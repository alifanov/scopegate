Check the project's IMAP inbox for new messages, create GitHub issues from them, and send approved email replies via SMTP.

## Step 1 — Read config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)
- `branch=` → main branch name
- `merge_strategy=` → `pr` or `direct`

Load mailbox credentials from `.env.darkflow`:
```bash
set -a; source .env.darkflow; set +a
```

If `MAILBOX_IMAP_HOST` is empty after sourcing — stop and print "mailbox not configured — add MAILBOX_* vars to .env.darkflow".

## Step 2 — Send approved replies

Find all open issues with labels `status:approved` + `source:mailbox` + `action:reply`:

```bash
gh issue list --state open \
  --label "status:approved" --label "source:mailbox" --label "action:reply" \
  --json number,title,body,comments \
  --limit 50
```

For each such issue:

1. Extract email metadata from the issue body (look for the structured block added in Step 4):
   - **To** — value of `From:` field in the issue body (reply goes back to the sender)
   - **Subject** — `Re: ` + original subject from `Subject:` field
   - **Message-ID** — value of `Message-ID:` field for threading

2. Check if there are any human comments on the issue. If yes — include them as the reply body context (the human may have added instructions or draft text). If not — write a polite, short acknowledgement in `language=` that the message was received and is being handled.

3. Write the reply body to a temp file:
   ```bash
   cat > /tmp/darkflow_reply_$number.txt << 'EOF'
   <reply text here>
   EOF
   ```

4. Send the reply:
   ```bash
   python3 .darkflow.d/mailbox/send.py \
     --to "<From address from issue>" \
     --subject "Re: <original subject>" \
     --in-reply-to "<message-id from issue>" \
     --body-file /tmp/darkflow_reply_$number.txt
   ```

5. If send succeeds: leave a comment on the issue ("Reply sent to <address>"), then close the issue:
   ```bash
   gh issue comment $number --body "Reply sent to <address>."
   gh issue close $number
   ```

6. If send fails: label the issue `status:blocked`, leave a comment with the error. Continue to the next issue.

## Step 3 — Fetch new mail

```bash
python3 .darkflow.d/mailbox/fetch.py
```

The script prints a JSON array of unseen messages to stdout. Each element:
```json
{ "uid": "123", "from": "...", "subject": "...", "date": "...", "message_id": "...", "body": "..." }
```

If the array is empty — skip to Step 5.

Capture the output and parse it. Process each message one by one in Step 4.

## Step 4 — Create GitHub issues

For each message from Step 3:

**Determine priority:**
- `priority:high` — subject or body contains urgency keywords: "broken", "ошибка", "не работает", "urgent", "critical", "срочно", "bug", "crash", "down"
- `priority:medium` — everything else (default)

**Create the issue:**

```bash
gh issue create \
  --title "<action-oriented title>" \
  --label "status:proposed,source:mailbox,priority:<high or medium>" \
  --body "$(cat << 'EOF'
## Incoming email

**From:** <from>
**Date:** <date>
**Subject:** <subject>
**Message-ID:** <message_id>

## Message

<body text — truncate to 3000 chars if longer, add "... [truncated]">

## What to do

Choose one action and add the label before approving:

- Add `action:reply` → mailbox-check will write and send an email reply on your behalf
- Add `action:fix` → fix-issues will treat this as a code/product task and open a PR

Then set `status:approved` to trigger the action.
EOF
)"
```

**Title format** — rewrite to be action-oriented in `language=`:
- For support requests: "Reply to <sender name>: <their subject>"
- For bug reports: "Fix: <what is broken> (reported by <sender name>)"
- For feature requests: "Evaluate: <request summary> (from <sender name>)"

**After successful `gh issue create`** — mark the message as Seen in the mailbox:
```bash
python3 .darkflow.d/mailbox/fetch.py --mark-seen <uid>
```

If `gh issue create` fails for a message — do NOT mark it as Seen (it will be re-fetched next run). Log the error and continue.

Language for all GitHub issues, comments, and reply emails: the `language=` value from `.darkflow`.
