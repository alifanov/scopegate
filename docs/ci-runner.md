# CI checks (`ci-watch`) — no runner required

CI checks used to run in a GitHub Actions workflow (`darkflow-ci-gate`) on a
**self-hosted runner**. They no longer do. The `ci-watch` routine does the same
job inside the local Dark Flow worker, so there is nothing to provision,
authenticate or keep online besides the machine the worker already runs on.

Why the move:

| | self-hosted runner | `ci-watch` in the worker |
|---|---|---|
| Toolchain | must be baked into the runner image | already on the machine |
| Files tasks | ✗ can't reach the local task store — filed GitHub Issues nobody read | ✓ calls `df` directly |
| Runner offline | job sits in `queued` forever — never red, never green, no signal at all | ✓ *reported as a failure* |
| Cost | GitHub minutes, or a server to maintain | free |

## What `ci-watch` does

- Polls GitHub Actions for the base branch: newest run per workflow that
  **concluded `failure`**, or that is **still queued/in progress after 45 min**
  (that's the dead-runner case).
- Runs **`pnpm lint`** (or `ruff check .`) locally when `HEAD` moved since the last
  green run — this is what covers repos with no workflows at all. Lint only, not
  the test suite: lint is hermetic, a suite needs a declared environment.
- Files one deduped `source:ci` task per branch, and closes it again on green.

Pure bash, no agent, no tokens. `fix-ci-issue` does the fixing.

## Migrating an existing project

1. Delete `.github/workflows/darkflow-ci-gate.yml` — its checks are duplicated by
   `ci-watch`, and with an offline runner it is the source of the "stuck in
   queued" runs.
2. Remove the now-unused self-hosted runner in
   *Settings → Actions → Runners* in the repo.
3. Make sure **both** `ci-watch` and `fix-ci-issue` are enabled in
   *Settings → Routine schedule* — `ci-watch` produces the tasks, `fix-ci-issue`
   consumes them. One without the other does nothing.

Keep your own build/deploy workflows: `ci-watch` watches every workflow on the
base branch, so a red build or a failed deploy still becomes a task.

## Requirements

- **`gh`** authenticated on the worker machine (`gh auth login`) — for the
  GitHub-side half. Without it, only the local checks run.
- **`node` + `pnpm`** (JS) or **`ruff`** (Python) on the worker's `PATH`, and
  `node_modules` present — `ci-watch` does not install dependencies.
