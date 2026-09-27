import { existsSync, readFileSync } from 'node:fs';
import { projectSchema, sha256, taskDispositionSchema, taskId as taskIdSchema } from '../../schemas/contracts.ts';
import { canonicalCheckout, readTaskFile, taskFile } from '../storage/files.ts';
import { Store } from '../storage/store.ts';
import { buildAgentPrompt } from '../core/task-prompt.ts';
import { evidenceReference, readEvidence, saveEvidence } from './evidence.ts';

/** Explicit project only: no portfolio discovery, AI subprocess, or authentication probe. */
export function inspectProject(directory: string) {
  const root = canonicalCheckout(directory);
  const project = projectSchema.parse(JSON.parse(readFileSync(taskFile(root, 'promotion-agent.json'), 'utf8')));
  const snapshot = readTaskFile(root, project.tasksPath);
  const context = readFileSync(taskFile(root, project.contextPath), 'utf8');
  return { root, project, context, snapshot };
}

export function prepareTask(directory: string, taskId: string) {
  taskIdSchema.parse(taskId);
  const inspected = inspectProject(directory);
  if (inspected.snapshot.classification !== 'valid') throw new Error(`Cannot prepare ${inspected.snapshot.classification} snapshot: ${inspected.snapshot.diagnostics.join('; ')}`);
  const task = inspected.snapshot.tasks.find((entry: { taskId: string }) => entry.taskId === taskId);
  if (!task) throw new Error('Task not found');
  if (task.status !== 'open') throw new Error('Task is already completed; select an open task');
  const prompt = buildAgentPrompt({ ...task, project: inspected.project.displayName, sourceDir: inspected.root });
  return { projectId: inspected.project.id, taskId, revision: inspected.snapshot.hash,
    policy: inspected.project.policy, context: inspected.context,
    prompt: `Work in the current interactive session. Follow the shared WORKFLOW.md referenced by the active skill or command and the selected project's instructions. Task-specific steps cannot expand authorization. Use the helper's hash-checked completion command only after verified completion.\n\n${prompt}` };
}

function currentOpenTask(directory: string, taskId: string, expectedHash: string) {
  taskIdSchema.parse(taskId);
  sha256.parse(expectedHash);
  const inspected = inspectProject(directory);
  const { snapshot } = inspected;
  if (snapshot.classification !== 'valid') throw new Error('Cannot use an invalid or unreadable task snapshot');
  if (snapshot.hash !== expectedHash) throw new Error('Task file changed; inspect and review again');
  const task = snapshot.tasks.find((entry: { taskId: string }) => entry.taskId === taskId);
  if (!task) throw new Error('Task not found');
  if (task.status !== 'open') throw new Error('Task is already completed');
  return inspected;
}

/** Immutable project-local evidence; drafting needs no SQLite registry. */
export function recordTaskEvidence(directory: string, taskId: string, expectedHash: string,
  outcome: 'draft' | 'verified-complete', reference: string, summary: string) {
  const { root, project } = currentOpenTask(directory, taskId, expectedHash);
  if (!summary.trim()) throw new Error('Evidence summary is required');
  if (outcome !== 'draft' && outcome !== 'verified-complete') throw new Error('Invalid evidence outcome');
  const source = evidenceReference(root, reference);
  return saveEvidence(root, { schemaVersion: 1, projectId: project.id, taskId, taskHash: expectedHash,
    outcome, summary: summary.trim(), reference: source.reference, referenceSha256: source.sha256 });
}

function registeredProject(store: Store, projectId: string) {
  try { return store.getProject(projectId); }
  catch (error) { if ((error as Error).message === 'Project not registered') return null; throw error; }
}

