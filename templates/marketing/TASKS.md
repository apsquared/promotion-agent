# Marketing tasks — <PRODUCT NAME>

Use sequential T-NNN IDs, never reused. Each task should be executable with its supplied materials. Check the box only when complete and record evidence; the `verified-complete` summary uses Outputs:, Impact: and Next steps: lines and is shown for done tasks in the review desk. Preserve legacy entries without Prompt.

Format example (outside Open/Done, so it is not a real task):

```text
- [ ] T-001 | 2026-09-26 | P2 | directory | Prepare a listing
      URL: https://directory.example/submit
      Materials: Complete copy and verified repo-relative asset paths.
      Prompt: 1. Open the actual target form and match the supplied fields.
        2. Prepare the exact content for review; identify missing required facts.
        3. Record confirmation evidence only after authorized submission.
```

Materials is the task description shown in the review desk. Any task may queue follow-up tasks: start their Materials with `Follow-up to T-NNN.` and include any earliest date or trigger. Use category `product` for work implemented in the product repository; all other categories run in the promotion agent. Use category `video` for product videos: the project lives under `marketing/assets/videos/<project>/` in this workspace, and the render and contact sheet are recorded as draft evidence until the user approves them; posting the video is its own task. Write each task so it can be pasted into an agent: say whether it runs in the promotion workspace or the product repository (`product` category only), keep it self-contained, and mark anything only the user can do (sign-in, payment, CAPTCHA, approval) as `Human required:` as described in the shared workflow. Prompt comes last, with 3–8 task-specific steps. Do not put field markers URL: or Materials:, task headers, or ## headings inside continuation blocks. Shared execution policy is added by the prompt builder; it is not a substitute for enforced runtime permissions.

Use category `release` for launch-pack review or release fact checks. Materials must name the stable release UUID, frozen source snapshot, exact draft version and unresolved claims. Queue renders as `video` tasks through the existing video activity and approved posts through the publishing workflow; preparation never authorizes either action. Keep at most three deduplicated follow-ups per run.

Use category `acquisition` for sprint execution/review. Materials name the sprint/opportunity UUIDs, exact unsent draft version and destination, minutes and approval trigger. Keep wider opportunities and outcome history in the sprint record; this file is the only executable task board. A research/action completion does not complete the paying-customer target.

## Open

## Done
