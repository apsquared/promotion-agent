import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const skill = 'skills/product-hunt-launch';
const script = `${skill}/scripts/check-launch-copy.mjs`;
const { checkLaunchCopy } = await import(resolve(script));

test('bundled example passes the copy check', () => {
  const output = execFileSync(process.execPath, [script, `${skill}/examples/launch.json`], { encoding: 'utf8' });
  assert.match(output, /^ok \(0 warning\(s\)\)/m);
});

test('copy check flags upvote asks, limits, shorteners and Markdown', () => {
  const result = checkLaunchCopy({
    name: 'Tidepool 🚀',
    tagline: 'The best way to turn support threads into an FAQ, for every team',
    description: 'x',
    productUrl: 'https://bit.ly/abc',
    firstComment: 'Hi!\n- one\n- two',
    galleryCount: 1,
    shoutouts: [{ note: 'too short' }],
    outreach: ['Please upvote us today!', 'Vote for us on PH', 'Would love your up-vote'],
  });
  assert.equal(result.ok, false);
  const text = result.errors.join('\n');
  assert.match(text, /name: no emoji/);
  assert.match(text, /tagline: \d+ characters, limit 60/);
  assert.match(text, /productUrl: use the direct product link/);
  assert.match(text, /shoutouts\[0\]\.note/);
  assert.match(text, /outreach\[0\].*upvote/);
  assert.match(text, /outreach\[1\].*Vote for us/);
  assert.match(text, /outreach\[2\].*up-vote/);
  const warnings = result.warnings.join('\n');
  assert.match(warnings, /superlative "best"/);
  assert.match(warnings, /looks like Markdown/);
  assert.match(warnings, /galleryCount: 1/);
});

test('reported composer limits override the defaults', () => {
  assert.equal(checkLaunchCopy({ tagline: 'a'.repeat(61) }).ok, false);
  assert.equal(checkLaunchCopy({ tagline: 'a'.repeat(61), limits: { tagline: 70 } }).ok, true);
});

test('CLI exits 2 on unreadable input', () => {
  const run = spawnSync(process.execPath, [script, '/dev/null'], { encoding: 'utf8' });
  assert.equal(run.status, 2);
});

test('checkout copy for Codex matches the downloadable skill byte for byte', () => {
  const list = root => {
    const out = [];
    const walk = dir => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else out.push(path.slice(root.length + 1));
      }
    };
    walk(root);
    return out.sort();
  };
  const checkout = '.agents/skills/product-hunt-launch';
  assert.deepEqual(list(checkout), list(skill));
  for (const file of list(skill)) {
    assert.equal(readFileSync(join(checkout, file), 'utf8'), readFileSync(join(skill, file), 'utf8'), file);
  }
});

test('product-hunt-launch skill is self-contained', () => {
  const md = readFileSync(`${skill}/SKILL.md`, 'utf8');
  assert.match(md, /^---\nname: product-hunt-launch\n/);
  const files = [`${skill}/SKILL.md`, ...readdirSync(`${skill}/references`).map(f => `${skill}/references/${f}`)];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const [, target] of text.matchAll(/\]\(((?!https?:)[^)#]+)(?:#[^)]*)?\)/g)) {
      assert.ok(existsSync(join(dirname(file), target)), `${file} links to missing ${target}`);
    }
  }
  assert.match(readFileSync('skills/readme.md', 'utf8'), /\[product-hunt-launch\]\(product-hunt-launch\/SKILL\.md\)/);
});
