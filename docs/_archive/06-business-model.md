# Stage 6: BUSINESS MODEL — Unit Economics & Revenue Design
# AI Access Proxy — Granular Permission Gateway for AI Agents
> Date: 2026-02-24
> Dependencies: Market (88/100), Competitors (51/100), Audience (85/100)

---

## 1. Pricing Tiers

### Pricing Philosophy

AI Access Proxy sits at the intersection of developer tooling and security infrastructure. The pricing strategy uses a **hybrid subscription + usage model** (adopted by 68% of top-performing SaaS in 2025-2026) with a generous free tier for PLG adoption, developer-friendly mid tiers, and value-based enterprise pricing anchored on compliance ROI. The open-core model means the self-hosted core is free; cloud convenience and enterprise features drive revenue.

### Tier Table

| | **Free** | **Pro / Developer** | **Team** | **Enterprise** |
|---|---|---|---|---|
| **Price** | $0/mo | $29/mo | $149/mo | Custom ($500–5,000+/mo) |
| **Target Persona** | Cautious Carlos (indie dev, hobbyist) | Cautious Carlos + Builder Ben (startup devs, freelancers) | Worried Wendy (eng managers, 5-50 person teams) | Pressured Pavel (CISO, 100+ person orgs) |
| **Connected Services** | 2 (e.g., Google Drive + Gmail) | 10 | 50 | Unlimited |
| **AI Agents** | 2 | 15 | 100 | Unlimited |
| **API Requests / mo** | 5,000 | 100,000 | 1,000,000 | Unlimited (fair use) |
| **MCP Endpoints** | 1 | 5 | 25 | Unlimited |
| **Audit Log Retention** | 7 days | 30 days | 90 days | 1 year+ (configurable) |
| **Per-Agent Scope Control** | Basic (read/write) | Granular (folder-level, field-level) | Granular + custom policies | Full ABAC/RBAC + custom policy engine |
| **Rate Limiting** | Fixed (100 req/min) | Configurable per agent | Configurable + alerts | Configurable + auto-throttle + webhooks |
| **Instant Revocation** | Yes | Yes | Yes + bulk revoke | Yes + emergency kill-switch |
| **Cross-Service Dashboard** | Basic | Full | Full + team views | Full + org-wide + CISO dashboard |
| **SSO / SCIM** | No | No | SAML SSO | SAML/OIDC SSO + SCIM |
| **Self-Hosted Option** | OSS core (limited) | No (cloud-only) | No (cloud-only) | Yes (full feature parity) |
| **Support** | Community (GitHub) | Email (48h SLA) | Priority email (24h SLA) | Dedicated Slack + SLA (4h) |
| **Compliance** | — | — | SOC 2 report access | SOC 2 + ISO 42001 + EU AI Act compliance pack |
| **Overage Pricing** | Hard cap | $3 per 10K extra requests | $2 per 10K extra requests | Negotiated |

### Pricing Rationale

- **Free tier** is deliberately constrained (2 services, 5,000 requests, 7-day logs) to give developers enough to prototype and validate, but not enough for production. Cost per free user estimated at $2-5/mo in infrastructure — sustainable with <5,000 free users. Industry data shows companies offering unlimited free MCP servers burned $50K-75K/mo; our limits prevent this.
- **Pro at $29/mo** is anchored below GitHub Copilot Business ($19/mo), WorkOS starter ($49/mo), and Arcade Growth ($25/mo). Sweet spot for indie devs with $100-500/mo tool budgets (Persona 1 WTP: $29-79/mo).
- **Team at $149/mo** captures the "engineering manager" buyer. Anchored against Auth0 ($35-240/mo) and WorkOS ($49-499/mo). Persona 2 WTP: $199-499/mo — we start at the lower end to reduce friction, with overage revenue providing expansion.
- **Enterprise at $500-5,000+/mo** reflects compliance premium. EU AI Act penalties up to 7% global revenue make $500-5,000/mo trivial. Persona 3 WTP: $999-5,000+/mo. Self-hosted option commands premium due to dedicated support/SLA.

---

## 2. Unit Economics

### 2.1 ARPU (Average Revenue Per User)

Assuming a steady-state tier distribution after 12 months of operation:

