# Portfolio propio

## Model roles

- Main session (Sonnet, high effort): plans, writes code, drives the work.
- `explorer` / `researcher` / `test-runner` (Haiku): delegate searches, doc lookups and test/build runs to them to keep the main context small.
- `code-reviewer` (Opus): on call, read-only.

## Review checkpoints (mandatory)

Invoke `code-reviewer`:
1. Before finalizing a plan that touches multiple files or the project architecture.
2. When the same test, build or compiler error fails twice — stop and ask for a root-cause review before trying a third fix.
3. Before declaring a task complete or creating a git commit — pass it the full diff.

## Subagent rules

- Subagents return structured summaries only, never full files or logs.
- Anything that edits files or runs tests/builds in a subagent uses `isolation: worktree`.
