#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const help =
  'Local Next.js review: npm run review -- --project <directory> [--database <local.sqlite>] [--port <4317>] [--production]';
try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(help);
    process.exit(0);
  }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (Object.hasOwn(options, key)) throw new Error('Duplicate option');
    if (key === '--production') {
      options[key] = true;
      continue;
    }
    if (
      !['--project', '--database', '--port'].includes(key) ||
      !args[i + 1] ||
      args[i + 1].startsWith('--')
    )
      throw new Error(help);
    options[key] = args[++i];
  }
  if (!options['--project']) throw new Error(help);
  const project = realpathSync(options['--project']);
  if (!existsSync(resolve(project, 'promotion-agent.json')))
    throw new Error('Select a configured product with promotion-agent.json');
  const port = Number(options['--port'] ?? 4317);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const origin = `http://127.0.0.1:${port}`;
  const token = randomBytes(32).toString('hex');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const child = spawn(
    process.execPath,
    [
      resolve(root, 'node_modules/next/dist/bin/next'),
      options['--production'] ? 'start' : 'dev',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
        PROMOTION_REVIEW_PROJECT: project,
        PROMOTION_REVIEW_DATABASE: options['--database'] ? resolve(options['--database']) : '',
        PROMOTION_REVIEW_TOKEN: token,
        PROMOTION_REVIEW_ORIGIN: origin,
      },
    },
  );
  console.log(
    `\nOpen your private review session: ${origin}/#${token}\nStop with Ctrl+C. Tasks and drafts remain in the product.\n`,
  );
  child.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('exit', (code) => {
    process.exitCode = code ?? 0;
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
