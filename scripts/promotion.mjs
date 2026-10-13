#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { previewInstall, applyInstall, reviewHash, previewRemoval, applyRemoval, removalHash } from '../src/onboarding/install.ts';
import { inspectProject, prepareTask, recordTaskEvidence, completeSelectedTask, setSelectedTaskDisposition, readSelectedTaskState } from '../src/interactive/tasks.ts';
import { releaseSource } from '../src/interactive/release-source.ts';
import { acquisitionStatus } from '../src/interactive/acquisition.ts';

import { requireWorkspace, observerSource, assertObserverOutput, assertObserverOutputForSetup } from '../src/onboarding/workspace.ts';

const help = `Local task helpers for the CURRENT interactive agent (no AI process is launched):
  onboard --project <read-only-product-directory> --workspace <separate-workspace-directory> --name <display-name> --plan <new-plan.json>
  install --project <directory> --plan <reviewed-plan.json> --review-hash <sha256>
  remove-preview --project <directory> --plan <new-plan.json>
  remove --project <directory> --plan <reviewed-plan.json> --review-hash <sha256>
  inspect --project <directory>
  prepare --project <directory> --task <T-NNN>
  release-source --project <workspace> --base <local-ref-or-commit> --head <local-ref-or-commit>
  acquisition-status --project <workspace> --sprint <UUID> [--database <local.sqlite>]
  record --project <directory> --task <T-NNN> --expected-hash <sha256> --outcome <draft|verified-complete> --reference <path|https-url> --summary <text>
  state --project <directory> --database <local.sqlite>
  disposition --project <directory> --task <T-NNN> --expected-hash <sha256> --database <local.sqlite> --state <active|skipped|snoozed> [--reason <text>] [--until <UTC timestamp>]
  complete --project <directory> --task <T-NNN> --expected-hash <sha256> --database <local.sqlite> --evidence <record-path> --evidence-hash <sha256>
--project for all commands except onboard selects the promotion workspace, never the product repo.
inspect/prepare are read-only. state reads optional registry state without changing product files.
release-source reads only the registered source's Git history: exact IDs and filtered file names, never a diff or deployment proof.
acquisition-status reads a saved sprint and existing tasks/dispositions; it never queues or sends, or verifies payments.
record stores an agent-supplied evidence account without SQLite.
complete requires a matching reviewed verified-complete record; it does not verify an external action itself.
Use one database for dispositions/completion to share P02 project locks.`;
try {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help') { console.log(help); }
  else {
    const specs = {
      onboard: { required: ['project', 'workspace', 'name', 'plan'] },
      install: { required: ['project', 'plan', 'review-hash'] },
      'remove-preview': { required: ['project', 'plan'] },
      remove: { required: ['project', 'plan', 'review-hash'] },
      inspect: { required: ['project'] },
      prepare: { required: ['project', 'task'] },
      'release-source': { required: ['project', 'base', 'head'] },
      'acquisition-status': { required: ['project', 'sprint'], optional: ['database'] },
      record: { required: ['project', 'task', 'expected-hash', 'outcome', 'reference', 'summary'] },
      state: { required: ['project', 'database'] },
      disposition: { required: ['project', 'task', 'expected-hash', 'database', 'state'], optional: ['reason', 'until'] },
      complete: { required: ['project', 'task', 'expected-hash', 'database', 'evidence', 'evidence-hash'] },
    };
    const spec = specs[command];
    if (!spec) throw new Error('Unknown command; use --help');
    const allowed = [...spec.required, ...(spec.optional ?? [])];
    const options = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].slice(2);
      if (!args[i].startsWith('--') || !allowed.includes(key) || Object.hasOwn(options, key) || !args[i + 1]) throw new Error('Invalid, duplicate, or missing option; use --help');
      options[key] = args[i + 1];
    }
    if (spec.required.some(key => !options[key])) throw new Error(`Required options: ${spec.required.map(key => '--' + key).join(', ')}`);
    if (command === 'onboard') {
      observerSource(options.workspace, options.project);
      // Validate even the private preview destination before writing it.
      const source = options.project;
      assertObserverOutputForSetup(options.workspace, source, options.plan);
      const plan = previewInstall(options.workspace, options.name, options.project);
      writeFileSync(options.plan, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ plan: options.plan, reviewHash: reviewHash(plan), entries: plan.entries.map(({ path, action, reason }) => ({ path, action, reason })) }, null, 2));
    } else if (command === 'install') {
      const plan = JSON.parse(readFileSync(options.plan, 'utf8'));
      const mapping = plan.entries?.find(entry => entry.path === 'promotion-source.json');
      if (!mapping) throw new Error('Install requires an observer workspace plan');
      observerSource(options.project, JSON.parse(mapping.after).sourcePath);
      console.log(JSON.stringify(applyInstall(options.project, plan, options['review-hash']), null, 2));
    } else if (command === 'remove-preview') {
      requireWorkspace(options.project);
      assertObserverOutput(options.project, options.plan);
      const plan = previewRemoval(options.project);
      writeFileSync(options.plan, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ plan: options.plan, reviewHash: removalHash(plan), entries: plan.entries.map(({ path, action, reason }) => ({ path, action, reason })) }, null, 2));
    } else if (command === 'remove') {
      requireWorkspace(options.project);
      console.log(JSON.stringify(applyRemoval(options.project, JSON.parse(readFileSync(options.plan, 'utf8')), options['review-hash']), null, 2));
    } else {
      requireWorkspace(options.project);
      const result = command === 'acquisition-status' ? acquisitionStatus(options.project, options.sprint, options.database)
        : command === 'release-source' ? releaseSource(options.project, options.base, options.head)
        : command === 'inspect' ? inspectProject(options.project) : command === 'prepare' ? prepareTask(options.project, options.task)
        : command === 'record' ? recordTaskEvidence(options.project, options.task, options['expected-hash'], options.outcome, options.reference, options.summary)
        : command === 'state' ? readSelectedTaskState(options.project, options.database)
        : command === 'disposition' ? setSelectedTaskDisposition(options.project, options.task, options['expected-hash'], options.database,
          options.state, options.reason ?? null, options.until ?? null)
        : completeSelectedTask(options.project, options.task, options['expected-hash'], options.database, options.evidence, options['evidence-hash']);
      console.log(JSON.stringify(result, null, 2));
      if (command === 'inspect' && result.snapshot.classification !== 'valid') process.exitCode = 2;
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
