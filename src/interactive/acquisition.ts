import { lstatSync, readFileSync } from 'node:fs';
import { array, choice, literal, nullable, object, positiveInteger, refine, rule, text, type Infer } from '../../schemas/validation.ts';
import { taskId, timestamp, uuid } from '../../schemas/contracts.ts';
import { canonicalCheckout, taskFile } from '../storage/files.ts';
import { assertObserverOutput, requireWorkspace } from '../onboarding/workspace.ts';
import { reviewData } from '../review/data.ts';

/** Canonical discussion identity, never a target to send to without rechecking the original. */
export function acquisitionUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port)
    throw new Error('Opportunity URL must be HTTPS without credentials or a port');
  if ([...url.searchParams.keys()].some(key => /(?:token|secret|password|signature|api[_-]?key)/i.test(key)))
    throw new Error('Opportunity URL must not contain credential or signed-link parameters');
  url.hash = '';
  const host = url.hostname.toLowerCase();
  if (/^(?:(?:www|old|new)\.)?reddit\.com$/.test(host)) {
    const thread = url.pathname.match(/\/comments\/([a-z0-9]+)(?:\/|$)/i);
    if (thread) return `https://www.reddit.com/comments/${thread[1].toLowerCase()}`;
  }
  if (/^(?:www\.)?(?:twitter|x)\.com$/.test(host)) {
    const post = url.pathname.match(/\/status\/(\d+)(?:\/|$)/);
    if (post) return `https://x.com/i/status/${post[1]}`;
  }
  for (const key of [...url.searchParams.keys()])
    if (/^utm_|^(?:fbclid|gclid|ref_src|ref_url)$/.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href;
}

const count = rule<number>(v => Number.isSafeInteger(v) && Number(v) >= 0, 'nonnegative integer');
const metric = refine(object({ count: nullable(count), basis: choice('verified', 'reported', 'unknown'), reference: nullable(text) }),
  m => m.basis === 'unknown' ? m.count === null : m.count !== null && m.reference !== null,
  'known baselines require a count and attributed evidence; unknown is not zero');
const rating = object({ score: rule<number>(v => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 2, 'score 0–2'), reason: text });
const assessment = object({
  checkedAt: timestamp, evidence: text, basis: choice('verified', 'unverified'),
  publishedAt: nullable(timestamp), audienceFit: rating, statedProblem: rating, recency: rating, contribution: rating,
  decision: choice('candidate', 'excluded'), reason: text, estimatedMinutes: positiveInteger,
});
const opportunity = refine(object({ id: uuid, url: text, history: array(assessment), taskIds: array(taskId) }),
  o => o.history.length > 0 && new Set(o.taskIds).size === o.taskIds.length &&
    o.history.every((a, i) => i === 0 || a.checkedAt >= o.history[i - 1].checkedAt),
  'opportunities require ordered assessment history and unique task references');
const action = object({ id: uuid, opportunityId: uuid, taskId, kind: text, basis: choice('reported', 'verified'), reference: text, at: timestamp });
const outcome = object({
  id: uuid, customerKey: text, kind: choice('paying-customer', 'trial-user', 'signup'),
  basis: choice('reported', 'verified', 'retracted'), reference: text, at: timestamp,
  opportunityId: nullable(uuid), actionId: nullable(uuid),
  // Aggregate baseline customers must never be counted again as incremental outcomes.
  newSinceBaseline: literal(true), note: text,
});
const review = object({ at: timestamp, version: positiveInteger, evidence: text, learned: text, decision: text });

