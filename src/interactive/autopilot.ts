import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { reviewBoard, reviewData, type ReviewProject, type ReviewTask } from '../review/data.ts';
import { ProjectLockedError, withProjectLock } from '../storage/files.ts';
import { uuid } from '../../schemas/contracts.ts';
import { followUpPattern, humanPattern, localDate, notBeforePattern, triggerPattern } from './brief.ts';
import { prepareTask } from './tasks.ts';

/**
 * Portfolio autopilot (P25): coordination for scheduled agent sessions, not a runner.
 * A CMO pass files new task ideas; any number of runner sessions claim one task each at a time.
 * Leases are files beside the portfolio registry, written under the registry's existing project locks,
 * so the registry schema stays at version 1 and older installed helpers keep reading it.
 * One lease per project: TASKS.md and the logs are single files that agents edit, so two agents never
 * work the same workspace at once. Nothing here posts, sends, spends or edits a task file.
 */

export type Level = 0 | 1 | 2 | 3;
export type Limits = {
  /** Highest task priority number the runner takes (P1 = 1). */
  maxPriority: number;
  /** Task categories the runner never claims (lowercase). */
  excludeCategories: string[];
  /** Task claims per project in any 24 hours. */
  perProjectPerDay: number;
  /** Task claims per runner session (agent name) in any 24 hours. */
  maxTasksPerRun: number;
  leaseMinutes: number;
  /** New tasks the CMO pass may file per project per pass. */
  ideasPerProject: number;
  /** The CMO pass files nothing for a product with this many open, active tasks. */
  maxOpenTasks: number;
  /** With this many items waiting on the user, the CMO files at most one idea, and only agent-only work. */
  maxNeedsYou: number;
};
export type ClaimMode = 'work' | 'handoff' | 'verify-post' | 'check-condition';

const limitKeys = ['maxPriority', 'excludeCategories', 'perProjectPerDay', 'maxTasksPerRun', 'leaseMinutes',
  'ideasPerProject', 'maxOpenTasks', 'maxNeedsYou'] as const;

export const levels: Record<Level, { name: string; allows: string; modes: ClaimMode[]; limits: Limits }> = {
  0: {
    name: 'off',
    allows: 'Nothing. The runner claims no tasks; the CMO pass files no ideas unless ideasPerProject is set.',
    modes: [],
    limits: { maxPriority: 0, excludeCategories: [], perProjectPerDay: 0, maxTasksPerRun: 0, leaseMinutes: 120, ideasPerProject: 0, maxOpenTasks: 10, maxNeedsYou: 6 },
  },
  1: {
    name: 'cautious',
    allows: 'Research, analysis and drafts saved in the workspace, and handoff packets for human steps. P1-P2 tasks only; no product, video or release tasks. Nothing leaves this machine.',
    modes: ['work', 'handoff'],
    limits: { maxPriority: 2, excludeCategories: ['product', 'video', 'release'], perProjectPerDay: 1, maxTasksPerRun: 2, leaseMinutes: 120, ideasPerProject: 2, maxOpenTasks: 6, maxNeedsYou: 4 },
  },
  2: {
    name: 'standard',
    allows: 'Everything cautious allows for P1-P3 tasks of every category except product, plus checking scheduled posts that are due and After-conditions whose parent task is done. Nothing leaves this machine.',
    modes: ['work', 'handoff', 'verify-post', 'check-condition'],
    limits: { maxPriority: 3, excludeCategories: ['product'], perProjectPerDay: 3, maxTasksPerRun: 5, leaseMinutes: 120, ideasPerProject: 3, maxOpenTasks: 10, maxNeedsYou: 6 },
  },
  3: {
    name: 'aggressive',
    allows: 'Everything standard allows for every priority and category, plus product tasks on a new branch with a draft pull request (never merged, never pushed to the default branch), and external steps whose exact content, destination and time the user already approved in writing, through the workspace\'s configured adapter.',
    modes: ['work', 'handoff', 'verify-post', 'check-condition'],
    limits: { maxPriority: 9, excludeCategories: [], perProjectPerDay: 6, maxTasksPerRun: 10, leaseMinutes: 180, ideasPerProject: 5, maxOpenTasks: 15, maxNeedsYou: 8 },
  },
};

/** Never allowed at any level; repeated in every claim so a runner session sees it. */
export const neverAllowed = 'At every level: never post, send, submit or schedule content the user has not approved word for word; never spend money, create accounts, sign in, enter credentials or solve a CAPTCHA; never merge, push a default branch or deploy; never edit the product repository outside a level-3 product task branch.';

