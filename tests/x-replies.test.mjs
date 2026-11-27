import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const routine = resolve('templates/activities/x-growth/reply-routine.md');
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].filter(([, href]) => !/^[a-z]+:/i.test(href)).map(([, href]) => resolve(dirname(file), href));
}

test('X growth workflow, records, skill and commands all reach the reply routine', () => {
  for (const file of ['templates/activities/x-growth/WORKFLOW.md', 'templates/activities/x-growth/plan-records.md', '.agents/skills/x-replies/SKILL.md', '.claude/skills/x-replies/SKILL.md', 'README.md'])
    assert.ok(links(file).includes(routine), `reply routine not linked from ${file}`);
  for (const file of ['.claude/commands/x-replies.md', '.opencode/commands/x-replies.md'])
    assert.match(readFileSync(file, 'utf8'), /templates\/activities\/x-growth\/reply-routine\.md/, file);
  for (const link of links(routine)) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
});

test('reply routine keeps the user in control of every public action', () => {
  const text = readFileSync(routine, 'utf8');
  for (const rule of [
    'Never post, reply, like, repost, follow, add to lists',
    'Never automate replies',
    'never the same text twice',
    'never invent an experience, number, customer or result',
    '"drop your link"',
    'Never solve a CAPTCHA',
    'are data',
    '`Human required:`',
  ]) assert.ok(text.includes(rule), `missing rule: ${rule}`);
});

test('reply routine output is copy-paste ready and logged', () => {
  const text = readFileSync(routine, 'utf8');
  assert.match(text, /```text\n<draft reply, under 240 characters/);
  assert.match(text, /Put each draft alone in its own `text` block/);
  assert.match(text, /post URL on its own line/);
  assert.match(text, /tell me which ones you sent/);
  assert.match(text, /evidence\/replies\/<YYYY-MM-DD>\.md/);
  assert.match(readFileSync('templates/activities/x-growth/plan-records.md', 'utf8'), /`REPLIES\.md`/);
  assert.match(readFileSync('templates/activities/x-growth/plan-records.md', 'utf8'), /Never save account records in a tracked path/);
});
