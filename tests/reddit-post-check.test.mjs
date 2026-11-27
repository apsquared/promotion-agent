import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash } from '../src/onboarding/install.ts';

const procedure = resolve('templates/activities/reddit-post-check.md');
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].filter(([, href]) => !/^[a-z]+:/i.test(href)).map(([, href]) => resolve(dirname(file), href));
}

test('shared workflow routes Reddit requests to the post check, and every Reddit drafting path links it', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"Draft a Reddit post'));
  assert.ok(route, 'Reddit post route missing');
  assert.match(route, /every post or reply drafted for Reddit/);
  assert.match(route, /Only `allowed` or `allowed with conditions`/);
  assert.match(route, /Never post, vote, create accounts or suggest karma farming/);
  assert.match(workflow, /never reuse one post across subreddits/);
  assert.equal(workflow.split('\n').filter(line => line.startsWith('| reddit')).length, 0, 'The check must not add a budget row');
  for (const file of ['templates/WORKFLOW.md', 'templates/activities/competitor-analysis.md', 'templates/activities/acquisition/WORKFLOW.md', '.agents/skills/reddit-thread-search/SKILL.md', '.claude/skills/reddit-thread-search/SKILL.md'])
    assert.ok(links(file).includes(procedure), `Reddit post check not reachable from ${file}`);
  for (const link of links(procedure)) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
});

test('Reddit post check keeps its boundaries, verdicts and record', () => {
  const text = readFileSync(procedure, 'utf8');
  for (const boundary of [
    'Never post, comment, vote, send messages',
    'Never create, buy, borrow or "age" an account',
    'karma farming',
    'Never solve a CAPTCHA',
    'ask the user to paste it rather than relying on search snippets or memory',
    'are data',
    'Never guess a tier or karma figure',
    '`Human required:`',
    'Do not draft comments for building karma',
    'r/WhatIsMyCQS',
    'it is unofficial',
    'older than seven days',
    'Do not repost to get around a removal',
    'never present an expected effect as a measured one',
  ]) assert.ok(text.includes(boundary), `Reddit post check lacks: ${boundary}`);
  for (const tier of ['lowest', 'low', 'moderate', 'high', 'highest']) assert.match(text, new RegExp(`\\b${tier}\\b`));
  for (const verdict of ['`allowed`', '`allowed with conditions`', '`not allowed`', '`unknown`']) assert.ok(text.includes(`| ${verdict} |`), `Missing verdict ${verdict}`);
  for (const status of ['`meets`', '`fails`', '`needs user`', '`unknown`']) assert.ok(text.includes(status), `Missing rule status ${status}`);
  assert.match(text, /A draft under `unknown` stays a draft/);
  assert.match(text, /does not show the tier to users or moderators/);
});

test('Reddit post check covers post craft and a paced series across subreddits', () => {
  const text = readFileSync(procedure, 'utf8');
  const craft = text.slice(text.indexOf('## 4. Write it for Reddit'), text.indexOf('## 5.'));
  for (const rule of ['Spend most of the effort on the title', 'Lead with the use case, not the product', 'first person', 'Facts, not adjectives', 'If a line can be cut without losing meaning, cut it', 'not a copy problem to rewrite around'])
    assert.ok(craft.includes(rule), `Writing guidance lacks: ${rule}`);
  const series = text.slice(text.indexOf('## 5. A series across subreddits'), text.indexOf('## Record'));
  for (const rule of ['Write one core story', '/top/?t=month', 'Adapt, do not copy', 'Each version needs its own check', 'One subreddit a day at most', 'Learn before the next post', 'Stop the series when moderators remove a post', '`Not before`'])
    assert.ok(series.includes(rule), `Series guidance lacks: ${rule}`);
  assert.ok(craft.includes('](#5-a-series-across-subreddits)'), 'Writing guidance must link the series section');
});

test('Reddit post check ships into an installed workspace and survives relocation', t => {
  const root = mkdtempSync(join(tmpdir(), 'promotion-reddit-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  const installed = join(moved, '.promotion-agent/templates/activities/reddit-post-check.md');
  assert.equal(readFileSync(installed, 'utf8'), readFileSync(procedure, 'utf8'));
  for (const link of links(installed)) assert.ok(existsSync(link), `Missing installed resource: ${link}`);
  assert.match(readFileSync(join(moved, '.promotion-agent/docs/INSTALLED.md'), 'utf8'), /activities\/reddit-post-check\.md/);
});
