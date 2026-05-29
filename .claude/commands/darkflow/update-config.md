Update Dark Flow project settings: language and/or main branch.

## Usage

```
/darkflow:update-config            ← interactive (ask for new values)
/darkflow:update-config lang=Russian
/darkflow:update-config branch=develop
/darkflow:update-config lang=Russian branch=develop
```

## Step 1 — Read current settings

Read `.darkflow` from the project root. Extract `language=` and `branch=` values. If the file is missing, abort with an error.

## Step 2 — Determine new values

Parse any `lang=` and `branch=` arguments passed to the command.

For any value **not** provided as an argument, ask the user interactively:
- **Language**: current value shown as default; accept free text (e.g. English, Russian, Spanish)
- **Main branch**: current value shown as default; accept free text (e.g. main, master, develop)

If the user presses Enter without input, keep the current value unchanged.

## Step 3 — Update `.darkflow`

For each changed value, update the corresponding key in `.darkflow` in-place:

```bash
# macOS
sed -i '' "s/^language=.*/language=<NEW_LANG>/" .darkflow
sed -i '' "s/^branch=.*/branch=<NEW_BRANCH>/" .darkflow

# Linux
sed -i "s/^language=.*/language=<NEW_LANG>/" .darkflow
sed -i "s/^branch=.*/branch=<NEW_BRANCH>/" .darkflow
```

## Step 4 — Update `.darkflow.d/claude.md`

Read `.darkflow.d/claude.md`. Update the two lines in-place:

```bash
# macOS
sed -i '' "s/^\*\*Language:\*\* .*/\*\*Language:\*\* <NEW_LANG> — use this language for GitHub issues, comments, commit messages, and all agent-facing text./" .darkflow.d/claude.md
sed -i '' "s/^\*\*Main branch:\*\* .*/\*\*Main branch:\*\* \`<NEW_BRANCH>\`/" .darkflow.d/claude.md

# Linux
sed -i "s/^\*\*Language:\*\* .*/\*\*Language:\*\* <NEW_LANG> — use this language for GitHub issues, comments, commit messages, and all agent-facing text./" .darkflow.d/claude.md
sed -i "s/^\*\*Main branch:\*\* .*/\*\*Main branch:\*\* \`<NEW_BRANCH>\`/" .darkflow.d/claude.md
```

Also update any line that reads `→ PR → merge to <old-branch>` or `push directly to \`<old-branch>\`` to use `<NEW_BRANCH>`.

## Step 5 — Commit and push

Stage and commit the changed files:

```bash
git add .darkflow.d/claude.md
git commit -m "chore: update darkflow config (lang=<NEW_LANG>, branch=<NEW_BRANCH>)"
git push
```

Only include values that actually changed in the commit message. Note: `.darkflow` is gitignored and must not be staged — only `.darkflow.d/claude.md` is tracked.

## Step 6 — Report

Print a summary of what changed:
```
Updated .darkflow and .darkflow.d/claude.md:
  language: <OLD> → <NEW>
  branch:   <OLD> → <NEW>
```

If nothing changed, print: `No changes — config already up to date.`
