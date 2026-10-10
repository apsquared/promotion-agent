/** Shared browser/test prompt contract. Strings from task files remain context, not authorization. */

/**
 * Tasks filed with category `product` are implemented in the product repository; everything else runs in the promotion agent.
 * @returns {'promotion' | 'product'}
 */
export function promptTarget(task) {
  return task.category.trim().toLowerCase() === 'product' ? 'product' : 'promotion';
}

export const targets = {
  promotion: {
    label: 'Promotion agent',
    where: 'Paste into your promotion-agent session (Codex, Claude Code or OpenCode opened in the promotion-agent repo).',
  },
  product: {
    label: 'Product repo',
    where: 'Paste into an agent session opened in the product repository.',
  },
};

const fallbackSteps = 'Work out what "done" looks like from the task description, state it in one line, then do it.';

function draftLines(task) {
  const references = [...new Set(task.drafts.map((d) => d.reference))];
  return references.length ? references.map((r) => `- ${r}`).join('\n') : '';
}

/** @returns {{ target: 'promotion' | 'product', text: string }} */
export function reviewPrompt(data, task) {
  const target = promptTarget(task);
  const product = data.project.displayName;
  const steps = task.agentPrompt?.trim() || fallbackSteps;
  const parked =
    task.disposition && task.disposition.state !== 'active'
      ? `\nThis task is ${task.disposition.state} (${task.disposition.reason}). Check with me before reactivating it.\n`
      : '';
  const drafts = draftLines(task);
  if (target === 'product') {
    return {
      target,
      text: `Implement this change in the ${product} product repository${data.project.sourceRoot ? ` (${data.project.sourceRoot})` : ''}.

${task.taskId}: ${task.title}
${task.actionUrl ? `Destination: ${task.actionUrl}\n` : ''}${parked}
Details:
${task.materials || '(none)'}

Steps:
${steps}
${drafts ? `\nRelated drafts and proposals:\n${drafts}\n` : ''}
Paths under marketing/ live in the ${product} promotion workspace at ${data.project.root}. Read them there; don't edit them. Follow this repository's own instructions and run its checks. Don't commit, push or deploy until I approve. When you're done, summarize the change so I can close ${task.taskId} in the promotion agent.`,
    };
  }
  return {
    target,
    text: `Continue ${product} promotion task ${task.taskId}: ${task.title}

Promotion workspace: ${data.project.root}
${task.actionUrl ? `Destination: ${task.actionUrl}\n` : ''}${parked}
Steps:
${steps}
${drafts ? `\nSaved drafts so far:\n${drafts}\n` : ''}
Read the task in ${data.project.tasksPath}${drafts ? ' and the saved drafts' : ''}, then pick up at the first unfinished step. Save work as drafts in the promotion workspace and keep the product repository${data.project.sourceRoot ? ` (${data.project.sourceRoot})` : ''} read only. Show me the exact content and ask before publishing, sending, spending or marking the task done.`,
  };
}