const modeInstructions: Record<ClaimMode, string> = {
  work: 'Do this task within the level. Save outputs in the workspace, record evidence, complete it only after checking its completion criteria, queue at most three follow-ups, then release.',
  handoff: 'The task has a Human required step. Do every part an agent can do, then write marketing/handoffs/<task ID>.md following the runner procedure, record it as a draft and release with outcome handoff. Do not attempt the human step.',
  'verify-post': 'A scheduled post\'s time has passed. Check whether the post is live at its destination. If it is, record verified-complete with the live URL and complete the task; if not, record what you saw as a draft or write a handoff, then release.',
  'check-condition': 'The parent task is done. Check whether the task\'s After condition is now met. If it is, do the task; if not, snooze the task with the reason and a date to look again, then release with outcome snoozed.',
};

export type Settings = {
  schemaVersion: 1;
  level: Level;
  limits: Partial<Limits>;
  projects: Record<string, { level?: Level; limits?: Partial<Limits> }>;
};

export type Lease = {
  schemaVersion: 1; leaseId: string; agent: string; purpose: 'task' | 'ideation';
  projectId: string; displayName: string; workspace: string; taskId: string | null; mode: ClaimMode | null;
  claimedAt: string; expiresAt: string;
};

type HistoryEvent = {
  at: string; event: 'claim' | 'release' | 'expired'; leaseId: string; agent: string; purpose: 'task' | 'ideation';
  projectId: string; taskId: string | null; mode?: ClaimMode | null; outcome?: string; note?: string;
};

const day = 24 * 60 * 60 * 1000;
const agentPattern = /^[A-Za-z0-9][\w.:@-]{0,79}$/;
const taskOutcomes = ['completed', 'draft', 'handoff', 'snoozed', 'skipped', 'failed'] as const;
const ideationOutcomes = ['ideas', 'none', 'failed'] as const;
const stuckFailures = 2;
const stuckWindow = 7 * day;
const cmoIdeaPattern = /\bCMO idea \d{4}-\d{2}-\d{2}\b/;

/** Activities the CMO pass can choose from, with the task categories that count as each. */
export const activityCatalog: { activity: string; categories: string[] }[] = [
  { activity: 'social', categories: ['social', 'x', 'twitter', 'linkedin', 'threads', 'bluesky'] },
  { activity: 'engagement', categories: ['engagement', 'outreach', 'reddit', 'community', 'reply'] },
  { activity: 'directory', categories: ['directory', 'backlink', 'listing'] },
  { activity: 'launch', categories: ['launch', 'product-hunt', 'producthunt'] },
  { activity: 'blog', categories: ['blog', 'content', 'article', 'refresh', 'pseo', 'seo'] },
  { activity: 'search-console', categories: ['search-console', 'gsc'] },
  { activity: 'competitor', categories: ['competitor', 'competitor-analysis', 'research', 'search'] },
  { activity: 'visibility', categories: ['visibility', 'ai-visibility', 'geo', 'aeo'] },
  { activity: 'video', categories: ['video'] },
  { activity: 'release', categories: ['release', 'launch-pack'] },
  { activity: 'acquisition', categories: ['acquisition', 'first-customers', 'sales'] },
  { activity: 'x-growth', categories: ['x-growth'] },
  { activity: 'email', categories: ['email', 'nurture', 'newsletter'] },
  { activity: 'agent-ready', categories: ['agent-ready', 'mcp'] },
  { activity: 'product', categories: ['product'] },
];

const activityOf = (category: string) => {
  const c = category.trim().toLowerCase();
  return activityCatalog.find(a => a.categories.includes(c))?.activity ?? 'other';
};
const priorityRank = (p: string) => { const n = /^P(\d)$/i.exec(p.trim()); return n ? Number(n[1]) : 9; };

// ---------- paths, settings and history ----------

function registry(database: string) {
  if (!existsSync(database)) throw new Error('Autopilot needs the portfolio registry (--database). It is created the first time a task is skipped, snoozed or completed through the helpers or the review desk.');
  const path = realpathSync(database);
  return { path, lockRoot: `${path}.locks`, dir: `${path}.autopilot` };
}

function ensureDir(dir: string) {
  mkdirSync(join(dir, 'leases'), { recursive: true, mode: 0o700 });
}

function writeAtomic(target: string, text: string) {
  const temp = `${target}.${randomUUID()}.tmp`;
  writeFileSync(temp, text, { flag: 'wx', mode: 0o600 });
  try { renameSync(temp, target); }
  catch (error) { try { unlinkSync(temp); } catch {} throw error; }
}

