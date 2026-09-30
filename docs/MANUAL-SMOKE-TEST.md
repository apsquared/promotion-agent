# Try promotion-agent with BarGPT

The test is a short conversation: set up your existing BarGPT project, get one useful draft, revise it, and ask for status. Allow about 10–15 minutes, plus any first-time setup time. Nothing gets published.

## 1. Open promotion-agent and name your project

Open this promotion-agent repository in your usual Codex, Claude Code, or OpenCode session. Say:

> Set up BarGPT for promotion. Its repo is at /path/to/bargpt. Handle the local setup for me, preserve its existing instructions and marketing work, and keep everything in draft mode.

Replace the example path with your actual BarGPT checkout path. If you only say “BarGPT,” the agent should ask for its location rather than search your other projects.

**What should happen:** the agent reads BarGPT's existing instructions and product context, handles any necessary build and installation, and explains what it installed or preserved. It summarizes the facts it found and any important gaps. You should not need to run commands, copy hashes, configure SQLite, or move to a different chat. If your session requires permission to write into BarGPT, the agent should explain that specific permission request.

If you want to review the file changes before installation, add “Show me the setup changes before applying them.” Otherwise, the setup request authorizes the local installation.

## 2. Ask for one real draft

In the same conversation, say:

> Draft one X post for BarGPT. Use an angle we haven't recently used. Save it for review and show me the copy and the facts behind it. Don't publish or schedule it.

**What should happen:** the agent checks available product facts and recent marketing history, saves one draft in a project-approved location, and shows you the exact copy with a link to the file. If history or essential facts are missing, it should say so instead of inventing them.

**Your check:** does this accurately describe BarGPT, and is the draft useful enough to edit or publish later? Open the saved file to confirm it exists. No existing submission or publishing task should be marked complete just because a draft was created.

## 3. Revise it naturally

Say:

> Make it shorter and less salesy. Keep it as a draft.

**What should happen:** the agent updates the draft and shows the revised copy. It should keep the same product and draft context without making you repeat paths or task IDs. Open the file again and check that it matches the revision shown in chat.

## 4. Ask where things stand

Say:

> What's the status of our BarGPT promotion work? What did you create or change, and what should we do next?

**What should happen:** you get a brief summary with the saved draft, any setup changes, remaining gaps, and a next step. It should clearly say nothing was published or scheduled. Ask it to show the project changes if you want to inspect them; pre-existing edits should remain intact.

## 5. Tell us whether it worked

Send back a short verdict, for example:

> I tested in Codex. Setup worked, the draft was accurate, and revisions saved correctly. Status was clear. The confusing part was ____.

The smoke test passes when setup and the draft/revision/status conversation work, files match the reported results, and there are no unexpected actions. Report any tool or permission limitation as a blocker rather than a pass.

### If the agent doesn't recognize the workflow

In this source repository, say:

> Read templates/WORKFLOW.md and use it to help me set up BarGPT and prepare a draft in this conversation.

You can also explicitly select `$promotion-agent` in Codex or `/promote` in Claude Code/OpenCode. If that entry is absent, record it as a discovery issue; a successful direct-workflow conversation does not prove native menu discovery.

Later, if you open a fresh chat inside the installed BarGPT project, invoke that skill/command and ask for another draft. The agent should find BarGPT's saved context and logs. Its workflow is now at `.promotion-agent/templates/WORKFLOW.md`.

This first test covers useful real-product setup and drafting in your chosen host. Other hosts, SQLite completion guards, package distribution, and public publishing are separate checks. No commit, push, or external post is part of this smoke test.
