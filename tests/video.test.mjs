import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
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

test('standalone product-video skill is self-contained and its references match the activity', t => {
  const skill = 'skills/product-video';
  const text = readFileSync(join(skill, 'SKILL.md'), 'utf8');
  assert.match(text, /^---\nname: product-video\ndescription: .+\nlicense: MIT\n---\n/);
  const activityRefs = readdirSync(activityDir).filter(n => n !== 'WORKFLOW.md').sort();
  assert.deepEqual(readdirSync(join(skill, 'references')).sort(), activityRefs);
  for (const name of activityRefs)
    assert.equal(readFileSync(join(skill, 'references', name), 'utf8'), readFileSync(join(activityDir, name), 'utf8'), `${name} drifted from the activity`);
  // Copied anywhere on its own, every link still resolves inside the folder.
  const root = mkdtempSync(join(tmpdir(), 'product-video-skill-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const copy = join(root, 'product-video');
  cpSync(skill, copy, { recursive: true });
  const files = ['SKILL.md', ...activityRefs.map(n => `references/${n}`)];
  const linked = new Set();
  for (const file of files) for (const link of links(join(copy, file))) {
    assert.ok(link.startsWith(copy + '/'), `${file} links outside the skill: ${link}`);
    assert.ok(existsSync(link), `Missing linked resource: ${link}`);
    linked.add(link);
  }
  for (const name of activityRefs) assert.ok(linked.has(join(copy, 'references', name)), `${name} is not linked from the skill`);
  for (const file of files) assert.doesNotMatch(readFileSync(join(copy, file), 'utf8'), /\.promotion-agent|templates\/|marketing\/logs|\/Users\//);
});

test('chat replay builds the example into a deterministic HyperFrames composition traced to its transcript', async () => {
  const { validate, compose, markdown, snapshotTimes, MARKER } = await import('../templates/activities/video/chat-replay.mjs');
  const dir = 'examples/chat-replay';
  const replay = JSON.parse(readFileSync(join(dir, 'replay.json'), 'utf8'));
  assert.deepEqual(validate(replay, dir), { errors: [], warnings: [] });
  const { html, timing } = compose(replay, dir);
  assert.equal(compose(replay, dir).html, html);
  // Widgets carry their intrinsic size and the page waits for images, so scrolling is measured on the final layout.
  assert.match(html, /<img src="assets\/opportunities\.svg" width="1360" height="520"/);
  assert.match(html, /document\.images/);
  assert.ok(html.includes(MARKER));
  assert.match(html, new RegExp(`data-composition-id="main" data-start="0" data-duration="${timing.duration}"`));
  assert.match(html, /window\.__timelines\['main'\] = tl;/);
  assert.ok(html.includes('Recreated from a real session'));
  assert.doesNotMatch(html, /Date\.now|Math\.random|fetch\(/);
  for (const beat of timing.beats) if (beat.type !== 'focus' && beat.type !== 'pause') assert.ok(html.includes(`id="${beat.id}"`), beat.id);
  // Streamed units in the page match the timing plan.
  for (const beat of timing.beats.filter(b => b.type === 'assistant'))
    assert.equal(markdown(replay.beats.find(b => b.id === beat.id).text).html.match(/class="w/g).length, beat.units);
  assert.ok(timing.beats.every((b, i) => i === 0 || b.start === timing.beats[i - 1].end));
  assert.equal(snapshotTimes(timing)[0], 0);
  // Every cited turn exists in the transcript.
  const transcript = readFileSync(join(dir, replay.source), 'utf8');
  for (const beat of replay.beats) for (const turn of [beat.from ?? []].flat())
    assert.ok(transcript.includes(`**${turn} ·`), `${beat.id} cites missing turn ${turn}`);
});

test('every chat replay skin builds the example with its own palette and chrome', async () => {
  const { SKINS, validate, compose } = await import('../templates/activities/video/chat-replay.mjs');
  const dir = 'examples/chat-replay';
  const claude = JSON.parse(readFileSync(join(dir, 'replay.json'), 'utf8'));
  const codex = JSON.parse(readFileSync(join(dir, 'replay-codex.json'), 'utf8'));
  assert.deepEqual(Object.keys(SKINS).sort(), ['claude', 'codex']);
  const keys = Object.keys(SKINS.claude.colors).sort();
  for (const skin of Object.values(SKINS)) {
    assert.deepEqual(Object.keys(skin.colors).sort(), keys);
    assert.ok(skin.placeholder && ['rail', 'threads'].includes(skin.sidebar));
  }
  // The Codex example is the Claude one with a different skin, eyebrow and sidebar names.
  const { sidebar, ...rest } = codex;
  assert.deepEqual({ ...rest, skin: 'claude', beats: codex.beats.map(b => b.id) }, { ...claude, beats: claude.beats.map(b => b.id) });
  assert.deepEqual(validate(codex, dir), { errors: [], warnings: [] });
  const html = compose(codex, dir).html;
  assert.ok(html.includes(`--app: ${SKINS.codex.colors.app};`));
  assert.ok(html.includes('id="rail" class="threads"') && html.includes('class="win"') && html.includes('<span class="tool-verb">Called</span>'));
  for (const name of [sidebar.project, ...sidebar.threads, ...sidebar.projects]) assert.ok(html.includes(name), name);
  assert.ok(html.includes(SKINS.codex.placeholder) && html.includes('Worked for 9s') && html.includes('Recreated from a real session'));
  const claudeHtml = compose(claude, dir).html;
  assert.ok(!claudeHtml.includes('tool-verb') && !claudeHtml.includes('class="win"') && claudeHtml.includes('Thought for 9s'));
  // Without names the thread list shows placeholder bars, and long real times read in minutes.
  const bare = { ...rest, beats: [{ id: 'long', type: 'thinking', from: 'T2', realSeconds: 61 }] };
  assert.ok(compose(bare, dir).html.includes('Worked for 1m 1s') && compose(bare, dir).html.includes('class="rail-bar"'));
  assert.match(validate({ ...bare, sidebar: { threads: ['a', 'b', 'c', 'd', 'e'] } }, dir).errors.join('\n'), /up to 4 names/);
});

test('chat replay refuses unsourced or unreadable beats and never overwrites a hand-made composition', async t => {
  const { validate } = await import('../templates/activities/video/chat-replay.mjs');
  const base = { version: 1, skin: 'claude', source: 'transcript.md' };
  const errors = beats => validate({ ...base, beats }).errors.join('\n');
  assert.match(errors([{ type: 'tool', name: 'search' }]), /need "from"/);
  assert.match(errors([{ type: 'user', from: 'T1', text: 'x'.repeat(221) }]), /shorten it to 220/);
  assert.match(errors([{ type: 'focus', target: 'later' }, { id: 'later', type: 'user', from: 'T1', text: 'hi' }]), /earlier beat/);
  assert.match(errors([{ type: 'widget', from: 'T1', src: '../secret.png' }]), /under assets/);
  assert.match(errors([{ id: '01-ask', type: 'user', from: 'T1', text: 'hi' }]), /start with a letter/);
  assert.match(validate({ ...base, skin: 'other', beats: [{ type: 'pause' }] }).errors.join('\n'), /skin must be one of/);
  assert.match(validate({ version: 1, skin: 'claude', beats: [{ type: 'pause' }] }).errors.join('\n'), /source must name the transcript/);

  const root = mkdtempSync(join(tmpdir(), 'chat-replay-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync('examples/chat-replay', root, { recursive: true });
  const index = join(root, 'index.html');
  writeFileSync(index, '<!doctype html><p>hand-made</p>\n');
  const run = (...args) => spawnSync(process.execPath, [resolve('templates/activities/video/chat-replay.mjs'), join(root, 'replay.json'), root, ...args], { encoding: 'utf8' });
  const refused = run();
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /--force/);
  assert.equal(readFileSync(index, 'utf8'), '<!doctype html><p>hand-made</p>\n');
  assert.equal(run('--force').status, 0);
  const rebuilt = run();
  assert.equal(rebuilt.status, 0, rebuilt.stderr);
  assert.match(rebuilt.stdout, /Snapshot times: 0,/);
});
