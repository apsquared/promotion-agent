import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// Checkout skills live in .agents/skills (Codex) and .claude/skills (Claude Code).
// The Claude copy omits agents/, which holds Codex-only UI metadata.
const codex = '.agents/skills';
const claude = '.claude/skills';

function files(root) {
  const out = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'agents') walk(path); }
      else out.push(relative(root, path));
    }
  };
  walk(root);
  return out.sort();
}

test('every checkout skill is mirrored identically for Codex and Claude Code', () => {
  const skills = readdirSync(codex).sort();
  assert.deepEqual(readdirSync(claude).sort(), skills);
  for (const skill of skills) {
    const source = files(join(codex, skill));
    assert.deepEqual(files(join(claude, skill)), source, skill);
    for (const file of source) assert.equal(readFileSync(join(claude, skill, file), 'utf8'), readFileSync(join(codex, skill, file), 'utf8'), `${skill}/${file}`);
  }
});

test('mirrored Claude Code skills have matching names and resolvable relative links', () => {
  for (const skill of readdirSync(claude)) {
    const text = readFileSync(join(claude, skill, 'SKILL.md'), 'utf8');
    assert.match(text, new RegExp(`^---\\nname: ${skill}\\n`), skill);
    for (const [, link] of text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      if (/^[a-z]+:/i.test(link)) continue;
      assert.ok(existsSync(resolve(claude, skill, link)), `${skill}: ${link}`);
    }
  }
});