| Tier | % of Paying Users | Price | Weighted ARPU |
|---|---|---|---|
| Pro | 60% | $29 | $17.40 |
| Team | 30% | $149 | $44.70 |
| Enterprise | 10% | $1,500 (avg) | $150.00 |
| **Blended ARPU** | | | **$212.10/mo** |

Free users are excluded from ARPU calculation (they are the funnel). Free-to-paid conversion rate assumed at 5-8% (PLG benchmark for developer tools).

**Note:** If we include all users (free + paid) with a 6% conversion rate, effective ARPU across entire user base is ~$12.73/mo.

### 2.2 Gross Margin by Tier

| Cost Component | Free | Pro ($29) | Team ($149) | Enterprise ($1,500) |
|---|---|---|---|---|
| Cloud hosting (proxy server, compute) | $1.50 | $3.00 | $12.00 | $40.00 (cloud) / $0 (self-hosted) |
| OAuth token management & storage | $0.30 | $0.80 | $3.00 | $10.00 |
| Database (audit logs, configs) | $0.50 | $1.50 | $6.00 | $20.00 |
| API proxy bandwidth & processing | $0.50 | $2.00 | $10.00 | $50.00 |
| Stripe/payment processing (2.9%+$0.30) | $0 | $1.14 | $4.62 | $43.80 |
| SSL/security infrastructure | $0.20 | $0.20 | $0.50 | $2.00 |
| **Total COGS** | **$3.00** | **$8.64** | **$36.12** | **$165.80** |
| **Gross Profit** | **-$3.00** | **$20.36** | **$112.88** | **$1,334.20** |
| **Gross Margin** | **N/A (cost center)** | **70.2%** | **75.8%** | **88.9%** |

**Blended Gross Margin (paying users only): ~78%**

This aligns with AI-first B2B SaaS maturity targets of 60-70% gross margin, with our product performing better because we are a **proxy/middleware layer** (not running AI inference) — our compute costs scale linearly with API call volume, not with expensive GPU inference. The primary cost drivers are database storage (audit logs) and proxy compute, both of which are commodity resources.

### 2.3 Monthly Churn Rate Estimates

| Tier | Monthly Churn | Annual Churn | Rationale |
|---|---|---|---|
| Pro | 5.0% | 46% | Individual devs; low switching costs; typical for SMB SaaS ($3-5% benchmark). High because solo devs may abandon projects. |
| Team | 3.0% | 31% | Mid-market; moderate switching costs (team onboarding). B2B SaaS mid-market benchmark: 1.5-3%. |
| Enterprise | 1.5% | 17% | Annual contracts; high switching costs (compliance integration, self-hosted). Enterprise benchmark: 1-2%. |
| **Blended (weighted)** | **3.9%** | **38%** | Weighted by tier distribution (60/30/10) |

### 2.4 LTV Calculation

**LTV = ARPU x Gross Margin / Monthly Churn**

| Tier | ARPU | Gross Margin | Monthly Churn | LTV |
|---|---|---|---|---|
| Pro | $29 | 70.2% | 5.0% | **$407** |
| Team | $149 | 75.8% | 3.0% | **$3,764** |
| Enterprise | $1,500 | 88.9% | 1.5% | **$88,900** |
| **Blended** | **$212.10** | **78%** | **3.9%** | **$4,241** |

### 2.5 CAC Estimates by Channel

| Channel | CAC | Payback Period | Notes |
|---|---|---|---|
| **Organic / PLG (GitHub, MCP registries)** | $15–50 | <1 month | Open-source discovery → cloud conversion. Lowest CAC. Primary channel. |
| **Content Marketing (HN, Reddit, blog, SEO)** | $50–150 | 1–2 months | Security content gets high engagement. "MCP security" = growing search volume. |
| **Product Hunt / Show HN launch** | $5–20 | <1 month | One-time burst; developer tools consistently perform well. |
| **LinkedIn / Paid Social (Team tier)** | $200–400 | 2–3 months | Targeting eng managers and CISOs. Higher CAC but higher LTV. |
| **Enterprise outbound / conferences** | $1,000–3,000 | 2–3 months | Long sales cycle but $1,500+ ARPU justifies cost. Only after $10K MRR. |
| **Blended CAC (Year 1, PLG-heavy)** | **$80–150** | **~1 month** | 80% organic/content, 20% paid. |

### 2.6 LTV:CAC Ratio

