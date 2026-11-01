# Interactive invocation compatibility

This page is for agent users. Verification evidence and open acceptance work are in the maintainer release checklist.

| Intended host | Entry point relative to the promotion workspace | Invoke in the existing session | Native menu acceptance |
| --- | --- | --- | --- |
| Codex | `.agents/skills/promotion-agent/SKILL.md` | `$promotion-agent <project and request>` | Pending |
| Claude Code | `.claude/commands/promote.md` | `/promote <project and request>` | Pending |
| OpenCode | `.opencode/commands/promote.md` | `/promote <project and request>` | Pending |

Open the registered promotion workspace for everyday use. Its root `AGENTS.md` and `CLAUDE.md` identify it as a usage workspace, and every installed wrapper references its bundled `.promotion-agent/templates/WORKFLOW.md`. Existing customized instructions are preserved during installation and upgrades.

The source/development checkout currently also supports initial setup, upgrades and checkout-only features; its wrappers reference `templates/WORKFLOW.md`. There is no CLI detection, auth check, version allowlist, subprocess launch, model override or native resume logic. Installed AI command-line binary health is irrelevant to using this workflow in an already running session.

If menu discovery is unavailable in your host, ask the current agent to read the shared workflow directly.

Helpers need Node.js 22.14.0 or newer. Automated checks run on Ubuntu and macOS; Windows is unverified, and native menu selection has not been exercised in all three hosts.
