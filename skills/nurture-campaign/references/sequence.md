# Sequence design

## Default arc

About five emails over two to three weeks. Adapt step names, days, and count to the product; keep the order unless the product gives a reason to change it.

| Step | Day | Purpose | Branching |
| --- | --- | --- | --- |
| `activation` | 1 | The single most important first action. | If the user already did it, send them to the next step instead. |
| `why-it-works` | 3 | The core thesis or differentiator, with proof from the product. | None. |
| `missed-feature` | 6 | The feature most likely to be missed: an integration, automation, API, or AI-assistant connector. | Skip (return `null`) if the feature isn't enabled or the user already uses it. |
| `outcome-how-to` | 10 | A practical how-to built on what they already have in the product, linking an existing guide or doc page. | Vary the example by what they've created; fall back to a generic starting point when empty. |
| `re-engage` | 17 | Something new since they joined, plus "reply and tell us what you're trying to do". | Use a real count from the database (new items, features, templates since signup); use fallback copy when it's zero. |

## Copy rules

- Short and plain. A few short paragraphs, at most one bullet list.
- One main call-to-action per email. Secondary links are fine; a second button isn't.
- Every link goes to a page that exists. Check routes or the live site; don't invent paths.
- No claims the product can't back up. Reuse wording from the product's own pages and docs. Collect phrases the product disclaims (guarantees, results it says it can't promise) into a banned list that a test enforces.
- Personalize only from the user's own records: their name, their counts, their items. Never from other users' data, enrichment, or inference.
- Subject lines say what's inside. No fake "Re:", false urgency, or misleading preheaders.
- Write like the sender: a named person or the product team, matching the product's existing tone.
- The re-engagement ask invites a reply, so Reply-To must reach a real inbox someone reads.

## Choosing value actions

Pick the actions from the investigation that best predict a user getting value, and decide which one is the activation step. Each branch needs a cheap per-user query (count or exists). Load them once per run into the build context; the content module itself does no I/O.