| Tier | LTV | CAC | LTV:CAC | Assessment |
|---|---|---|---|---|
| Pro (organic) | $407 | $35 | **11.6x** | Excellent |
| Pro (content) | $407 | $100 | **4.1x** | Good |
| Team (content + social) | $3,764 | $300 | **12.5x** | Excellent |
| Enterprise (outbound) | $88,900 | $2,000 | **44.5x** | Exceptional |
| **Blended** | **$4,241** | **$120** | **35.3x** | **Exceptional** |

Industry benchmark for healthy SaaS: LTV:CAC > 3:1. Developer tools with PLG typically achieve 5-7:1. Our blended 35:1 is skewed by enterprise; excluding enterprise, blended Pro+Team is ~7:1 — solidly healthy.

**CAC Payback Period:** Blended ~1 month (vs. 6.8 month median for SaaS industry). This is the PLG advantage — most customers find the product through open-source / MCP registries, try the free tier, and self-convert.

---

## 3. Revenue Projections

### 3.1 Time to $1K MRR

**Target: Month 3-4 after launch**

| Month | Free Users | Paid Users | MRR | Milestone |
|---|---|---|---|---|
| 0 | Pre-launch | — | $0 | MVP development complete |
| 1 | 200 | 5 (Pro) | $145 | Launch on HN, Product Hunt, GitHub, MCP registries |
| 2 | 600 | 15 (12 Pro + 3 Team) | $795 | Content marketing cadence; word-of-mouth begins |
| 3 | 1,200 | 30 (22 Pro + 7 Team + 1 Enterprise) | **$2,181** | **$1K MRR crossed** |
| 4 | 2,000 | 50 (35 Pro + 12 Team + 3 Enterprise) | $6,303 | Product-market fit signals |

**Assumptions:** 5-6% free-to-paid conversion, HN/PH launch generates 500-1,000 signups in first week, MCP registry listing provides ongoing discovery.

### 3.2 Time to $10K MRR

**Target: Month 5-7 after launch**

| Month | Free Users | Paid Users | MRR | Key Drivers |
|---|---|---|---|---|
| 5 | 3,500 | 80 (50 Pro + 22 Team + 8 Enterprise) | $16,710 | EU AI Act urgency (Aug 2026 deadline) drives Team/Enterprise |
| 6 | 5,000 | 110 (65 Pro + 32 Team + 13 Enterprise) | $24,133 | **$10K MRR crossed Month 5** |
| 7 | 7,000 | 150 (85 Pro + 45 Team + 20 Enterprise) | $39,165 | Referral flywheel + integration partnerships |

**Key accelerator:** EU AI Act enforcement begins August 2026. If MVP launches by March-April 2026, the May-August window creates urgent demand from EU companies needing compliance tooling. This regulatory deadline could compress time-to-$10K-MRR significantly.

### 3.3 12-Month Revenue Trajectory

| Month | Free Users | Paying Customers | MRR | Cumulative Revenue |
|---|---|---|---|---|
| 1 | 200 | 5 | $145 | $145 |
| 2 | 600 | 15 | $795 | $940 |
| 3 | 1,200 | 30 | $2,181 | $3,121 |
| 4 | 2,000 | 50 | $6,303 | $9,424 |
| 5 | 3,500 | 80 | $16,710 | $26,134 |
| 6 | 5,000 | 110 | $24,133 | $50,267 |
| 7 | 7,000 | 150 | $39,165 | $89,432 |
| 8 | 9,000 | 190 | $49,810 | $139,242 |
| 9 | 11,000 | 230 | $58,470 | $197,712 |
| 10 | 13,000 | 270 | $67,530 | $265,242 |
| 11 | 15,000 | 310 | $76,190 | $341,432 |
| 12 | 18,000 | 360 | $87,240 | $428,672 |

**12-month projections:**
- **Conservative scenario:** $150K-250K cumulative revenue (slower adoption, no enterprise)
- **Base scenario:** $350K-430K cumulative revenue (above trajectory)
- **Optimistic scenario:** $500K-750K cumulative revenue (viral open-source + strong enterprise pull from EU AI Act)

**ARR at Month 12 (base): ~$1.05M** ($87K MRR x 12)

---

## 4. Cost Structure

### 4.1 Infrastructure Costs (Monthly)

