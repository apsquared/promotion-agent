# Observer workflow smoke test

Use an explicitly selected real product or fictional test repo and a separate private workspace. Do not put credentials or customer data in fixtures. Native host conversation and menu invocation require this live acceptance test; helper tests alone do not prove them.

1. Open promotion-agent in Codex, Claude Code or OpenCode. Ask “Set up promotion-agent for Example Desk. Keep the product read only and draft for review.” The agent discovers the named checkout without asking for a path, verifies its identity, reads documentation, reports the external workspace, handles preview/install and verifies its helpers.
2. Verify the product's Git status and files are unchanged from before setup. Confirm runtime, skills, config, source mapping and marketing files exist only in the external workspace.
3. Continue in the chat or open that workspace. Ask “Draft one X post for the observed product.” Check claims against source documents and ensure the draft/logs are in the workspace.
4. Ask “Make it shorter,” then “What's the status?” Verify revised copy, retained draft status and correct workspace/source selection.
5. Ask for an SEO/code recommendation. Confirm a proposal is saved externally and product files remain unchanged. Do not apply it without a separate explicit request.
6. Open the optional review desk for the workspace. Verify each task shows a description and one prompt labeled for the promotion agent (or the product repo for `product` tasks), and that the copied prompt names the workspace and keeps the product repository read only.
7. Repeat for a second explicitly selected product with a separate workspace. Check that context, tasks and evidence do not mix. Reopen the review desk: one desk shows both products on **All projects** and on separate product boards, and marking a task changes only its own workspace.

Also exercise name discovery with a display name that differs from the folder name, two plausible checkouts, a stale registration, and an unavailable checkout. Check that a unique match proceeds, ambiguous matches get named choices, and unavailable sources prompt opening/selecting the product. Verify a newly named product overrides earlier chat selection, symlink aliases do not create duplicate matches, and matching registrations reuse their stable UUID. No case should request a filesystem path or read unrelated marketing files.

Report defects without editing installed runtime/skills. Fix in the promotion-agent source, rebuild and upgrade the workspace with a reviewed plan. Do not clean up earlier product-local installations without a separate request.
