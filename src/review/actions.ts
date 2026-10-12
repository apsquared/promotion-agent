import { inspectProject, completeSelectedTask, readSelectedTaskState, recordTaskEvidence, setSelectedTaskDisposition } from '../interactive/tasks.ts';

export type ReviewAction = { action: 'complete' | 'skip' | 'resume'; projectId: string; taskId: string; revision: string; note?: string };

const maxNote = 2000;

/** Parse an untrusted browser request body; paths and databases never come from the browser. */
export function parseReviewAction(body: unknown): ReviewAction {
  const input = (body ?? {}) as Record<string, unknown>;
  if (!['complete', 'skip', 'resume'].includes(input.action as string)) throw new Error('Unknown action');
  if (typeof input.projectId !== 'string' || typeof input.taskId !== 'string' || typeof input.revision !== 'string')
    throw new Error('Project, task and revision are required');
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > maxNote)) throw new Error('Note is too long');
  return { action: input.action as ReviewAction['action'], projectId: input.projectId, taskId: input.taskId, revision: input.revision, note: (input.note as string | undefined)?.trim() };
}

/**
 * The person's own decision from the desk. Uses the same hash-checked helpers as the agent:
 * completion records a `verified-complete` account and checks the workspace task box; skip/resume set registry state.
 */
export function applyReviewAction(directory: string, database: string | undefined, input: ReviewAction) {
  if (!database) throw new Error('Marking tasks needs a registry. Relaunch the review desk with --database.');
  const { taskId, revision, note } = input;
  if (inspectProject(directory).project.id !== input.projectId) throw new Error('Project changed; refresh the board');
  if (input.action === 'resume') return setSelectedTaskDisposition(directory, taskId, revision, database, 'active', null, null);
  if (input.action === 'skip')
    return setSelectedTaskDisposition(directory, taskId, revision, database, 'skipped', note || 'Skipped in the review desk.', null);
  const state = readSelectedTaskState(directory, database).tasks.find((task) => task.taskId === taskId);
  if (state?.disposition && state.disposition.state !== 'active') throw new Error('Resume this task before marking it complete');
  // The task file is the reference: the record documents a decision made at the desk, not an external receipt.
  const { project } = inspectProject(directory);
  const summary = [
    `Outputs: ${note || 'Not described.'} (marked complete by hand in the review desk)`,
    'Impact: Not recorded.',
    'Next steps: None recorded.',
  ].join('\n');
  const evidence = recordTaskEvidence(directory, taskId, revision, 'verified-complete', project.tasksPath, summary);
  return completeSelectedTask(directory, taskId, revision, database, evidence.path, evidence.hash);
}