| Component | Month 1-3 | Month 4-6 | Month 7-12 | Notes |
|---|---|---|---|---|
| **Proxy Server (compute)** | $20–50 | $100–300 | $500–2,000 | Start on Hetzner/DigitalOcean ($6-24/mo VPS); scale to multi-instance. Proxy is lightweight — Node.js/Go handles 10K+ concurrent connections on $50/mo VPS. |
| **Database (PostgreSQL)** | $15–30 | $50–100 | $200–500 | Managed PostgreSQL (Supabase $25/mo or Railway). Audit logs are write-heavy; archive to S3 after retention window. |
| **OAuth Token Storage (encrypted)** | $5–10 | $20–40 | $50–150 | Encrypted at rest in PostgreSQL + Redis for active sessions. Redis: $10-30/mo (Upstash or self-hosted). |
| **Redis (sessions, rate limiting)** | $0–10 | $10–25 | $25–75 | Upstash serverless Redis ($0 free tier, scales to $10-25). |
| **CDN / Static Assets** | $0 | $0–10 | $10–30 | Cloudflare (free tier sufficient for dashboard). |
| **Monitoring / Logging** | $0 | $20–50 | $50–150 | Grafana Cloud free tier → paid. BetterStack or similar. |
| **Backups / DR** | $5 | $10–20 | $20–50 | S3 backups ($0.023/GB). |
| **Total Infrastructure** | **$45–105** | **$210–545** | **$855–2,955** | |

### 4.2 Variable Costs Per Customer

| Customer Type | Monthly Variable Cost | Primary Drivers |
|---|---|---|
| Free user | $2–5 | Proxy compute, DB for audit logs, OAuth token refresh |
| Pro ($29) | $7–9 | Higher request volume, longer audit log retention |
| Team ($149) | $30–36 | Multi-user, higher request volume, SSO overhead |
| Enterprise ($1,500) | $120–170 | Dedicated resources, extended retention, support time |

**Key insight:** The product is a proxy layer (pass-through), not running AI inference. Variable costs scale with **API request volume**, not compute-intensive AI workloads. This gives dramatically better unit economics than AI-first products like GitHub Copilot (which lost $20/user initially due to inference costs).

### 4.3 Fixed Costs (Monthly)

| Component | Monthly Cost | Notes |
|---|---|---|
| Domain + DNS | $2 | Cloudflare ($0) + domain ($20/yr) |
| Stripe subscription | $0 (+ 2.9% + $0.30/txn) | No monthly fee; variable cost per transaction |
| Email (transactional) | $0–20 | Resend or Postmark (free tier → $20/mo) |
| Google OAuth API verification | $0 | One-time verification; no ongoing cost |
| GitHub (repo hosting) | $0 | Free for open-source |
| Legal / Privacy policy | $10–50 | Termly or similar ($10/mo); or one-time legal review |
| Error tracking (Sentry) | $0–26 | Free tier → Team ($26/mo) |
| **Total Fixed** | **$12–98/mo** | |

### 4.4 Consolidated Monthly Burn Rate

| Phase | Months | Total Monthly Cost | Revenue | Net Burn |
|---|---|---|---|---|
| Pre-launch (MVP) | 0–2 | $200–500 | $0 | -$200 to -$500 |
| Early (launch) | 3–4 | $300–700 | $145–$2,181 | -$555 to +$1,481 |
| Growth | 5–8 | $800–3,000 | $6,303–$49,810 | **Cash-flow positive** |
| Scale | 9–12 | $2,500–6,000 | $58,470–$87,240 | **Strongly profitable** |

**Breakeven: Month 3-4** (approximately 15-20 paying customers). This is extremely early for a SaaS — driven by low infrastructure costs and PLG-driven zero-CAC acquisition.

---

## 5. MVP Cost Estimate

### Build Scope (4-6 weeks for solo developer)

| Component | Effort | Stack | Cost |
|---|---|---|---|
| **OAuth integration layer** (Google Drive, Gmail, Calendar, Sheets) | 1 week | Node.js/Go + googleapis SDK | $0 (dev time) |
| **Permission engine** (per-agent scope definitions, RBAC) | 1 week | Custom + Cerbos-inspired policy model | $0 |
| **MCP endpoint generator** (creates proxy MCP server per agent) | 1 week | MCP SDK (TypeScript) | $0 |
| **Proxy layer** (intercepts, validates, logs, forwards API calls) | 1 week | HTTP proxy (Node.js/Go) | $0 |
| **Web dashboard** (connect services, manage agents, view logs) | 1-2 weeks | React/Next.js + Tailwind | $0 |
| **Audit trail** (structured logging of all agent actions) | 3 days | PostgreSQL + structured JSON logs | $0 |
| **Auth + billing** | 3 days | Clerk/Auth.js + Stripe | $0 |

