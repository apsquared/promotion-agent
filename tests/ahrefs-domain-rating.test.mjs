import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const skill = 'skills/ahrefs-domain-rating';
const script = resolve(skill, 'scripts/domain-rating.mjs');
const KEY = 'test-key-do-not-print';

function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(([, href]) => href).filter(h => !/^[a-z]+:/i.test(h)).map(h => resolve(dirname(file), h));
}

// Async spawn: the mock server runs in this process, so a sync spawn would deadlock.
function run(args, env = {}) {
  return new Promise(done => {
    const child = spawn(process.execPath, [script, '--delay', '0', ...args], { env: { PATH: process.env.PATH, ...env } });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('close', status => done({ status, stdout, stderr }));
  });
}

async function mock(t, handler) {
  const requests = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    requests.push({ target: url.searchParams.get('target'), version: url.searchParams.get('version'), auth: req.headers.authorization });
    handler(url, req, res, requests.length);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => server.close());
  return { requests, env: { AHREFS_API_KEY: KEY, AHREFS_API_URL: `http://127.0.0.1:${server.address().port}/v3/public/domain-rating-free` } };
}

const json = (res, code, body, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(body)); };

test('ahrefs-domain-rating skill is self-contained and keeps its key boundaries', t => {
  const text = readFileSync(join(skill, 'SKILL.md'), 'utf8');
  assert.match(text, /^---\nname: ahrefs-domain-rating\ndescription: .+\nlicense: MIT\n---\n/);
  assert.match(readFileSync(join(skill, 'agents/openai.yaml'), 'utf8'), /\$ahrefs-domain-rating/);
  for (const boundary of ['DR3 and DR4', '2026-12-01', 'never comparable', 'AHREFS_API_KEY', 'Never create an Ahrefs account', 'never pass it as a command-line argument', 'Domain Rating by Ahrefs', 'Human required:', 'Never fill a missing value from memory'])
    assert.ok(text.includes(boundary), `SKILL.md lacks: ${boundary}`);
  const root = mkdtempSync(join(tmpdir(), 'ahrefs-dr-skill-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const copy = join(root, 'ahrefs-domain-rating');
  cpSync(skill, copy, { recursive: true });
  const found = links(join(copy, 'SKILL.md'));
  assert.ok(found.includes(join(copy, 'scripts/domain-rating.mjs')), 'script is not linked from the skill');
  for (const link of found) {
    assert.ok(link.startsWith(copy + '/'), `SKILL.md links outside the skill: ${link}`);
    assert.ok(existsSync(link), `Missing linked resource: ${link}`);
  }
  for (const file of ['SKILL.md', 'scripts/domain-rating.mjs']) assert.doesNotMatch(readFileSync(join(copy, file), 'utf8'), /\.promotion-agent|templates\/|\/Users\//);
  assert.ok(readFileSync('skills/readme.md', 'utf8').includes('[ahrefs-domain-rating](ahrefs-domain-rating/SKILL.md)'), 'catalog row missing');
});

test('refuses to run without a key or with a key on the command line', async () => {
  const missing = await run(['example.com']);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /AHREFS_API_KEY is not set/);
  const inline = await run(['--key', 'abc', 'example.com'], { AHREFS_API_KEY: KEY });
  assert.equal(inline.status, 2);
  assert.match(inline.stderr, /not on the command line/);
});

test('normalizes targets, dedupes, sends the bearer key and reports DR with attribution', async t => {
  const { requests, env } = await mock(t, (url, req, res) => json(res, 200, { domain_rating: { domain_rating: url.searchParams.get('target') === 'example.com' ? 91.5 : 0, license: 'https://ahrefs.com/' } }));
  const dir = mkdtempSync(join(tmpdir(), 'ahrefs-dr-list-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'list.txt'), '# prospects\nnew-site.dev\n\n');
  const out = await run(['--format', 'json', '--version', 'dr4', '--file', join(dir, 'list.txt'), 'https://www.Example.com/pricing?x=1', 'example.com', 'not a domain'], env);
  assert.equal(out.status, 1, out.stderr); // the invalid input makes it partial
  const parsed = JSON.parse(out.stdout);
  assert.equal(parsed.attribution, 'Domain Rating by Ahrefs');
  assert.deepEqual(parsed.results.map(r => [r.domain, r.dr, r.status]), [['new-site.dev', 0, 'ok'], ['example.com', 91.5, 'ok'], ['example.com', 91.5, 'ok'], [null, null, 'invalid']]);
  assert.deepEqual(requests.map(r => r.target), ['new-site.dev', 'example.com']);
  assert.ok(requests.every(r => r.auth === `Bearer ${KEY}` && r.version === 'dr4'));
  assert.ok(!out.stdout.includes(KEY) && !out.stderr.includes(KEY));

  const table = await run(['example.com'], env);
  assert.equal(table.status, 0, table.stderr);
  assert.match(table.stdout, /example\.com\s+91\.5\s+default\s+ok/);
  assert.equal(requests.at(-1).version, null, 'no version sent unless asked, so the API default applies');
  assert.match(table.stdout, /Domain Rating by Ahrefs\n$/);
});

test('retries a 429 once, then stops on a rejected key and skips the rest', async t => {
  const { requests, env } = await mock(t, (url, req, res, n) => {
    if (n === 1) return json(res, 429, ['Error', 'Too many requests'], { 'retry-after': '0' });
    if (n === 2) return json(res, 200, { domain_rating: { domain_rating: 42, license: 'x' } });
    return json(res, 403, ['Error', 'Forbidden']);
  });
  const out = await run(['--format', 'csv', 'a.com', 'b.com', 'c.com'], env);
  assert.equal(out.status, 1);
  const rows = out.stdout.trim().split('\n').slice(1).map(l => l.split(','));
  assert.deepEqual(rows.map(r => [r[1], r[2], r[4]]), [['a.com', '42', 'ok'], ['b.com', '', 'forbidden'], ['c.com', '', 'skipped']]);
  assert.match(out.stdout, /HTTP 403 Error: Forbidden/);
  assert.equal(requests.length, 3);
  assert.ok(!out.stdout.includes(KEY));
});
