# promotion-agent

A local marketing workspace for founders with multiple projects. Bring your repos and use Codex, Claude Code, or OpenCode to prepare useful marketing work, review it, and track what happened.

**Status: extraction foundation, not a working web app yet.** The task parser, prompt generator, templates, fixtures, and implementation plan are present. Agent runners, SQLite storage, localhost UI, publishing, and scheduling remain to be built.

## Start here

- [Implementation plan](docs/PLAN.md): ordered tasks, dependencies, and acceptance criteria.
- [Handoff](docs/HANDOFF.md): what is finished and where the next agent should start.
- [Architecture](docs/ARCHITECTURE.md): source of truth, execution, and security boundaries.
- [Extraction record](docs/EXTRACTION.md): provenance and deliberate changes.
- [Workflow](templates/WORKFLOW.md): canonical provider-neutral marketing contract.

## Validate the foundation

Requires Node 22.14 or newer. No package installation, cloud service, API key, or external database is needed for these tests.

```sh
npm test
```

The intended future install experience is `npx promotion-agent`; the command is not available from this repo yet and package-name availability has not been checked. The package remains private until release checks are complete.

## Product principles

- Each project owns its product facts, voice, tasks, and marketing history.
- One local interface coordinates many projects without mixing their context.
- One workflow, three agent adapters, optional publishing providers.
- Drafts and manual handoff remain useful without paid integrations.
- Review exact content before external actions; record evidence of what actually happened.
- No mandatory hosted service or telemetry. Local software still sends selected context to the configured AI provider when a run is started.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Start with a bounded item in the plan and include validation evidence. This repository currently contains first-party extractions and newly written foundation material; see [LICENSE](LICENSE) and [extraction provenance](docs/EXTRACTION.md).