### Monetary Costs to Launch

| Item | Cost | Notes |
|---|---|---|
| Domain name | $12–50 | .dev or .io domain |
| Cloud hosting (first 3 months) | $50–150 | Hetzner/DigitalOcean VPS |
| Managed database (first 3 months) | $0–75 | Supabase free tier or Railway |
| Google OAuth verification | $0 | Free but takes 2-4 weeks |
| Stripe setup | $0 | No upfront cost |
| SSL certificates | $0 | Let's Encrypt / Cloudflare |
| Logo / basic branding | $0–100 | Midjourney/DALL-E or Fiverr |
| Legal (privacy policy, ToS) | $0–200 | Templates or Termly |
| Product Hunt / launch prep | $0 | Sweat equity |
| **Total MVP Cost** | **$62–575** | |

### Opportunity Cost (Solo Developer Time)

| Metric | Value |
|---|---|
| Development time | 4-6 weeks full-time |
| Opportunity cost (at $100-150/hr) | $16,000–36,000 |
| **Total investment (cash + opportunity)** | **$16,062–$36,575** |

**Assessment:** Cash cost is well under $1,000 — dramatically below the $5-10K threshold. Even including opportunity cost, this is a reasonable investment for a solo founder with a 3-4 month breakeven horizon. The open-source ecosystem (MCP SDK, OAuth libraries, React, PostgreSQL) eliminates most build costs.

---

## 6. Solo-Operability Assessment

### Can One Person Run This?

| Dimension | Feasibility | Details |
|---|---|---|
| **Build MVP** | **HIGH** | 4-6 weeks. Node.js/Go + MCP SDK + OAuth + React dashboard. Well-documented APIs (Google, MCP). Solo devs have built similar proxy tools (MetaMCP, MCPJungle, HyprMCP). |
| **Operate infrastructure** | **HIGH** | Proxy layer is stateless (scales horizontally). Database is managed (Supabase/Railway). No ML models to train or GPUs to manage. Standard SaaS ops. |
| **Handle support** | **HIGH (early)** | Developer audience prefers docs + GitHub issues. Community support via Discord. Pro/Team support via email is manageable at <200 customers. |
| **Content marketing** | **HIGH** | MCP security is hot topic — blog posts, HN Show, Twitter threads. One person can sustain 2-4 posts/month. |
| **Sales** | **MEDIUM** | PLG handles Pro/Team (self-service). Enterprise requires sales calls — manageable at <20 enterprise clients but becomes bottleneck beyond that. |
| **Compliance (SOC 2)** | **LOW** | SOC 2 Type II requires 6-18 months and $50K-200K. Defer until enterprise revenue justifies cost ($50K+ ARR). Use Vanta/Drata to automate. |
| **Security maintenance** | **MEDIUM** | Security product must be secure. Requires ongoing dependency updates, vulnerability scanning, incident response. Manageable but high-stakes. |
| **Scale beyond $50K MRR** | **LOW-MEDIUM** | Beyond ~300 customers, support, security, and enterprise sales require hiring. Budget for first hire at $30K+ MRR. |

### Solo-Operability Verdict: **FEASIBLE through $30K MRR**

One person can realistically build, launch, and operate AI Access Proxy through the first $30K MRR (~150-200 customers). Key enablers:
- PLG eliminates need for sales team
- Developer audience prefers self-service
- Infrastructure is commodity (no GPUs, no ML)
- Open-core community provides free bug reports and contributions
- MCP registries provide built-in distribution (no ads needed)

**First hire trigger:** Enterprise sales volume (>10 enterprise prospects/month) or support volume (>50 tickets/week) or security incident requiring dedicated response. Expected around Month 6-8.

---

## 7. Scoring

### 7.1 Subscription Model — **82/100** (Weight: 15%)

