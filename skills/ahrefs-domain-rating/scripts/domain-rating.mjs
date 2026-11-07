#!/usr/bin/env node
// Look up Ahrefs Domain Rating through the free public endpoint
// GET https://api.ahrefs.com/v3/public/domain-rating-free
// The key is read from AHREFS_API_KEY only, never from arguments, and is never printed.
// No dependencies: Node.js 18 or later (global fetch).

import { readFileSync } from 'node:fs';

const ENDPOINT = process.env.AHREFS_API_URL || 'https://api.ahrefs.com/v3/public/domain-rating-free';
const ATTRIBUTION = 'Domain Rating by Ahrefs';
const USAGE = `Usage: domain-rating.mjs [options] <domain|url> [more...]

Reads the key from the AHREFS_API_KEY environment variable.

Options:
  --file <path>        read targets from a file, one per line (# comments allowed)
  --version dr3|dr4    Domain Rating model (default: none sent, so the API's default,
                       reported as "default")
  --format table|json|csv  output format (default: table)
  --raw                send each target as given instead of reducing it to its domain
  --delay <ms>         pause between requests (default: 1000)
  -h, --help           show this help

Exit codes: 0 all looked up, 1 some lookups failed, 2 usage error or missing key.`;

function fail(message) {
  process.stderr.write(`${message}\n\n${USAGE}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { targets: [], version: null, format: 'table', raw: false, delay: 1000 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) fail(`${arg} needs a value.`);
      return argv[++i];
    };
    if (arg === '-h' || arg === '--help') { process.stdout.write(`${USAGE}\n`); process.exit(0); }
    else if (arg === '--file') opts.targets.push(...readFileSync(value(), 'utf8').split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean));
    else if (arg === '--version') opts.version = value();
    else if (arg === '--format') opts.format = value();
    else if (arg === '--raw') opts.raw = true;
    else if (arg === '--delay') opts.delay = Number(value());
    else if (/^--?(key|api-key|token)\b/.test(arg)) fail('Pass the key in AHREFS_API_KEY, not on the command line, so it stays out of shell history.');
    else if (arg.startsWith('-')) fail(`Unknown option: ${arg}`);
    else opts.targets.push(arg);
  }
  if (opts.version !== null && !['dr3', 'dr4'].includes(opts.version)) fail('--version must be dr3 or dr4.');
  if (!['table', 'json', 'csv'].includes(opts.format)) fail('--format must be table, json or csv.');
  if (!Number.isFinite(opts.delay) || opts.delay < 0) fail('--delay must be a number of milliseconds.');
  if (opts.targets.length === 0) fail('Give at least one domain or URL.');
  return opts;
}

// Reduce a URL or host to the domain Ahrefs rates: no scheme, credentials, port, path or leading www.
function normalizeTarget(input) {
  const text = input.trim();
  let host;
  try { host = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`).hostname; }
  catch { return null; }
  host = host.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const STATUS_BY_CODE = { 400: 'bad request', 401: 'unauthorized', 403: 'forbidden', 429: 'limit reached' };

async function lookup(target, key, version) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('target', target);
  if (version) url.searchParams.set('version', version);
  url.searchParams.set('output', 'json');
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json', Authorization: `Bearer ${key}` } });
    } catch (err) {
      return { status: 'error', detail: err.cause?.code || err.message };
    }
    if (res.status === 429 && attempt === 0) {
      const header = Number(res.headers.get('retry-after') ?? NaN);
      const wait = Math.min(Number.isFinite(header) && header >= 0 ? header : 5, 60);
      await sleep(wait * 1000);
      continue;
    }
    const body = await res.text();
    if (res.ok) {
      let dr;
      try { dr = JSON.parse(body)?.domain_rating?.domain_rating; } catch { /* reported below */ }
      if (typeof dr !== 'number') return { status: 'not found', detail: 'response had no domain_rating number' };
      return { status: 'ok', dr };
    }
    let detail = body.slice(0, 200);
    try {
      const parsed = JSON.parse(body);
      detail = typeof parsed?.error === 'string' ? parsed.error : Array.isArray(parsed) ? parsed.join(': ') : detail;
    } catch { /* keep the raw text */ }
    return { status: STATUS_BY_CODE[res.status] || 'error', detail: `HTTP ${res.status}${detail ? ` ${detail}` : ''}` };
  }
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function render(rows, format) {
  if (format === 'json') return `${JSON.stringify({ attribution: ATTRIBUTION, results: rows }, null, 2)}\n`;
  const columns = ['input', 'domain', 'dr', 'version', 'status', 'checked', 'detail'];
  if (format === 'csv') return `${[columns, ...rows.map(r => columns.map(c => r[c]))].map(r => r.map(csvCell).join(',')).join('\n')}\n`;
  const shown = ['domain', 'dr', 'version', 'status', 'checked', 'detail'];
  const cells = [shown, ...rows.map(r => shown.map(c => String(r[c] ?? '')))];
  const widths = shown.map((_, i) => Math.max(...cells.map(row => row[i].length)));
  const lines = cells.map(row => row.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd());
  lines.splice(1, 0, widths.map(w => '-'.repeat(w)).join('  '));
  return `${lines.join('\n')}\n\n${ATTRIBUTION}\n`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const key = (process.env.AHREFS_API_KEY || '').trim();
  if (!key) fail('AHREFS_API_KEY is not set. Create a free APIv3 key at https://app.ahrefs.com/account/api-keys and export it in your shell.');

  const rows = [];
  const seen = new Map();
  let requested = 0;
  let stop = null;
  for (const input of opts.targets) {
    const domain = opts.raw ? input.trim() : normalizeTarget(input);
    const checked = new Date().toISOString().slice(0, 10);
    const base = { input, domain, dr: null, version: opts.version ?? 'default', checked };
    if (!domain) { rows.push({ ...base, status: 'invalid', detail: 'not a domain or URL' }); continue; }
    if (seen.has(domain)) { rows.push({ ...seen.get(domain), input }); continue; }
    if (stop) { rows.push({ ...base, status: 'skipped', detail: `stopped after ${stop}` }); continue; }
    if (requested++ > 0) await sleep(opts.delay);
    const result = await lookup(domain, key, opts.version);
    const row = { ...base, dr: result.dr ?? null, status: result.status, detail: result.detail ?? '' };
    rows.push(row);
    seen.set(domain, row);
    // A bad key or an exhausted limit will fail every later request too.
    if (['unauthorized', 'forbidden', 'limit reached'].includes(result.status)) stop = result.status;
  }
  process.stdout.write(render(rows, opts.format));
  process.exit(rows.every(r => r.status === 'ok') ? 0 : 1);
}

main();
