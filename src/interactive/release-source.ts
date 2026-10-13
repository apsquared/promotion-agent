import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { projectSchema } from '../../schemas/contracts.ts';
import { canonicalCheckout, taskFile } from '../storage/files.ts';
import { requireWorkspace } from '../onboarding/workspace.ts';

const maxCommits = 100;
const maxFiles = 50;
const oid = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

// A conservative discovery filter, not a guarantee that other paths contain no secrets.
// Return names only: no commit messages, authors, remotes, diff or file contents.
export function releaseSourcePath(path: string): boolean {
  if (path.length > 240 || /[\x00-\x1f\x7f\\]/.test(path)) return false;
  const parts = path.toLowerCase().split('/');
  if (parts.some(p => !p || p === '..' || p.startsWith('.') ||
    /(?:secret|credential|token|password|private|customer|contacts?|backup|dump)/.test(p) ||
    /^(?:data|fixtures|node_modules|vendor|dist|build|coverage)$/.test(p))) return false;
  const name = parts.at(-1)!;
  if (/^(?:env|config\.local)(?:\.|$)|(?:^|[._-])(?:key|keys|auth|accounts?)(?:[._-]|$)|lock/.test(name)) return false;
  return /\.(?:md|mdx|txt|ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|css|scss|html|json|yaml|yml|toml)$/.test(name);
}

/** Bounded, local, read-only source discovery. Host permissions still govern Git access. */
export function releaseSource(workspace: string, baseRef: string, headRef: string) {
  const root = canonicalCheckout(workspace);
  const { sourcePath } = requireWorkspace(root);
  const project = projectSchema.parse(JSON.parse(readFileSync(taskFile(root, 'promotion-agent.json'), 'utf8')));
  function git(args: string[]) {
    try {
      return execFileSync('git', ['--no-pager', '--no-optional-locks', '--no-replace-objects', '-c', 'core.fsmonitor=false', '-C', sourcePath, ...args], {
        encoding: 'utf8', timeout: 10_000, maxBuffer: 512 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
        // Do not let ambient Git variables redirect the observed repository or its objects.
        env: Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
      });
    } catch {
      // Git diagnostics may contain private paths or ref text. Never echo them into context.
      throw new Error('Release source Git read failed; verify refs, history and scope locally');
    }
  }
  if (realpathSync(git(['rev-parse', '--show-toplevel']).trim()) !== sourcePath)
    throw new Error('Observed source must be the repository root');
  if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false')
    throw new Error('Release source requires complete local history; use a supplied changelog instead');
  function resolveRef(ref: string) {
    if (typeof ref !== 'string' || ref.length > 200 || !/^[A-Za-z0-9_][A-Za-z0-9_./~^-]*$/.test(ref) || ref.includes('..'))
      throw new Error('Release refs must be individual local refs or commit IDs');
    const hash = git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
    if (!oid.test(hash)) throw new Error('Release ref did not resolve to a commit');
    return hash;
  }
  const baseCommit = resolveRef(baseRef);
  const headCommit = resolveRef(headRef);
  // Two-dot range: base excluded, head included. Refuse unrelated or reversed comparisons.
  git(['merge-base', '--is-ancestor', baseCommit, headCommit]);
  const ids = git(['rev-list', '--reverse', `--max-count=${maxCommits + 1}`, `${baseCommit}..${headCommit}`]).trim().split('\n').filter(Boolean);
  if (ids.length > maxCommits) throw new Error('Release range exceeds 100 commits; narrow the comparison');
  if (ids.some(id => !oid.test(id))) throw new Error('Invalid commit list');
  const commits = ids.map(commit => {
    const paths = [...new Set(git(['diff-tree', '--root', '-m', '--no-commit-id', '--name-only', '--no-renames', '-r', '-z', commit]).split('\0').filter(Boolean))];
    const safe = paths.filter(releaseSourcePath);
    return { commit, files: safe.slice(0, maxFiles), excludedFileCount: paths.length - safe.length,
      omittedFileCount: Math.max(0, safe.length - maxFiles) };
  });
  return { schemaVersion: 1, projectId: project.id, kind: 'git', baseCommit, headCommit,
    comparison: 'base excluded; head included; all reachable commits in base..head', commits,
    limitations: ['Names only; inspect minimal sanitized excerpts at these commits.',
      'Sensitive/non-source paths excluded; file lists may be truncated. Omitted paths are not reviewed.',
      'Local commits do not prove merge, deployment, availability or publication. Working-tree edits are excluded.'] };
}
