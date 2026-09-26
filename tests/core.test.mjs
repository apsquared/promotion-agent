import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTasks, parseTaskSnapshot } from '../src/core/legacy-tasks.mjs';
import { buildAgentPrompt, promptCategory, hasRepoSteps } from '../src/core/task-prompt.ts';
const fixture = readFileSync(new URL('../examples/example-desk/marketing/TASKS.md', import.meta.url), 'utf8');

test('legacy multiline materials and task-specific instructions are preserved', () => {
  const { tasks, canReconcile, diagnostics } = parseTaskSnapshot(fixture);
  assert.equal(canReconcile, true);
  assert.deepEqual(diagnostics, []);
  assert.equal(tasks.length, 4);
  assert.match(tasks[0].materials, /Logo: public\/logo.svg/);
  assert.match(tasks[0].agentPrompt, /3. Show the final form/);
  assert.doesNotMatch(tasks[0].materials, /Open the submission form/);
  assert.equal(tasks[0].actionUrl, 'https://directory.example/submit');
});
test('checked Open and unchecked Done entries both count as done', () => {
  assert.deepEqual(parseTasks(fixture).map(t => t.status), ['open','open','done','done']);
});
test('CRLF and old tasks without Prompt remain compatible', () => {
  const tasks = parseTasks(fixture.replaceAll('\n', '\r\n'));
  assert.equal(tasks[1].agentPrompt, '');
  assert.equal(tasks[1].taskId, 'T-002');
  assert.equal(tasks.length, 4);
});
test('malformed snapshots and duplicate IDs cannot authorize reconciliation', () => {
  for (const doc of [fixture.replace('P1 |', 'urgent |'), fixture.replace('T-002', 'T-001'), fixture.replace('## Open', '## Open-ish'), 'unrelated text', fixture.replace('P1 |', 'P9 |')]) {
    const result = parseTaskSnapshot(doc);
    assert.equal(result.canReconcile, false);
    assert.ok(result.diagnostics.length);
  }
});
test('empty valid template is a valid snapshot without importing its example', () => {
  const doc = readFileSync(new URL('../templates/marketing/TASKS.md', import.meta.url),'utf8');
  assert.equal(parseTaskSnapshot(doc).canReconcile, true);
  assert.deepEqual(parseTasks(doc), []);
});
test('task prompt retains materials and custom steps with shared review policy', () => {
  const task = {...parseTasks(fixture)[0], project:'Example Desk', sourceDir:'./example-desk'};
  const prompt = buildAgentPrompt(task);
  assert.ok(hasRepoSteps(task));
  assert.ok(prompt.includes(task.materials));
  assert.ok(prompt.includes(task.agentPrompt));
  assert.match(prompt, /OpenCode/);
  assert.match(prompt, /Publishing/);
  assert.doesNotMatch(prompt, /apsquared|MY_PROJECTS|mcp__claude/);
});
test('old tasks get category fallback; unknown categories remain usable', () => {
  const task = {...parseTasks(fixture)[1], project:'Example Desk'};
  assert.equal(hasRepoSteps(task), false);
  assert.equal(promptCategory('engagement'),'outreach');
  assert.equal(promptCategory('custom-workflow'),'other');
  assert.match(buildAgentPrompt(task), /thread as it stands/);
});
test('prompt generation does not carry context between projects', () => {
  const base = parseTasks(fixture)[0];
  buildAgentPrompt({...base, project:'First Fictional Product', materials:'First-only fact'});
  const second = buildAgentPrompt({...base, project:'Second Fictional Product', materials:'Second-only fact'});
  assert.doesNotMatch(second, /First Fictional|First-only/);
  assert.match(second, /Second-only fact/);
});