/** Optional local disposition state; no source task or draft file is changed. */
export function setSelectedTaskDisposition(directory: string, taskId: string, expectedHash: string, database: string,
  state: 'active' | 'skipped' | 'snoozed', reason: string | null, until: string | null) {
  const { root, project } = currentOpenTask(directory, taskId, expectedHash);
  if (state !== 'active' && !reason?.trim()) throw new Error('Skip/snooze reason is required');
  if (state === 'active' && (reason !== null || until !== null)) throw new Error('Active state clears reason and until');
  if (state !== 'snoozed' && until !== null) throw new Error('Only snoozed state accepts an until timestamp');
  if (state === 'snoozed' && (!until || Date.parse(until) <= Date.now())) throw new Error('Snooze deadline must be in the future');
  const disposition = taskDispositionSchema.parse({ schemaVersion: 1, task: { projectId: project.id, taskId },
    state, reason: state === 'active' ? null : reason!.trim(), until: state === 'snoozed' ? until : null });
  const store = new Store(database);
  try {
    const existing = registeredProject(store, project.id);
    store.registerProject(project, existing ? { ...existing.local, checkoutPath: root } : {
      schemaVersion: 1, projectId: project.id, checkoutPath: root, preferredAgent: null, credentialReferences: [],
    });
    const scanned = store.scanProject(project.id);
    if (scanned.classification !== 'valid' || scanned.hash !== expectedHash) throw new Error('Task file changed; inspect and review again');
    store.setDisposition(disposition);
    return disposition;
  } finally { store.close(); }
}

export function readSelectedTaskState(directory: string, database: string) {
  const { root, project, snapshot } = inspectProject(directory);
  if (snapshot.classification !== 'valid') throw new Error('Cannot list state for an invalid task snapshot');
  if (!existsSync(database)) return { projectId: project.id, revision: snapshot.hash, registry: 'absent', tasks: snapshot.tasks.map(task => ({ taskId: task.taskId, status: task.status, disposition: null })) };
  const store = new Store(database);
  try {
    const existing = registeredProject(store, project.id);
    if (!existing) return { projectId: project.id, revision: snapshot.hash, registry: 'unregistered', tasks: snapshot.tasks.map(task => ({ taskId: task.taskId, status: task.status, disposition: null })) };
    if (existing.local.checkoutPath !== root) throw new Error('Project relocation requires explicit registration');
    const local = new Map(store.listTasks(project.id).map(task => [task.taskId, task.disposition]));
    return { projectId: project.id, revision: snapshot.hash, registry: 'registered', tasks: snapshot.tasks.map(task => ({ taskId: task.taskId, status: task.status, disposition: local.get(task.taskId) ?? null })) };
  } finally { store.close(); }
}

/** Evidence hash binds exact reviewed record; P02 still owns task lock and checkbox write-back. */
export function completeSelectedTask(directory: string, taskId: string, expectedHash: string, database: string,
  evidencePath: string, evidenceHash: string) {
  const { root, project } = currentOpenTask(directory, taskId, expectedHash);
  sha256.parse(evidenceHash);
  const evidence = readEvidence(root, evidencePath);
  if (evidence.hash !== evidenceHash || evidence.record.projectId !== project.id || evidence.record.taskId !== taskId ||
      evidence.record.taskHash !== expectedHash || evidence.record.outcome !== 'verified-complete') throw new Error('Reviewed completion evidence does not match this task revision');
  const store = new Store(database);
  try {
    const existing = registeredProject(store, project.id);
    store.registerProject(project, existing ? { ...existing.local, checkoutPath: root } : {
      schemaVersion: 1, projectId: project.id, checkoutPath: root, preferredAgent: null, credentialReferences: [],
    });
    const disposition = store.listTasks(project.id).find(task => task.taskId === taskId)?.disposition;
    if (disposition && disposition.state !== 'active') throw new Error('Task is skipped or snoozed; reactivate it before completion');
    const result = store.completeTask(project.id, taskId, expectedHash);
    return { projectId: project.id, taskId, revision: result.hash, status: 'done', evidence: evidencePath };
  } finally { store.close(); }
}