export const acquisitionSprintSchema = refine(object({
  schemaVersion: literal(1), id: uuid, projectId: uuid, version: positiveInteger, createdAt: timestamp,
  status: choice('active', 'paused', 'stopped', 'achieved'), audience: text, offer: text, offerSource: text,
  dailyMinutes: positiveInteger, customerDefinition: text, customerUnit: choice('account', 'person'),
  baseline: object({ at: timestamp, payingCustomers: metric, trialUsers: metric, signups: metric }),
  target: object({ payingCustomers: positiveInteger, mode: choice('total', 'additional') }),
  opportunities: array(opportunity), actions: array(action), outcomes: array(outcome), reviews: array(review),
}), s => {
  const unique = (values: string[]) => new Set(values).size === values.length;
  const opportunityIds = new Set(s.opportunities.map(o => o.id));
  const actionIds = new Set(s.actions.map(a => a.id));
  return s.dailyMinutes <= 1440 && unique(s.opportunities.map(o => o.id)) &&
    unique(s.opportunities.map(o => acquisitionUrl(o.url))) && unique(s.actions.map(a => a.id)) && unique(s.outcomes.map(o => o.id)) &&
    s.actions.every(a => opportunityIds.has(a.opportunityId)) &&
    s.outcomes.every(o => (o.opportunityId === null || opportunityIds.has(o.opportunityId)) &&
      (o.actionId === null || actionIds.has(o.actionId))) &&
    s.reviews.every((r, i) => r.version <= s.version && (i === 0 || r.at >= s.reviews[i - 1].at)) &&
    s.outcomes.every(o => o.at >= s.baseline.at) && s.actions.every(a => a.at >= s.createdAt);
}, 'invalid identity, duplicate opportunity/event, linkage, budget or history');
export type AcquisitionSprint = Infer<typeof acquisitionSprintSchema>;

/** Latest account of each distinct unit/outcome wins; snapshots are never summed. */
export function acquisitionProgress(sprint: AcquisitionSprint) {
  const latest = new Map<string, AcquisitionSprint['outcomes'][number]>();
  for (const event of sprint.outcomes) {
    const key = `${event.kind}\0${event.customerKey}`;
    if (!latest.has(key) || latest.get(key)!.at <= event.at) latest.set(key, event);
  }
  const summarize = (kind: AcquisitionSprint['outcomes'][number]['kind'], baseline: AcquisitionSprint['baseline']['payingCustomers']) => {
    const events = [...latest.values()].filter(e => e.kind === kind);
    const verifiedNew = events.filter(e => e.basis === 'verified').length;
    const reportedNew = events.filter(e => e.basis === 'reported').length;
    return { baseline, verifiedNew, reportedNew,
      verifiedTotal: baseline.basis === 'verified' ? baseline.count! + verifiedNew : null,
      knownOrReportedTotal: baseline.count === null ? null : baseline.count + verifiedNew + reportedNew };
  };
  const payingCustomers = summarize('paying-customer', sprint.baseline.payingCustomers);
  const trialUsers = summarize('trial-user', sprint.baseline.trialUsers);
  const signups = summarize('signup', sprint.baseline.signups);
  const verified = sprint.target.mode === 'additional' ? payingCustomers.verifiedNew : payingCustomers.verifiedTotal;
  const reported = sprint.target.mode === 'additional' ? payingCustomers.verifiedNew + payingCustomers.reportedNew : payingCustomers.knownOrReportedTotal;
  return { payingCustomers, trialUsers, signups,
    verifiedTargetMet: verified !== null && verified >= sprint.target.payingCustomers,
    reportedTargetMet: reported !== null && reported >= sprint.target.payingCustomers,
    limitation: 'Evidence accounts retain their stated basis; this helper does not verify payments, actions or source pages.' };
}

