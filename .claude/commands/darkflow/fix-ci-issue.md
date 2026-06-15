Pick up one CI-failure issue (label `source:ci`), fix the failing lint/test, and push — with **bounded retries**. The same issue is retried up to **3 times**; only after the third failed attempt is it handed to a human. This prevents an endless red-CI → issue → fix → red-CI loop.

The issue itself is **not closed here** — the CI gate workflow closes it automatically once CI goes green again (`close-on-green`). That is what makes the retry counter reliable: one open issue per failing branch, attempts accumulate on it as comments.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `branch=` → main branch name (default: main)
- `merge_strategy=` → `pr` or `direct` (default: pr)
- `language=` → output/comment language (default: English)

If `.darkflow` is missing, continue with the defaults.

## Step 2 — Pick the next CI issue

Pick exactly **one** open issue with **both** `source:ci` and `status:approved`, skipping any that carry `needs-human` (already parked). Within the candidates, take the **oldest** (smallest number):

```bash
n=$(gh issue list --state open --label "source:ci" --label "status:approved" \
      --json number,labels \
      --jq '[ .[]
              | (.labels | map(.name)) as $l
              | select($l | index("needs-human") | not)
              | .number ]
            | min // empty')
```

If `$n` is empty, stop — nothing to do this run.

## Step 3 — Count prior attempts (the retry gate)

Each attempt this command makes leaves a marker comment containing `<!-- darkflow:ci-attempt -->`. Count them:

```bash
attempts=$(gh issue view "$n" --json comments \
  --jq '[.comments[].body | select(contains("<!-- darkflow:ci-attempt -->"))] | length')
```

- **`MAX_ATTEMPTS = 3`.**
- If `attempts >= 3` → **escalate to a human and STOP** (see Step 6). Do not attempt another fix.
- Otherwise this run is attempt **`attempts + 1`** of 3 — continue to Step 4.

## Step 4 — Reproduce and fix

Read the issue body — it lists the failing checks (e.g. `lint`, `test`) and the captured error output, plus the CI run link and commit SHA.

1. Run the failing check(s) locally to reproduce (e.g. `pnpm lint`, `pnpm test`, `ruff check .`, `pytest`).
2. Implement a focused fix for the actual failure. Keep the change minimal and scoped to what CI flagged.
3. **Verify locally — run `lint` and `test` only.** Do **not** run `build`: the CI gate verifies the build on push. Stop if lint/test still fail and you cannot resolve them — then go to Step 6 (escalate) rather than pushing a known-bad fix.

**Product language is always English.** `language=` controls only the language of issue comments and commit messages — never source code, identifiers, comments, or UI strings.

**If the fix genuinely needs a human** (missing env var, external credentials, infra change, secret rotation, a flaky/environment-only failure you cannot reproduce or fix): do not push. Go straight to Step 6 with an explanation of what's needed — regardless of the attempt count.

## Step 5 — Push the fix (do NOT close the issue)

Apply per `merge_strategy`:

- **`direct`**: commit and push straight to `branch=`.
- **`pr`**: create a feature branch off `branch=`, commit, open a PR targeting `branch=`, and merge it. **Reference the issue with `Refs #N`, NOT `Closes #N`** — the issue must stay open so the CI gate can close it only when CI is actually green.

Then, on the issue:
1. Ensure the `ci-retry` label is present: `gh issue edit "$n" --add-label ci-retry`
2. Post the attempt marker comment (in `language=`):

   ```bash
   gh issue comment "$n" --body "<!-- darkflow:ci-attempt -->
   🤖 CI auto-fix **attempt $((attempts + 1))/3** — pushed \`<sha>\` to \`<branch>\`. Awaiting CI re-run; if it stays red this issue will be retried, then handed to a human after attempt 3."
   ```

**Do not close the issue and do not remove `status:approved`.** If the fix worked, the CI gate's `close-on-green` step closes it on the next green run. If it didn't, the issue stays open and the next run increments the counter.

## Step 6 — Escalate to a human (after 3 attempts, or when blocked)

Only when `attempts >= 3`, or the fix needs a human:

```bash
gh issue edit "$n" --add-label needs-human --remove-label status:approved
```

Then comment (in `language=`) explaining the situation — for the attempt-cap case: that auto-fix was tried 3 times and CI is still failing, with the latest failing checks and the most recent CI run link; for the blocked case: exactly what human action is required.

Before commenting, check existing comments — if an equivalent `needs-human` explanation already exists, don't post a duplicate; just ensure labels are correct. Then stop the run.
