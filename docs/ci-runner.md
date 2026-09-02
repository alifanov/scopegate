# CI checks — workflow runs them, `ci-watch` files the task

CI checks run in a GitHub Actions workflow (`darkflow-ci-gate`) on a
**self-hosted runner** (`runner-scopegate`, a Coolify service) — `install` →
`build` (`prisma generate && tsc --noEmit`) → `lint` → `test` on every push and
PR. The workflow itself files nothing: it only reports red/green. The
`ci-watch` routine, running in the local Dark Flow worker, reads that
workflow's conclusion and does the bookkeeping.

Why the split:

| | GitHub Actions workflow | `ci-watch` in the worker |
|---|---|---|
| Runs the checks | ✓ — install/build/lint/test, on the self-hosted runner | ✗ — reads the conclusion, doesn't re-run them |
| Files tasks | ✗ can't reach the local task store — filed GitHub Issues nobody read (pre-v4.20.0 behavior) | ✓ calls `df` directly |
| Runner offline | job sits in `queued` forever — never red, never green, no signal at all | ✓ *reported as a failure* after 45 min |

## What `ci-watch` does

- Polls GitHub Actions for the base branch: newest run per workflow that
  **concluded `failure`**, or that is **still queued/in progress after 45 min**
  (that's the dead-runner case).
- Runs **`pnpm lint`** (or `ruff check .`) locally when `HEAD` moved since the last
  green run — this is what covers repos with no workflows at all, not this one.
  Lint only, not the test suite: lint is hermetic, a suite needs a declared
  environment.
- Files one deduped `source:ci` task per branch, and closes it again on green.

Pure bash, no agent, no tokens. `fix-ci-issue` does the fixing.

## Setting this up on a new project

1. Keep (or add) the GitHub Actions workflow that runs your checks — it's the
   thing that actually executes `install`/`build`/`lint`/`test`.
2. Make sure **both** `ci-watch` and `fix-ci-issue` are enabled in
   *Settings → Routine schedule* — `ci-watch` produces the tasks, `fix-ci-issue`
   consumes them. One without the other does nothing.
3. If the project has no GitHub Actions workflow at all, `ci-watch`'s local
   lint fallback (see above) covers the gap — but a real workflow, self-hosted
   or GitHub-hosted, still catches more (build + test, not just lint).

Keep your own build/deploy workflows: `ci-watch` watches every workflow on the
base branch, so a red build or a failed deploy still becomes a task.

## Requirements

- **`gh`** authenticated on the worker machine (`gh auth login`) — for the
  GitHub-side half. Without it, only the local lint fallback runs.
- **`node` + `pnpm`** (JS) or **`ruff`** (Python) on the worker's `PATH`, and
  `node_modules` present, if the local lint fallback is relied on — `ci-watch`
  does not install dependencies.
