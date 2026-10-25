import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const procedure = resolve('templates/activities/domain-rank.md');
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(([, href]) => resolve(dirname(file), href));
}

test('shared workflow routes domain rank requests to the keyless check, and activities that weigh domains link it', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"What\'s the domain rank of'));
  assert.ok(route, 'Domain rank request route missing');
  assert.match(route, /keyless/);
  assert.match(route, /never solve a CAPTCHA/);
  for (const file of ['templates/WORKFLOW.md', 'templates/activities/competitor-analysis.md', 'templates/activities/ai-visibility/WORKFLOW.md'])
    assert.ok(links(file).includes(procedure), `Domain rank check not reachable from ${file}`);
  for (const link of links(procedure)) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
});

test('domain rank check stays keyless and records what it could not check', () => {
  const text = readFileSync(procedure, 'utf8');
  for (const source of ['openpagerank/top-domains?q=', 'tranco-list.eu/api/ranks/domain/', 'website-authority-checker/?input=', 'moz.com/domain-analysis?site=', 'similarweb.com/website/'])
    assert.ok(text.includes(source), `Procedure lacks source: ${source}`);
  for (const boundary of ['no API key, account or sign-in', 'Never solve a CAPTCHA', '`blocked`', '`limit reached`', 'not interchangeable', 'Never fill a missing value from memory'])
    assert.ok(text.includes(boundary), `Procedure lacks boundary: ${boundary}`);
  assert.doesNotMatch(text, /API-OPR|Authorization:|api[_-]?key=/i);
});
