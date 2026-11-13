import { reviewBoard, type ReviewProject, type ReviewTask } from '../review/data.ts';

/**
 * Read-only daily brief across promotion workspaces: what needs the user, what the agent can do now,
 * what is waiting, and what was recorded recently. It never queues, completes, snoozes or posts.
 * Every classification is computed from the task text and saved records; none of it proves an external outcome.
 */

export type BriefItem = {
  taskId: string;
  priority: string;
  category: string;
  title: string;
  filedDate: string;
  /** Why the task is in its bucket, in plain words. */
  note: string;
  /** `Not before` date (YYYY-MM-DD) or scheduled post time (UTC), when there is one. */
  date: string | null;
};

const notBeforePattern = /\bNot before (\d{4}-\d{2}-\d{2})\b/i;
const followUpPattern = /\bFollow-up to (T-\d+)\b/i;
// A sentence that opens with "After …", e.g. "After the post goes live, verify …".
const triggerPattern = /(?:^|[.;:]\s+|\n\s*)(After [^.\n]{3,160})/;
const humanPattern = /\bHuman required:/i;
const day = 24 * 60 * 60 * 1000;
const staleDays = 30;

/** YYYY-MM-DD for `instant` in the project timezone. */
export function localDate(instant: Date, timeZone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(instant).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const priorityRank = (p: string) => { const n = /^P(\d)$/i.exec(p.trim()); return n ? Number(n[1]) : 9; };
const byPriority = (a: BriefItem, b: BriefItem) =>
  priorityRank(a.priority) - priorityRank(b.priority) || a.filedDate.localeCompare(b.filedDate) || a.taskId.localeCompare(b.taskId);
const firstLine = (text: string) => text.split('\n').map(l => l.trim()).find(Boolean)?.slice(0, 200) ?? '';

function item(task: ReviewTask, note: string, date: string | null = null): BriefItem {
  const { taskId, priority, category, title, filedDate } = task;
  return { taskId, priority, category, title, filedDate, note, date };
}

function projectBrief(data: ReviewProject, now: Date, since: Date) {
  const { project } = data;
  const today = localDate(now, project.timezone);
  const status = new Map(data.tasks.map(t => [t.taskId, t.status]));
  const buckets = {
    /** Open tasks that wait on the user: a `Human required:` step, or a saved draft to review. */
    needsYou: [] as BriefItem[],
    /** Scheduled posts whose time has passed; the task stays open until the live post is checked. */
    verifyPosts: [] as BriefItem[],
    /** Open, active tasks the agent can work on now. */
    ready: [] as BriefItem[],
    /** Open tasks held by a future `Not before` date or an `After …` condition. */
    waiting: [] as BriefItem[],
    /** Scheduled posts still in the future. */
    upcomingPosts: [] as BriefItem[],
    snoozed: [] as BriefItem[],
  };
  const counts = { open: 0, done: 0, skipped: 0, stale: 0 };
  const recent: { taskId: string; title: string; outcome: string; recordedAt: string; summary: string; reference: string }[] = [];

  for (const task of data.tasks) {
    for (const record of task.drafts)
      if (Date.parse(record.recordedAt) >= since.valueOf())
        recent.push({ taskId: task.taskId, title: task.title, outcome: record.outcome, recordedAt: record.recordedAt,
          summary: firstLine(record.summary), reference: record.reference });
    if (task.status !== 'open') { counts.done++; continue; }
    counts.open++;
    const disposition = task.disposition;
    if (disposition?.state === 'skipped') { counts.skipped++; continue; }
    if (disposition?.state === 'snoozed' && disposition.until && Date.parse(disposition.until) > now.valueOf()) {
      buckets.snoozed.push(item(task, `Snoozed until ${disposition.until}${disposition.reason ? `: ${disposition.reason}` : ''}`));
      continue;
    }
    const woke = disposition?.state === 'snoozed' ? ' Snooze ended.' : '';
    const text = `${task.materials}\n${task.agentPrompt ?? ''}`;
    const latest = task.drafts[0];
    const lastActivity = latest ? Date.parse(latest.recordedAt) : Date.parse(`${task.filedDate}T00:00:00Z`);
    if (now.valueOf() - lastActivity > staleDays * day) counts.stale++;

    if (task.scheduled) {
      const post = task.scheduled;
      const when = `${post.channel ?? 'post'} ${post.localTime}`;
      if (Date.parse(post.scheduledFor) <= now.valueOf())
        buckets.verifyPosts.push(item(task, `Scheduled for ${when} (${post.status}); check the live post.${woke}`, post.scheduledFor));
      else buckets.upcomingPosts.push(item(task, `Scheduled for ${when} (${post.status}).`, post.scheduledFor));
      continue;
    }
    const notBefore = notBeforePattern.exec(text)?.[1];
    if (notBefore && notBefore > today) {
      buckets.waiting.push(item(task, `Not before ${notBefore}.${woke}`, notBefore));
      continue;
    }
    const startsToday = notBefore && notBefore <= today && notBefore >= localDate(since, project.timezone)
      ? ` Became due ${notBefore}.` : '';
    if (humanPattern.test(text)) {
      buckets.needsYou.push(item(task, `Has a Human required step.${startsToday}${woke}`, notBefore ?? null));
      continue;
    }
    if (latest?.outcome === 'draft') {
      buckets.needsYou.push(item(task, `Draft saved ${latest.recordedAt.slice(0, 10)} awaits review: ${latest.reference}${startsToday}${woke}`));
      continue;
    }
    const parent = followUpPattern.exec(text)?.[1];
    const trigger = triggerPattern.exec(text)?.[1];
    if (trigger) {
      const parentNote = parent ? ` Parent ${parent} is ${status.get(parent) ?? 'not found'}.` : '';
      buckets.waiting.push(item(task, `Condition: ${trigger.trim()}.${parentNote}${woke}`));
      continue;
    }
    buckets.ready.push(item(task, `Ready.${startsToday}${woke}`, notBefore ?? null));
  }
  for (const list of Object.values(buckets)) list.sort(byPriority);
  recent.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  return {
    project: { id: project.id, displayName: project.displayName, workspace: project.root, timezone: project.timezone },
    today, counts, ...buckets, recent,
    warnings: data.warnings, classification: data.classification,
  };
}

/**
 * Brief for the explicit `directories`, or with none, every workspace registered in `database`.
 * `since` (UTC timestamp) bounds the recent-activity list; it defaults to 24 hours before `now`.
 */
export function promotionBrief(directories: string[], database?: string, since?: string, now = new Date()) {
  if (!directories.length && !database) throw new Error('Brief needs --project or --database');
  const from = since ? new Date(since) : new Date(now.valueOf() - day);
  if (!Number.isFinite(from.valueOf()) || from > now) throw new Error('--since must be a past UTC timestamp');
  const board = reviewBoard(directories, database);
  const projects = board.projects.map(data => projectBrief(data, now, from));
  const total = (key: 'needsYou' | 'verifyPosts' | 'ready' | 'waiting' | 'upcomingPosts' | 'snoozed') =>
    projects.reduce((sum, p) => sum + p[key].length, 0);
  return {
    generatedAt: now.toISOString(),
    since: from.toISOString(),
    totals: {
      projects: projects.length, needsYou: total('needsYou'), verifyPosts: total('verifyPosts'), ready: total('ready'),
      waiting: total('waiting'), upcomingPosts: total('upcomingPosts'), snoozed: total('snoozed'),
      recent: projects.reduce((sum, p) => sum + p.recent.length, 0),
    },
    projects,
    unavailable: board.unavailable,
  };
}
