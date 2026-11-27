import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash } from '../src/onboarding/install.ts';

const guide = resolve('templates/activities/buyer-first.md');
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].filter(([, href]) => !/^[a-z]+:/i.test(href)).map(([, href]) => resolve(dirname(file), href));
}
function anchorsTo(file, target) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]*)#([^)]+)\)/g)].filter(([, href]) => href && resolve(dirname(file), href) === target).map(([, , anchor]) => anchor);
}
function slugs(file) {
  return readFileSync(file, 'utf8').split('\n').filter(l => /^#{1,6} /.test(l)).map(l => l.replace(/^#+ /, '').toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-'));
}
const users = ['templates/WORKFLOW.md', 'templates/brief/WORKFLOW.md', 'templates/activities/acquisition/WORKFLOW.md', 'templates/activities/release/WORKFLOW.md', 'templates/activities/blog/WORKFLOW.md', 'templates/activities/reddit-post-check.md'];

test('shared workflow ranks work by the buyer test and routes task judgments to the guide', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"Which of these tasks actually matter?"'));
  assert.ok(route, 'Task judgment route missing');
  assert.match(route, /only after the user agrees/);
  assert.match(workflow, /then the enabled activity that best fits the product's stage under \[buyer-first priorities\]/);
  assert.match(workflow, /Explain the choice, including the stage it assumed/);
  assert.match(workflow, /rank by \[the buyer test\]/);
  assert.equal(workflow.split('\n').filter(line => line.startsWith('| buyer')).length, 0, 'The guide must not add a budget row');
  for (const file of users) {
    assert.ok(links(file).includes(guide), `Buyer-first guide not reachable from ${file}`);
    for (const anchor of anchorsTo(file, guide)) assert.ok(slugs(guide).includes(anchor), `Missing anchor #${anchor} in the guide (from ${file})`);
  }
  for (const link of links(guide)) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
  for (const anchor of anchorsTo(guide, resolve('templates/WORKFLOW.md'))) assert.ok(slugs('templates/WORKFLOW.md').includes(anchor));
});

test('marketing context template records the stage and buyer', () => {
  const context = readFileSync('templates/marketing/AGENT.md', 'utf8');
  assert.match(context, /^## Stage and buyer$/m);
  for (const field of ['Stage:', 'Bottleneck:', 'Buyer:', 'Where buyers already talk:', "Buyer's words:"]) assert.ok(context.includes(field), `Context template lacks ${field}`);
  assert.ok(context.indexOf('## Stage and buyer') < context.indexOf('## Audience and voice'));
});

test('buyer-first guide keeps its test, stages, verdicts and boundaries', () => {
  const text = readFileSync(guide, 'utf8');
  assert.ok(text.includes('will this get someone to pay, or keep someone paying, and how soon will we know?'));
  for (const stage of ['1. Unproven', '2. Committed, not shipped', '3. First customers', '4. Repeatable']) assert.ok(text.includes(`| ${stage} |`), `Missing stage ${stage}`);
  for (const verdict of ['**Do first:**', '**Has to be done:**', '**Do, smaller:**', '**Later:**', "**Don't do:**", '**Unclear:**']) assert.ok(text.includes(verdict), `Missing verdict ${verdict}`);
  for (const boundary of [
    'never overrides a choice the user has made',
    'An explicit user choice wins',
    'never authorizes outreach, posting or spending',
    'Do not invent the stage, revenue or customer counts',
    'It changes no task by itself',
    'it never forbids an activity the user asks for',
    'Judge from evidence, not from the type of work',
    'never whether they would use a product',
    'At most three',
  ]) assert.ok(text.includes(boundary), `Guide lacks: ${boundary}`);
});

test('buyer-first guide ships into an installed workspace and survives relocation', t => {
  const root = mkdtempSync(join(tmpdir(), 'promotion-buyer-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  const installed = join(moved, '.promotion-agent/templates/activities/buyer-first.md');
  assert.equal(readFileSync(installed, 'utf8'), readFileSync(guide, 'utf8'));
  for (const link of links(installed)) assert.ok(existsSync(link), `Missing installed resource: ${link}`);
  assert.match(readFileSync(join(moved, '.promotion-agent/docs/INSTALLED.md'), 'utf8'), /activities\/buyer-first\.md/);
});
