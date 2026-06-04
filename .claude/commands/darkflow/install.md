Run the Dark Flow installer — works for fresh projects and existing ones alike:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/alifanov/darkflow/main/install.sh)
```

Options:
- `--all` — enable all optional modules non-interactively
- `-y / --yes` — accept defaults with no prompts
- `--dry-run` — preview changes without applying
- `--force` — re-apply all templates, skip version check

After the installer finishes, read `.darkflow` if it exists and extract `language=` (default: English) — use it for all user-facing messages below.

Check for stale slash commands that are no longer part of Dark Flow:

1. Fetch the current canonical command list from the Dark Flow repo:
   ```bash
   curl -fsSL https://api.github.com/repos/alifanov/darkflow/contents/templates/.claude/commands/darkflow \
     | grep '"name"' | grep '\.md"' | sed 's/.*"name": "\(.*\)".*/\1/'
   ```
2. List all files currently in `.claude/commands/darkflow/` (relative to the project root).
3. If there are any local files **not** in the canonical list, show them to the user and ask whether to delete them (they are likely leftovers from an older Dark Flow version).
4. Delete only the files the user confirms.
