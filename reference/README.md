# UI reference only

`legacy-task-board.tsx.txt` is a sanitized extraction of the former task board. It is not compiled or shipped. Port selected UI behavior into the new app, replacing imports, styles, API paths, and personal assignment assumptions.

Useful behavior: project/priority/status/search filters, inline materials, copy prompt, copy outreach draft, optimistic updates with rollback, expandable task detail.

Do not inherit: database-only completion overrides, hardcoded assignees, hosted admin endpoints, prompt caching keyed only by task ID, or the assumption that a browser plugin exists. Cache prompts by content revision if needed.
