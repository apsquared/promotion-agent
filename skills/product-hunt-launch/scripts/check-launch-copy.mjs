#!/usr/bin/env node
// Check Product Hunt launch copy before staging it. Dependency-free.
// Usage: node check-launch-copy.mjs launch.json [--json]
// launch.json fields (all optional): name, tagline, description, firstComment,
// productUrl, promoText, promoCode, galleryCount, shoutouts: [{note}],
// outreach: [string], limits: {name, tagline, ...} to override the defaults.
// Exit code 1 when any error is found.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DEFAULT_LIMITS = {
  name: 40,
  tagline: 60,
  description: 500,
  firstComment: 5000,
  promoText: 25,
  promoCode: 15,
};

const UPVOTE_ASK = /\bup[\s-]?vot(?:e|es|ed|ing)\b|\bvote (?:for|on) (?:us|me|it|our)\b|\b(?:support|back) us (?:on|over on) product ?hunt\b/i;
const SUPERLATIVE = /\b(?:best|ultimate|revolutionary|game[\s-]?chang\w*|world'?s first|#1|number one|cutting[\s-]?edge|next[\s-]?gen\w*|groundbreaking)\b/i;
const SHORTENER = /^https?:\/\/(?:www\.)?(?:bit\.ly|t\.co|tinyurl\.com|lnkd\.in|buff\.ly|ow\.ly|rebrand\.ly|cutt\.ly|is\.gd|shorturl\.at)\//i;
const EMOJI = /\p{Extended_Pictographic}/u;

const length = text => [...text].length;

export function checkLaunchCopy(input) {
  const limits = { ...DEFAULT_LIMITS, ...(input.limits ?? {}) };
  const errors = [];
  const warnings = [];
  const texts = [];

  for (const [field, max] of Object.entries(limits)) {
    const value = input[field];
    if (value == null) continue;
    if (typeof value !== 'string') {
      errors.push(`${field}: must be a string`);
      continue;
    }
    texts.push([field, value]);
    if (length(value) > max) errors.push(`${field}: ${length(value)} characters, limit ${max}`);
  }
  for (const field of ['name', 'tagline', 'description']) {
    if (typeof input[field] === 'string' && !input[field].trim()) errors.push(`${field}: empty`);
  }

  if (typeof input.name === 'string' && EMOJI.test(input.name)) errors.push('name: no emoji; use the product name only');
  if (typeof input.tagline === 'string' && SUPERLATIVE.test(input.tagline)) {
    warnings.push(`tagline: superlative "${input.tagline.match(SUPERLATIVE)[0]}"; say plainly what it does`);
  }
  if (typeof input.firstComment === 'string' && /(^|\n)\s*(?:[-*] |\d+\. )|\*\*[^*]+\*\*/.test(input.firstComment) && !/<(?:p|ul|ol|li|strong)\b/i.test(input.firstComment)) {
    warnings.push('firstComment: looks like Markdown; the Product Hunt MCP takes HTML or plain text and shows Markdown literally');
  }
  if (typeof input.productUrl === 'string' && SHORTENER.test(input.productUrl)) {
    errors.push('productUrl: use the direct product link, not a link shortener');
  }
  if (Number.isInteger(input.galleryCount) && input.galleryCount < 3) {
    warnings.push(`galleryCount: ${input.galleryCount}; three or more images are recommended`);
  }
  (input.shoutouts ?? []).forEach((shoutout, i) => {
    const note = shoutout?.note ?? '';
    texts.push([`shoutouts[${i}].note`, note]);
    if (length(note) < 20 || length(note) > 2000) errors.push(`shoutouts[${i}].note: ${length(note)} characters, must be 20 to 2000`);
  });
  (input.outreach ?? []).forEach((message, i) => texts.push([`outreach[${i}]`, String(message)]));

  for (const [field, text] of texts) {
    const match = text.match(UPVOTE_ASK);
    if (match) errors.push(`${field}: mentions "${match[0]}"; ask people to try it and share feedback, never to upvote`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

function main(argv) {
  const file = argv.find(arg => !arg.startsWith('--'));
  if (!file) {
    console.error('Usage: node check-launch-copy.mjs launch.json [--json]');
    return 2;
  }
  let input;
  try {
    input = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`Could not read ${file}: ${error.message}`);
    return 2;
  }
  const result = checkLaunchCopy(input);
  if (argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const error of result.errors) console.log(`error   ${error}`);
    for (const warning of result.warnings) console.log(`warning ${warning}`);
    console.log(result.ok ? `ok (${result.warnings.length} warning(s))` : `${result.errors.length} error(s)`);
  }
  return result.ok ? 0 : 1;
}

const invokedDirectly = (() => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (invokedDirectly) process.exitCode = main(process.argv.slice(2));
