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
    where: 'Paste into your promotion-agent session (Codex, Claude Code or OpenCode opened in this product’s promotion workspace).',
  },
  product: {
    label: 'Product repo',
    where: 'Paste into an agent session opened in the product repository.',
  },
};

/** Shape of a `verified-complete` evidence summary; the review desk shows it on the Done tab. */
export const completionFormat = `Outputs: what was produced or done, with live URLs or workspace paths.
Impact: what changed for the product. Give measured results with their source, or label the expected effect "expected".
Next steps: follow-up task IDs queued, or why none are needed.`;

const sectionLabels = { outputs: 'Outputs', impact: 'Impact', 'next steps': 'Next steps' };

/**
 * Split a completion summary into its labeled sections. Summaries recorded before the format existed come back as plain text.
 * @returns {{ sections: { label: string, text: string }[], text: string }}
 */
export function completionReport(summary) {
  const sections = [];
  const preamble = [];
  for (const line of summary.split('\n')) {
    const match = /^\s*(outputs|impact|next steps)\s*:\s*(.*)$/i.exec(line);
    if (match) sections.push({ label: sectionLabels[match[1].toLowerCase()], text: match[2] });
    else if (sections.length) sections.at(-1).text += `\n${line}`;
    else preamble.push(line);
  }
  for (const section of sections) section.text = section.text.trim();
  return { sections, text: preamble.join('\n').trim() };
}

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
  const post = task.scheduled;
  const scheduled =
    post && post.status === 'scheduled'
      ? `\nRecorded as scheduled through the ${post.adapter} adapter for ${post.localTime} (${post.scheduledFor.slice(11, 16)} UTC)${post.reference ? `, reference ${post.reference}` : ''}. Scheduled is not published: follow the verify step of the shared workflow's publishing procedure, and change, cancel or repost only with my approval.\n`
      : post
        ? `\nThe latest scheduled-post record says ${post.status}. Check it with the shared workflow's publishing procedure before doing anything else.\n`
        : '';
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
Paths under marketing/ live in the ${product} promotion workspace at ${data.project.root}. Read them there; don't edit them. Follow this repository's own instructions and run its checks. Don't commit, push or deploy until I approve. When you're done, summarize it in this shape so I can record it and close ${task.taskId} in the promotion agent:

${completionFormat}

Under Next steps, list the marketing work this change unlocks (announcing it, updating listings, measuring the result) so the promotion agent can queue it as tasks.`,
    };
  }
  return {
    target,
    text: `Continue ${product} promotion task ${task.taskId}: ${task.title}

Promotion workspace: ${data.project.root}
${task.actionUrl ? `Destination: ${task.actionUrl}\n` : ''}${parked}${scheduled}
Steps:
${steps}
${drafts ? `\nSaved drafts so far:\n${drafts}\n` : ''}
Read the task in ${data.project.tasksPath}${drafts ? ' and the saved drafts' : ''}, then pick up at the first unfinished step. Save work as drafts in the promotion workspace and keep the product repository${data.project.sourceRoot ? ` (${data.project.sourceRoot})` : ''} read only. Show me the exact content and ask before publishing, sending, spending or marking the task done.

Keep the marketing moving: before you stop, either take the next action or queue it. You can add follow-up tasks to ${data.project.tasksPath} without asking (next unused T-NNN ID, Materials starting "Follow-up to ${task.taskId}.", URL and 3–8 Prompt steps; at most three, no duplicates of open or done tasks). Tell me which tasks you added.

When the task is verified done, record \`verified-complete\` evidence whose summary uses exactly this shape (the review desk shows it on the Done tab), then complete the task:

${completionFormat}`,
  };
}