| Factor | Score | Rationale |
|---|---|---|
| Pricing tier clarity | 90 | 4 clear tiers mapped to personas, anchored to competitor pricing |
| Free-to-paid conversion design | 80 | Generous free tier for PLG; clear upgrade triggers (limits, retention, SSO) |
| Upsell path | 85 | Pro→Team (more agents/services), Team→Enterprise (compliance, self-hosted) |
| Pricing anchoring | 80 | Below WorkOS ($49-499), below Arcade ($25 + overages), below enterprise tools ($500+) |
| Open-core monetization | 75 | Risk: OSS core may satisfy some users. Mitigation: audit logs, SSO, support as paid features |

**Rationale for 82:** Well-structured tiered pricing with clear upgrade paths and persona alignment. Hybrid subscription + usage model follows 2025-2026 best practices (68% of top SaaS use hybrid). Risk factor: open-core model may slow paid conversion — some developers will self-host forever. Mitigation is cloud-only features (managed OAuth tokens, hosted audit dashboard, SSO) that are genuinely difficult to self-manage.

### 7.2 Unit Economics — **85/100** (Weight: 30%)

| Factor | Score | Rationale |
|---|---|---|
| Gross margin | 92 | 78% blended — significantly above AI-first SaaS (50-60%) because no inference costs |
| LTV:CAC ratio | 90 | 7:1 (excluding enterprise) to 35:1 (blended) — well above 3:1 benchmark |
| Churn rates | 70 | 3.9% blended monthly churn is within norms but not exceptional. Low switching costs = higher churn risk. |
| CAC efficiency | 90 | PLG + open-source + MCP registries = near-zero CAC for majority of users |
| ARPU | 80 | $212 blended ARPU is healthy; enterprise tier lifts average significantly |

**Rationale for 85:** Exceptional unit economics for an AI-era product. The core insight is that AI Access Proxy is a **proxy/middleware** (not AI inference), so COGS are dominated by commodity cloud resources rather than expensive GPU compute. This gives 78% gross margins vs. 50-60% for typical AI-first SaaS. PLG-driven low CAC and strong LTV:CAC ratios. Main weakness is potentially high Pro-tier churn (individual devs are fickle). Enterprise tier provides LTV stability.

### 7.3 Scalability — **80/100** (Weight: 25%)

| Factor | Score | Rationale |
|---|---|---|
| Technical scalability | 90 | Stateless proxy — horizontally scalable. No GPU bottleneck. Standard load balancing. |
| Revenue scalability | 80 | Enterprise tier scales revenue per customer. But enterprise sales cycle limits velocity for solo founder. |
| Cost scalability | 85 | Variable costs are proportional (not exponential). No inference cost surprise. Bulk discounts on cloud compute. |
| Market scalability | 80 | MCP ecosystem growing 58x/year. New services (Slack, Jira, Notion) = new integration upsell. |
| Org scalability | 65 | Solo-operable through $30K MRR but enterprise tier requires sales/support hiring. Security product = high-stakes incidents. |

**Rationale for 80:** Technically very scalable — proxy architecture is one of the most scalable patterns in software. Revenue scales well through enterprise tier and usage overages. Main limitation is organizational — a security-critical product eventually needs a team for incident response, compliance, and enterprise sales. Not a concern for first $30K MRR, but caps solo-operator trajectory.

### 7.4 Time to Revenue — **88/100** (Weight: 15%)

| Factor | Score | Rationale |
|---|---|---|
| MVP build time | 92 | 4-6 weeks for solo dev. All components are well-documented (MCP SDK, Google OAuth, React). |
| Time to first dollar | 90 | Month 1-2 (launch → first Pro subscriber). PLG + free tier → conversion. |
| Time to $1K MRR | 88 | Month 3-4. HN/PH launch + MCP registry listing provides initial traffic. |
| Time to $10K MRR | 85 | Month 5-7. EU AI Act urgency accelerates Team/Enterprise adoption in May-Aug 2026. |
| Regulatory tailwind | 90 | EU AI Act August 2026 deadline creates time-bound demand spike. Perfect for Q2-Q3 2026 launch. |

**Rationale for 88:** Exceptionally fast time to revenue for a B2B SaaS. Enabled by: (1) low-cost MVP ($62-575 cash), (2) PLG distribution through MCP registries and GitHub, (3) EU AI Act deadline creating urgent demand in H1 2026, (4) hot topic = high engagement content marketing. The regulatory deadline is a unique accelerator — companies MUST have AI governance tooling by August 2026 or face 7% revenue penalties.

