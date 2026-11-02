# Source transcript (fictional example)

A made-up session with a fictional product, Example Desk, and fictional directory names. It shows the shape of a raw transcript before cleanup: a typo, a failed tool call that was retried, and wordier replies than a video can carry. Turn ids (T1, T2, …) are what `replay.json` cites in `from`.

**T1 · user**
hey can you find directorys worth submiting Example Desk to? only ones that are actually open right now, i dont want dead forms

**T2 · assistant · thinking (9 s)**
The user wants directory submissions for a help desk product. I should search for candidates and then verify each one's submission page is live and accepts this category.

**T3 · tool · Promotion Agent · search_directories**
Input: `{"category": "help desk software", "min_domain_rating": 40}`
Error: timeout after 30 s

**T4 · tool · Promotion Agent · search_directories (retry)**
Input: `{"category": "help desk software", "min_domain_rating": 40}`
Result: 18 candidates (Toolshelf, LaunchLedger, StackAtlas, Helpdesk Hub, Indie Index, …)

**T5 · tool · Promotion Agent · verify_listing**
Input: `{"sites": 18, "checks": ["form_live", "category_accepted", "rules"]}`
Result: 5 open and eligible; 9 closed or paid-only; 4 reject help desk tools

**T6 · assistant**
Good news! I went ahead and searched for directories in the help desk software category with a domain rating of at least 40, which gave me 18 candidates after one retry because the first search timed out. Then I verified each one by loading its submission page and checking the form, the accepted categories and the listing rules. Of the 18, 5 are open right now and accept a help desk product like Example Desk: Toolshelf, LaunchLedger, StackAtlas, Helpdesk Hub and Indie Index. 9 were closed or only take paid listings, and 4 don't accept help desk tools at all. I've put the five in the table below with their rating and traffic so you can decide where to start. Want me to draft the submission copy for each one?

**T7 · widget · Promotion Agent · Qualified directories**
Table of the five open directories with domain rating, monthly visits and status.

**T8 · user**
yes draft them, start with toolshelf
