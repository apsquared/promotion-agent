#!/usr/bin/env node
// Fails when files meant for public distribution (skills, plugin manifests,
// mcp.json, READMEs, llms.txt) contain a credential-shaped value or a
// machine-specific path, when a SKILL.md's frontmatter is invalid, or when a
// JSON manifest does not parse. No dependencies. Usage:
//   node check-distributable.mjs <file-or-folder>...
// Port the patterns into the project's own test runner when that fits better.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", ".next"]);
const TEXT_EXT = /\.(md|mdx|txt|json|ya?ml|toml|js|mjs|cjs|ts|sh|html)$/i;

const CREDENTIALS = [
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}/],
  ["Slack token", /\bxox[abposr]-[A-Za-z0-9-]{10,}/],
  ["Stripe secret key", /\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}/],
  ["OpenAI/Anthropic-style key", /\bsk-(ant-|proj-)?[A-Za-z0-9_-]{20,}/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["bearer token", /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/],
  ["key in URL", /[?&](api[_-]?key|access[_-]?token|token|key|secret)=[A-Za-z0-9._~-]{12,}/i],
  ["secret assignment", /\b(api[_-]?key|secret|token|password|client[_-]?secret)["']?\s*[:=]\s*["']?[A-Za-z0-9/+_.-]{16,}/i],
];

const MACHINE_PATHS = [
  ["home directory path", /\/(Users|home)\/[A-Za-z0-9._-]+\//],
  ["Windows user path", /[A-Za-z]:\\Users\\[^\\\s]+\\/],
];

const files = [];
function walk(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(basename(path))) return;
    for (const entry of readdirSync(path)) walk(join(path, entry));
  } else if (TEXT_EXT.test(path) || basename(path) === "llms.txt") {
    files.push(path);
  }
}

function checkFrontmatter(path, text, problems) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return problems.push(`${path}: SKILL.md has no YAML frontmatter`);
  const field = (key) => match[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim().replace(/^["']|["']$/g, "");
  const name = field("name");
  const description = field("description");
  const folder = basename(dirname(resolve(path)));
  if (!name) problems.push(`${path}: frontmatter has no name`);
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) problems.push(`${path}: name "${name}" is not lowercase-hyphenated`);
  else if (name !== folder) problems.push(`${path}: name "${name}" does not match folder "${folder}"`);
  if (!description) problems.push(`${path}: frontmatter has no description`);
  else if (description.length > 1024) problems.push(`${path}: description is over 1024 characters`);
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: node check-distributable.mjs <file-or-folder>...");
  process.exit(2);
}
targets.forEach(walk);

const problems = [];
for (const path of files) {
  const text = readFileSync(path, "utf8");
  text.split(/\r?\n/).forEach((line, i) => {
    for (const [label, pattern] of [...CREDENTIALS, ...MACHINE_PATHS]) {
      if (pattern.test(line)) problems.push(`${path}:${i + 1}: ${label}`);
    }
  });
  if (basename(path) === "SKILL.md") checkFrontmatter(path, text, problems);
  if (path.endsWith(".json")) {
    try { JSON.parse(text); } catch (error) { problems.push(`${path}: invalid JSON (${error.message})`); }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) in ${files.length} file(s). Values are not printed; inspect each line.`);
  process.exit(1);
}
console.log(`ok: ${files.length} file(s) checked`);
