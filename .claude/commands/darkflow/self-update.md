Update Dark Flow to the latest version.

## Step 1 — Run the installer

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/alifanov/darkflow/main/install.sh) --force --yes
```

The installer is fully non-interactive: `--yes` skips all prompts, `--force` overwrites locally-modified templates. It will update `.darkflow.d/darkflow-run.sh`, slash commands, and the version in `.darkflow`.

## Step 2 — Ensure `.darkflow` is in `.gitignore`

Check if `.darkflow` is already ignored. If not, add it:

```bash
grep -qxF '.darkflow' .gitignore 2>/dev/null || echo '.darkflow' >> .gitignore
```

## Step 3 — Detect PostHog project ID (if missing)

<!-- Note: the detection logic below (name-match → write ID) is mirrored in analytics-review.md Step 1. Keep both in sync when modifying. -->

Read `.darkflow`. Extract `language=` (default: English) for all user-facing output. If `posthog_project_id=` is missing or empty, and the PostHog MCP is available:

1. List all available PostHog projects.
2. Find the one whose name best matches `name=` from `.darkflow` (case-insensitive, partial match).
3. Write the ID to `.darkflow`:

```bash
# macOS
grep -q "^posthog_project_id=" .darkflow \
  && sed -i '' "s/^posthog_project_id=.*/posthog_project_id=<ID>/" .darkflow \
  || echo "posthog_project_id=<ID>" >> .darkflow
# Linux
grep -q "^posthog_project_id=" .darkflow \
  && sed -i "s/^posthog_project_id=.*/posthog_project_id=<ID>/" .darkflow \
  || echo "posthog_project_id=<ID>" >> .darkflow
```

If PostHog MCP is not available or no match found — skip silently.

## Step 4 — Verify

After the installer exits, confirm the update succeeded:

```bash
grep '^version=' .darkflow
```

Compare the installed version against the latest release:

```bash
curl -fsSL https://raw.githubusercontent.com/alifanov/darkflow/main/VERSION
```

## Step 5 — Commit and push the update

After a successful update, commit and push any changes left by the installer:

```bash
git add -A
git diff --cached --quiet || git commit -m "chore: update Dark Flow to vX.Y.Z"
git push
```

Replace `vX.Y.Z` with the actual installed version. If there were no changes (already up to date), skip the commit step.

## Step 6 — Report

Print a single summary line in `language=`:
- On success: `Dark Flow updated to vX.Y.Z`
- If already up to date: `Dark Flow already up to date (vX.Y.Z)`
- On failure: print the error output and exit non-zero
