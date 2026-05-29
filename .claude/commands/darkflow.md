Check the Dark Flow workflow status for this project and help the user manage it.

## What to do

1. **Check docs/ structure** — verify all expected folders exist (`docs/product/`, `docs/spec/`, `docs/design/`, `docs/insights/`, `docs/decisions/`). List any that are missing.

2. **Check GitHub labels** — run `gh label list | grep "status:"` to verify the label taxonomy is set up. If missing, offer to run `/darkflow:install` (which re-runs label setup as its first step).

3. **Show approved task queue** — run:
   ```bash
   gh issue list --label "status:approved" --state open --json number,title,labels,body --limit 20
   ```
   Summarize them by priority. Do not offer to start working — the fix-issues routine handles that.

4. **Check for proposed issues** — run:
   ```bash
   gh issue list --label "status:proposed" --state open --json number,title,labels --limit 10
   ```
   Summarize what's waiting for human review.

5. **Report** — give a short health summary:
   - ✓/✗ docs/ structure present
   - ✓/✗ GitHub labels configured
   - N approved tasks ready to work on
   - N proposed tasks waiting for review

## Available subcommands

- `/darkflow:add-issue [title]` — create a GitHub issue for a manually identified task
- `/darkflow:install` — re-run the Dark Flow installer
- `/darkflow:update-config [lang=...] [branch=...]` — update language and/or main branch settings
