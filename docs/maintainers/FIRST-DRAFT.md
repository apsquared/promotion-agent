# From product fact to a saved draft

This is a maintainer walkthrough completed in the current Codex session on 2026-10-12 using a temporary fictional source and a separate temporary promotion workspace. The prompts below illustrate the user flow; they are not a transcript of an outside founder's trial. Native menu invocation, automatic name discovery and cross-host behavior were not exercised.

## Start with a sourced fact

The repository's [Example Desk context](../../examples/example-desk/marketing/AGENT.md) says:

> Helps a small team organize reference notes.

For this exercise that fictional context was copied into the temporary source's README. No user counts, revenue, testimonials or live integrations were supplied. The source contained only that README.

## Set up and prepare one post

In a normal first session, the request is:

```text
Set up promotion for my project Example Desk and draft one X post for review.
```

For the walkthrough, the agent used the local installer to preview a separate workspace, reviewed its destinations, applied the plan using its review hash, and filled its context from the fictional source. Setup did not write to the source. The workspace started in draft mode with manual publishing.

The prepared X copy was:

> Give your small team's reference notes a home. Example Desk helps you organize them.

The saved artifact was `marketing/drafts/example-desk-x-v1.md`. An open social task, T-001, held the review step. Its task-linked evidence record had outcome `draft`.

## Revise without losing the first version

The corresponding revision request is:

```text
Make it shorter and focus on the main benefit.
```

The shorter draft was:

> Example Desk helps small teams organize reference notes.

It was saved as `marketing/drafts/example-desk-x-v2.md` with a new draft evidence record. Both versions used the same sourced capability. Neither introduced a metric or testimonial.

## Read the saved status

For “What's the status?”, the inspected workspace and review read model showed:

- Two saved draft versions linked to T-001.
- T-001 still open for review, with no completion record.
- Draft mode and no provider configured for automatic posting.
- Source README bytes and source directory contents unchanged.

The next action is to review the shorter copy. Publishing needs its own applicable authorization and destination; no post, scheduling operation, commit or push occurred in this exercise.

## What this verifies

The local setup, draft persistence, revision records, status read model and source-preservation checks were executed with fictional data. The agent authored the copy and used the helpers directly in this session. This is not proof that a new founder can discover the native menu, that conversational name discovery works in every host, or that any external provider works. Those gates stay open in [the acceptance record](ACCEPTANCE.md).
