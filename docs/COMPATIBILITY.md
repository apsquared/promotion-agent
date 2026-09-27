# Interactive invocation compatibility

| Host | Repo entry point | Invoke in the existing session |
| --- | --- | --- |
| Codex | `.agents/skills/promotion-agent/SKILL.md` | `$promotion-agent <project and request>` |
| Claude Code | `.claude/commands/promote.md` | `/promote <project and request>` |
| OpenCode | `.opencode/commands/promote.md` | `/promote <project and request>` |

In this source checkout every wrapper references `templates/WORKFLOW.md`. In an onboarded product every wrapper references its bundled `.promotion-agent/templates/WORKFLOW.md`. There is no CLI detection, auth check, version allowlist, subprocess launch, model override or native resume logic. Installed AI command-line binary health is irrelevant to using this workflow in an already running session.

Layouts were checked against official [Codex skill docs](https://learn.chatgpt.com/docs/build-skills), [Claude Code skill docs](https://code.claude.com/docs/en/skills) (which still support `.claude/commands/`) and [OpenCode command docs](https://opencode.ai/v2/docs/commands). Metadata, links and helper behavior are checked locally. Native menu selection across all three hosts has not been exercised. If discovery is unavailable, ask the current agent to read the shared workflow directly.

The packaged Node helper was exercised on macOS 14.5 arm64 with Node 22.14.0 and npm 10.9.2. The declared minimum is Node 22.14.0. No Linux/Windows run or host-version matrix is verified; do not advertise those as tested. See `docs/RELEASE.md` for the acceptance matrix still to run.

The earlier P03 headless probes and their authentication/isolation blockers are superseded, not repaired. Their runner code and smoke command were removed. No CLI login, repair, global skill installation or external account change is required or performed by this restructure.