/** Read the saved sprint and the ONE existing task board; never write, queue, send or reconcile. */
export function acquisitionStatus(workspace: string, sprintId: string, database?: string) {
  workspace = canonicalCheckout(workspace);
  uuid.parse(sprintId);
  requireWorkspace(workspace);
  if (database) assertObserverOutput(workspace, database);
  const path = `marketing/acquisition/${sprintId}/SPRINT.json`;
  const file = taskFile(workspace, path);
  if (lstatSync(file).size > 512 * 1024) throw new Error('Sprint record too large; retain older reviews in referenced archives');
  const sprint = acquisitionSprintSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const board = reviewData(workspace, database);
  if (sprint.id !== sprintId || sprint.projectId !== board.project.id) throw new Error('Sprint identity does not match the selected workspace');
  const progress = acquisitionProgress(sprint);
  const dispositionsAvailable = !database || board.registry.status === 'registered';
  const warnings = [...board.warnings];
  if (!database) warnings.push('No registry selected: saved skipped/snoozed dispositions must be checked before queuing or acting.');
  if (!dispositionsAvailable) warnings.push('Requested registry unavailable/unregistered: today is withheld until task dispositions can be read.');
  if (sprint.status === 'achieved' && !progress.verifiedTargetMet) warnings.push('Sprint says achieved but verified customer target is not met.');
  const shortlist = sprint.opportunities.map(o => {
    const current = o.history.at(-1)!;
    const priorActions = sprint.actions.filter(a => a.opportunityId === o.id);
    const references = [...new Set([...o.taskIds, ...priorActions.map(a => a.taskId)])];
    const linked = board.tasks.filter(t => references.includes(t.taskId) ||
      (['acquisition', 'outreach', 'engagement'].includes(t.category) && t.actionUrl && (() => {
        try { return acquisitionUrl(t.actionUrl) === acquisitionUrl(o.url); } catch { return false; }
      })()));
    const retired = linked.filter(t => t.status !== 'open' || (t.disposition && t.disposition.state !== 'active'));
    const open = linked.filter(t => t.status === 'open' && (!t.disposition || t.disposition.state === 'active'));
    const missing = references.filter(id => !board.tasks.some(t => t.taskId === id));
    const reason = current.decision === 'excluded' ? current.reason
      : current.basis !== 'verified' ? 'Opportunity evidence is unverified'
      : !current.audienceFit.score || !current.statedProblem.score || !current.contribution.score ? 'Audience, stated problem or useful contribution is unsupported'
      : retired.some(t => t.disposition && t.disposition.state !== 'active') ? 'Related task is skipped or snoozed; no automatic replacement or revival'
      : retired.length && !open.length ? 'Related action is done; a distinct purposeful follow-up must be queued on the existing board'
      : missing.length ? 'Linked task is missing; reconcile the existing board first' : null;
    return { id: o.id, url: o.url, score: current.audienceFit.score + current.statedProblem.score + current.recency.score + current.contribution.score,
      assessment: current, taskIds: linked.map(t => t.taskId), openTaskIds: open.map(t => t.taskId), blockedReason: reason,
      priorActions };
  }).sort((a, b) => b.score - a.score || b.assessment.checkedAt.localeCompare(a.assessment.checkedAt) || a.id.localeCompare(b.id));
  const today: (typeof shortlist[number] & { selectedTaskId: string | null; action: string })[] = [];
  const selectedTasks = new Set<string>();
  let remainingMinutes = sprint.dailyMinutes;
  if (sprint.status === 'active' && !progress.verifiedTargetMet && board.classification === 'valid' && dispositionsAvailable) {
    // Resume active queued work first; wider research remains in the plan.
    const eligible = shortlist.filter(o => !o.blockedReason).sort((a, b) => Number(b.openTaskIds.length > 0) - Number(a.openTaskIds.length > 0) || b.score - a.score);
    for (const item of eligible) if (today.length < 3 && item.assessment.estimatedMinutes <= remainingMinutes) {
      const selectedTaskId = item.openTaskIds[0] ?? null;
      if (selectedTaskId && selectedTasks.has(selectedTaskId)) continue;
      const alreadyActed = item.priorActions.some(a => a.taskId === selectedTaskId);
      today.push({ ...item, selectedTaskId, action: alreadyActed
        ? 'Verify the recorded action or review its results; do not resend it'
        : selectedTaskId ? 'Resume the existing task; exact sending authorization is still required'
        : 'Prepare the next action for review on the existing task board' });
      remainingMinutes -= item.assessment.estimatedMinutes;
      if (selectedTaskId) selectedTasks.add(selectedTaskId);
    }
  }
  return { sprint, path, projectId: board.project.id, taskRevision: board.revision, registry: board.registry.status,
    progress, shortlist, today, remainingMinutes, warnings,
    nextStep: 'Recheck targets and community rules, prepare/review the exact action, and use existing TASKS.md. Suggestions authorize no sending.' };
}
