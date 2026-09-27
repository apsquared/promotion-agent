import { array, boolean, choice, literal, nullable, nonnegative, object, positiveInteger, refine, rule, text } from './validation.ts';

export const SCHEMA_VERSION = 1;
export const uuid = rule<string>(v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v), 'lowercase UUID');
export const timestamp = rule<string>(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v, 'canonical UTC timestamp');
export const relativePath = rule<string>(v => typeof v === 'string' && v.length > 0 && !/[\\:*?\[\]{}\x00-\x1f]/.test(v) && !v.startsWith('/') && v.split('/').every(p => p !== '' && p !== '.' && p !== '..'), 'literal repo-relative POSIX path without traversal or globs');
export const absolutePath = rule<string>(v => typeof v === 'string' && !/[\x00-\x1f]/.test(v) && (/^\//.test(v) || /^[A-Za-z]:[\\/]/.test(v) || /^\\\\[^\\]+\\[^\\]+/.test(v)) && !v.split(/[\\/]/).includes('..'), 'absolute local checkout path');
export const timezone = rule<string>(v => {
  if (typeof v !== 'string' || !/^(UTC|[A-Za-z_]+\/[A-Za-z_+\-/]+)$/.test(v)) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; }
}, 'IANA timezone');
export const agent = choice('codex', 'claude-code', 'opencode');
export const mode = choice('draft', 'apply');
export const taskId = rule<string>(v => typeof v === 'string' && /^T-\d+$/.test(v), 'legacy task ID (T-digits)');
export const taskKeySchema = object({ projectId: uuid, taskId });
export const sha256 = rule<string>(v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v), 'SHA-256 hex');
export const sourceSchema = object({ path: relativePath, reference: text });
export const factSchema = refine(object({
  key: text, status: choice('unknown', 'unverified', 'verified'), value: nullable(text),
  sources: array(sourceSchema), verifiedAt: nullable(timestamp),
}), f => f.status === 'unknown' ? f.value === null && f.verifiedAt === null
  : f.value !== null && (f.status === 'verified' ? f.sources.length > 0 && f.verifiedAt !== null : f.verifiedAt === null),
'unknown facts have no value; verified facts require sources and verification date');
export const validationCommandSchema = object({
  // Executable + arguments, never a shell command string. Execution still requires approval/gates.
  argv: refine(array(text), v => v.length > 0, 'command argv cannot be empty'),
  cwd: nullable(relativePath), timeoutSeconds: positiveInteger,
});
export const policySchema = object({
  mode, allowedWritePaths: array(relativePath), validationCommands: array(validationCommandSchema),
  commit: choice('deny', 'explicit-approval'), push: choice('deny', 'explicit-approval'),
  publish: choice('deny', 'exact-content-review'), spending: literal('deny'),
});
export const cadenceSchema = refine(object({
  kind: choice('manual', 'daily', 'weekly'),
  localTime: nullable(rule<string>(v => typeof v === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v), 'HH:mm')),
  weekdays: array(rule<number>(v => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 7, 'ISO weekday 1-7')),
}), c => new Set(c.weekdays).size === c.weekdays.length && (c.kind === 'manual' ? c.localTime === null && c.weekdays.length === 0 : c.localTime !== null && (c.kind === 'daily' ? c.weekdays.length === 0 : c.weekdays.length > 0)), 'cadence fields must match manual/daily/weekly kind');
export const projectSchema = object({
  schemaVersion: literal(SCHEMA_VERSION), id: uuid, displayName: text,
  contextPath: relativePath, tasksPath: relativePath, facts: array(factSchema),
  policy: policySchema, timezone, cadence: cadenceSchema,
});
export const credentialReferenceSchema = object({
  connector: text, environmentVariable: rule<string>(v => typeof v === 'string' && /^[A-Z_][A-Z0-9_]*$/.test(v), 'environment variable NAME only'),
});
export const localProjectSchema = object({
  schemaVersion: literal(SCHEMA_VERSION), projectId: uuid, checkoutPath: absolutePath,
  preferredAgent: nullable(agent), credentialReferences: array(credentialReferenceSchema),
});
export const budgetSchema = object({ maxSeconds: positiveInteger, maxCostUsd: nullable(nonnegative) });
export const runInputSchema = object({
  schemaVersion: literal(SCHEMA_VERSION), id: uuid, projectId: uuid, agent, activity: text,
  context: array(sourceSchema), policy: policySchema, budget: budgetSchema, outputDirectory: relativePath,
});
export const artifactSchema = object({
  schemaVersion: literal(SCHEMA_VERSION), id: uuid, revision: uuid, projectId: uuid, runId: uuid,
  path: relativePath, mediaType: text, sha256,
});
export const evidenceSchema = object({ description: text, reference: text, observedAt: timestamp });
/** An agent-supplied account of evidence, not independent proof of an external action. */
export const taskEvidenceSchema = object({
  schemaVersion: literal(SCHEMA_VERSION), id: uuid, projectId: uuid, taskId, taskHash: sha256,
  outcome: choice('draft', 'verified-complete'), summary: text, reference: text,
  referenceSha256: nullable(sha256), recordedAt: timestamp,
});
export const runOutputSchema = object({
  summary: text, artifacts: array(artifactSchema), taskProposals: array(object({ title: text, category: text, materials: text })),
  changedFiles: array(relativePath), evidence: array(evidenceSchema),
  errors: array(object({ code: text, message: text })), sessionReference: nullable(text),
  usage: object({ inputTokens: nullable(nonnegative), outputTokens: nullable(nonnegative), costUsd: nullable(nonnegative) }),
});
export const runSchema = refine(object({
  input: runInputSchema, status: choice('queued', 'running', 'succeeded', 'failed', 'cancelled'),
  startedAt: nullable(timestamp), endedAt: nullable(timestamp), output: nullable(runOutputSchema),
}), r => {
  if (r.output?.artifacts.some(a => a.projectId !== r.input.projectId || a.runId !== r.input.id)) return false;
  if (r.startedAt && r.endedAt && r.endedAt < r.startedAt) return false;
  if (r.status === 'queued') return r.startedAt === null && r.endedAt === null && r.output === null;
  if (r.status === 'running') return r.startedAt !== null && r.endedAt === null && r.output === null;
  if (r.endedAt === null || r.output === null) return false;
  if (r.status === 'succeeded') return r.startedAt !== null && r.output.errors.length === 0 && r.output.evidence.length > 0;
  return r.status !== 'failed' || r.output.errors.length > 0;
}, 'inconsistent lifecycle, output ownership, or success/failure evidence');
export const reviewBindingSchema = object({
  projectId: uuid, artifactId: uuid, artifactRevision: uuid, action: choice('apply', 'publish', 'schedule'),
  destination: text, accountReference: nullable(text), scheduledFor: nullable(timestamp),
});
export const reviewSchema = refine(object({
  schemaVersion: literal(SCHEMA_VERSION), id: uuid, binding: reviewBindingSchema,
  decision: choice('pending', 'approved', 'rejected'), decidedAt: nullable(timestamp),
}), r => (r.decision === 'pending') === (r.decidedAt === null) &&
  (r.binding.action === 'schedule' ? r.binding.scheduledFor !== null : r.binding.scheduledFor === null), 'review decision and intended time must match state/action');
