import type { Infer } from '../../schemas/validation.ts';
import { artifactSchema, adapterCapabilitiesSchema, localProjectSchema, policySchema, projectSchema, reviewSchema, reviewBindingSchema, runSchema, runInputSchema, runOutputSchema, scheduleSchema, taskDispositionSchema, taskEvidenceSchema, taskKeySchema } from '../../schemas/contracts.ts';

export type Project = Infer<typeof projectSchema>;
export type LocalProject = Infer<typeof localProjectSchema>;
export type Policy = Infer<typeof policySchema>;
export type Run = Infer<typeof runSchema>;
export type RunInput = Infer<typeof runInputSchema>;
export type RunOutput = Infer<typeof runOutputSchema>;
export type Artifact = Infer<typeof artifactSchema>;
export type Review = Infer<typeof reviewSchema>;
export type TaskDisposition = Infer<typeof taskDispositionSchema>;
export type TaskEvidence = Infer<typeof taskEvidenceSchema>;
export type Schedule = Infer<typeof scheduleSchema>;
export type AdapterCapabilities = Infer<typeof adapterCapabilitiesSchema>;
export type TaskKey = Infer<typeof taskKeySchema>;

export function defaultPolicy(): Policy {
  return { mode: 'draft', allowedWritePaths: [], validationCommands: [], commit: 'deny', push: 'deny', publish: 'deny', spending: 'deny' };
}

/** The caller supplies a newly allocated UUID or reuses the recorded UUID on relocation. */
export function createProject(id: string, displayName: string): Project {
  return projectSchema.parse({ schemaVersion: 1, id, displayName,
    contextPath: 'marketing/AGENT.md', tasksPath: 'marketing/TASKS.md', facts: [],
    policy: defaultPolicy(), timezone: 'UTC', cadence: { kind: 'manual', localTime: null, weekdays: [] } });
}

/** Bind the legacy parser's task ID; names/paths never enter the identity. */
export function taskIdentity(projectId: string, legacyTaskId: string): string {
  const key = taskKeySchema.parse({ projectId, taskId: legacyTaskId });
  return `${key.projectId}:${key.taskId}`;
}

export function bindProject(project: unknown, local: unknown): { project: Project; local: LocalProject } {
  const parsedProject = projectSchema.parse(project);
  const parsedLocal = localProjectSchema.parse(local);
  if (parsedProject.id !== parsedLocal.projectId) throw new Error('Local mapping project ID does not match portable project ID');
  return { project: parsedProject, local: parsedLocal };
}

/** No implicit migration of unknown versions. v1 is the initial portable format. */
export const CONFIG_MIGRATIONS = Object.freeze([{ from: null, to: 1, description: 'Initial typed configuration; legacy task Markdown unchanged.' }]);
export function loadProjectConfig(value: unknown): Project { return projectSchema.parse(value); }
export function serializeProjectConfig(value: unknown): string {
  return JSON.stringify(projectSchema.parse(value), null, 2) + '\n';
}

/** Only reviewed, sourced facts can enter generated product claims. */
export function verifiedProductFacts(project: Project): Project['facts'] {
  return projectSchema.parse(project).facts.filter(f => f.status === 'verified');
}

/** Comparison helper only; P08 must verify ownership, artifact bytes, and action state. */
export function reviewMatches(review: unknown, intendedBinding: unknown): boolean {
  const parsed = reviewSchema.parse(review);
  const binding = reviewBindingSchema.parse(intendedBinding);
  return parsed.decision === 'approved' && JSON.stringify(parsed.binding) === JSON.stringify(binding);
}
