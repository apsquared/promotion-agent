import { schedulerAdapter } from '../../schemas/contracts.ts';

/** Lifecycle states a scheduled-post record can report; `drafted` and `approved` precede any record. */
export const scheduledPostStates = ['scheduled', 'published', 'failed', 'cancelled', 'uncertain'] as const;
export type ScheduledPost = {
  adapter: 'manual' | 'post-bridge';
  channel: string | null;
  account: string | null;
  /** Canonical UTC timestamp. */
  scheduledFor: string;
  /** Provider post ID, or the manual handoff note. */
  reference: string | null;
  status: (typeof scheduledPostStates)[number];
};

const fields: Record<string, keyof ScheduledPost> = {
  'scheduled post': 'adapter', channel: 'channel', account: 'account',
  'scheduled for': 'scheduledFor', 'provider reference': 'reference', status: 'status',
};

/**
 * Read the labeled lines of a scheduled-post evidence summary (templates/publishing/WORKFLOW.md):
 *
 *     Scheduled post: post-bridge
 *     Channel: x
 *     Account: <account reference>
 *     Scheduled for: 2026-10-13T13:00:00Z
 *     Provider reference: <post ID>
 *     Status: scheduled, unverified
 *
 * Returns null unless the adapter and a UTC time are present. This parses an agent's account; it proves nothing.
 */
export function parseScheduledPost(summary: string): ScheduledPost | null {
  const found: Partial<Record<keyof ScheduledPost, string>> = {};
  for (const line of summary.split('\n')) {
    const match = /^\s*(scheduled post|channel|account|scheduled for|provider reference|status)\s*:\s*(.+?)\s*$/i.exec(line);
    if (match && !found[fields[match[1].toLowerCase()]]) found[fields[match[1].toLowerCase()]] = match[2];
  }
  let adapter: ScheduledPost['adapter'];
  try { adapter = schedulerAdapter.parse(found.adapter?.toLowerCase()); } catch { return null; }
  const time = found.scheduledFor;
  if (!time || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/.test(time) || !Number.isFinite(Date.parse(time))) return null;
  const state = /^[a-z]+/i.exec(found.status ?? '')?.[0].toLowerCase() ?? 'scheduled';
  return {
    adapter, channel: found.channel ?? null, account: found.account ?? null,
    scheduledFor: new Date(time).toISOString(), reference: found.reference ?? null,
    status: (scheduledPostStates as readonly string[]).includes(state) ? state as ScheduledPost['status'] : 'uncertain',
  };
}

/** `Tue 2026-10-13 09:00 America/New_York` for a UTC timestamp in the project timezone. */
export function projectLocalTime(utc: string, timeZone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(utc)).map(p => [p.type, p.value]));
  return `${parts.weekday} ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${timeZone}`;
}
