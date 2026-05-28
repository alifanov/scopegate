#!/usr/bin/env bash
# DF_VERSION: 2.30.1
# Dark Flow routine dispatcher
# Lives at .darkflow.d/darkflow-run.sh — run from anywhere in the project.
#
# Usage:
#   bash .darkflow.d/darkflow-run.sh              # loop every 60s — checks for due routines (default)
#   bash .darkflow.d/darkflow-run.sh <name>       # manual: run one routine immediately
#   bash .darkflow.d/darkflow-run.sh --sync       # push issues + metadata to the web UI
#   bash .darkflow.d/darkflow-run.sh --list       # show routine status table
#   bash .darkflow.d/darkflow-run.sh --dry-run    # show what would run, don't run it
#   bash .darkflow.d/darkflow-run.sh --self-test  # run internal cron-matcher tests

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DARKFLOW_D="${PROJECT_ROOT}/.darkflow.d"
YAML="${DARKFLOW_D}/routines.yml"
STATE_DIR="${DARKFLOW_D}/state"
LOCK_DIR="${STATE_DIR}/.lock"
LOG="${DARKFLOW_D}/darkflow-run.log"
METRICS_DIR="${DARKFLOW_D}/state/metrics"
DARKFLOW_CFG="${PROJECT_ROOT}/.darkflow"
DARKFLOW_REPO="https://raw.githubusercontent.com/alifanov/darkflow/main"
GLOBAL_SLOTS_DIR="/tmp/darkflow-slots"

# Accumulated routine log entries for this dispatch cycle (JSON lines)
PENDING_LOGS=()

# Cached log prefix "[vX.Y.Z] [ProjectName]" — built lazily on first log() call
_LOG_PREFIX=""
_LOG_PREFIX_READY=false

cd "$PROJECT_ROOT"

# ── OS detection ──────────────────────────────────────────────────────────────

OS="$(uname)"

# Decode epoch → "minute hour day month weekday" (weekday: 0=Sun)
epoch_decode() {
  if [[ "$OS" == "Darwin" ]]; then
    date -r "$1" "+%M %H %d %m %w"
  else
    date -d "@$1" "+%M %H %d %m %w"
  fi
}

# Format epoch for display
epoch_fmt() {
  local fmt="${2:-%Y-%m-%d %H:%M}"
  if [[ "$OS" == "Darwin" ]]; then
    date -r "$1" "+$fmt" 2>/dev/null || echo "$1"
  else
    date -d "@$1" "+$fmt" 2>/dev/null || echo "$1"
  fi
}

now_epoch() { date +%s; }

# ── Logging ───────────────────────────────────────────────────────────────────

log() {
  _init_log_prefix
  local line="[$(date '+%Y-%m-%d %H:%M:%S')]${_LOG_PREFIX} $*"
  echo "$line" >> "$LOG" 2>/dev/null || true
  echo "$line"
}

rotate_log() {
  if [[ -f "$LOG" ]] && [[ "$(wc -c < "$LOG")" -gt 1048576 ]]; then
    tail -c 524288 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
  fi
}

# ── .darkflow config reader ───────────────────────────────────────────────────

darkflow_val() {
  local key="$1" default="${2:-}" val
  if [[ -f "$DARKFLOW_CFG" ]]; then
    val=$(grep -E "^${key}=" "$DARKFLOW_CFG" 2>/dev/null | head -1 | cut -d= -f2-)
    if [[ -n "$val" ]]; then echo "$val"; return; fi
  fi
  echo "$default"
}

# Lazily builds the log prefix "[vX.Y.Z] [ProjectName]" and caches it.
# Called on every log() invocation; only reads .darkflow on the first call.
_init_log_prefix() {
  $_LOG_PREFIX_READY && return 0
  _LOG_PREFIX_READY=true
  local ver name
  ver=$(darkflow_val "version" "")
  name=$(darkflow_val "name" "$(basename "$PROJECT_ROOT")")
  _LOG_PREFIX=""
  [[ -n "$ver" ]]  && _LOG_PREFIX=" [v${ver}]"
  [[ -n "$name" ]] && _LOG_PREFIX+=" [${name}]"
}

# ── GitHub token bootstrap ────────────────────────────────────────────────────
# Priority: gh_token in .darkflow > webapp global token > gh auth token
if [[ -z "${GH_TOKEN:-}" ]]; then
  _cfg_tok=$(darkflow_val "gh_token" "")
  if [[ -n "$_cfg_tok" ]]; then
    export GH_TOKEN="$_cfg_tok"
  else
    # Try fetching token from the webapp (no auth needed, just curl)
    _webapp_url=$(darkflow_val "webapp_url" "")
    if [[ -n "$_webapp_url" ]] && command -v curl &>/dev/null; then
      _webapp_tok=$(curl -fsS -m 5 "${_webapp_url}/api/settings/gh-token" 2>/dev/null \
        | grep -o '"ghToken":"[^"]*"' | cut -d'"' -f4 || true)
      [[ -n "$_webapp_tok" && "$_webapp_tok" != "null" ]] && export GH_TOKEN="$_webapp_tok"
    fi
    # Fall back to gh CLI
    if [[ -z "${GH_TOKEN:-}" ]] && command -v gh &>/dev/null; then
      _tok=$(gh auth token 2>/dev/null) && export GH_TOKEN="$_tok" || true
    fi
  fi
fi

# ── Cron field matching ────────────────────────────────────────────────────────
# Returns 0 if integer value matches cron field expression.
# Supports: *, n, a-b, a-b/n, */n, a,b,c and combinations.

