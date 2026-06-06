An interactive grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates the project's documentation inline.

This command is **interactive** — it asks questions and waits for your answers. It does **not** create GitHub issues, snapshots, or run autonomously. Use it during planning/design, before writing code, to pressure-test a plan and keep `docs/` honest.

## Step 0 — Read project config

Run `bash .darkflow.d/get-config.sh` to refresh the local `.darkflow` cache, then read `.darkflow` and extract `language=` (default: English). Conduct the whole session in that language.

## The two documents this command maintains

**1. Glossary — `docs/product/glossary.md`**
The canonical list of domain terms. It is a glossary and **nothing else**: totally devoid of implementation details. Do not treat it as a spec, a scratch pad, or a place for implementation decisions.
- One opinionated term per concept. Definitions are 1–2 sentences stating what the thing *is*, not how it behaves or is used.
- Reject alternatives explicitly in the **Notes** column ("synonyms to avoid: …").
- Only include terms specific to *this* product's domain. Exclude general programming concepts (timeouts, error types, retries).

**2. ADRs — `docs/decisions/`**
Architecture Decision Records, using the format in `docs/decisions/TEMPLATE.md`. Numbered sequentially `NNNN-slug.md` (find the highest existing number and increment).
Create an ADR **only** when all three hold:
1. **Hard to reverse** — meaningful cost to changing direction later.
2. **Surprising without context** — a future reader will question the choice.
3. **A real trade-off** — multiple options existed and one was chosen deliberately.
Skip trivial, easily-reversible decisions. Most grilling sessions produce zero or one ADR — that's expected.

## How to grill

1. **One question at a time.** Ask a single question, wait for the answer, then continue. Never dump a list of questions.

2. **Explore the code before asking.** If a question can be answered by reading the codebase, read the codebase instead of asking the user.

3. **Challenge language against the glossary.** When the user's terminology conflicts with `docs/product/glossary.md`, call it out immediately — don't silently accept a synonym for an established term.

4. **Sharpen fuzzy terms.** When language is vague or overloaded, propose a precise canonical term and get agreement on it.

5. **Stress-test relationships with scenarios.** When domain relationships are discussed, probe them with concrete scenarios ("what happens if a user has two active subscriptions?") rather than accepting them abstractly.

6. **Cross-reference claims against code.** When the user states how something works, check whether the code actually agrees. Surface the discrepancy if it doesn't.

7. **Update docs inline, as you go.** The moment a term is resolved, write it into `docs/product/glossary.md` — don't batch it for the end. The moment a qualifying decision is made, create the ADR.

## What "done" looks like

- The plan has survived the questions, or been revised because of them.
- New/clarified domain terms are in `docs/product/glossary.md` (and any conflicting usage was reconciled).
- Any decision meeting the three ADR criteria is recorded in `docs/decisions/`.
- The glossary still contains zero implementation details.

Report a short summary at the end: terms added/changed, ADRs created (with numbers), and any open questions the user still needs to resolve.
