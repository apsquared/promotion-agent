import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const copies = ['.claude/skills/reddit-thread-search', '.agents/skills/reddit-thread-search'];
const skill = `${copies[0]}/SKILL.md`;
const postCheck = resolve('templates/activities/reddit-post-check.md');
const slug = heading => heading.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');
const anchors = file => readFileSync(file, 'utf8').split('\n').filter(line => /^#{1,6} /.test(line)).map(line => slug(line.replace(/^#+ /, '')));

test('both reddit-thread-search copies stay identical', () => {
  for (const file of ['SKILL.md', 'references/search-topics.md'])
    assert.equal(readFileSync(`${copies[1]}/${file}`, 'utf8'), readFileSync(`${copies[0]}/${file}`, 'utf8'), `${file} differs between copies`);
  assert.match(readFileSync(`${copies[1]}/agents/openai.yaml`, 'utf8'), /Google-ranked/);
});

test('evergreen pass finds Google first-page threads without manipulation', () => {
  const text = readFileSync(skill, 'utf8');
  const description = text.split('\n').find(line => line.startsWith('description:'));
  assert.match(description, /rank on Google's first page/);
  const section = text.split('## Evergreen Pass (Google-Ranked Threads)')[1]?.split('\n## ')[0];
  assert.ok(section, 'Evergreen pass section missing');
  for (const rule of [
    'no `tbs`',
    "Google's first page",
    'never turn it into a traffic estimate',
    'not a tracked ranking',
    'archives older posts',
    'lock any thread',
    'Read the top replies',
    'Snippet dates are discovery aids, not facts',
    'goes in an unverified list and gets no draft',
    'at most one reply per thread',
    "from the user's own account",
    'disclosing',
    'Never suggest upvotes',
    'a second account',
  ]) assert.ok(section.includes(rule), `Evergreen pass lacks: ${rule}`);
  assert.ok(section.includes('](../../../templates/activities/reddit-post-check.md)'), 'Evergreen drafts must run the Reddit post check');
  assert.match(text, /Evergreen: Google first page, no date filter, checked YYYY-MM-DD/);
});

test('evergreen links resolve to real files and headings', () => {
  const text = readFileSync(skill, 'utf8');
  const local = [...text.matchAll(/\]\(([^)]+)\)/g)].map(([, href]) => href).filter(href => !/^[a-z]+:/i.test(href));
  for (const href of local) {
    const [path, anchor] = href.split('#');
    const target = path ? resolve(dirname(skill), path) : resolve(skill);
    assert.ok(existsSync(target), `Missing linked file: ${href}`);
    if (anchor) assert.ok(anchors(target).includes(anchor), `Missing anchor: ${href}`);
  }
  assert.ok(local.some(href => resolve(dirname(skill), href.split('#')[0]) === postCheck));
  assert.ok(local.includes('#evergreen-pass-google-ranked-threads'));
  assert.ok(local.includes('references/search-topics.md#evergreen-google-ranked-queries'));
});
