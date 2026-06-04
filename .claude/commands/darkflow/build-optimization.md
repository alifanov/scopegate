Analyze how this project builds and deploys — map the full pipeline, find bottlenecks and inefficiencies, and create `status:proposed` GitHub issues with concrete optimization proposals. Each issue should describe the problem, what to change, and a measurable acceptance criterion.

This is a **proposal-only audit**: it identifies opportunities and proposes changes. It does not apply changes itself (that is a human/`fix-issues` decision).

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)
- `merge_strategy=` → context for how fixes land (pr or direct)

If `.darkflow` is missing, continue with defaults.

## Step 2 — Map the build & deploy pipeline

Detect and read the actual toolchain. Check each of the following (skip if not present):

**App build:**
- `package.json` scripts (`build`, `test`, `lint`, `typecheck`, `dev`), infer package manager from lockfile (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm)
- Bundler/framework config: `next.config.*`, `vite.config.*`, `webpack.config.*`, `turbo.json`, `nx.json`
- `pyproject.toml` / `uv.lock` / `requirements.txt` for Python projects

**Container build:**
- `Dockerfile` / `Dockerfile.*` — note base image, layer order, multi-stage structure, what gets copied
- `.dockerignore` — presence and what it excludes
- `docker-compose.yml` / `docker-compose.*.yml` — services, build context, volume mounts

**CI/CD:**
- `.github/workflows/*.yml` — jobs, steps, caching strategy (look for `actions/cache`), parallelism, matrix builds, deploy steps
- `Makefile` — relevant build/deploy targets

**Deploy mechanism:**
- Coolify (`deploy` step in CI or `coolify` CLI invocation)
- Registry push commands (`docker build && docker push`)
- Any deploy scripts

**Recent churn:**
```bash
git log --oneline -30
git diff --stat HEAD~10..HEAD 2>/dev/null | grep -E "Dockerfile|\.yml|package\.json|turbo|next\.config|pyproject" | head -20
```

Summarize the current build → deploy path in a short paragraph and note where time is likely spent (e.g., "installs ~800 deps on every CI run, no cache configured").

## Step 3 — Find optimization opportunities

Check each area below. For each finding, note the area, current state, proposed change, and estimated impact (wall-clock time saved, image size reduced, etc.).

**Docker image efficiency:**
- Layer ordering: are `COPY package.json + install` separated from `COPY . + build`? If deps are copied after source, cache busts every time.
- Multi-stage builds: does the final image include build tools, dev dependencies, or source maps that aren't needed at runtime?
- Base image: is `node:X` used where `node:X-alpine` would be significantly smaller? Is the tag pinned or floating (`latest`)?
- `.dockerignore`: is it missing, or does it fail to exclude `node_modules/`, `.git/`, `*.log`, test files, or local `.env`?

**Dependency installation speed:**
- Is `pnpm install` run without `--frozen-lockfile`? Could resolve differently and is slower.
- Is `npm install` used instead of `npm ci`? `ci` is faster and deterministic.
- Are dev dependencies installed in production Docker images? (`--prod` flag missing)
- Is the pnpm store / npm cache / pip cache persisted across CI runs?

**CI caching:**
- Is there an `actions/cache` step for: node_modules / pnpm store / Docker build cache / pip cache / uv cache?
- Is Docker BuildKit / buildx cache (`--cache-from`, `--cache-to`) configured?
- Are CI jobs sequential where they could be parallel (matrix, fan-out)?

**Incremental / affected-only builds:**
- Does the project have turbo or nx configured? Are tasks set up for incremental output caching?
- Are all tests re-run on every push regardless of what changed?

**Build output size:**
- Is bundle analysis run? Are there obvious large dependencies that could be tree-shaken or replaced?
- Are source maps included in production Docker images?

**Deploy step efficiency:**
- Is the deploy step serial where it could be pipelined (build image → push → deploy overlapping)?
- Is the entire image pushed on every commit, or are there strategies to push only changed layers?

Rank opportunities by: **impact** (time saved per run × runs/week) vs **effort** (lines of config changed).

## Step 4 — Create issues for opportunities

Create a GitHub issue for each significant, independent optimization. Group trivially related changes into one issue (e.g., "Add .dockerignore and fix layer ordering" → one issue). Do not create issues for already-tracked open issues.

- Labels: `status:proposed`, `source:build`, priority by impact:
  - `priority:p1` — large, safe time savings (e.g., 5+ min per CI run, or image 2× smaller)
  - `priority:p2` — moderate improvement (1–5 min, meaningful size reduction)
  - `priority:p3` — minor / nice-to-have

**Issue format (required):**

- **Title**: action-oriented verb — "Add pnpm store cache to CI", "Fix Docker layer order to restore cache hits", "Switch to multi-stage build to reduce image size" — never a vague statement
- **Body**:
  ```
  ## Problem
  <current state with file paths — what is slow / wasteful and why>

  ## What to do
  <specific change: which file, what to add/change, exact config if short enough>

  ## Acceptance criteria
  - [ ] <measurable outcome, e.g. "CI install step drops from ~90s to ~15s on cache hit">
  - [ ] <secondary check if needed>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 5 — Write snapshot and metrics

Write `docs/insights/build-optimization/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# Build Optimization — YYYY-MM-DD

**Scope:** <which tools and config files were checked>

## Pipeline overview

<1–3 sentence description of the current build → deploy path and estimated total time>

## Opportunities found

| Area | Current | Proposed | Est. savings | Severity | Issue |
|---|---|---|---|---|---|
| | | | | p1 / p2 / p3 | #N |

## Recurring

<opportunities appearing in 2+ consecutive audits — note how many audits in a row>

## Recommendations

<each with: file to change → what to change → acceptance criterion>
```

Save a snapshot so the Dark Flow worker can forward it to the web UI.

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:build` → `openIssues`
- Count those with `priority:p1` → `criticalOpen`
- Derive `status`: `"warning"` if `criticalOpen > 0`, `"warning"` if `openIssues > 5`, `"ok"` otherwise

Write `.darkflow.d/state/metrics/build-optimization.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
