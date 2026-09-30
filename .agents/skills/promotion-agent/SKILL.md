---
name: promotion-agent
description: Set up an explicitly selected local product for promotion, prepare and revise marketing drafts, or report progress using its facts, tasks, and logs in the current conversation.
---

Read [the canonical workflow](../../../templates/WORKFLOW.md) relative to this skill directory, then perform it yourself in the current conversation. The promotion-agent checkout is three directories above this file's directory.

Accept conversational setup, draft, revision, and status requests. The shared workflow routes setup to its installation procedure. Run needed local helpers yourself; the user should not need to copy commands, JSON, or hashes. A draft alone does not require installation.

Resolve one explicit project and the requested setup, activity, revision, or status from the conversation; ask only if the selection is missing or ambiguous. Read the selected project's instructions before editing it. Use the tools available in this session; do not launch another AI CLI, probe authentication, switch models, or delegate.

Use [interactive helper guidance](../../../docs/INTERACTIVE.md) for inspecting tasks, assembling an existing task's prompt, recording draft or verified evidence, optional skipped/snoozed state, and hash-checked completion. These local Node helpers do not invoke AI. A project lacking helper configuration can still receive a draft from its supplied facts; do not invent a project UUID or overwrite its task files to unblock preparation.

Prepare drafts by default, preserve existing user authorization, and report concrete artifacts and verified outcomes here. Do not treat drafting as external publication or task completion. A `verified-complete` record is an agent-supplied account of evidence; verify the underlying action yourself before recording it and using it to complete a task.