export const taskDispositionSchema = refine(object({
  schemaVersion: literal(SCHEMA_VERSION), task: taskKeySchema, state: choice('active', 'skipped', 'snoozed'),
  reason: nullable(text), until: nullable(timestamp),
}), d => d.state === 'snoozed' ? d.until !== null : d.until === null, 'only snoozed tasks require an until timestamp');
export const scheduleSchema = object({
  schemaVersion: literal(SCHEMA_VERSION), id: uuid, projectId: uuid, enabled: boolean,
  kind: literal('draft-run'), timezone,
  cadence: refine(cadenceSchema, c => c.kind !== 'manual', 'scheduled runs need daily or weekly cadence'),
  budget: budgetSchema, missedRunPolicy: choice('skip', 'ask'), nextRunAt: nullable(timestamp),
});
export const adapterCapabilitiesSchema = refine(object({
  schemaVersion: literal(SCHEMA_VERSION), agent, installedVersion: nullable(text),
  available: boolean, authentication: choice('unknown', 'missing', 'ready'),
  enforcedModes: array(mode), supportsCancel: boolean, supportsResume: boolean,
  supportsStructuredOutput: boolean, supportsUsage: boolean, diagnostic: nullable(text),
  verifiedAt: nullable(timestamp), evidenceReference: nullable(text),
}), c => new Set(c.enforcedModes).size === c.enforcedModes.length &&
  (c.enforcedModes.length === 0 || (c.available && c.installedVersion !== null && c.verifiedAt !== null && c.evidenceReference !== null)),
'advertised enforced modes require available, versioned, verified capability evidence');