cron_field_match() {
  local val_raw="$1" field="$2"
  local val
  val=$(( 10#$val_raw ))  # strip leading zeros

  local part lo hi step
  local IFS=','
  read -ra parts <<< "$field"
  for part in "${parts[@]}"; do
    step=1
    if [[ "$part" == *"/"* ]]; then
      step="${part##*/}"
      part="${part%%/*}"
    fi
    if [[ "$part" == "*" ]]; then
      lo=0; hi=99
    elif [[ "$part" == *"-"* ]]; then
      lo="${part%%-*}"; hi="${part##*-}"
    else
      lo="$part"; hi="$part"
    fi
    lo=$(( 10#$lo )); hi=$(( 10#$hi )); step=$(( 10#$step ))
    if (( val >= lo && val <= hi && (val - lo) % step == 0 )); then
      return 0
    fi
  done
  return 1
}

# Returns 0 if the cron expression matches at the given epoch.
# dom/dow: if both are restricted, either matching is sufficient (standard OR rule).
cron_due_at() {
  local ep="$1" c_min="$2" c_hr="$3" c_dom="$4" c_month="$5" c_dow="$6"
  local dm hm dd mo wd

  read -r dm hm dd mo wd <<< "$(epoch_decode "$ep")"
  [[ "$wd" == "7" ]] && wd="0"  # normalize Sunday

  cron_field_match "$dm" "$c_min"   || return 1
  cron_field_match "$hm" "$c_hr"    || return 1
  cron_field_match "$mo" "$c_month" || return 1

  local dom_star=false dow_star=false
  [[ "$c_dom" == "*" ]] && dom_star=true
  [[ "$c_dow" == "*" ]] && dow_star=true

  if $dom_star && $dow_star; then
    return 0
  elif $dom_star; then
    cron_field_match "$wd" "$c_dow" || return 1
  elif $dow_star; then
    cron_field_match "$dd" "$c_dom" || return 1
  else
    # Both restricted: OR semantics
    cron_field_match "$dd" "$c_dom" || cron_field_match "$wd" "$c_dow" || return 1
  fi
  return 0
}

# Finds the most recent epoch >= floor_epoch that matches the cron expression.
# Prints the epoch on stdout; prints 0 if none found.
#
# Optimisation: if minute and hour are plain integers, align to the most recent
# (min, hour) pair in LOCAL time, then step by 86400s (daily). This reduces date
# calls from thousands to single digits for typical weekly/daily crons.
prev_fire() {
  local c_min="$1" c_hr="$2" c_dom="$3" c_month="$4" c_dow="$5" floor_ep="$6"
  local now ep step m h cur_m cur_h diff _f1 _f2 _rest

  now=$(now_epoch)
  ep=$(( now - now % 60 ))  # start of current minute

  if [[ "$c_min" =~ ^[0-9]+$ ]] && [[ "$c_hr" =~ ^[0-9]+$ ]]; then
    # Both minute and hour are fixed: align using LOCAL time from epoch_decode.
    m=$(( 10#$c_min )); h=$(( 10#$c_hr ))
    # Decode current local minute
    read -r cur_m _rest <<< "$(epoch_decode "$ep")"
    cur_m=$(( 10#$cur_m ))
    diff=$(( (cur_m - m + 60) % 60 ))
    ep=$(( ep - diff * 60 ))
    # Re-decode after minute alignment to get local hour (boundary may have shifted)
    read -r _f1 cur_h _rest <<< "$(epoch_decode "$ep")"
    cur_h=$(( 10#$cur_h ))
    diff=$(( (cur_h - h + 24) % 24 ))
    ep=$(( ep - diff * 3600 ))
    step=86400

  elif [[ "$c_min" =~ ^[0-9]+$ ]]; then
    # Only minute is fixed: align using LOCAL time, step hourly.
    m=$(( 10#$c_min ))
    read -r cur_m _rest <<< "$(epoch_decode "$ep")"
    cur_m=$(( 10#$cur_m ))
    diff=$(( (cur_m - m + 60) % 60 ))
    ep=$(( ep - diff * 60 ))
    step=3600

  else
    step=60
  fi

  while (( ep >= floor_ep )); do
    if cron_due_at "$ep" "$c_min" "$c_hr" "$c_dom" "$c_month" "$c_dow"; then
      echo "$ep"
      return 0
    fi
    ep=$(( ep - step ))
  done

  echo 0
}

# ── State helpers ─────────────────────────────────────────────────────────────

read_state() {
  local f="${STATE_DIR}/${1}.last"
  [[ -f "$f" ]] && cat "$f" || echo 0
}

write_state() {
  local name="$1" ep="$2"
  mkdir -p "$STATE_DIR"
  echo "$ep" > "${STATE_DIR}/${name}.last"
}

# ── YAML helpers ──────────────────────────────────────────────────────────────

yaml_get() {
  local expr="$1" file="$2" default="${3:-}"
  local val
  val=$(yq "$expr" "$file" 2>/dev/null || true)
  if [[ -z "$val" || "$val" == "null" ]]; then
    echo "$default"
  else
    echo "$val"
  fi
}

routine_names() {
  yq '.routines | keys | .[]' "$YAML" 2>/dev/null
}

# ── Preflight ─────────────────────────────────────────────────────────────────

preflight() {
  local ok=true
  if ! command -v yq &>/dev/null; then
    echo "darkflow-run: yq not found." >&2
    echo "  macOS:  brew install yq" >&2
    echo "  Linux:  https://github.com/mikefarah/yq#install" >&2
    ok=false
  fi
  if ! command -v claude &>/dev/null; then
    echo "darkflow-run: claude not found." >&2
    echo "  Install Claude Code: https://claude.ai/code" >&2
    ok=false
  fi
  if ! command -v python3 &>/dev/null; then
    echo "darkflow-run: python3 not found." >&2
    echo "  macOS:  brew install python3" >&2
    echo "  Linux:  apt install python3 / dnf install python3" >&2
    ok=false
  fi
  if [[ ! -f "$YAML" ]]; then
    echo "darkflow-run: ${YAML} not found. Run install.sh to reinstall Dark Flow." >&2
    ok=false
  fi
  # Verify that each enabled routine has a corresponding command file.
  # A mismatch means routines.yml and .claude/commands/darkflow/ are out of sync.
  if [[ -f "$YAML" ]] && command -v yq &>/dev/null; then
    local _cmd_dir="${PROJECT_ROOT}/.claude/commands/darkflow"
    local _rname _enabled
    while IFS= read -r _rname; do
      _enabled=$(yq ".routines[\"${_rname}\"].enabled // true" "$YAML" 2>/dev/null || echo "true")
      [[ "$_enabled" == "false" ]] && continue
      if [[ ! -f "${_cmd_dir}/${_rname}.md" ]]; then
        echo "darkflow-run: routine '${_rname}' is enabled in routines.yml but missing command file: .claude/commands/darkflow/${_rname}.md" >&2
        echo "  Run install.sh to repair, or disable the routine in routines.yml." >&2
        ok=false
      fi
    done < <(routine_names)
  fi
  [[ "$ok" == true ]]
}

# ── Lock ──────────────────────────────────────────────────────────────────────

# Try to take the dispatch lock. Returns 0 on success, 1 on contention.
# Reclaims the lock if the recorded owner PID is no longer alive (stale lock
# from a SIGKILLed / OOM-killed / power-loss dispatch that never ran its trap).
try_acquire_lock() {
  mkdir -p "$STATE_DIR"
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "$$" > "$LOCK_DIR/pid"
    return 0
  fi

  local owner_pid=""
  [[ -f "$LOCK_DIR/pid" ]] && owner_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")

  if [[ -n "$owner_pid" ]] && kill -0 "$owner_pid" 2>/dev/null; then
    return 1
  fi

  log "LOCK   reclaiming stale lock (owner PID ${owner_pid:-unknown} not running)"
  rm -rf "$LOCK_DIR"
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "$$" > "$LOCK_DIR/pid"
    return 0
  fi
  return 1
}

release_lock() {
  rm -rf "$LOCK_DIR" 2>/dev/null || true
}

# ── Global concurrency semaphore ──────────────────────────────────────────────
# Limits simultaneous claude processes across all projects on this machine.
# Slots live in /tmp/darkflow-slots/; each slot file contains "PID:project-path".
# Stale slots (dead PID) are reclaimed automatically.

_acquired_slot=""  # slot index held by this process (empty = none)

semaphore_acquire() {
  local max_slots i slot_file owner_pid
  max_slots=$(darkflow_val "max_concurrent" "3")
  mkdir -p "$GLOBAL_SLOTS_DIR"

  for (( i = 0; i < max_slots; i++ )); do
    slot_file="${GLOBAL_SLOTS_DIR}/slot-${i}.lock"
    if [[ ! -f "$slot_file" ]]; then
      if ( set -o noclobber; echo "$$:${PROJECT_ROOT}" > "$slot_file" ) 2>/dev/null; then
        _acquired_slot="$i"
        return 0
      fi
    fi
    # Slot exists — reclaim if owner PID is dead
    owner_pid=$(cut -d: -f1 "$slot_file" 2>/dev/null || echo "")
    if [[ -n "$owner_pid" ]] && ! kill -0 "$owner_pid" 2>/dev/null; then
      rm -f "$slot_file"
      if ( set -o noclobber; echo "$$:${PROJECT_ROOT}" > "$slot_file" ) 2>/dev/null; then
        log "SEMA   reclaimed stale slot ${i} (dead PID ${owner_pid})"
        _acquired_slot="$i"
        return 0
      fi
    fi
  done
  return 1  # all slots busy
}

semaphore_release() {
  if [[ -n "$_acquired_slot" ]]; then
    rm -f "${GLOBAL_SLOTS_DIR}/slot-${_acquired_slot}.lock" 2>/dev/null || true
    _acquired_slot=""
  fi
}

acquire_lock() {
  if ! try_acquire_lock; then
    exit 0
  fi
  trap 'release_lock; stop_heartbeat_loop' EXIT
}

# ── Process group isolation ───────────────────────────────────────────────────
# Run a command in a new process group so any background processes it spawns
# (dev servers, watchers, etc.) can be killed after the command exits.
# Prints output to stdout; sets caller's _pgid_ret to the new PGID.
_pgid_ret=""

run_in_pgid() {
  local _tmpout _bgpid
  _tmpout=$(mktemp)
  _pgid_ret=""

  if ! command -v python3 &>/dev/null; then
    echo "darkflow-run: python3 not found — required for process group isolation" >&2
    rm -f "$_tmpout"
    return 1
  fi

  python3 -c 'import os,sys; os.setpgrp(); os.execvp(sys.argv[1], sys.argv[1:])' "$@" > "$_tmpout" 2>&1 &
  _bgpid=$!
  _pgid_ret=$_bgpid

  wait "$_bgpid" 2>/dev/null || true
  local _rc=$?

  # Kill any survivors in the process group (stray dev servers, file watchers, etc.)
  if [[ -n "$_pgid_ret" ]] && pgrep -g "$_pgid_ret" &>/dev/null 2>/dev/null; then
    log "CLEANUP stray processes in PGID ${_pgid_ret} (dev servers, watchers) — terminating"
    kill -TERM -"$_pgid_ret" 2>/dev/null || true
    sleep 1
    kill -KILL -"$_pgid_ret" 2>/dev/null || true
  fi

  cat "$_tmpout"
  rm -f "$_tmpout"
  return $_rc
}

# ── Claude stream formatter ───────────────────────────────────────────────────
# Reads stream-json NDJSON from stdin (claude --output-format stream-json),
# extracts assistant text + tool_use + tool_result events, outputs Markdown.
# Skips thinking blocks, system init, and duplicate final result events.

format_claude_stream() {
  jq -r '
    if .type == "assistant" then
      (.message.content // [])[] | (
        if .type == "text" and (.text | length) > 0 then
          "\n" + .text + "\n"
        elif .type == "tool_use" then
          if .name == "Bash" then
            "\n**Tool: Bash**\n\n```bash\n" + (.input.command // "") + "\n```\n"
          else
            "\n**Tool: " + .name + "**\n\n```json\n" + (.input | tojson) + "\n```\n"
          end
        else empty end
      )
    elif .type == "user" then
      (.message.content // [])[] | (
        if .type == "tool_result" then
          "\n**Result" + (if (.is_error // false) then " (error)" else "" end) + ":**\n\n```\n"
            + (if (.content | type) == "string" then .content
               else (.content // [] | map(.text // "") | join("\n")) end)
            + "\n```\n"
        else empty end
      )
    else empty end
  '
}

# ── Routine execution ─────────────────────────────────────────────────────────

run_routine() {
  local name="$1" model="$2" permission_mode="$3"
  local now exit_code=0
  local -a perm_args

  case "$permission_mode" in
    bypassPermissions)
      perm_args=(--permission-mode bypassPermissions)
      ;;
    acceptEdits)
      perm_args=(--permission-mode acceptEdits)
      ;;
    *)
      perm_args=(--permission-mode "$permission_mode")
      ;;
  esac

  if [[ "$name" == "fix-issues" ]] && command -v gh &>/dev/null; then
    # Flush any webapp-approved issues to GitHub labels before checking the count,
    # otherwise issues approved via the web UI won't have the label yet and get skipped.
    apply_pending_statuses
    local approved_count
    approved_count=$(gh issue list --state open --label "status:approved" \
                       --json number --jq 'length' 2>/dev/null || echo "")
    if [[ "$approved_count" == "0" ]]; then
      log "SKIP   ${name} — no open status:approved issues"
      local skip_now skip_ts
      skip_now=$(now_epoch)
      write_state "$name" "$(( skip_now - skip_now % 60 ))"
      skip_ts=$(date -u +%FT%TZ)
      PENDING_LOGS+=("{\"routine\":\"${name}\",\"summary\":\"skipped fix-issues — no approved issues\",\"timestamp\":\"${skip_ts}\"}")
      return 0
    fi
  fi

  if ! semaphore_acquire; then
    local _max_slots; _max_slots=$(darkflow_val "max_concurrent" "3")
    log "DEFER  ${name} — all ${_max_slots} global slots busy, will retry next cycle"
    return 0
  fi

  log "START  ${name} (model=${model}, perm=${permission_mode})"

  send_heartbeat "running" "$name"
  start_heartbeat_loop "$name"

  local claude_output _stream_file
  _stream_file=$(mktemp)
  run_in_pgid claude -p "/darkflow:${name}" --model "${model}" "${perm_args[@]}" \
    --output-format stream-json --verbose > "$_stream_file" || exit_code=$?
  claude_output=$(format_claude_stream < "$_stream_file")
  rm -f "$_stream_file"
  semaphore_release

  stop_heartbeat_loop
  send_heartbeat "idle"

  now=$(now_epoch)
  write_state "$name" "$(( now - now % 60 ))"

  local status_str="ok"
  [[ "$exit_code" != "0" ]] && status_str="exit:${exit_code}"
  log "DONE   ${name} (${status_str})"
  local ts; ts=$(date -u +%FT%TZ)
  local output_json
  output_json=$(jq -Rsa '.' <<< "$claude_output")
  PENDING_LOGS+=("{\"routine\":\"${name}\",\"summary\":\"ran ${name} — ${status_str}\",\"output\":${output_json},\"timestamp\":\"${ts}\"}")

  return $exit_code
}

# ── Apply pending status changes ──────────────────────────────────────────────
# Pulls pending approve/reject decisions from the web UI and applies them to
# GitHub via `gh issue edit`. Runs right before sync_webapp so the subsequent
# `gh issue list` reflects the new labels and ingest can clear pendingStatus.

STATUS_LABELS_ALL=(status:proposed status:approved status:rejected status:needs-info status:in-progress status:blocked)

# ── GitHub auth guard ─────────────────────────────────────────────────────────
# Returns 0 if gh is authenticated, 1 otherwise (with a log entry).
check_gh_auth() {
  local err status
  err=$(gh auth status 2>&1)
  status=$?
  if [ $status -ne 0 ]; then
    # gh auth status can exit non-zero when GH_TOKEN has issues but a local
    # account is still active — treat "Active account: true" as authenticated.
    echo "$err" | grep -q "Active account: true" && return 0
    log "GH_AUTH gh not authenticated — run 'gh auth login'. Details: $(echo "$err" | head -3 | tr '\n' ' ')"
    return 1
  fi
  return 0
}

# ── Auto-revive stuck in-progress issues ──────────────────────────────────────
# If an issue has been in status:in-progress for >1h (per updatedAt), treat it
# as crashed/stalled, drop status:in-progress and set status:approved so the
# next fix-issues run will pick it up again. Reuses the issues_json already
# fetched by sync_webapp to avoid an extra `gh issue list` call.

STUCK_IN_PROGRESS_THRESHOLD=3600

revive_stuck_issues() {
  local issues_json="$1"
  [[ -z "$issues_json" ]] && return 0
  ! command -v gh &>/dev/null && return 0
  ! command -v jq &>/dev/null && return 0

  local now_secs threshold_iso
  now_secs=$(now_epoch)
  threshold_iso=$(epoch_fmt $(( now_secs - STUCK_IN_PROGRESS_THRESHOLD )) "%Y-%m-%dT%H:%M:%SZ" 2>/dev/null) || threshold_iso=""
  [[ -z "$threshold_iso" ]] && return 0

  local stuck
  stuck=$(echo "$issues_json" | jq -r --arg cutoff "$threshold_iso" '
    .[] | select(.state == "OPEN")
        | select(any(.labels[]; .name == "status:in-progress"))
        | select(.updatedAt < $cutoff)
        | .number
  ' 2>/dev/null) || return 0
  [[ -z "$stuck" ]] && return 0

  local num gh_err
  while IFS= read -r num; do
    [[ -z "$num" ]] && continue
    if gh_err=$(gh issue edit "$num" \
         --remove-label "status:in-progress" \
         --add-label "status:approved" 2>&1 >/dev/null); then
      log "REVIVE #${num} stuck >1h in-progress → approved"
    else
      log "REVIVE #${num} failed to relabel: $(echo "$gh_err" | head -2 | tr '\n' ' ')"
    fi
  done <<< "$stuck"
}

close_rejected_issues() {
  local issues_json="$1"
  [[ -z "$issues_json" ]] && return 0
  ! command -v gh &>/dev/null && return 0
  ! command -v jq &>/dev/null && return 0

  local rejected
  rejected=$(echo "$issues_json" | jq -r '
    .[] | select(.state == "OPEN")
        | select(any(.labels[]; .name == "status:rejected"))
        | .number
  ' 2>/dev/null) || return 0
  [[ -z "$rejected" ]] && return 0

  local num
  while IFS= read -r num; do
    [[ -z "$num" ]] && continue
    gh issue close "$num" >/dev/null 2>&1 && log "CLOSE #${num} closed (status:rejected)"
  done <<< "$rejected"
}

apply_pending_statuses() {
  local webapp_url repo_url pending_json count
  webapp_url=$(darkflow_val "webapp_url" "")
  [[ -z "$webapp_url" ]] && return 0
  ! command -v gh   &>/dev/null && return 0
  ! command -v jq   &>/dev/null && return 0
  ! command -v curl &>/dev/null && return 0

  check_gh_auth || return 0

  local gh_err
  repo_url=$(gh repo view --json url -q .url 2>/dev/null) || {
    gh_err=$(gh repo view --json url -q .url 2>&1 || true)
    log "PENDING skipped (gh repo view failed: $(echo "$gh_err" | head -2 | tr '\n' ' '))"
    return 0
  }
  [[ -z "$repo_url" ]] && return 0

  pending_json=$(curl -fsS -m 10 -G \
    --data-urlencode "repoUrl=${repo_url}" \
    "${webapp_url}/api/pending-status" 2>/dev/null) || return 0

  count=$(echo "$pending_json" | jq '.pending | length' 2>/dev/null || echo 0)
  [[ "$count" == "0" || -z "$count" ]] && return 0

  log "PENDING applying ${count} status change(s)"

  local remove_args=()
  local lbl
  for lbl in "${STATUS_LABELS_ALL[@]}"; do
    remove_args+=(--remove-label "$lbl")
  done

  local i num target
  for ((i=0; i<count; i++)); do
    num=$(echo "$pending_json" | jq -r ".pending[$i].number")
    target=$(echo "$pending_json" | jq -r ".pending[$i].pendingStatus")
    [[ -z "$num" || -z "$target" || "$target" == "null" ]] && continue
    if [[ "$target" == "closed" ]]; then
      gh issue edit "$num" "${remove_args[@]}" --remove-label "needs-human" >/dev/null 2>&1 || true
      gh issue close "$num" >/dev/null 2>&1 && log "PENDING #${num} closed (needs-human resolved)" || \
        log "PENDING #${num} failed to close"
    elif gh_err=$(gh issue edit "$num" "${remove_args[@]}" --add-label "status:${target}" 2>&1 >/dev/null); then
      log "PENDING #${num} → status:${target}"
      if [[ "$target" == "rejected" ]]; then
        gh issue close "$num" >/dev/null 2>&1 && log "PENDING #${num} closed (rejected)"
      fi
    else
      log "PENDING #${num} failed to apply status:${target}: $(echo "$gh_err" | head -2 | tr '\n' ' ')"
    fi
  done
}

# ── Webapp sync ───────────────────────────────────────────────────────────────
# Called after any routine actually ran. POSTs issue data and project metadata
# to the Dark Flow webapp API (/api/ingest) using the webapp_url from .darkflow.

sync_webapp() {
  local webapp_url
  webapp_url=$(darkflow_val "webapp_url" "")
  if [[ -z "$webapp_url" ]]; then
    log "WEBAPP skipped (webapp_url not set in .darkflow)"
    PENDING_LOGS=()
    return 0
  fi

  if ! command -v gh &>/dev/null || ! command -v jq &>/dev/null || ! command -v curl &>/dev/null; then
    log "WEBAPP skipped (gh, jq, or curl missing)"
    PENDING_LOGS=()
    return 0
  fi

  if ! check_gh_auth; then
    PENDING_LOGS=()
    return 0
  fi

  apply_pending_statuses

  local repo_url issues now_iso gh_err
  repo_url=$(gh repo view --json url -q .url 2>/dev/null) || {
    gh_err=$(gh repo view --json url -q .url 2>&1 || true)
    log "WEBAPP skipped (gh repo view failed: $(echo "$gh_err" | head -2 | tr '\n' ' '))"
    PENDING_LOGS=()
    return 0
  }
  if [[ -z "$repo_url" ]]; then
    log "WEBAPP skipped (could not determine repo URL)"
    PENDING_LOGS=()
    return 0
  fi

  issues=$(gh issue list --state all --json number,title,body,state,labels,url,updatedAt --limit 300 2>/dev/null) || {
    gh_err=$(gh issue list --state all --json number,title,body,state,labels,url,updatedAt --limit 300 2>&1 || true)
    log "WEBAPP skipped (gh issue list failed: $(echo "$gh_err" | head -2 | tr '\n' ' '))"
    PENDING_LOGS=()
    return 0
  }

  revive_stuck_issues "$issues"
  close_rejected_issues "$issues"

  now_iso=$(date -u +%FT%TZ)

  # Parse each issue's labels into structured fields
  local issues_json
  issues_json=$(printf '%s\n' "$issues" | jq '
    def label_prefix(p): [.labels[].name | select(startswith(p)) | ltrimstr(p)][0] // null;
    def has_label(n): [.labels[].name] | index(n) != null;
    map({
      number,
      title,
      body,
      state,
      url,
      status:     (label_prefix("status:")   // "none"),
      priority:   label_prefix("priority:"),
      source:     label_prefix("source:"),
      needsHuman: has_label("needs-human")
    })
  ') || { log "WEBAPP skipped (jq parse error)"; PENDING_LOGS=(); return 0; }

  # Read project metadata from .darkflow
  local proj_name proj_branch proj_lang proj_merge proj_modules proj_version
  proj_name=$(darkflow_val "name" "$(basename "$PROJECT_ROOT")")
  proj_branch=$(darkflow_val "branch" "main")
  proj_lang=$(darkflow_val "language" "English")
  proj_merge=$(darkflow_val "merge_strategy" "pr")
  proj_modules=$(darkflow_val "modules" "")
  proj_version=$(darkflow_val "version" "")

  # Build modules JSON array (comma-separated string → JSON array)
  local modules_json
  modules_json=$(echo "$proj_modules" | jq -Rc 'split(",") | map(select(length > 0))')

  # Build optional sections from metrics files
  local analytics_json="null" security_json="null" architecture_json="null"
  [[ -f "${METRICS_DIR}/analytics.json" ]]     && analytics_json=$(cat "${METRICS_DIR}/analytics.json")
  [[ -f "${METRICS_DIR}/security.json" ]]      && security_json=$(cat "${METRICS_DIR}/security.json")
  [[ -f "${METRICS_DIR}/architecture.json" ]]  && architecture_json=$(cat "${METRICS_DIR}/architecture.json")

  # Read attention items from .darkflow.d/attention.json (written by routines/scripts)
  local alerts_json="[]"
  if [[ -f "${DARKFLOW_D}/attention.json" ]]; then
    alerts_json=$(jq -c '.' "${DARKFLOW_D}/attention.json" 2>/dev/null || echo "[]")
  fi

  # Build logs JSON array from accumulated PENDING_LOGS
  local logs_json="[]"
  if [[ "${#PENDING_LOGS[@]}" -gt 0 ]]; then
    logs_json=$(printf '%s\n' "${PENDING_LOGS[@]}" | jq -sc '.')
  fi

  # Parse routines.yml into a JSON array snapshot
  local routines_json="[]"
  if [[ -f "$YAML" ]]; then
    routines_json=$(yq -o=json '.routines | to_entries | map({"name": .key, "cron": .value.cron, "model": .value.model, "enabled": (.value.enabled // true), "permissionMode": .value.permission_mode})' "$YAML" 2>/dev/null | jq -c '.' 2>/dev/null || echo "[]")
  fi

  # Last 50 commits via git log; tab-separated to dodge quoting issues in messages.
  local commits_json="[]"
  if command -v git &>/dev/null && git rev-parse --git-dir &>/dev/null; then
    local commit_base="${repo_url%.git}"
    commits_json=$(git log -n 50 --pretty=format:'%H%x09%cI%x09%an%x09%ae%x09%s' 2>/dev/null \
      | jq -Rsc --arg base "$commit_base" '
          split("\n") | map(select(length > 0))
          | map(split("\t") | {
              sha:         .[0],
              committedAt: .[1],
              author:      .[2],
              email:       .[3],
              message:     .[4],
              url:         ($base + "/commit/" + .[0])
            })
        ' 2>/dev/null) || commits_json="[]"
    [[ -z "$commits_json" ]] && commits_json="[]"
  fi

  # Assemble payload
  local payload
  payload=$(jq -n \
    --arg repoUrl    "$repo_url" \
    --arg name       "$proj_name" \
    --arg branch     "$proj_branch" \
    --arg language   "$proj_lang" \
    --arg merge      "$proj_merge" \
    --arg version    "$proj_version" \
    --argjson modules    "$modules_json" \
    --argjson issues     "$issues_json" \
    --argjson analytics  "$analytics_json" \
    --argjson security   "$security_json" \
    --argjson architecture "$architecture_json" \
    --argjson logs       "$logs_json" \
    --argjson routines   "$routines_json" \
    --argjson commits    "$commits_json" \
    --argjson alerts     "$alerts_json" \
    '{
      repoUrl:          $repoUrl,
      name:             $name,
      branch:           $branch,
      language:         $language,
      mergeStrategy:    $merge,
      modules:          $modules,
      darkflowVersion:  $version,
      issues:           $issues,
      logs:             $logs,
      routines:         $routines,
      commits:          $commits,
      alerts:           $alerts
    }
    | if $analytics   != null then . + {analytics: $analytics}     else . end
    | if $security    != null then . + {security: $security}        else . end
    | if $architecture != null then . + {architecture: $architecture} else . end
    ') || { log "WEBAPP skipped (payload build error)"; PENDING_LOGS=(); return 0; }

  local http_code
  http_code=$(curl -fsS -o /dev/null -w "%{http_code}" \
    -X POST "${webapp_url}/api/ingest" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null) || true

  if [[ "$http_code" =~ ^2 ]]; then
    log "WEBAPP synced (HTTP ${http_code})"
  else
    log "WEBAPP sync failed (HTTP ${http_code:-000})"
  fi

  PENDING_LOGS=()
}

# ── Worker heartbeat ──────────────────────────────────────────────────────────
# Sends lightweight status pings to /api/worker/heartbeat so the web UI shows
# which projects have an active worker and what routine is running.
# The watch loop sends "idle" every 30 s even when no routine runs.

_REPO_URL_CACHE=""

_get_repo_url_cached() {
  if [[ -z "$_REPO_URL_CACHE" ]]; then
    _REPO_URL_CACHE=$(gh repo view --json url -q .url 2>/dev/null || echo "")
  fi
  echo "$_REPO_URL_CACHE"
}

send_heartbeat() {
  local status="$1" routine="${2:-}"
  local webapp_url
  webapp_url=$(darkflow_val "webapp_url" "")
  [[ -z "$webapp_url" ]] && return 0
  ! command -v curl &>/dev/null && return 0
  ! command -v gh   &>/dev/null && return 0

  local repo_url
  repo_url=$(_get_repo_url_cached)
  [[ -z "$repo_url" ]] && return 0

  local proj_name proj_hb_version routine_field="null"
  proj_name=$(darkflow_val "name" "$(basename "$PROJECT_ROOT")")
  proj_hb_version=$(darkflow_val "version" "")
  [[ -n "$routine" ]] && routine_field="\"${routine}\""

  curl -fsS -o /dev/null -m 5 \
    -X POST "${webapp_url}/api/worker/heartbeat" \
    -H "Content-Type: application/json" \
    -d "{\"repoUrl\":\"${repo_url}\",\"status\":\"${status}\",\"routine\":${routine_field},\"name\":\"${proj_name}\",\"darkflowVersion\":\"${proj_hb_version}\"}" \
    2>/dev/null || true
}

HEARTBEAT_PID=""

start_heartbeat_loop() {
  local routine="$1"
  (
    # Ignore INT so Ctrl-C during a dispatch doesn't kill the heartbeat;
    # TERM stays catchable so stop_heartbeat_loop can reap it cleanly.
    trap '' INT
    while true; do
      sleep 30
      send_heartbeat "running" "$routine"
    done
  ) &
  HEARTBEAT_PID=$!
}

stop_heartbeat_loop() {
  if [[ -n "${HEARTBEAT_PID:-}" ]]; then
    kill -TERM "$HEARTBEAT_PID" 2>/dev/null || true
    # Belt-and-suspenders: if it's wedged, SIGKILL can't be trapped/ignored.
    kill -KILL "$HEARTBEAT_PID" 2>/dev/null || true
    wait "$HEARTBEAT_PID" 2>/dev/null || true
    HEARTBEAT_PID=""
  fi
}

# ── Self-update check ─────────────────────────────────────────────────────────
# Fetches the latest Dark Flow VERSION from GitHub; if it differs from the
# installed version, triggers /darkflow:self-update via Claude.
# Throttled to at most once per minute via STATE_DIR/last-update-check.
# Returns 0 always (update failure should never abort the caller).

check_for_update() {
  ! command -v curl   &>/dev/null && return 0
  ! command -v claude &>/dev/null && return 0

  local check_ts_file="${STATE_DIR}/last-update-check"
  local last_check=0
  [[ -f "$check_ts_file" ]] && last_check=$(cat "$check_ts_file" 2>/dev/null || echo 0)
  local now_ts; now_ts=$(now_epoch)
  if (( now_ts - last_check < 60 )); then
    return 0
  fi
  echo "$now_ts" > "$check_ts_file"

  local installed_version latest
  installed_version=$(darkflow_val "version" "0.0.0")
  [[ -z "$installed_version" ]] && installed_version="0.0.0"

  latest=$(curl -fsSL -m 5 "${DARKFLOW_REPO}/VERSION" 2>/dev/null | tr -d '[:space:]') || latest=""
  [[ -z "$latest" ]] && return 0   # no network or fetch failed — skip silently

  [[ "$latest" == "$installed_version" ]] && return 0

  log "UPDATE detected ${installed_version} → ${latest}, running /darkflow:self-update"

  local ts; ts=$(date -u +%FT%TZ)
  local claude_output exit_code=0
  # Fallback: if the slash command isn't installed yet (pre-2.20.0 projects),
  # run the installer directly instead of failing with "Unknown command".
  if [[ -f ".claude/commands/darkflow/self-update.md" ]]; then
    local _su_stream
    _su_stream=$(mktemp)
    run_in_pgid claude -p "/darkflow:self-update" --model sonnet --permission-mode bypassPermissions \
      --output-format stream-json --verbose > "$_su_stream" || exit_code=$?
    claude_output=$(format_claude_stream < "$_su_stream")
    rm -f "$_su_stream"
  else
    log "UPDATE self-update.md not found, running installer directly"
    claude_output=$(bash <(curl -fsSL -m 30 "${DARKFLOW_REPO}/install.sh") --force --yes 2>&1) || exit_code=$?
  fi

  local status_str="ok"
  [[ "$exit_code" != "0" ]] && status_str="exit:${exit_code}"
  local output_json
  output_json=$(jq -Rsa '.' <<< "$claude_output")
  PENDING_LOGS+=("{\"routine\":\"self-update\",\"summary\":\"self-update ${installed_version}→${latest} — ${status_str}\",\"output\":${output_json},\"timestamp\":\"${ts}\"}")

  if [[ "$exit_code" == "0" ]]; then
    log "UPDATE complete (now at ${latest})"
  else
    log "UPDATE failed (exit ${exit_code})"
  fi
  return 0
}

# ── Mode: list ────────────────────────────────────────────────────────────────

mode_list() {
  local name cron enabled last_run last_str
  printf "%-25s %-20s %-9s %s\n" "ROUTINE" "CRON" "ENABLED" "LAST RUN"
  printf "%-25s %-20s %-9s %s\n" "-------" "----" "-------" "--------"
  while IFS= read -r name; do
    cron=$(yaml_get ".routines[\"${name}\"].cron" "$YAML" "")
    enabled=$(yaml_get ".routines[\"${name}\"].enabled" "$YAML" "true")
    last_run=$(read_state "$name")
    if [[ "$last_run" == "0" ]]; then
      last_str="never"
    else
      last_str=$(epoch_fmt "$last_run")
    fi
    printf "%-25s %-20s %-9s %s\n" "$name" "${cron:-(none)}" "$enabled" "$last_str"
  done < <(routine_names)
}

# ── Mode: dispatch ────────────────────────────────────────────────────────────

mode_dispatch() {
  local dry_run="${1:-false}"
  local now name cron enabled model permission_mode last_run floor prev
  local default_model default_perm

  now=$(now_epoch)
  default_model=$(yaml_get '.defaults.model' "$YAML" "sonnet")
  default_perm=$(yaml_get '.defaults.permission_mode' "$YAML" "bypassPermissions")

  rotate_log

  local any_due=false
  while IFS= read -r name; do
    cron=$(yaml_get ".routines[\"${name}\"].cron" "$YAML" "")
    enabled=$(yaml_get ".routines[\"${name}\"].enabled" "$YAML" "true")

    if [[ "$enabled" != "true" || -z "$cron" ]]; then
      continue
    fi

    model=$(yaml_get ".routines[\"${name}\"].model" "$YAML" "$default_model")
    permission_mode=$(yaml_get ".routines[\"${name}\"].permission_mode" "$YAML" "$default_perm")

    # Parse 5 cron fields
    read -r c_min c_hr c_dom c_month c_dow <<< "$cron"

    last_run=$(read_state "$name")

    # Search floor: on first install (last_run=0) look back 25h; else from last_run
    if [[ "$last_run" == "0" ]]; then
      floor=$(( now - 90000 ))
    else
      floor=$last_run
    fi

    prev=$(prev_fire "$c_min" "$c_hr" "$c_dom" "$c_month" "$c_dow" "$floor")

    if [[ "$prev" == "0" || "$prev" -le "$last_run" ]]; then
      continue
    fi

    any_due=true

    if [[ "$dry_run" == true ]]; then
      echo "  [due] ${name}  cron='${cron}'  model=${model}"
    else
      run_routine "$name" "$model" "$permission_mode" || true
    fi

  done < <(routine_names)

  if [[ "$dry_run" == true && "$any_due" == false ]]; then
    echo "  No routines are due at this time."
  fi
}

# ── Mode: manual ──────────────────────────────────────────────────────────────

mode_manual() {
  local name="$1"
  local model permission_mode default_model default_perm

  if ! yq ".routines | has(\"${name}\")" "$YAML" 2>/dev/null | grep -q "true"; then
    echo "darkflow-run: unknown routine '${name}'" >&2
    echo "Known routines: $(routine_names | tr '\n' ' ')" >&2
    exit 1
  fi

  default_model=$(yaml_get '.defaults.model' "$YAML" "sonnet")
  default_perm=$(yaml_get '.defaults.permission_mode' "$YAML" "bypassPermissions")
  model=$(yaml_get ".routines[\"${name}\"].model" "$YAML" "$default_model")
  permission_mode=$(yaml_get ".routines[\"${name}\"].permission_mode" "$YAML" "$default_perm")

  log "MANUAL ${name}"
  run_routine "$name" "$model" "$permission_mode"
  sync_webapp
}

# ── Mode: watch ───────────────────────────────────────────────────────────────

mode_watch() {
  local interval=30
  local tick=0
  local consecutive_skips=0

  log "Dark Flow started (tick every ${interval}s). Ctrl-C to stop."
  trap 'echo ""; log "WATCH  stopped (signal)"; stop_heartbeat_loop; exit 0' INT TERM

  # Check for update at startup; exec self if a new version was installed.
  local _watch_pre_ver; _watch_pre_ver=$(darkflow_val "version" "0.0.0")
  check_for_update
  if [[ "$(darkflow_val "version" "0.0.0")" != "$_watch_pre_ver" ]]; then
    log "UPDATE reloading dispatcher"
    exec "${BASH_SOURCE[0]}"
  fi

  while true; do
    (( tick++ )) || true
    log "WATCH  tick ${tick}"
    send_heartbeat "idle"

    if try_acquire_lock; then
      consecutive_skips=0
      mode_dispatch false || log "WATCH  dispatch error (tick ${tick})"
      # Full web UI sync (GitHub issues + metadata) every 10th tick (~5 min).
      # The heartbeat above keeps the worker-alive signal fresh every 30 s.
      if (( tick % 10 == 1 )); then
        sync_webapp
      fi
      # Check for update every 30 ticks (~15 min); reload if new version installed.
      if (( tick % 30 == 0 )); then
        local _tick_pre_ver; _tick_pre_ver=$(darkflow_val "version" "0.0.0")
        check_for_update
        if [[ "$(darkflow_val "version" "0.0.0")" != "$_tick_pre_ver" ]]; then
          log "UPDATE reloading dispatcher"
          release_lock
          exec "${BASH_SOURCE[0]}"
        fi
      fi
      release_lock
    else
      (( consecutive_skips++ )) || true
      local owner_pid=""
      [[ -f "$LOCK_DIR/pid" ]] && owner_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")
      if (( consecutive_skips >= 5 )); then
        log "WATCH  WARN skipped tick ${tick} (${consecutive_skips} skips in a row, lock held by PID ${owner_pid:-unknown})"
      else
        log "WATCH  skipped tick ${tick} (another dispatch is running, PID ${owner_pid:-unknown})"
      fi
    fi

    sleep "$interval" || true   # || true so SIGINT from Ctrl-C doesn't exit with error
  done
}

# ── Mode: self-test ───────────────────────────────────────────────────────────

mode_self_test() {
  local failures=0
  local now; now=$(now_epoch)
  echo "Running cron-matcher self-tests..."

  # field match: wildcard
  cron_field_match "5" "*" || { echo "FAIL wildcard"; (( failures++ )) || true; }
  echo "  PASS  wildcard match"

  # field match: exact
  cron_field_match "0" "0" || { echo "FAIL exact 0"; (( failures++ )) || true; }
  echo "  PASS  exact match"

  # field match: list
  cron_field_match "0" "1,2,0" || { echo "FAIL list"; (( failures++ )) || true; }
  echo "  PASS  list match"

  # field match: list — negative
  cron_field_match "3" "1,2,0" && { echo "FAIL list-neg (should not match)"; (( failures++ )) || true; } || echo "  PASS  list no-match"

  # field match: range
  cron_field_match "3" "1-5" || { echo "FAIL range"; (( failures++ )) || true; }
  echo "  PASS  range match"

  # field match: step
  cron_field_match "5" "1-9/2" || { echo "FAIL step"; (( failures++ )) || true; }
  echo "  PASS  step match"

  # field match: step — negative
  cron_field_match "4" "1-9/2" && { echo "FAIL step-neg (should not match)"; (( failures++ )) || true; } || echo "  PASS  step no-match"

  # prev_fire: hourly — result must be the top of the current hour
  local top_of_hour=$(( now - now % 3600 ))
  local result; result=$(prev_fire "0" "*" "*" "*" "*" "$(( now - 90000 ))")
  if [[ "$result" == "$top_of_hour" ]]; then
    echo "  PASS  hourly prev_fire → $(epoch_fmt "$result" "%H:%M")"
  else
    echo "  FAIL  hourly: expected $(epoch_fmt "$top_of_hour" "%H:%M"), got $(epoch_fmt "$result" "%H:%M" 2>/dev/null || echo "$result")"
    (( failures++ )) || true
  fi

  # prev_fire: empty cron should not be called (guard: 0 floor always fails)
  result=$(prev_fire "0" "0" "*" "*" "*" "$(( now + 3600 ))")
  if [[ "$result" == "0" ]]; then
    echo "  PASS  unreachable floor → 0"
  else
    echo "  FAIL  expected 0, got $result"
    (( failures++ )) || true
  fi

  if [[ "$failures" == "0" ]]; then
    echo "All self-tests passed."
  else
    echo "${failures} test(s) failed."
    exit 1
  fi
}

# ── Mode: sync ────────────────────────────────────────────────────────────────
# Pushes current GitHub issues and project metadata to the web UI without
# running any routine. Useful right after install to populate the dashboard.

mode_sync() {
  if ! command -v gh &>/dev/null || ! command -v jq &>/dev/null || ! command -v curl &>/dev/null; then
    echo "darkflow-run: --sync requires gh, jq, and curl" >&2
    exit 1
  fi
  log "SYNC   manual web UI sync"
  send_heartbeat "idle"
  sync_webapp
  echo "Synced GitHub issues and project metadata to the web UI."
}

# ── Main ──────────────────────────────────────────────────────────────────────

mkdir -p "$STATE_DIR"

case "${1:-}" in
  --list)
    preflight || exit 1
    mode_list
    ;;
  --dry-run)
    preflight || exit 1
    acquire_lock
    mode_dispatch true
    ;;
  --self-test)
    mode_self_test
    ;;
  --sync)
    mode_sync
    ;;
  "")
    # Default: continuous loop, check every minute
    preflight || exit 1
    mode_watch 60
    ;;
  -*)
    echo "Usage: darkflow-run.sh [<routine-name> | --sync | --list | --dry-run | --self-test]" >&2
    exit 1
    ;;
  *)
    preflight || exit 1
    acquire_lock
    mode_manual "$1"
    ;;
esac