function checkLevel(value: unknown, where: string): Level {
  if (value !== 0 && value !== 1 && value !== 2 && value !== 3) throw new Error(`${where}: level must be 0, 1, 2 or 3`);
  return value;
}

function checkLimits(value: unknown, where: string): Partial<Limits> {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${where}: limits must be an object`);
  const out: Partial<Limits> = {};
  for (const [key, v] of Object.entries(value)) {
    if (!(limitKeys as readonly string[]).includes(key)) throw new Error(`${where}: unknown limit ${key}`);
    if (key === 'excludeCategories') {
      if (!Array.isArray(v) || v.some(c => typeof c !== 'string' || !c.trim())) throw new Error(`${where}: excludeCategories must be a list of category names`);
      out.excludeCategories = v.map(c => c.trim().toLowerCase());
    } else {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 1000) throw new Error(`${where}: ${key} must be a whole number from 0 to 1000`);
      if (key === 'leaseMinutes' && (v < 10 || v > 24 * 60)) throw new Error(`${where}: leaseMinutes must be 10 to 1440`);
      (out as Record<string, number>)[key] = v;
    }
  }
  return out;
}

export function settingsPath(database: string) { return join(registry(database).dir, 'settings.json'); }

export function readSettings(database: string): Settings {
  const file = settingsPath(database);
  if (!existsSync(file)) return { schemaVersion: 1, level: 2, limits: {}, projects: {} };
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  if (!raw || raw.schemaVersion !== 1) throw new Error(`${file}: schemaVersion must be 1`);
  const projects: Settings['projects'] = {};
  for (const [id, value] of Object.entries((raw.projects ?? {}) as Record<string, Record<string, unknown>>)) {
    uuid.parse(id);
    projects[id] = {
      ...(value.level !== undefined ? { level: checkLevel(value.level, `${file} project ${id}`) } : {}),
      ...(value.limits !== undefined ? { limits: checkLimits(value.limits, `${file} project ${id}`) } : {}),
    };
  }
  return { schemaVersion: 1, level: checkLevel(raw.level ?? 2, file), limits: checkLimits(raw.limits, file), projects };
}

/** Effective level and limits: the level's defaults, then portfolio limits, then the project's own. */
export function effective(settings: Settings, projectId?: string) {
  const own = projectId ? settings.projects[projectId] : undefined;
  const level = own?.level ?? settings.level;
  const base = levels[level];
  return { level, name: base.name, allows: base.allows, modes: base.modes,
    limits: { ...base.limits, ...settings.limits, ...(own?.limits ?? {}) } as Limits };
}

export type SettingsChange = { level?: Level; limits?: Partial<Limits>; reset?: boolean };

/** Show settings, or change the portfolio's (no projectId) or one project's level and limits. */
export function updateSettings(database: string, projectId: string | null, change: SettingsChange) {
  const { dir } = registry(database);
  const settings = readSettings(database);
  const limits = checkLimits(change.limits, 'change');
  const changed = change.reset || change.level !== undefined || Object.keys(limits).length > 0;
  if (change.level !== undefined) checkLevel(change.level, 'change');
  if (projectId) {
    uuid.parse(projectId);
    const current = change.reset ? {} : settings.projects[projectId] ?? {};
    const next = { ...current, ...(change.level !== undefined ? { level: change.level } : {}),
      ...(Object.keys(limits).length ? { limits: { ...(current.limits ?? {}), ...limits } } : {}) };
    if (Object.keys(next).length) settings.projects[projectId] = next; else delete settings.projects[projectId];
  } else {
    if (change.reset) { settings.level = 2; settings.limits = {}; }
    if (change.level !== undefined) settings.level = change.level;
    settings.limits = { ...settings.limits, ...limits };
  }
  if (changed) { ensureDir(dir); writeAtomic(join(dir, 'settings.json'), JSON.stringify(settings, null, 2) + '\n'); }
  return describeSettings(database, settings, changed);
}

function describeSettings(database: string, settings: Settings, changed = false) {
  const portfolio = effective(settings);
  return {
    path: settingsPath(database), changed, neverAllowed,
    portfolio: { level: portfolio.level, name: portfolio.name, allows: portfolio.allows, limits: portfolio.limits },
    projects: Object.fromEntries(Object.keys(settings.projects).map(id => {
      const e = effective(settings, id);
      return [id, { level: e.level, name: e.name, limits: e.limits }];
    })),
    levels: Object.fromEntries(Object.entries(levels).map(([n, l]) => [n, { name: l.name, allows: l.allows }])),
  };
}

export function showSettings(database: string) { return describeSettings(database, readSettings(database)); }

function readHistory(dir: string): HistoryEvent[] {
  const file = join(dir, 'history.jsonl');
  if (!existsSync(file)) return [];
  const events: HistoryEvent[] = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { events.push(JSON.parse(line)); } catch { /* a torn line from a crash is ignored */ }
  }
  return events;
}

function appendHistory(dir: string, event: HistoryEvent) {
  ensureDir(dir);
  appendFileSync(join(dir, 'history.jsonl'), JSON.stringify(event) + '\n', { mode: 0o600 });
}

const leaseFile = (dir: string, projectId: string) => join(dir, 'leases', `${uuid.parse(projectId)}.json`);

function readLease(dir: string, projectId: string): Lease | null {
  const file = leaseFile(dir, projectId);
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

/** Caller holds the project lock. An expired lease is logged and removed. */
function liveLease(dir: string, projectId: string, now: Date): Lease | null {
  const lease = readLease(dir, projectId);
  if (!lease) return null;
  if (Date.parse(lease.expiresAt) > now.valueOf()) return lease;
  appendHistory(dir, { at: now.toISOString(), event: 'expired', leaseId: lease.leaseId, agent: lease.agent, purpose: lease.purpose,
    projectId, taskId: lease.taskId, mode: lease.mode, outcome: 'expired' });
  unlinkSync(leaseFile(dir, projectId));
  return null;
}

function checkAgent(agent: string) {
  if (!agentPattern.test(agent ?? '')) throw new Error('--agent must be 1-80 letters, digits or . _ : @ -, starting with a letter or digit; use a unique name per run');
}

// ---------- task classification ----------

function classify(task: ReviewTask, status: Map<string, string>, today: string, now: Date): { mode: ClaimMode } | { skip: string } {
  if (task.status !== 'open') return { skip: 'done' };
  const d = task.disposition;
  if (d?.state === 'skipped') return { skip: 'skipped' };
  if (d?.state === 'snoozed' && d.until && Date.parse(d.until) > now.valueOf()) return { skip: `snoozed until ${d.until}` };
  if (task.scheduled)
    return Date.parse(task.scheduled.scheduledFor) <= now.valueOf() ? { mode: 'verify-post' } : { skip: 'scheduled post not due yet' };
  const text = `${task.materials}\n${task.agentPrompt ?? ''}`;
  const notBefore = notBeforePattern.exec(text)?.[1];
  if (notBefore && notBefore > today) return { skip: `not before ${notBefore}` };
  const latest = task.drafts[0];
  if (latest?.outcome === 'draft')
    return { skip: latest.reference.startsWith('marketing/handoffs/') ? 'handoff waits on the user' : 'draft waits on the user' };
  if (latest?.outcome === 'verified-complete') return { skip: 'recorded complete; checkbox pending' };
  if (humanPattern.test(text)) return { mode: 'handoff' };
  const trigger = triggerPattern.exec(text)?.[1];
  if (trigger) {
    const parent = followUpPattern.exec(text)?.[1];
    return parent && status.get(parent) === 'done' ? { mode: 'check-condition' } : { skip: 'waiting on a condition' };
  }
  return { mode: 'work' };
}

function failures(history: HistoryEvent[], projectId: string, taskId: string, now: Date) {
  return history.filter(e => e.projectId === projectId && e.taskId === taskId && e.purpose === 'task'
    && (e.outcome === 'failed' || e.outcome === 'expired') && now.valueOf() - Date.parse(e.at) < stuckWindow).length;
}

const claimsSince = (history: HistoryEvent[], test: (e: HistoryEvent) => boolean, since: number) =>
  history.filter(e => e.event === 'claim' && Date.parse(e.at) >= since && test(e)).length;

/** Why the runner may not take this task at this level, or null when it may. */
function gate(task: ReviewTask, mode: ClaimMode, e: ReturnType<typeof effective>) {
  if (!e.modes.includes(mode)) return `${mode} is above level ${e.level} (${e.name})`;
  if (priorityRank(task.priority) > e.limits.maxPriority) return `${task.priority} is above the level's P${e.limits.maxPriority} limit`;
  if (e.limits.excludeCategories.includes(task.category.trim().toLowerCase())) return `category ${task.category} is excluded at this level`;
  return null;
}

