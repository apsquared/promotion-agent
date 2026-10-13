# Interactive invocation compatibility

This page is for agent users. Verification evidence and open acceptance work are in the maintainer release checklist.

| Host | Repo entry point | Invoke in the existing session |
| --- | --- | --- |
| Codex | `.agents/skills/promotion-agent/SKILL.md` | `$promotion-agent <project and request>` |
| Claude Code | `.claude/commands/promote.md` | `/promote <project and request>` |
| OpenCode | `.opencode/commands/promote.md` | `/promote <project and request>` |

In this source checkout every wrapper references `templates/WORKFLOW.md`. In a registered promotion workspace every wrapper references its bundled `.promotion-agent/templates/WORKFLOW.md`. There is no CLI detection, auth check, version allowlist, subprocess launch, model override or native resume logic. Installed AI command-line binary health is irrelevant to using this workflow in an already running session.

If menu discovery is unavailable in your host, ask the current agent to read the shared workflow directly.

Helpers need Node.js 22.14.0 or newer. Automated checks run on Ubuntu and macOS; Windows is unverified, and native menu selection has not been exercised in all three hosts.