### 7.5 MVP Cost — **95/100** (Weight: 15%)

| Factor | Score | Rationale |
|---|---|---|
| Cash cost | 98 | $62-575 total. Well under $1K. Entire stack is open-source or free-tier. |
| Time cost | 88 | 4-6 weeks. Reasonable for solo founder. Shorter than most B2B SaaS MVPs. |
| Technical risk | 92 | All components proven (OAuth, MCP SDK, proxy patterns). No novel ML/AI required. |
| Iteration cost | 95 | Adding new services (Slack, Jira) = 2-3 days each. Low marginal cost for feature expansion. |

**Rationale for 95:** One of the cheapest MVPs in the entire pipeline. No AI inference costs, no training data, no specialized hardware. The entire product is middleware gluing together existing protocols (OAuth, MCP) with a permission layer and audit logging. All building blocks are open-source and well-documented. The only non-trivial time investment is the web dashboard, and even that uses commodity tools (Next.js + Tailwind).

---

## 8. Final Business Model Score

| Parameter | Score | Weight | Weighted |
|---|---|---|---|
| Subscription Model | 82 | 15% | 12.30 |
| Unit Economics | 85 | 30% | 25.50 |
| Scalability | 80 | 25% | 20.00 |
| Time to Revenue | 88 | 15% | 13.20 |
| MVP Cost | 95 | 15% | 14.25 |

**Total: 12.30 + 25.50 + 20.00 + 13.20 + 14.25 = 85.25**

### business_model_score = 85 / 100

---

## 9. Key Insights & Risks

### Strengths

1. **Proxy economics > AI economics.** Unlike GitHub Copilot (which lost $20/user on inference), AI Access Proxy is middleware with commodity cloud costs. 78% gross margins vs. 50-60% for AI-first products. This is a structural advantage that persists at scale.

2. **PLG + open-source = near-zero CAC.** MCP registries (5,800+ servers, 97M+ monthly SDK downloads) provide built-in distribution. GitHub open-core provides trust. Combined with HN/PH launches, majority of customers cost $15-50 to acquire vs. $1,200 SaaS industry average.

3. **Regulatory deadline = demand accelerator.** EU AI Act enforcement (August 2026) creates time-bound urgency. Companies MUST have AI audit trails and governance by August 2026. This compresses the typical "nice to have → must have" timeline from years to months.

4. **Ultra-low MVP cost.** Under $600 in cash, 4-6 weeks in time. Enables rapid iteration and pivot-if-wrong without significant financial risk. One of the lowest-cost MVPs possible for a B2B SaaS.

5. **Multi-tier revenue diversification.** Enterprise tier ($1,500/mo avg) provides LTV stability while Pro tier ($29/mo) provides volume. This mix reduces dependence on any single customer segment.

### Risks

1. **Open-core conversion challenge.** If the OSS core is "good enough" for most users, paid conversion may stall below 5%. Mitigation: Keep audit log retention, SSO, and team management as cloud-only premium features that are genuinely hard to self-host.

2. **Churn from low switching costs.** Proxy layers are relatively easy to swap. A competitor with deeper integrations or lower pricing could poach customers. Mitigation: Build sticky features (audit log history, compliance reports, integration depth) and pursue annual contracts for Team/Enterprise.

3. **Enterprise sales bottleneck for solo founder.** Enterprise deals ($1,500+/mo) require demos, security reviews, procurement cycles. At >10 enterprise prospects/month, this becomes a full-time job. Mitigation: Hire first sales/solutions engineer at $30K MRR.

4. **Security product liability.** A breach of the permission proxy itself would be catastrophic for reputation. Mitigation: Security-first engineering, regular pen testing, bug bounty program, and cyber liability insurance ($500-2,000/yr).

5. **Platform risk.** If Anthropic, OpenAI, or Google build native permission layers into their MCP implementations, the product's value proposition shrinks. Mitigation: Multi-protocol support (not MCP-only), deeper permission granularity than built-in solutions, and compliance features that platform providers won't build.

---

## Sources

