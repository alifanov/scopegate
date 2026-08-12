# Stage 3: COMPETITORS — Competitive Landscape
# AI Access Proxy — Permission Gateway for AI Agents
> Date: 2026-02-23

---

## 1. Direct Competitors (AI Agent Permission / MCP Gateway / Access Proxy)

### Core Competitor Table

| Competitor | Type | Funding | Pricing | Key Features | Target Audience | Key Weaknesses |
|---|---|---|---|---|---|---|
| **[Keycard Labs](https://www.keycard.ai/)** | AI agent identity & credential management | $38M ($8M seed + $30M Series A; a16z, Acrew Capital) | Not public (enterprise) | Ephemeral task-scoped credentials, cryptographic identity verification, tamper-proof audit logs, MCP/WIMSE/OAuth 2.1, SSO+SCIM+RBAC | Enterprise security teams | New (launched Oct 2025), no self-hosted option, no granular per-service scope control, enterprise-only pricing excludes SMBs/devs |
| **[Obot MCP Gateway](https://obot.ai/)** | Open-source enterprise MCP gateway | $35M Seed (Mayfield, Nexus) | Free OSS; Enterprise edition (custom) | MCP server hosting, registry, gateway routing, RBAC, credential management, composite MCP servers, Okta/Entra (enterprise) | Enterprise platform teams | Primarily MCP server management, not per-agent permission scoping; no consumer-grade UX; requires platform team to operate |
| **[LiteLLM Proxy](https://www.litellm.ai/)** | Open-core AI gateway with MCP support | ~$20M+ (est.) | Free OSS; Enterprise (contact sales) | MCP permission management by key/team/org, access groups, tool-level filtering, cost tracking, 100+ LLM providers | AI platform teams, developers | MCP permissions are secondary feature (LLM proxy first); enterprise features paywalled; complex setup; no dedicated MCP permission UX |
| **[Arcade.dev](https://www.arcade.dev/)** | MCP runtime for agent authorization | Undisclosed (YC-backed) | $25/mo Growth (600 challenges, 2K tool executions); per-execution overage | Largest MCP tool catalog, user-scoped OAuth, tool execution governance, agent-first auth | AI agent developers | Pricing tied to execution volume (expensive at scale); tool catalog focus over permission granularity; no self-hosted option |
| **[Alter](https://www.ycombinator.com/companies/alter)** | Zero-trust IAM for AI agents | YC-backed (undisclosed) | Not public | Zero-trust per-tool-call auth, RBAC+ABAC, real-time guardrails, CISO dashboard, audit trails | Enterprise CISOs, regulated industries | Very early-stage (2 employees), no MCP-specific features, enterprise-only focus, unproven at scale |
| **[Scalekit](https://www.scalekit.com/)** | Auth stack for AI apps / MCP servers | $5.5M Seed (Together Fund, Z47) | Free tier available | OAuth 2.1 for MCP servers, encrypted token vault, delegated consent, tool-calling layer for agent-on-behalf-of-user | SaaS developers building AI apps | Auth-focused (not full permission management), limited scope control granularity, early-stage, no audit trail dashboard |
| **[MetaMCP](https://metamcp.com/)** | Open-source MCP aggregator/gateway | Bootstrapped/OSS | Free (self-hosted) | MCP server aggregation, namespace grouping, rate limiting, OIDC auth, middleware system, GUI management, app store | Developers, hobbyists | No enterprise support, no dedicated permission management UI, community-maintained, limited audit capabilities |
| **[MCPJungle](https://github.com/mcpjungle/MCPJungle)** | Self-hosted MCP gateway & registry | Bootstrapped/OSS | Free (self-hosted) | Centralized MCP registry, tool groups, enterprise mode with access control, auth tokens, fine-grained permissions | Self-hosted enthusiasts, small teams | SQLite default (scale limits), no cloud option, limited documentation, no audit trail, community project |
| **[Microsoft MCP Gateway](https://github.com/microsoft/mcp-gateway)** | MCP reverse proxy for Kubernetes | Microsoft (internal) | Free OSS | Session-aware routing, Entra ID auth, role-based authorization (mcp.admin), lifecycle management, K8s-native | Enterprise K8s teams | Kubernetes-only, Microsoft Entra lock-in, no granular per-agent scoping, no multi-tenant permission dashboard |
| **[Traefik Hub MCP Gateway](https://traefik.io/solutions/mcp-gateway)** | MCP gateway built into API gateway | VC-backed ($60M+ total for Traefik Labs) | Custom (enterprise) | Task-Based Access Control (TBAC), OAuth 2.0/2.1, list filtering, JWT integration, audit-ready observability | Enterprise network/platform teams | MCP gateway is add-on to existing Traefik product; requires Traefik ecosystem buy-in; complex setup for simple use cases; no developer self-service |
| **[Gravitee MCP Proxy](https://www.gravitee.io/platform/ai-agent-management)** | API management platform with MCP proxy | VC-backed | Custom (enterprise) | MCP analytics, protocol-level governance, ACL per MCP method, request/response transformation, REST-to-MCP conversion | Enterprise API management teams | Enterprise-only pricing, MCP is bolt-on to API management platform, not agent-permission-first design |
| **[Lasso Security MCP Gateway](https://github.com/lasso-security/mcp-gateway)** | Security-focused MCP gateway | Undisclosed | Not public | Triple-gate security (AI/MCP/API layers), prompt injection detection, MCP server reputation scoring | Security teams | Very security-focused (not developer UX), limited documentation, narrow feature set |
| **[HyprMCP Gateway](https://github.com/hyprmcp/mcp-gateway)** | OAuth proxy for MCP servers | Bootstrapped/OSS | Free (self-hosted) | 1-click OAuth with DCR, MCP prompt analytics, MCP firewall, streamable HTTP | Developers | Narrow scope (OAuth only), no permission management dashboard, no multi-tenant, early project |

---

## 2. Indirect Competitors (Adjacent Solutions)

| Competitor | Category | Funding | Relevance | Key Overlap | Key Difference |
|---|---|---|---|---|---|
| **[Composio](https://composio.dev/)** | AI agent integration platform | $29M (Series A) | HIGH | 250+ tool integrations for AI agents, auth management, MCP support | Integration-first, not permission/security-first; no granular per-agent scoping |
| **[Nango](https://nango.dev/)** | API integration infrastructure | $2M Seed (YC W23) | MEDIUM | 600+ API integrations, OAuth handling, MCP server, per-customer config | Integration infrastructure, no agent permission management or audit trails |
| **[Aembit](https://aembit.io/)** | Non-human IAM for workloads | $45M ($25M Series A) | HIGH | MCP Identity Gateway, ephemeral credentials, blended identity (agent-on-behalf-of-user) | Workload IAM (broader than AI agents), enterprise-focused, not developer self-service |
| **[Zenity](https://zenity.io/)** | AI agent governance & security | $59.5M ($38M Series B) | MEDIUM | Agent discovery, permission visibility, runtime governance | Security/governance platform (not permission proxy); no MCP endpoint generation |
| **[SailPoint](https://www.sailpoint.com/products/agent-identity-security)** | Enterprise identity governance | Public company (SAIL) | LOW-MED | AI agent identity governance, service account lifecycle | Traditional IAM vendor adding agent features; heavyweight, enterprise-only |
| **[Okta/Auth0](https://www.okta.com/solutions/secure-ai/)** | Identity platform | Public company (OKTA) | MEDIUM | AI agent identity, token vaulting, fine-grained authorization | Identity platform (not MCP-specific); no per-agent scope management |
| **[1Password](https://1password.com/solutions/agentic-ai)** | Secrets management for AI agents | Private ($920M+ raised) | LOW-MED | AI agent credential management, secrets vault | Credential storage, not permission proxy or MCP gateway |
| **[Cerbos](https://www.cerbos.dev/)** | Open-source authorization engine | $7.5M | LOW-MED | Fine-grained policy engine, MCP authorization blog posts | Policy engine (building block), not complete MCP permission gateway |
| **[WorkOS](https://workos.com/)** | Enterprise auth for B2B SaaS | $222M (Series C) | LOW | SSO, SCIM, RBAC for B2B apps, agent credential features | Auth infrastructure, not AI-agent-specific; no MCP support |
| **[E2B](https://e2b.dev/)** | AI agent code sandbox | Undisclosed | LOW | Secure agent execution environments, audit trails | Code execution sandbox, not permission/access management |
| **[Docker MCP Gateway](https://docs.docker.com/)** | Containerized MCP server management | Docker Inc. | MEDIUM | MCP server orchestration in isolated containers, resource limits | Container isolation, not permission management; no per-agent scoping |
| **[AWS MCP Proxy](https://aws.amazon.com/)** | AWS-hosted MCP proxy | Amazon | LOW-MED | MCP proxy with SigV4 auth for AWS-hosted MCP servers | AWS-only, authentication not authorization, no permission dashboard |

---

## 3. User Pain Points & Review Analysis (Reddit, HN, Security Blogs)

### 3.1 MCP Security Concerns (Widely Documented)

**"MCP is a Security Nightmare"** — Multiple security researchers and publications have documented critical MCP vulnerabilities:

- **43% of MCP servers have unsafe shell calls** allowing arbitrary code execution ([Pillar Security](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp), [Equixly](https://equixly.com/blog/2025/03/29/mcp-server-new-security-nightmare/))
- **Tool poisoning attacks** embed malicious instructions invisible to users but interpreted by AI models ([Datadog](https://www.datadoghq.com/blog/monitor-mcp-servers/))
- **No standard authentication handshake** between MCP clients and servers — leading to inconsistent security implementations ([Red Hat](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls))
- **Token theft risk**: MCP servers store tokens for multiple services; breach = access to everything ([Palo Alto Networks](https://live.paloaltonetworks.com/t5/community-blogs/mcp-security-exposed-what-you-need-to-know-now/ba-p/1227143))
- **Excessive permissions**: MCP servers routinely request broad scopes with no mechanism to restrict per-agent ([Prompt Security](https://prompt.security/blog/top-10-mcp-security-risks))
- **Lack of audit logging**: No standardized approach to traceability — impossible to conduct forensic analysis ([Docker](https://www.docker.com/blog/mcp-security-explained/))

### 3.2 AI Agent Access Control Frustrations

**"AI Agents Are Becoming Authorization Bypass Paths"** ([The Hacker News](https://thehackernews.com/2026/01/ai-agents-are-becoming-privilege.html)):
- Authorization evaluated against agent identity rather than requester identity — user-level restrictions no longer apply
- Security teams have lost ability to enforce least privilege or reliably attribute intent
- Static access policies designed for predictable behavior are colliding with agents that *reason* instead of execute

**"God-Like Attack Machines"** ([Dark Reading](https://www.darkreading.com/application-security/ai-agents-ignore-security-policies)):
- AI agents go "above and beyond" to complete tasks, even breaking through carefully designed guardrails
- Traditional security controls insufficient for autonomous agents

**Identity as Configuration Problem** ([Token Security](https://www.token.security/blog/blog-ai-agent-security-fails-identity-configuration-problem)):
- Agents launched with broad access that persists beyond their purpose
- Least privilege not continuously enforced
- Agent needs change dynamically based on context — static permissions are fundamentally broken

### 3.3 Developer-Specific Frustrations

| Pain Point | Evidence | Opportunity |
|---|---|---|
| **No simple "plug and play" permission layer** | Developers cobble together OAuth + custom middleware + logging; no unified solution | Single SDK/endpoint that handles all three |
| **MCP servers over-permissioned by default** | MCP spec provides no guidance on scope restriction | Permission-first MCP proxy with default-deny |
| **Can't give different agents different permissions** | Most tools are all-or-nothing access | Per-agent, per-service, per-scope configuration |
| **No audit trail for agent actions** | MCP spec lacks standardized logging | Built-in audit trail with every request logged |
| **Self-hosted option missing from funded competitors** | Keycard, Arcade — cloud-only; enterprises want on-prem | Open-core with genuine self-hosted parity |
| **Enterprise tools too complex for individual devs** | Aembit, Zenity, SailPoint require platform teams | Developer self-service with simple onboarding |

---

## 4. Competitive Gaps Identified

### Gap 1: Developer Self-Service MCP Permission Proxy (PRIMARY GAP)
No existing solution offers a **simple, developer-facing product** that lets you: (1) connect a service via OAuth, (2) define granular scopes per AI agent, (3) get an MCP endpoint, (4) see audit logs — all in under 5 minutes. Keycard/Aembit/Zenity target enterprise CISOs. Arcade focuses on tool execution, not permission management. MetaMCP/MCPJungle require self-hosting expertise. **The "Stripe of AI agent permissions" does not exist yet.**

### Gap 2: Per-Agent, Per-Service Granular Scope Control
Most MCP gateways offer team/org-level access control (LiteLLM, Obot) or tool-level filtering, but none provide **per-agent, per-service scope restriction** (e.g., Agent A can read Google Drive folder X but not write; Agent B can send emails but not read inbox). The permission model is always coarse-grained.

### Gap 3: Open-Core with Self-Hosted Parity
Well-funded competitors (Keycard $38M, Obot $35M, Arcade) are cloud-first or cloud-only. Open-source options (MetaMCP, MCPJungle, Microsoft MCP Gateway) lack enterprise permission features. **No product offers genuine open-core parity** — full permission management in both cloud and self-hosted with the same feature set.

### Gap 4: Instant Revocation with Real-Time Effect
Most solutions use long-lived tokens or static configs. No competitor emphasizes **instant, one-click revocation** that immediately invalidates an agent's access across all connected services, with confirmation in the audit trail.

### Gap 5: Cross-Service Permission Dashboard
Existing tools manage permissions per-MCP-server or per-tool. No unified dashboard shows **"what can Agent X access across ALL my connected services"** with visual scope representation and one-click management.

### Gap 6: Rate Limiting at Permission Layer
MetaMCP offers basic rate limiting. But no tool provides **intelligent, per-agent, per-service rate limiting** with alerting (e.g., "Agent Y made 500 Google Drive API calls in 10 minutes — auto-throttled").

### Gap 7: SMB/Developer-First Pricing
Keycard, Aembit, Zenity, Traefik, Gravitee — all enterprise/custom pricing. Arcade charges per-execution (unpredictable). Open-source options are free but unsupported. **No $20-50/mo plan exists** for individual developers or small teams who want managed MCP permission proxy.

---

## 5. Competitive Scoring Breakdown

### Quantity of Competitors (Inverse) — **40/100**

| Type | Count | Threat Level |
|---|---|---|
| Direct MCP permission gateways | 13+ products | High |
| Indirect (IAM, integration platforms) | 12+ products | Medium |
| Open-source MCP gateways | 6+ projects | Medium |
| Enterprise IAM adding agent features | 4+ (Okta, SailPoint, Aembit, Zenity) | Medium-High |
| **TOTAL** | **35+ active competitors/adjacent** | **Crowded and growing** |

The space is hot — $200M+ in aggregate funding specifically for AI agent security/permission/MCP tooling in 2025-2026. However, the market is highly fragmented with no dominant winner, which is typical of a nascent category still being defined.

**Score: 40** — High competitor count, but fragmentation provides entry opportunity.

### Competition Level (Inverse) — **35/100**

The competitive intensity is **very high**:
- Keycard ($38M), Obot ($35M), Aembit ($45M), Zenity ($59.5M), Composio ($29M) — well-funded direct/adjacent players
- Microsoft, Docker, Traefik, Gravitee — established infra companies adding MCP gateway features
- TechCrunch reports VCs are "betting big on AI security" with agents described as one of the hottest investment themes of 2025-2026
- Enterprise buyers are actively evaluating solutions (NIST initiative launched Feb 2026)

However, no single player dominates and most are still pre-revenue or early-revenue.

**Score: 35** — Very competitive, well-funded market with institutional attention.

### Barriers to Entry — **55/100**

| Barrier | Level | Description |
|---|---|---|
| Technical complexity | Medium | OAuth + MCP SDK + proxy layer is buildable by a solo dev in 4-6 weeks; but production-grade security is hard |
| VC-funded competitors | High | $200M+ deployed in the space; fast-moving well-resourced teams |
| Brand/trust for security product | High | Security products need trust — hard for unknown solo founder to win enterprise deals |
| Open-source competition | Medium | MetaMCP, MCPJungle, Obot OSS provide free alternatives |
| Regulatory/compliance (SOC2, etc.) | Medium | Enterprise customers will require compliance certifications |
| Network/ecosystem effects | Low | No strong network effects — each deployment is independent |
| Switching costs | Low | Easy to swap proxy layers; not deeply embedded |

**Score: 55** — Moderate barriers; technically feasible but trust and funding disadvantage are real.

### Differentiation Opportunity — **65/100**

Strong differentiation is available through the identified gaps:
- **Developer self-service** (vs enterprise-only tools) — huge underserved segment
- **Open-core with self-hosted parity** (vs cloud-only or feature-stripped OSS)
- **Per-agent granular scope control** (vs team/org-level access)
- **Simple onboarding** (connect OAuth, set scopes, get MCP endpoint in 5 min)
- **SMB-friendly pricing** ($20-50/mo vs enterprise-only)
- **Cross-service permission dashboard** (visual overview of all agent permissions)

The "developer Stripe" positioning for AI agent permissions is genuinely unclaimed.

**Score: 65** — Clear differentiation paths exist, especially at the developer/SMB tier.

### Competitor Weaknesses (from Reviews & Analysis) — **60/100**

| Competitor | Confirmed Weakness |
|---|---|
| **Keycard** | Enterprise-only, no self-hosted, new/unproven (Oct 2025 launch), no public pricing |
| **Obot** | Requires platform team to operate, primarily MCP server management not permission-first |
| **LiteLLM** | MCP is secondary feature; complex setup; enterprise features paywalled |
| **Arcade** | Per-execution pricing (unpredictable costs); tool catalog focus over permission granularity |
| **Alter** | 2-person team, extremely early, no MCP-specific features yet |
| **Scalekit** | Auth-only (not full permission management), early stage |
| **MetaMCP/MCPJungle** | Community-maintained OSS, no support, limited audit capabilities |
| **Traefik/Gravitee** | MCP is bolt-on to existing API gateway; complex setup; enterprise pricing |
| **Microsoft MCP Gateway** | Kubernetes-only, Entra lock-in, no multi-tenant permission dashboard |
| **Aembit** | Workload IAM (broader than AI agents), enterprise-focused, not developer self-service |
| **Zenity** | Governance/visibility platform (not permission proxy), enterprise-only |

Weaknesses are confirmed and structural — they stem from positioning decisions (enterprise vs developer, platform vs product, bolt-on vs purpose-built) rather than easily fixable bugs.

**Score: 60** — Weaknesses are real and structural, but well-funded competitors can adapt.

---

## 6. Final Competitor Score

| Parameter | Score | Weight | Weighted |
|---|---|---|---|
| Quantity of competitors (inverse) | 40 | 20% | 8.0 |
| Competition level (inverse) | 35 | 20% | 7.0 |
| Barriers to entry | 55 | 20% | 11.0 |
| Differentiation opportunity | 65 | 20% | 13.0 |
| Competitor weaknesses | 60 | 20% | 12.0 |

### competitor_score = 51 / 100

**Rationale:** This is a **hot, well-funded, and crowded** space with 35+ direct and indirect competitors and $200M+ in aggregate funding deployed specifically in AI agent security/MCP tooling during 2025-2026. Major infrastructure companies (Microsoft, Docker, Traefik, Gravitee) are adding MCP gateway features, and VCs are actively pouring money into the category. The market is pre-winner — fragmented with no dominant player — which creates entry opportunity but also means fierce competition for positioning. The strongest differentiation path is the **developer self-service / SMB tier** that well-funded enterprise competitors are ignoring, combined with the **open-core model** and **per-agent granular scope control** that no one executes well. The risk is that a well-funded competitor (Keycard, Obot, Arcade) could pivot to cover developer segments quickly, collapsing the differentiation window. A solo founder can build an MVP here, but winning long-term against $38M+ funded teams in a security-critical product category will be extremely challenging without external funding or a viral open-source strategy.

---

## Sources

- [Keycard Labs — Official Site](https://www.keycard.ai/)
- [Keycard $38M Funding — SiliconANGLE](https://siliconangle.com/2025/10/21/ai-agent-security-startup-keycard-reels-38m/)
- [Keycard vs WorkOS — WorkOS Blog](https://workos.com/blog/keycard-vs-workos-agent-credentials-enterprise-authentication)
- [Obot MCP Gateway — Official Site](https://obot.ai/)
- [Obot $35M Seed — PR Newswire](https://www.prnewswire.com/news-releases/obot-ai-secures-35m-seed-to-build-enterprise-mcp-gateway-302563687.html)
- [LiteLLM MCP Permission Management](https://docs.litellm.ai/docs/mcp_control)
- [LiteLLM Review 2026 — TrueFoundry](https://www.truefoundry.com/blog/a-detailed-litellm-review-features-pricing-pros-and-cons-2026)
- [Arcade.dev — Official Site](https://www.arcade.dev/)
- [Arcade Pricing Updates](https://blog.arcade.dev/pricing-updates)
- [Alter — YC Profile](https://www.ycombinator.com/companies/alter)
- [Alter — Hacker News Discussion](https://news.ycombinator.com/item?id=45154579)
- [Scalekit $5.5M — SecurityWeek](https://www.securityweek.com/scalekit-raises-5-5-million-to-secure-ai-agent-authentication/)
- [Scalekit — Official Site](https://www.scalekit.com/)
- [MetaMCP — GitHub](https://github.com/metatool-ai/metamcp)
- [MCPJungle — GitHub](https://github.com/mcpjungle/MCPJungle)
- [Microsoft MCP Gateway — GitHub](https://github.com/microsoft/mcp-gateway)
- [Traefik Hub MCP Gateway](https://traefik.io/solutions/mcp-gateway)
- [Traefik TBAC Documentation](https://doc.traefik.io/traefik-hub/mcp-gateway/guides/understanding-tbac)
- [Gravitee MCP Proxy](https://www.gravitee.io/blog/mcp-proxy-unified-governance-for-agents-tools)
- [Lasso Security MCP Gateway — GitHub](https://github.com/lasso-security/mcp-gateway)
- [HyprMCP Gateway — GitHub](https://github.com/hyprmcp/mcp-gateway)
- [Composio $29M Series A](https://composio.dev/blog/series-a)
- [Composio Pricing](https://composio.dev/pricing)
- [Nango — Official Site](https://nango.dev/)
- [Nango Pricing](https://nango.dev/pricing)
- [Aembit $25M Series A](https://aembit.io/press-release/aembit-raises-25-million-in-series-a-funding-for-non-human-identity-and-access-management/)
- [Aembit IAM for Agentic AI](https://aembit.io/press-release/aembit-introduces-identity-and-access-management-for-agentic-ai/)
- [Zenity $38M Series B](https://zenity.io/company-overview/newsroom/company-news/zenity-raises-38m-series-b-funding-round-to-secure-agentic-ai)
- [SailPoint Agent Identity Security](https://www.sailpoint.com/products/agent-identity-security)
- [Okta AI Agent Solutions](https://www.okta.com/solutions/secure-ai/)
- [1Password Agentic AI](https://1password.com/solutions/agentic-ai)
- [Cerbos MCP Authorization](https://www.cerbos.dev/blog/mcp-authorization)
- [E2B — Official Site](https://e2b.dev/)
- [AWS MCP Proxy GA](https://aws.amazon.com/about-aws/whats-new/2025/10/model-context-protocol-proxy-available/)
- [Docker MCP Security](https://www.docker.com/blog/mcp-security-explained/)
- [MCP Security Risks — Pillar Security](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)
- [MCP Security — Prompt Security Top 10](https://prompt.security/blog/top-10-mcp-security-risks)
- [MCP Security — Palo Alto Networks](https://live.paloaltonetworks.com/t5/community-blogs/mcp-security-exposed-what-you-need-to-know-now/ba-p/1227143)
- [MCP Security — Red Hat](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)
- [MCP Security — Datadog](https://www.datadoghq.com/blog/monitor-mcp-servers/)
- [AI Agents Authorization Bypass — Hacker News](https://thehackernews.com/2026/01/ai-agents-are-becoming-privilege.html)
- [AI Agent Security Identity Problem — Token Security](https://www.token.security/blog/blog-ai-agent-security-fails-identity-configuration-problem)
- [God-Like Attack Machines — Dark Reading](https://www.darkreading.com/application-security/ai-agents-ignore-security-policies)
- [VCs Betting on AI Security — TechCrunch](https://techcrunch.com/2026/01/19/rogue-agents-and-shadow-ai-why-vcs-are-betting-big-on-ai-security/)
- [Composio Alternatives — Nango Blog](https://nango.dev/blog/composio-alternatives)
- [Best MCP Gateways 2026 — Composio](https://composio.dev/blog/best-mcp-gateway-for-developers)
- [MCP Gateways Comparison — Moesif](https://www.moesif.com/blog/monitoring/model-context-protocol/Comparing-MCP-Model-Context-Protocol-Gateways/)
- [Awesome MCP Gateways — E2B GitHub](https://github.com/e2b-dev/awesome-mcp-gateways)
- [NIST Agentic AI Initiative](https://federalnewsnetwork.com/cybersecurity/2026/02/nist-agentic-ai-initiative-looks-to-get-handle-on-security/)
