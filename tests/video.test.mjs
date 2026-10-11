import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash, previewRemoval, applyRemoval, removalHash } from '../src/onboarding/install.ts';
import { prepareTask, recordTaskEvidence } from '../src/interactive/tasks.ts';
import { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';
import { promptCategory } from '../src/core/task-prompt.ts';

const entrypoints = ['.agents/skills/promotion-video/SKILL.md', '.claude/commands/promote-video.md', '.opencode/commands/promote-video.md'];
const activityDir = 'templates/activities/video';
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(([, href]) => resolve(dirname(file), href));
}
function verifyLinks(file, expectedActivity) {
  const found = links(file);
  assert.ok(found.includes(expectedActivity), `Activity not reachable from ${file}`);
  for (const link of found) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-video-'));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, project };
}

test('shared workflow routes video requests to the one canonical activity with its budget', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"Make a video"'));
  assert.ok(route, 'Video request route missing');
  assert.match(route, /activity `video`/);
  assert.ok(links('templates/WORKFLOW.md').includes(resolve(activityDir, 'WORKFLOW.md')));
  const row = workflow.split('\n').find(line => line.startsWith('| video |'));
  assert.ok(row, 'Video budget row missing');
  assert.match(row, /One video, or one cut plus its aspect variants/);
  assert.match(row, /script.*MP4.*contact sheet.*evidence/);
  // Every reference beside the procedure is linked from it and resolves.
  const procedure = resolve(activityDir, 'WORKFLOW.md');
  const referenced = links(procedure);
  for (const link of referenced) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
  for (const name of readdirSync(activityDir).filter(n => n !== 'WORKFLOW.md'))
    assert.ok(referenced.includes(resolve(activityDir, name)), `${name} is not linked from the video procedure`);
  const text = readFileSync(procedure, 'utf8');
  for (const boundary of ['marketing/assets/videos/<project>/', 'npx hyperframes auth status', '--api-key', 'SCRIPT.md', 'signed-out', 'Never commit, push or deploy'])
    assert.ok(text.includes(boundary), `Procedure lacks boundary: ${boundary}`);
});

test('video entrypoints share the activity and remain portable, owned and customization-safe', t => {
  const { root, project } = fixture(t);
  const sourceActivity = resolve(activityDir, 'WORKFLOW.md');
  for (const path of entrypoints) {
    verifyLinks(resolve(path), sourceActivity);
    assert.doesNotMatch(readFileSync(path, 'utf8'), /^model:|^agent:|^context:\s*fork|^subtask:|!`/m);
  }
  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  const installedActivity = join(moved, '.promotion-agent', activityDir, 'WORKFLOW.md');
  for (const path of entrypoints) verifyLinks(join(moved, path), installedActivity);
  for (const name of readdirSync(activityDir)) {
    const installed = join(moved, '.promotion-agent', activityDir, name);
    assert.equal(readFileSync(installed, 'utf8'), readFileSync(join(activityDir, name), 'utf8'));
    for (const link of links(installed)) assert.ok(existsSync(link), `Missing installed resource: ${link}`);
  }
  const customized = join(moved, entrypoints[0]);
  writeFileSync(customized, 'User-customized video workflow\n');
  const upgraded = previewInstall(moved, 'Ignored');
  assert.equal(upgraded.entries.find(e => e.path === entrypoints[0]).action, 'preserve');
  applyInstall(moved, upgraded, reviewHash(upgraded));
  const removal = previewRemoval(moved);
  applyRemoval(moved, removal, removalHash(removal));
  assert.equal(readFileSync(customized, 'utf8'), 'User-customized video workflow\n');
  for (const path of entrypoints.slice(1)) assert.equal(existsSync(join(moved, path)), false);
});

test('video task survives preparation, draft render evidence and review handoff without completion', t => {
  const { project } = fixture(t);
  const taskFile = join(project, 'marketing/TASKS.md');
  const markdown = '# Marketing tasks\n\n## Open\n\n- [ ] T-601 | 2026-10-10 | P1 | video | Make a 45-second site tour\n      URL: https://example-desk.example\n      Materials: Square site tour for the X feed from approved homepage copy.\n\n## Done\n';
  writeFileSync(taskFile, markdown);
  assert.equal(promptCategory('video'), 'video');
  const prepared = prepareTask(project, 'T-601');
  assert.ok(prepared.prompt.includes('site tour'));
  assert.ok(prepared.prompt.includes('SCRIPT.md'));
  assert.ok(prepared.prompt.includes('npx hyperframes auth status'));
  const dir = 'marketing/assets/videos/site-tour';
  mkdirSync(join(project, dir, 'renders'), { recursive: true });
  mkdirSync(join(project, dir, 'snapshots'), { recursive: true });
  const render = `${dir}/renders/site-tour.mp4`;
  const sheet = `${dir}/snapshots/contact-sheet.png`;
  // Synthetic bytes only; no video was rendered.
  writeFileSync(join(project, render), Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]));
  writeFileSync(join(project, sheet), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const mp4 = recordTaskEvidence(project, 'T-601', prepared.revision, 'draft', render, 'Draft render, 43.7 s, 1080x1080; awaiting approval');
  recordTaskEvidence(project, 'T-601', prepared.revision, 'draft', sheet, 'Contact sheet for the draft render');
  assert.match(readFileSync(join(project, mp4.path), 'utf8'), /"referenceSha256": "[a-f0-9]{64}"/);
  const data = reviewData(project);
  const task = data.tasks.find(t => t.taskId === 'T-601');
  assert.equal(task.category, 'video');
  assert.equal(task.status, 'open');
  assert.equal(task.completion, null);
  assert.deepEqual(task.drafts.map(d => d.reference).sort(), [render, sheet].sort());
  const handoff = reviewPrompt(data, task);
  assert.equal(handoff.target, 'promotion');
  assert.ok(handoff.text.includes('T-601'));
  assert.ok(handoff.text.includes(render));
  assert.ok(handoff.text.includes(sheet));
  assert.equal(readFileSync(taskFile, 'utf8'), markdown);
});
