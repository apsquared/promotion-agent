# P05 interactive workflow verification

## Scope and evidence level

On 2026-09-27, the current **Codex desktop session** loaded the repo-local `promotion-agent` skill instructions and executed the shared workflow itself for the invented products in `examples/p05-lab/`. The skill appears in this session's available skill catalog. The agent read each selected project's context, tasks and logs, used its web research tool for public threads, wrote draft artifacts within the projects' allowed `marketing/drafts/` paths, and logged draft status. No nested AI CLI, provider login, external post, submission, scheduling, purchase, commit or push occurred.

This is evidence of an interactive Codex run and its saved artifacts. It is **not** evidence that a user selected the skill from Codex's native menu. No Claude Code or OpenCode session was active for this run; their command files and relative workflow references are checked locally, but their native invocation and generated output remain unverified. This is a host-coverage limit for P07 release validation, not a simulated host success.

## Fictional scenario results

| Activity | Observed result | Reviewable artifact |
| --- | --- | --- |
| Directory | T-101 was skipped because Done task T-100 records the same fictional directory; T-102 received a complete draft kit for a different `.example` target. The target was inaccessible to the web tool, so fields, price and submission are unverified. Both open tasks remain open. | `examples/p05-lab/fieldbook-notes/marketing/drafts/directory-kit.md` |
| Social | Two exact-copy drafts use an ownership/review angle after the post log's earlier topic-gathering angle. Proposed UTC times are unreserved; account identities and publication are unverified. | `examples/p05-lab/fieldbook-notes/marketing/drafts/social.md` |
| Engagement | The agent retrieved a [public knowledge-base discussion](https://www.reddit.com/r/software/comments/1wal6mh/what_do_you_use_for_a_company_knowledge_base_that/) and wrote a product-free reply draft. It skipped a URL already in the activity log and a [specialized documentation-tool discussion](https://www.reddit.com/r/technicalwriting/comments/1wobeq5/looking_for_a_docs_tool_that_doesnt_make_one/) whose visible replies already covered the useful angle. One candidate remained, below the default budget for a documented fit/duplicate reason. Nothing was posted. | `examples/p05-lab/fieldbook-notes/marketing/drafts/engagement.md` |
| Blog | A new owner/review keyword and proposed slug avoid the recorded topic-based draft. The artifact contains draft metadata, an opening, an outline and a route/claim validation plan. Search demand and a live content system are unverified. | `examples/p05-lab/fieldbook-notes/marketing/drafts/blog-proposal.md` |
| Project separation | A separate Shift Ledger draft uses only its approved volunteer-shift/checklist fact; no Fieldbook Notes claim appears in its marketing copy. Its distinct project UUID and valid empty task snapshot were inspected. | `examples/p05-lab/shift-ledger/marketing/drafts/social-control.md` |

The reviewable artifacts state exact copy, intended destination and status. Each real action would require fresh review of the artifact, live destination and applicable authorization. The `.example` URLs are intentionally non-live; the one retrieved Reddit candidate is a research source, not a post made by either fictional product. All created marketing files are drafts or proposals. The task checkboxes were left unchanged. The Fieldbook Notes activity/post/content logs were updated with these **draft-only** outcomes.

## Verification and limits

- `npm run promotion -- inspect --project examples/p05-lab/fieldbook-notes` classified its task snapshot as `valid`; `prepare --task T-102` returned the intended project ID and reviewed snapshot hash. `inspect` for Shift Ledger returned its different project ID and a valid empty snapshot. These are deterministic helper checks, not model-output tests.
- Skill Creator `quick_validate.py .agents/skills/promotion-agent` returned `Skill is valid!`. The repo-local Claude Code and OpenCode wrappers reference the same canonical workflow; P03 automated tests cover that link resolution. Neither result proves native menu invocation.
- Opening `https://catalog.example/submit` with the session's web tool returned inaccessible, so the directory artifact supplies a manual handoff with unknown fields and no submission claim.
- Public thread pages were read through the session's web tool. Recheck their current content and community rules before considering an actual reply; retrieval here does not prove a reply can be posted.
- There was no scheduler, publishing account or real content site selected. Proposed social times are not reservations, and the blog route is not a deployed page.

For P07, use fresh, explicitly selected fictional installations in active Claude Code and OpenCode sessions and invoke `/promote` from each host's native command interface. Capture the generated artifact and host-visible command discovery result, then compare it with this workflow contract. Repeat Codex native menu invocation separately; do not substitute another agent's CLI subprocess for an interactive session.
