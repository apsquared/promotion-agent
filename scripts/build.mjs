import { rmSync, cpSync, writeFileSync, chmodSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
const compiled = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url)), '-p', 'tsconfig.json'], { cwd: root, stdio: 'inherit' });
if (compiled.status !== 0) process.exit(compiled.status ?? 1);
cpSync(new URL('../templates/', import.meta.url), new URL('../dist/templates/', import.meta.url), { recursive: true });
mkdirSync(new URL('../dist/docs/', import.meta.url));
for (const name of ['ARCHITECTURE.md', 'COMPATIBILITY.md', 'INTERACTIVE.md', 'STORAGE.md'])
  cpSync(new URL(`../docs/${name}`, import.meta.url), new URL(`../dist/docs/${name}`, import.meta.url));
writeFileSync(new URL('../dist/package.json', import.meta.url), JSON.stringify({ type: 'module', private: true }) + '\n');
cpSync(new URL('../LICENSE', import.meta.url), new URL('../dist/LICENSE', import.meta.url));
chmodSync(new URL('../dist/scripts/promotion.mjs', import.meta.url), 0o755);