### API Gateway & SaaS Pricing
- [DigitalAPI — API Management Cost Breakdown 2025](https://www.digitalapi.ai/blogs/api-management-cost)
- [Gravitee — Complete Guide to API Gateway Pricing](https://www.gravitee.io/api-gateway-pricing-guide)
- [AWS API Gateway Pricing](https://aws.amazon.com/api-gateway/pricing/)
- [Kong Gateway Pricing 2026](https://www.truefoundry.com/blog/kong-gateway-pricing-architecture-an-analysis-for-ai-teams-2026-edition)
- [Monetizely — SaaS Pricing Models 2025-2026](https://www.getmonetizely.com/blogs/complete-guide-to-saas-pricing-models-for-2025-2026)
- [Monetizely — 2026 Guide to Agentic Pricing Models](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)
- [Maxio — 2025 SaaS Pricing Trends Report](https://www.maxio.com/resources/2025-saas-pricing-trends-report)
- [Growth Unhinged — What Works in SaaS Pricing Right Now](https://www.growthunhinged.com/p/2025-state-of-saas-pricing-changes)

### Unit Economics & SaaS Benchmarks
- [Monetizely — Economics of AI-First B2B SaaS in 2026](https://www.getmonetizely.com/blogs/the-economics-of-ai-first-b2b-saas-in-2026)
- [Vena Solutions — 85 SaaS Statistics for 2026](https://www.venasolutions.com/blog/saas-statistics)
- [Proven SaaS — CAC Payback Benchmarks 2026](https://proven-saas.com/benchmarks/cac-payback-benchmarks)
- [High Alpha — 2025 SaaS Benchmarks Report](https://www.highalpha.com/saas-benchmarks)
- [ChartMogul — SaaS Growth Benchmarks](https://chartmogul.com/insights/)
- [RockingWeb — Complete SaaS Metrics Benchmark Report 2025](https://www.rockingweb.com.au/saas-metrics-benchmark-report-2025/)

### Churn Benchmarks
- [ChurnFree — B2B SaaS Churn Rate Benchmarks 2026](https://churnfree.com/blog/b2b-saas-churn-rate-benchmarks/)
- [MRRSaver — SaaS Churn Rate Benchmarks 2026](https://www.mrrsaver.com/blog/saas-churn-rate-benchmarks)
- [Vitally — B2B SaaS Churn Benchmarks 2025](https://www.vitally.io/post/saas-churn-benchmarks)
- [UserJot — SaaS Churn Rate Benchmarks 2026](https://userjot.com/blog/saas-churn-rate-benchmarks)

### CAC & PLG
- [Genesys Growth — Customer Acquisition Cost Benchmarks 2025](https://genesysgrowth.com/blog/customer-acquisition-cost-benchmarks-for-marketing-leaders)
- [Equanax — SaaS Growth Strategies 2025: PLG & CAC Efficiency](https://www.equanax.com/blog-1/saas-growth-strategies-2025-product-led-growth-amp-cac-efficiency)
- [Proven SaaS — SaaS CAC Benchmarks 2025](https://proven-saas.com/blog/saas-cac-benchmarks-2025)

### MCP Infrastructure Costs
- [Zeo — MCP Server Economics: TCO Analysis & ROI](https://zeo.org/resources/blog/mcp-server-economics-tco-analysis-business-models-roi)
- [Agent37 — MCP Hosting Complete Guide 2026](https://www.agent37.com/blog/mcp-hosting-complete-guide-to-hosting-mcp-servers)
- [MintMCP — Top MCP Gateways for Enterprise 2026](https://www.mintmcp.com/blog/enterprise-ai-infrastructure-mcp)
- [Ekamoira — Deploy MCP Servers to Production 2025](https://www.ekamoira.com/blog/mcp-servers-cloud-deployment-guide)

### Micro SaaS Pricing
- [Quick Market Pitch — Micro-SaaS News July 2025](https://quickmarketpitch.com/blogs/news/micro-saas-news)
- [Modall — SaaS Trends 2025-2026](https://modall.ca/blog/saas-trends)
- [Medium — Future of SaaS Pricing in 2026](https://medium.com/@aymane.bt/the-future-of-saas-pricing-in-2026-an-expert-guide-for-founders-and-leaders-a8d996892876)

### Cloud Hosting Costs
- [DigitalOcean Pricing](https://www.digitalocean.com/pricing)
- [Hostinger VPS Pricing](https://www.hostinger.com/pricing/vps-hosting)
- [HostAdvice — VPS Price Comparison Feb 2026](https://hostadvice.com/vps/vps-pricing/)