// ---------- claims ----------

function leaseRecord(agent: string, purpose: Lease['purpose'], data: ReviewProject, taskId: string | null, mode: ClaimMode | null, minutes: number, now: Date): Lease {
  return { schemaVersion: 1, leaseId: randomUUID(), agent, purpose, projectId: data.project.id, displayName: data.project.displayName,
    workspace: data.project.root, taskId, mode, claimedAt: now.toISOString(), expiresAt: new Date(now.valueOf() + minutes * 60_000).toISOString() };
}

/**
 * Claim the next task for one runner session: highest priority first, then the product with the fewest
 * claims today, then the oldest task. Projects another agent holds, or whose lock is busy, are passed over.
 */
export function claimTask(database: string, agent: string, directories: string[] = [], now = new Date()) {
  checkAgent(agent);
  const { lockRoot, dir } = registry(database);
  const settings = readSettings(database);
  const portfolio = effective(settings);
  let history = readHistory(dir);
  const used = claimsSince(history, e => e.agent === agent && e.purpose === 'task', now.valueOf() - day);
  const runLimit = { used, max: portfolio.limits.maxTasksPerRun };
  const anyOn = portfolio.level > 0 || Object.values(settings.projects).some(p => (p.level ?? 0) > 0);
  if (!anyOn) return { claim: null, reason: 'Autopilot is off (level 0).', runLimit, passedOver: [], unavailable: [] };
  if (used >= portfolio.limits.maxTasksPerRun)
    return { claim: null, reason: `This run has claimed ${used} of ${runLimit.max} tasks; stop here.`, runLimit, passedOver: [], unavailable: [] };

  const board = reviewBoard(directories, database);
  const passedOver: { project: string; taskId: string | null; reason: string }[] = [];
  const candidates: { data: ReviewProject; task: ReviewTask; mode: ClaimMode; e: ReturnType<typeof effective>; today: number }[] = [];
  for (const data of board.projects) {
    const e = effective(settings, data.project.id);
    if (e.level === 0) { passedOver.push({ project: data.project.displayName, taskId: null, reason: 'autopilot off for this product' }); continue; }
    const today = claimsSince(history, x => x.projectId === data.project.id && x.purpose === 'task', now.valueOf() - day);
    if (today >= e.limits.perProjectPerDay) { passedOver.push({ project: data.project.displayName, taskId: null, reason: `${today} claims in 24 hours (limit ${e.limits.perProjectPerDay})` }); continue; }
    const status = new Map(data.tasks.map(t => [t.taskId, t.status]));
    const localToday = localDate(now, data.project.timezone);
    for (const task of data.tasks) {
      const c = classify(task, status, localToday, now);
      if ('skip' in c) continue;
      const blocked = gate(task, c.mode, e)
        ?? (failures(history, data.project.id, task.taskId, now) >= stuckFailures ? `failed or expired ${stuckFailures}+ times in 7 days; needs a look` : null);
      if (blocked) { passedOver.push({ project: data.project.displayName, taskId: task.taskId, reason: blocked }); continue; }
      candidates.push({ data, task, mode: c.mode, e, today });
    }
  }
  candidates.sort((a, b) => priorityRank(a.task.priority) - priorityRank(b.task.priority) || a.today - b.today
    || a.task.filedDate.localeCompare(b.task.filedDate) || a.data.project.displayName.localeCompare(b.data.project.displayName)
    || a.task.taskId.localeCompare(b.task.taskId, undefined, { numeric: true }));

  const held = new Set<string>();
  for (const candidate of candidates) {
    const { data, task, e } = candidate;
    const projectId = data.project.id;
    if (held.has(projectId)) continue;
    let lease: Lease | null = null;
    try {
      lease = withProjectLock(lockRoot, projectId, () => {
        const current = liveLease(dir, projectId, now);
        if (current) { held.add(projectId); passedOver.push({ project: data.project.displayName, taskId: null, reason: `held by ${current.agent} until ${current.expiresAt}` }); return null; }
        // Re-read under the lock: another session may have finished or changed the task since the board was read.
        const fresh = reviewData(data.project.root, database);
        const freshTask = fresh.tasks.find(t => t.taskId === task.taskId);
        if (!freshTask) return null;
        const c = classify(freshTask, new Map(fresh.tasks.map(t => [t.taskId, t.status])), localDate(now, fresh.project.timezone), now);
        if ('skip' in c || gate(freshTask, c.mode, e)) return null;
        history = readHistory(dir);
        if (claimsSince(history, x => x.projectId === projectId && x.purpose === 'task', now.valueOf() - day) >= e.limits.perProjectPerDay) return null;
        const record = leaseRecord(agent, 'task', fresh, task.taskId, c.mode, e.limits.leaseMinutes, now);
        ensureDir(dir);
        writeFileSync(leaseFile(dir, projectId), JSON.stringify(record, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        appendHistory(dir, { at: now.toISOString(), event: 'claim', leaseId: record.leaseId, agent, purpose: 'task', projectId, taskId: task.taskId, mode: c.mode });
        return record;
      });
    } catch (error) {
      if (error instanceof ProjectLockedError) { held.add(projectId); continue; }
      throw error;
    }
    if (!lease) continue;
    let prepared: ReturnType<typeof prepareTask>;
    try { prepared = prepareTask(data.project.root, task.taskId); }
    catch (error) {
      releaseLease(database, lease.leaseId, agent, 'failed', `Could not prepare the task: ${(error as Error).message}`, now);
      throw error;
    }
    return {
      claim: {
        leaseId: lease.leaseId, agent, expiresAt: lease.expiresAt, mode: lease.mode!, modeInstructions: modeInstructions[lease.mode!],
        project: { id: projectId, displayName: data.project.displayName, workspace: data.project.root, sourceRoot: data.project.sourceRoot, timezone: data.project.timezone },
        task: { taskId: task.taskId, priority: task.priority, category: task.category, title: task.title, revision: prepared.revision },
        level: { level: e.level, name: e.name, allows: e.allows, neverAllowed },
        prompt: prepared.prompt,
      },
      runLimit: { used: used + 1, max: runLimit.max },
      unavailable: board.unavailable,
    };
  }
  return { claim: null, reason: candidates.length ? 'Every product with claimable work is held by another session.' : 'Nothing claimable at the current level.', runLimit, passedOver, unavailable: board.unavailable };
}

/** Claim one product for a CMO ideation pass: the product idle longest since its last pass, or the one named. */
export function claimIdeation(database: string, agent: string, directories: string[] = [], now = new Date()) {
  checkAgent(agent);
  const { lockRoot, dir } = registry(database);
  const report = coverage(database, directories, now);
  const eligible = report.projects.filter(p => p.ideation.eligible)
    .sort((a, b) => (a.autopilot.lastIdeation ?? '').localeCompare(b.autopilot.lastIdeation ?? '') || a.project.displayName.localeCompare(b.project.displayName));
  for (const entry of eligible) {
    const projectId = entry.project.id;
    let lease: Lease | null = null;
    try {
      lease = withProjectLock(lockRoot, projectId, () => {
        if (liveLease(dir, projectId, now)) return null;
        const settings = readSettings(database);
        const record: Lease = { schemaVersion: 1, leaseId: randomUUID(), agent, purpose: 'ideation', projectId, displayName: entry.project.displayName,
          workspace: entry.project.workspace, taskId: null, mode: null, claimedAt: now.toISOString(),
          expiresAt: new Date(now.valueOf() + effective(settings, projectId).limits.leaseMinutes * 60_000).toISOString() };
        ensureDir(dir);
        writeFileSync(leaseFile(dir, projectId), JSON.stringify(record, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        appendHistory(dir, { at: now.toISOString(), event: 'claim', leaseId: record.leaseId, agent, purpose: 'ideation', projectId, taskId: null });
        return record;
      });
    } catch (error) {
      if (error instanceof ProjectLockedError) continue;
      throw error;
    }
    if (lease) return { claim: { leaseId: lease.leaseId, agent, expiresAt: lease.expiresAt, coverage: entry }, unavailable: report.unavailable };
  }
  return {
    claim: null,
    reason: eligible.length ? 'Every eligible product is held by another session.' : 'No product is eligible for new ideas.',
    notEligible: report.projects.filter(p => !p.ideation.eligible).map(p => ({ project: p.project.displayName, reason: p.ideation.reason })),
    unavailable: report.unavailable,
  };
}

function findLease(dir: string, leaseId: string) {
  const leases = join(dir, 'leases');
  if (!existsSync(leases)) return null;
  for (const name of readdirSync(leases).filter(n => n.endsWith('.json'))) {
    try {
      const lease = JSON.parse(readFileSync(join(leases, name), 'utf8')) as Lease;
      if (lease.leaseId === leaseId) return lease;
    } catch { /* ignore a torn file */ }
  }
  return null;
}

function heldLease(dir: string, leaseId: string, agent: string) {
  checkAgent(agent);
  const lease = findLease(dir, leaseId);
  if (!lease) throw new Error('Lease not held: it was released, or it expired and was taken over. Do not record further work for it; claim again.');
  if (lease.agent !== agent) throw new Error('Lease belongs to another agent');
  return lease;
}

/** Extend a lease for long work; call before it expires. */
export function renewLease(database: string, leaseId: string, agent: string, now = new Date()) {
  const { lockRoot, dir } = registry(database);
  const found = heldLease(dir, leaseId, agent);
  return withProjectLock(lockRoot, found.projectId, () => {
    const lease = heldLease(dir, leaseId, agent);
    if (Date.parse(lease.expiresAt) <= now.valueOf()) throw new Error('Lease already expired; claim again');
    const minutes = effective(readSettings(database), lease.projectId).limits.leaseMinutes;
    const next = { ...lease, expiresAt: new Date(now.valueOf() + minutes * 60_000).toISOString() };
    writeAtomic(leaseFile(dir, lease.projectId), JSON.stringify(next, null, 2) + '\n');
    return { leaseId, expiresAt: next.expiresAt };
  });
}

/**
 * Release a lease with what happened. The outcome is checked against the workspace so the history stays honest:
 * completed needs the task checked off, draft and handoff need a draft record saved during the lease,
 * snoozed and skipped need that disposition, and failed, ideas and none need a note.
 */
export function releaseLease(database: string, leaseId: string, agent: string, outcome: string, note: string | undefined, now = new Date()) {
  const { lockRoot, dir } = registry(database);
  const found = heldLease(dir, leaseId, agent);
  return withProjectLock(lockRoot, found.projectId, () => {
    const lease = heldLease(dir, leaseId, agent);
    const allowed: readonly string[] = lease.purpose === 'task' ? taskOutcomes : ideationOutcomes;
    if (!allowed.includes(outcome)) throw new Error(`Outcome for a ${lease.purpose} lease must be one of: ${allowed.join(', ')}`);
    const text = note?.trim() ?? '';
    if (['failed', 'ideas', 'none'].includes(outcome) && !text) throw new Error(`Outcome ${outcome} needs --note (what happened, or the task IDs filed)`);
    if (lease.purpose === 'task') {
      const task = reviewData(lease.workspace, database).tasks.find(t => t.taskId === lease.taskId);
      if (!task) throw new Error(`Task ${lease.taskId} is no longer in the workspace`);
      const latest = task.drafts[0];
      const since = Date.parse(lease.claimedAt);
      if (outcome === 'completed' && task.status !== 'done') throw new Error('Task is still open; complete it with the helper first, or release with another outcome');
      if ((outcome === 'draft' || outcome === 'handoff') && !(latest?.outcome === 'draft' && Date.parse(latest.recordedAt) >= since))
        throw new Error('No draft record saved during this lease; record the draft or handoff first');
      if (outcome === 'handoff' && !latest!.reference.startsWith('marketing/handoffs/'))
        throw new Error('A handoff record must reference marketing/handoffs/<task ID>.md');
      if ((outcome === 'snoozed' || outcome === 'skipped') && task.disposition?.state !== outcome)
        throw new Error(`Task is not ${outcome}; set the disposition with the helper first`);
    }
    unlinkSync(leaseFile(dir, lease.projectId));
    appendHistory(dir, { at: now.toISOString(), event: 'release', leaseId, agent, purpose: lease.purpose, projectId: lease.projectId,
      taskId: lease.taskId, mode: lease.mode, outcome, ...(text ? { note: text.slice(0, 500) } : {}) });
    return { released: true, leaseId, project: lease.displayName, taskId: lease.taskId, outcome };
  });
}

// ---------- coverage for the CMO pass ----------

const impactLine = (summary: string) => /^Impact:\s*(.+)$/m.exec(summary)?.[1]?.trim().slice(0, 240) ?? null;

/** Read-only portfolio view for ideation: what each product has tried, what worked, what the user turned down. */
export function coverage(database: string, directories: string[] = [], now = new Date()) {
  const { dir } = registry(database);
  const settings = readSettings(database);
  const history = readHistory(dir);
  const board = reviewBoard(directories, database);
  const projects = board.projects.map(data => {
    const id = data.project.id;
    const e = effective(settings, id);
    const status = new Map(data.tasks.map(t => [t.taskId, t.status]));
    const today = localDate(now, data.project.timezone);
    const counts = { open: 0, claimable: 0, needsYou: 0, waiting: 0, snoozed: 0, skipped: 0, done: 0 };
    const byActivity = new Map<string, { activity: string; open: number; done: number; skipped: number; lastFiled: string | null }>();
    const openTasks: { taskId: string; priority: string; category: string; title: string; filedDate: string; state: string }[] = [];
    const recentDone: { taskId: string; category: string; title: string; completedAt: string | null; impact: string | null }[] = [];
    const skipped: { taskId: string; category: string; title: string; reason: string | null }[] = [];
    const stuck: { taskId: string; title: string; failures: number }[] = [];
    const cmo = { open: 0, done: 0, skipped: 0 };
    for (const task of data.tasks) {
      const activity = activityOf(task.category);
      const a = byActivity.get(activity) ?? { activity, open: 0, done: 0, skipped: 0, lastFiled: null };
      if (!a.lastFiled || task.filedDate > a.lastFiled) a.lastFiled = task.filedDate;
      byActivity.set(activity, a);
      const fromCmo = cmoIdeaPattern.test(task.materials);
      if (task.status !== 'open') {
        counts.done++; a.done++; if (fromCmo) cmo.done++;
        recentDone.push({ taskId: task.taskId, category: task.category, title: task.title,
          completedAt: task.completion?.recordedAt ?? null, impact: task.completion ? impactLine(task.completion.summary) : null });
        continue;
      }
      if (task.disposition?.state === 'skipped') {
        counts.skipped++; a.skipped++; if (fromCmo) cmo.skipped++;
        skipped.push({ taskId: task.taskId, category: task.category, title: task.title, reason: task.disposition.reason ?? null });
        continue;
      }
      counts.open++; a.open++; if (fromCmo) cmo.open++;
      const c = classify(task, status, today, now);
      let state: string;
      if ('mode' in c) {
        const blocked = gate(task, c.mode, e);
        state = blocked ? `not at this level: ${blocked}` : `claimable: ${c.mode}`;
        if (c.mode === 'handoff') counts.needsYou++;
        if (!blocked) counts.claimable++;
      } else {
        state = c.skip;
        if (/waits on the user/.test(c.skip)) counts.needsYou++;
        else if (c.skip.startsWith('snoozed')) counts.snoozed++;
        else counts.waiting++;
      }
      const n = failures(history, id, task.taskId, now);
      if (n >= stuckFailures) stuck.push({ taskId: task.taskId, title: task.title, failures: n });
      openTasks.push({ taskId: task.taskId, priority: task.priority, category: task.category, title: task.title, filedDate: task.filedDate, state });
    }
    recentDone.sort((x, y) => (y.completedAt ?? '').localeCompare(x.completedAt ?? ''));
    const tried = new Set([...byActivity.keys()]);
    const neverTried = activityCatalog.map(a => a.activity).filter(a => !tried.has(a));
    const active = counts.open - counts.snoozed;
    const budget = Math.max(0, Math.min(e.limits.ideasPerProject, e.limits.maxOpenTasks - active));
    const ideation = e.limits.ideasPerProject === 0 ? { eligible: false, budget: 0, agentOnly: false, reason: 'ideasPerProject is 0 at this level' }
      : budget === 0 ? { eligible: false, budget: 0, agentOnly: false, reason: `${active} open tasks (limit ${e.limits.maxOpenTasks}); work the queue first` }
      : counts.needsYou >= e.limits.maxNeedsYou ? { eligible: true, budget: 1, agentOnly: true, reason: `${counts.needsYou} items wait on the user; file at most one idea the agent can finish alone` }
      : { eligible: true, budget, agentOnly: false, reason: `up to ${budget} new ideas` };
    const lastIdeation = history.filter(x => x.projectId === id && x.purpose === 'ideation' && x.event === 'release' && x.outcome !== 'failed')
      .map(x => x.at).sort().pop() ?? null;
    const lease = readLease(dir, id);
    return {
      project: { id, displayName: data.project.displayName, workspace: data.project.root, sourceRoot: data.project.sourceRoot, timezone: data.project.timezone },
      level: { level: e.level, name: e.name },
      counts,
      activities: [...byActivity.values()].sort((x, y) => x.activity.localeCompare(y.activity)),
      neverTried,
      openTasks,
      recentDone: recentDone.slice(0, 15),
      skipped,
      stuck,
      cmoIdeas: cmo,
      autopilot: {
        claims24h: claimsSince(history, x => x.projectId === id && x.purpose === 'task', now.valueOf() - day),
        lastIdeation,
        lease: lease && Date.parse(lease.expiresAt) > now.valueOf() ? { agent: lease.agent, purpose: lease.purpose, taskId: lease.taskId, expiresAt: lease.expiresAt } : null,
      },
      ideation,
      warnings: data.warnings,
    };
  });
  return { generatedAt: now.toISOString(), settings: showSettings(database).portfolio, projects, unavailable: board.unavailable };
}
