# scopegate Docs

Documentation split into 5 layers, each with a different update frequency.

Agent rules "when to read / when to write" — in [`agent-workflow.md`](./agent-workflow.md).

## File manifest

| File | Purpose | Update frequency |
|---|---|---|
| **product/** | Business layer: what are we building and why | Quarterly |
| `product/product.md` | Product description, pain points, audience | Quarterly |
| `product/audience.md` | User segments | Quarterly |
| `product/use-cases.md` | Usage scenarios | Quarterly |
| `product/competitors.md` | Competitive landscape | Quarterly |
| `product/positioning.md` | Positioning, value prop | Quarterly |
| `product/pricing.md` | Pricing tiers, billing | As changed |
| `product/marketing.md` | Marketing channels and messages | Monthly |
| `product/metrics.md` | North star metrics, analytics events (**definitions**) | Monthly |
| `product/glossary.md` | Domain terms and entities | As changed |
| **spec/** | Product/UX layer: flows, screens, states | Weekly |
| `spec/flows/` | User flow descriptions (`TEMPLATE.md` inside) | Weekly |
| `spec/screens/inventory.md` | Screen inventory | Weekly |
| `spec/data-model.md` | Data model summary (from ORM schema) | Per migration |
| **design/** | Visual identity and voice | Situational |
| `design/components.md` | Component registry | Weekly |
| `design/patterns.md` | UI patterns and states (loading/empty/error) | Situational |
| `design/assets/` | Logos, illustrations, OG images | Situational |
| **insights/** | Data → observations (time-stamped snapshots) | Daily |
| `insights/analytics/` | Analytics / HogQL snapshots | Daily |
| `insights/search-console/` | Google Search Console snapshots | Per check |
| `insights/ads/` | Paid ads snapshots | Per check |
| `insights/qualitative/` | Interviews, feedback, session recordings | As received |
| **decisions/** | Accepted decisions (ADRs) | As made |
| `decisions/TEMPLATE.md` | ADR template (context → decision → verification) | — |
| **Process** | Agent and team working agreements | As changed |
| `github-issues.md` | GitHub Issues label taxonomy + agent triage loop | Quarterly |
| `.github/ISSUE_TEMPLATE/recommendation.yml` | Issue creation form | As changed |

## Reading order for newcomer / AI agent

1. `product/product.md` — what is this
2. `product/audience.md` + `product/use-cases.md` — who and why
3. `product/competitors.md` + `product/positioning.md` — what's different
4. `spec/data-model.md` + `spec/screens/inventory.md` — how it's built
5. `design/components.md` + `design/patterns.md` — how we build UI
6. `product/metrics.md` + last 2–3 files from `insights/analytics/` — what's working now
7. `decisions/` — what decisions have already been made
