Help the user create a GitHub issue for a manually identified task (bug, feature, or improvement).

Run `bash .darkflow.d/get-config.sh` to refresh the local `.darkflow` cache from the Web UI (silently falls back to cache if offline), then read `.darkflow` in the project root (if it exists) and extract:
- `language=` → language for all conversation and issue text (default: English)

Then read `docs/github-issues.md` to get the list of `area:*` labels defined for this project. Use those — not a hardcoded list.

If `$ARGUMENTS` contains text (e.g. `/darkflow:add-issue fix login button on mobile`), use that text as the **title** — do not ask for a title again. Infer the type from the title if obvious ("fix"/"bug" → `bug`, "add"/"implement" → `enhancement`).

Walk through **only the missing fields** conversationally — skip any field already clear from the title:

1. **What is it?** (if not already clear) — bug, feature, or improvement?
   - bug → label `bug`
   - feature / improvement → label `enhancement`

2. **Title** (if not provided in $ARGUMENTS) — short action-oriented ("Fix X", "Add Y")

3. **Area** — pick one or more from the project's `area:*` labels (read from `docs/github-issues.md`)

4. **Priority:**
   - critical — breaks revenue or a key feature right now
   - high — this week
   - medium — this month
   - low — someday / nice-to-have (allowed for manual issues; scheduled routines never auto-create `low`)

5. **Effort:**
   - xs — ≤ 30 min · s — ~2 hours · m — half a day · l — more than a day

6. **Description** — "Briefly describe the problem and what done looks like." Use the answer to write a context paragraph and 1–3 acceptance criteria checkboxes.

Then construct and run:

```bash
gh issue create \
  --title "<title>" \
  --label "status:approved,source:manual,area:<area>,priority:<p>,effort:<e>,<type>" \
  --body "$(cat <<'EOF'
## Context

<description>

## Acceptance criteria

- [ ] <criterion 1>
- [ ] <criterion 2 if needed>
EOF
)"
```

**Important rules:**
- Language for all conversation and issue text: the `language=` value from `.darkflow` (default: English)
- Always use `status:approved` — the user already decided to do it
- If effort is `l`: warn "This looks like more than a day — better to split into 2–4 sub-issues. Want me to help break it down first?"
- After creating, show the URL and issue number. The fix-issues routine will pick it up automatically.
