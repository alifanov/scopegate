# Stage 4: AUDIENCE — Целевая аудитория и валидация спроса
# AI Access Proxy — Granular Permission Gateway for AI Agents
> Дата: 2026-02-23

---

## 1. Подтверждённая боль (Confirmed Pain)

### Что разработчики и security-специалисты говорят о проблеме

#### Прямые цитаты с Hacker News, форумов и технических блогов

> "containers are being used as a security boundary while it's well known they are not"
> — kketch, Hacker News ([Sandboxing AI agents at the kernel level](https://news.ycombinator.com/item?id=45415814))

> "A sandbox does not prevent an email-reading agent from reading a malicious email, being prompt injected, and then sending an email to a malicious email address"
> — DanMcInerney, Hacker News ([Matchlock – Secures AI agent workloads](https://news.ycombinator.com/item?id=46932343))

> "If the agent can read and send emails, no sandbox can tell a legit send from an exfiltration"
> — jingkai_he (Matchlock creator), Hacker News

> "[Claude's sandbox setup] gives read access to everything by default so its not deny-default"
> — Hacker News commenter on MCP security

> "Network-layer controls are the only hard defense we have for agents at the moment"
> — Hacker News discussion on AI agent isolation

> "whitelisting is better than blacklisting — provide specific API access instead of filesystem access"
> — kketch, Hacker News on AI agent permission design

> "Most of them [AI agents] can run arbitrary code on your machine with zero restrictions"
> — Tan Genie, DEV.to ([AI Agents Run Unsandboxed Code — How to Fix It](https://dev.to/tan_genie_6a51065da7b63b6/ai-agents-run-unsandboxed-code-how-to-fix-it-2026-1np4))

> "Agents quietly accumulate permissions as their scope expands. Integrations are added, roles change, teams come and go, but the agent's access remains."
> — The Hacker News ([Who Approved This Agent?](https://thehackernews.com/2026/01/who-approved-this-agent-rethinking.html))

> "Every agent must have a defined owner responsible for its purpose, scope of access, and ongoing review. Without ownership, approval is meaningless and risk remains unmanaged."
> — The Hacker News

> "An agent's 'role' can change moment to moment — a request that begins as read-only can evolve into a code-generation exercise that needs write rights, and constant role hopping either floods logs or drives teams to grant one oversized role."
> — [Auth0 — Access Control in the Era of AI Agents](https://auth0.com/blog/access-control-in-the-era-of-ai-agents/)

#### Подтверждённые реальные инциденты

| Инцидент | Описание | Дата | Источник |
|---|---|---|---|
| GitHub MCP Exploit | Malicious commands embedded in public repo Issues hijacked developers' locally running AI Agents, exfiltrating private source code and cryptographic keys | May 2025 | [Obsidian Security](https://www.obsidiansecurity.com/blog/ai-agent-market-landscape) |
| Perplexity Comet Injection | AI browser Comet exposed to "indirect prompt injection" via hidden commands in Reddit comments | Aug 2025 | [Obsidian Security](https://www.obsidiansecurity.com/blog/ai-agent-market-landscape) |
| Slack AI Data Exfiltration | Indirect prompt injection in private channels tricked corporate AI into summarizing sensitive conversations and sending to external address | Aug 2024 | [The Hacker News](https://thehackernews.com/2026/01/who-approved-this-agent-rethinking.html) |
| ServiceNow Agent Exploit | Second-order prompt injection used agent-to-agent discovery to copy/exfiltrate sensitive corporate data and escalate privileges | Nov 2025 | [The Hacker News](https://thehackernews.com/2025/11/servicenow-ai-agents-can-be-tricked.html) |
| Claude Desktop RCE | Claude Desktop Extensions exposed 10,000+ users to remote code execution — no sandboxing, full host privileges | 2025 | [LayerX Security](https://layerxsecurity.com/blog/claude-desktop-extensions-rce/) |
| Malicious MCP Package | Fake "playwright-mcp" package reached 17,000 downloads in single week, masquerading as Microsoft's legitimate Playwright MCP | 2025 | [Clutch Security](https://www.clutch.security/blog/mcp-servers-what-we-found-when-we-actually-looked) |

#### Количественные данные о масштабе боли

| Метрика | Значение | Источник |
|---|---|---|
| Организации с AI agent security инцидентами за год | **88%** | [Gravitee — State of AI Agent Security 2026](https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control) |
| Организации с security controls для AI | Только **34%** | [USCS Institute](https://www.uscsinstitute.org/cybersecurity-insights/blog/what-is-ai-agent-security-plan-2026-threats-and-strategies-explained) |
| MCP серверы с dangerous default configs | **>90%** | [Noma Security](https://noma.security/blog/top-five-mcp-security-blindspots-putting-your-organization-at-risk/) |
| Агентов, выполнивших unintended actions | **80%** организаций | [Obsidian Security](https://www.obsidiansecurity.com/blog/ai-agent-security-risks) |
| Агенты, tricks into revealing credentials | **23%** организаций | [Obsidian Security](https://www.obsidiansecurity.com/blog/ai-agent-security-risks) |
| Команды с full security/IT approval для AI agents | Только **14.4%** | [Gravitee Report](https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control) |
| AI agents, активно контролируемых/защищённых | Только **47.1%** | [Gravitee Report](https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control) |
| Организации, использующие shared API keys для agent auth | **45.6%** | [Gravitee Report](https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control) |
| Организации с hardcoded authorization logic | **27.2%** | [Gravitee Report](https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control) |
| Fortune 500, деплоящие AI agents через low-code | **>80%** | Microsoft Cyber Pulse |
| Из них с security controls | Только **47%** | Microsoft Cyber Pulse |

#### Ключевая проблемная формулировка

Боль кристально ясна и подтверждена количественно: **88% организаций уже столкнулись с AI agent security инцидентами**, при этом **только 14.4% имеют полное security-одобрение**, а **>90% MCP серверов работают с dangerous default configurations**. Разрыв между adoption (80%+) и security readiness (34%) — это зияющая дыра, которую AI Access Proxy призван закрыть.

### Confirmed Pain Score: **92/100**

**Обоснование:** Это не гипотетическая проблема — она подтверждена реальными инцидентами (GitHub MCP exploit, Slack AI exfiltration, Claude Desktop RCE), массовой статистикой (88% организаций с инцидентами), и десятками цитат разработчиков на HN/форумах. Боль актуальна прямо сейчас (2025-2026), растёт с каждым месяцем по мере adoption AI agents, и носит характер pain killer (не vitamin) — security breach = реальные финансовые потери. Значительно выше QABot (82) и Google Ads AI Chat, потому что последствия нерешённой проблемы катастрофичны (data breach, compliance violation), а не просто неудобны.

---

## 2. Готовность платить (Willingness to Pay)

### Текущие enterprise security бюджеты

| Метрика | Значение | Источник |
|---|---|---|
| Глобальные расходы на cybersecurity 2026 | **$244.2 млрд** (Gartner) / **>$520 млрд** (Cybersecurity Ventures) | [Gartner](https://softwarestrategiesblog.com/2026/02/10/gartner-cybersecurity-trends-2026/) |
| Enterprise governance бюджет — рост | **98%** планируют увеличить, средний рост **24%** | [CIO Dive](https://www.ciodive.com/news/AI-risk-mitigation-governance-oversight-data/761385/) |
| AI-related бюджеты — рост | **88%** executives планируют увеличить за 12 мес | [PwC AI Agent Survey](https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-agent-survey.html) |
| CISOs, увеличивающие cybersecurity бюджеты | **99%** | [SecureWorld](https://www.secureworld.io/industry-news/cyber-budget-boom) |
| IAM (Identity & Access Management) | Топ-3 приоритет бюджета CISOs | [Wiz CISO Budget Report 2026](https://www.wiz.io/reports/ciso-security-budget-benchmark-2026) |
| Дополнительный security бюджет на AI deployments | **20-40%** от platform costs | [AI Agent Security Tools](https://research.aimultiple.com/ai-agent-security/) |

### Reference pricing — конкуренты и аналоги

| Продукт / Категория | Ценовой диапазон | Модель |
|---|---|---|
| Enterprise AI security platforms | **$500+/мес** | Per-agent / per-connection |
| Lasso Security, Noma Security | **Custom pricing** (enterprise quotes) | Enterprise |
| Obot MCP Gateway | Not publicly priced (beta) | Per-org |
| Gravitee MCP Proxy | Enterprise pricing | Per-traffic volume |
| Prompt Security MCP Gateway | Enterprise pricing | Per-interaction |
| Auth0 (identity for agents) | **$35-240/мес** (starter-enterprise) | Per-identity |
| WorkOS (agent access control) | **$49-499/мес** | Per-connection |
| Typical developer security tools | **$10-50/dev/мес** | Per-seat |

### Willingness-to-pay сигналы

1. **Экономика предотвращения:** Один data breach стоит компании **10-100x** годового governance investment. Средняя стоимость data breach в 2025 — $4.88M (IBM). AI Access Proxy за $50-500/мес — очевидный ROI.

2. **Бюджеты растут:** 98% enterprise увеличивают governance бюджеты на 24%, а 88% executives увеличивают AI-related budgets — деньги уже выделены.

3. **Regulatory pressure:** EU AI Act enforcement начинается август 2026 — compliance requirements создают принудительный спрос. Gartner предсказывает первые major lawsuits из-за gap между AI adoption и security.

4. **Gartner предупреждение:** >40% agentic AI projects провалятся к 2027 из-за "not enough risk controls" — security инструменты буквально необходимы для survival проектов.

5. **Developer segment WTP:** Developer tools pricing anchored at $10-50/dev/мес (GitHub Copilot = $10-39, WorkOS = $49+), но security — категория с premium pricing (компании готовы платить больше за security чем за productivity).

### WTP Score: **78/100**

**Обоснование:** WTP подтверждена на нескольких уровнях: (1) enterprise бюджеты массово растут и включают AI security как приоритет, (2) regulatory pressure (EU AI Act) создаёт принудительный спрос, (3) экономика предотвращения работает — $50-500/мес за proxy vs $4.88M за breach, (4) IAM и access control — топ-3 CISO приоритет. Developer-сегмент anchored ниже ($10-50/мес), но enterprise-сегмент готов платить premium. Значительно выше QABot (62), потому что security tools имеют premium positioning и regulatory tailwind. Не 90+ потому что solo developers (cheapest segment) будут ожидать free tier, а open-core модель давит на конвертацию.

---

## 3. Размер аудитории

### Количественные данные

| Сегмент | Размер | Источник |
|---|---|---|
| Разработчики, строящие AI agents | **99% из опрошенных** AI developers explore/develop agents | [IBM/Morning Consult](https://www.ibm.com/think/insights/ai-agents-2025-expectations-vs-reality) |
| Организации с AI agents в production | **57%** | [G2 Enterprise AI Agents Report](https://learn.g2.com/enterprise-ai-agents-report) |
| Организации, adopting AI agents | **79%** senior executives | [PwC AI Agent Survey](https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-agent-survey.html) |
| MCP SDK monthly downloads | **97M+** | [MCP Anniversary Blog](http://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/) |
| MCP серверов зарегистрировано | **7,109+** (April 2025) → estimated **15,000+** (Feb 2026) | [MCP Statistics](https://www.mcpevals.io/blog/mcp-statistics) |
| Организации, использующие MCP | **~90%** estimated by end 2025 | [MCP Manager Statistics](https://mcpmanager.ai/blog/mcp-adoption-statistics/) |
| Employees running MCP in avg 10K org | **15.28%** (1,528 employees, avg 2 servers each) | [Clutch Security](https://www.clutch.security/blog/mcp-servers-what-we-found-when-we-actually-looked) |
| GitHub Copilot users (proxy for AI dev community) | **15 млн** | [Microsoft 2025](https://www.pragmaticcoders.com/resources/ai-agent-statistics) |
| Организации, используюшие Copilot Studio для agents | **230,000+** (incl 90% Fortune 500) | [Microsoft 2025](https://www.pragmaticcoders.com/resources/ai-agent-statistics) |
| AI agents market size 2025 | **$7.6–7.8 млрд** | [Fortune Business Insights](https://www.fortunebusinessinsights.com/agentic-ai-market-114233) |
| AI agents market size 2026 (projected) | **$10.9 млрд** | [Multiple sources](https://www.pragmaticcoders.com/resources/ai-agent-statistics) |
| Enterprise apps с AI agents к 2026 | **40%** (up from <5% in 2025) | [Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025) |

### Целевые сегменты — расчёт TAM

| Сегмент | Размер (оценка) | ARPU/мес | TAM |
|---|---|---|---|
| **Individual developers building AI agents** | ~2-5M devs globally (из 15M Copilot users, ~15-30% строят agents) | $19-49 | ~$500M-$3B/год |
| **Startups building agent products** | ~50,000-200,000 (из 230K+ orgs building agents, minus enterprise) | $99-299 | ~$60M-$720M/год |
| **Enterprise teams (50+ employees)** | ~100,000-500,000 teams (57% of companies have agents in prod) | $299-999 | ~$360M-$6B/год |
| **MCP-specific users (core TAM)** | ~500,000-2M active MCP developers (97M downloads, high churn) | $29-199 | ~$175M-$4.8B/год |

### Audience Size Score: **88/100**

**Обоснование:** Аудитория масштабная и стремительно растущая: 97M+ MCP SDK downloads, 15M GitHub Copilot users, 79% enterprises adopting agents, 40% enterprise apps embedding agents к 2026. Рынок AI agent security — nascent category с projected $146.5B для AI-in-cybersecurity к 2034. MCP стал де-факто стандартом (backed by Anthropic, OpenAI, Google, Microsoft), что обеспечивает protocol-level lock-in для продукта. Выше QABot (85) потому что целевая аудитория шире (все AI agent builders, а не только тестировщики) и растёт на 40%+ YoY. Не 95+ потому что MCP-specific user base ещё формируется и не все agent builders используют MCP.

---

## 4. Доступность аудитории

### Каналы привлечения

| Канал | Эффективность | Стоимость | Скорость | Обоснование |
|---|---|---|---|---|
| GitHub (open-core repo + marketplace) | Высокая | Бесплатно | Быстро (неделя 1) | 15M+ AI dev users, open-source == trust |
| Product Hunt | Высокая | Бесплатно | Быстро (день 1) | Developer security tools trending category |
| Hacker News (Show HN) | Очень высокая | Бесплатно | Быстро (день 1) | AI agent security — горячая тема (Matchlock trending) |
| Reddit (r/LocalLLaMA, r/MachineLearning, r/programming) | Средне-высокая | Бесплатно | Быстро (неделя 1) | Active MCP and AI agent discussions |
| MCP Registries (PulseMCP, etc.) | Высокая | Бесплатно | Быстро (неделя 1) | 5,500+ servers listed = built-in distribution |
| Twitter/X AI community | Высокая | Бесплатно | Средне | @AnthropicAI, @OpenAI ecosystem — high engagement |
| Dev.to / Medium | Средняя | Бесплатно | Средне (2-4 нед) | Security-focused content performs well |
| SEO (blog + docs) | Высокая (long-term) | Бесплатно | Медленно (3-6 мес) | "MCP security", "AI agent permissions" — growing queries |
| LinkedIn (enterprise segment) | Средне-высокая | Бесплатно-$$ | Средне | CISOs, engineering managers = decision makers |
| Security conferences / webinars | Высокая (enterprise) | $$-$$$ | Медленно (2-3 мес) | RSA, Black Hat, DEF CON AI village |
| Discord / Slack AI communities | Средняя | Бесплатно | Быстро | Claude, LangChain, AutoGen communities |
| Integration partnerships | Высокая (long-term) | Бесплатно | Медленно (1-3 мес) | Partner with Claude/Cursor/Windsurf as security layer |

### Конкурентное преимущество в distribution

- **Open-core model** позволяет GitHub-first distribution — разработчики находят, пробуют, доверяют через open-source
- **MCP registries** — built-in distribution channel (PulseMCP, mcp.run и т.д.), 5,500+ серверов уже зарегистрированы
- **Security content** — hot topic сейчас, контент об AI agent security получает high engagement (HN frontpage, security blogs)
- **Integration ecosystem** — партнёрства с Claude, Cursor, VS Code, Windsurf дают доступ к миллионам users

### Accessibility Score: **82/100**

**Обоснование:** Developer-аудитория высоко доступна через GitHub, HN, Reddit, Product Hunt — все бесплатные каналы. MCP registries дают уникальный built-in distribution. Open-core модель снижает barrier to entry. Enterprise сегмент сложнее — требует content marketing, LinkedIn, conferences, sales cycle. Немного выше QABot (80) благодаря MCP registries как уникальному каналу и hot-topic security content. Не 90+ потому что enterprise сегмент требует longer sales cycle и relationship building.

---

## 5. Персоны

### Персона 1: "Cautious Carlos" — AI Agent Developer (Individual/Startup)

| Характеристика | Описание |
|---|---|
| **Роль** | Full-stack developer, building AI agent product |
| **Компания** | Solo/small startup, 1-5 человек |
| **Возраст** | 25-35 |
| **Технический стек** | LangChain/CrewAI/AutoGen + Claude/GPT APIs + MCP servers |
| **Бюджет на tools** | $100-500/мес на весь dev stack |
| **Текущий подход к security** | Hardcoded API keys в .env файлах, full-permission OAuth tokens, no audit trail, "I'll add security later" |
| **Primary Pain** | Хочет подключить своего агента к Google Drive/Gmail/Calendar пользователей, но понимает, что full OAuth scopes = liability. Один инцидент = потеря всех пользователей и reputation. |
| **Trigger** | First enterprise customer asks "what security controls do you have for agent access?" OR reads about MCP exploit on HN |
| **Current workaround** | Manual OAuth scope restriction + custom middleware + hope for the best |
| **WTP** | $29-79/мес |
| **Decision maker** | Сам |
| **Urgency** | **7/10** — растёт с каждым security инцидентом в новостях |
| **Где тусуется** | GitHub, Hacker News, r/LocalLLaMA, r/programming, Twitter/X AI community, Discord (LangChain, Claude) |

> "I'm building an AI agent that helps users organize their Google Drive, but I'm terrified of the liability if the agent accidentally deletes something or accesses personal files. I need a way to give it read-only access to specific folders only."

---

### Персона 2: "Worried Wendy" — Engineering Manager / Team Lead

| Характеристика | Описание |
|---|---|
| **Роль** | Engineering Manager / VP Engineering |
| **Компания** | Mid-size tech company, 50-300 сотрудников |
| **Возраст** | 32-45 |
| **Контекст** | 15-30% сотрудников уже используют MCP серверы с Claude/Cursor |
| **Бюджет на security tools** | $2,000-15,000/мес |
| **Текущий подход** | Устное правило "don't connect agents to production data", но никто не проверяет. Shared API keys. Нет audit trail. |
| **Primary Pain** | Каждый разработчик подключил Claude/Cursor к корпоративным Google Workspace, Slack, Jira через MCP. Нет видимости, что агенты делают с данными. Один MCP server update = potential data exfiltration. CISO задаёт неудобные вопросы. |
| **Trigger** | CISO audit OR security incident in team OR competitor's AI agent breach makes news |
| **Current workaround** | Spreadsheet с "approved MCP servers" + trust + quarterly manual review |
| **WTP** | $199-499/мес (team license) |
| **Decision maker** | VP Engineering + CISO approval |
| **Urgency** | **8/10** — regulatory pressure + board asking about AI governance |
| **Где тусуется** | LinkedIn, security conferences, Gartner/Forrester reports, CTO/CISO Slack communities |

> "I have 30 developers, and at least 20 of them have connected Claude Code to our Google Workspace via MCP servers. I have zero visibility into what these agents can access. We need a centralized gateway — yesterday."

---

### Персона 3: "Pressured Pavel" — CISO / Head of Security

| Характеристика | Описание |
|---|---|
| **Роль** | CISO / Head of Information Security |
| **Компания** | Enterprise, 500-5,000+ сотрудников |
| **Возраст** | 38-55 |
| **Контекст** | Board mandated AI adoption, but security team wasn't consulted. AI agents multiplying across departments. |
| **Бюджет на AI security** | $10,000-100,000+/мес |
| **Текущий подход** | Blanket "block all MCP connections" policy (productivity killer) OR allow with manual approval per-server |
| **Primary Pain** | 80% сотрудников используют AI agents, но только 47% контролируются. Agents become authorization bypass paths. EU AI Act compliance deadline approaching. Can't say "no" to AI — board wants productivity gains. |
| **Trigger** | Board/CEO pressure for AI governance framework OR regulatory audit OR competitor breach |
| **Current workaround** | CASB tools (not designed for AI agents) + custom policies + manual agent inventory + blocking |
| **WTP** | $999-5,000+/мес (enterprise license) |
| **Decision maker** | CISO + procurement |
| **Urgency** | **9/10** — regulatory deadline + board pressure + expanding attack surface |
| **Где тусуется** | RSA Conference, Black Hat, Gartner Security Summit, LinkedIn, CISO Slack/Discord groups, security vendor briefings |

> "We have 2,000 employees and I can't even tell you how many AI agents are running, what data they access, or who authorized them. This is a compliance nightmare waiting to happen."

---

### Персона 4: "Builder Ben" — AI Startup Founder

| Характеристика | Описание |
|---|---|
| **Роль** | CTO / Co-founder AI startup |
| **Компания** | AI-first startup, 5-20 человек, Series Seed-A |
| **Возраст** | 28-40 |
| **Продукт** | AI agent platform для specific vertical (sales, HR, legal, etc.) |
| **Бюджет на infrastructure** | $5,000-50,000/мес |
| **Текущий подход** | Custom-built permission layer (3 engineers spent 2 months) — fragile, incomplete, doesn't scale |
| **Primary Pain** | Enterprise customers require SOC 2, granular permissions, audit trails. Building this in-house eats engineering time that should go to core product. Every customer asks "can you limit what the agent sees?" |
| **Trigger** | Lost deal because couldn't demonstrate granular access control / SOC 2 readiness |
| **Current workaround** | Custom middleware + OAuth token management + manual audit logs + prayer |
| **WTP** | $299-999/мес (infrastructure cost) |
| **Decision maker** | CTO |
| **Urgency** | **8/10** — directly blocking revenue (enterprise sales) |
| **Где тусуется** | YC community, Twitter/X, Hacker News, AI/ML meetups, founder communities, GitHub |

> "Every enterprise prospect asks: 'Can you limit what your AI agent sees in our Google Drive to just the Sales folder?' Right now, our answer is 'sort of.' We need a proper permission layer — we're wasting engineering cycles building it ourselves."

---

## 6. Demand Signals (подтверждение спроса)

### VC-инвестиции в AI agent security = активный рынок

Рынок AI agent security infrastructure формируется прямо сейчас. Несколько индикаторов:

| Сигнал | Данные |
|---|---|
| AI agent security market 2026 | Nascent category, part of $244B global security spend |
| AI-in-cybersecurity market | $24.8B (2024) → $146.5B (2034) = **6x growth** |
| Agentic AI market | $7.8B (2025) → $199B (2034) = **25x growth, 45% CAGR** |
| Enterprise AI governance budgets | **98%** plan to increase, average **+24%** |
| Gartner: agentic AI project failures | **>40%** will fail by 2027 due to "not enough risk controls" |

### Existing products = validated category

Не менее **7 products** уже запущены или строятся в этом пространстве:

1. **Obot MCP Gateway** — MCP gateway с policies и audit ([obot.ai](https://obot.ai/))
2. **Agentgateway** — Open-source agentic proxy ([GitHub](https://github.com/agentgateway/agentgateway))
3. **MCP Gateway & Registry** — Enterprise registry с OAuth ([GitHub](https://github.com/agentic-community/mcp-gateway-registry))
4. **Gravitee MCP Proxy** — Centralized MCP traffic governance ([gravitee.io](https://www.gravitee.io/blog/mcp-proxy-unified-governance-for-agents-tools))
5. **ContextForge (IBM)** — MCP proxy, 2,300+ GitHub stars ([IBM](https://medium.com/@crivetimihai/mcp-gateway-the-missing-proxy-for-ai-tools-2b16d3b018d5))
6. **Prompt Security MCP Gateway** — Security-focused MCP reverse proxy ([prompt.security](https://prompt.security/blog/security-for-agentic-ai-unveiling-mcp-gateway-mcp-risk-assessment))
7. **Traefik Hub MCP Gateway** — Infrastructure-level MCP governance ([traefik.io](https://doc.traefik.io/traefik-hub/mcp-gateway/guides/getting-started))

Это подтверждает: категория формируется, спрос реален, но рынок ещё не consolidated — window of opportunity открыто.

### Community / Platform Signals

- **MCP SDK downloads:** 97M+/мес — massive developer base
- **MCP servers:** 7,109+ registered, growing rapidly
- **Auth0, WorkOS, Stytch, Cerbos, Oso** — все выпустили blog posts / guides по AI agent permissions в 2025-2026
- **Microsoft, Docker, Palo Alto, CyberArk** — все опубликовали MCP security guides
- **Hacker News:** AI agent sandboxing tools consistently reach frontpage (Matchlock, Amla Sandbox)

---

## 7. Итоговый audience_score

| Параметр | Балл | Вес | Взвешенный балл |
|---|---|---|---|
| Подтверждённая боль (Confirmed Pain) | 92 | 20% | 18.4 |
| Готовность платить (WTP) | 78 | 25% | 19.5 |
| Размер аудитории | 88 | 25% | 22.0 |
| Доступность аудитории | 82 | 15% | 12.3 |
| Качество персон | 85 | 15% | 12.75 |

**Расчёт:** 18.4 + 19.5 + 22.0 + 12.3 + 12.75 = **84.95**

### audience_score = 85 / 100

**Обоснование:** Один из самых сильных audience profiles в пайплайне. Боль подтверждена массово и количественно: 88% организаций с инцидентами, реальные exploits (GitHub MCP, Slack AI, Claude Desktop RCE), десятки цитат разработчиков. WTP сильная благодаря enterprise security budgets ($244B global), regulatory pressure (EU AI Act), и прямой экономике предотвращения ($50/мес vs $4.88M breach). Аудитория огромная (97M MCP downloads, 15M Copilot users) и растёт на 40%+ YoY. Доступность высокая через developer channels + MCP registries как уникальный distribution. Персоны чёткие с разным WTP ($29-5000+/мес), покрывая spectrum от indie developer до enterprise CISO.

**Ограничения:** Open-core модель может замедлить конвертацию free→paid. Enterprise sales cycle длиннее (CISO persona). Самый дешёвый сегмент (individual devs) может ожидать всё бесплатно. Конкуренция формируется (7+ products), но рынок ещё не consolidated.

---

## Источники

### Форумы и прямые цитаты
- [Hacker News — Sandboxing AI agents at the kernel level](https://news.ycombinator.com/item?id=45415814)
- [Hacker News — Matchlock: Secures AI agent workloads with sandbox](https://news.ycombinator.com/item?id=46932343)
- [DEV.to — AI Agents Run Unsandboxed Code](https://dev.to/tan_genie_6a51065da7b63b6/ai-agents-run-unsandboxed-code-how-to-fix-it-2026-1np4)
- [The Hacker News — Who Approved This Agent?](https://thehackernews.com/2026/01/who-approved-this-agent-rethinking.html)
- [The Hacker News — AI Agents Are Becoming Authorization Bypass Paths](https://thehackernews.com/2026/01/ai-agents-are-becoming-privilege.html)

### Security research и статистика
- [Gravitee — State of AI Agent Security 2026 Report](https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control)
- [Obsidian Security — 2025 AI Agent Security Landscape](https://www.obsidiansecurity.com/blog/ai-agent-market-landscape)
- [Obsidian Security — Top AI Agent Security Risks](https://www.obsidiansecurity.com/blog/ai-agent-security-risks)
- [Dark Reading — AI Agents Ignore Security Policies](https://www.darkreading.com/application-security/ai-agents-ignore-security-policies)
- [CyberArk — AI Agents and Identity Risks 2026](https://www.cyberark.com/resources/blog/ai-agents-and-identity-risks-how-security-will-shift-in-2026)
- [Microsoft Security Blog — Securing AI Agents](https://www.microsoft.com/en-us/security/blog/2026/01/23/runtime-risk-realtime-defense-securing-ai-agents/)
- [LayerX — Claude Desktop RCE Vulnerability](https://layerxsecurity.com/blog/claude-desktop-extensions-rce/)
- [Clutch Security — MCP Servers: What We Found](https://www.clutch.security/blog/mcp-servers-what-we-found-when-we-actually-looked)

### MCP protocol и adoption
- [MCP Official — Security Best Practices](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)
- [MCP Blog — One Year of MCP](http://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)
- [MCP Manager — Adoption Statistics 2025](https://mcpmanager.ai/blog/mcp-adoption-statistics/)
- [MCP Evals — MCP Statistics](https://www.mcpevals.io/blog/mcp-statistics)
- [Zuplo — State of MCP Report](https://zuplo.com/mcp-report)
- [Red Hat — MCP Security Risks and Controls](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)
- [Docker — MCP Security Explained](https://www.docker.com/blog/mcp-security-explained/)

### Access control и permissions
- [Auth0 — Access Control in the Era of AI Agents](https://auth0.com/blog/access-control-in-the-era-of-ai-agents/)
- [WorkOS — AI Agent Access Control](https://workos.com/blog/ai-agent-access-control)
- [Stytch — Handling AI Agent Permissions](https://stytch.com/blog/handling-ai-agent-permissions/)
- [Cerbos — MCP Permissions: Securing AI Agent Access to Tools](https://www.cerbos.dev/blog/mcp-permissions-securing-ai-agent-access-to-tools)
- [Oso — Best Practices of Authorizing AI Agents](https://www.osohq.com/learn/best-practices-of-authorizing-ai-agents)

### Market sizing и бюджеты
- [Pragmatic Coders — 200+ AI Agent Statistics 2026](https://www.pragmaticcoders.com/resources/ai-agent-statistics)
- [Fortune Business Insights — Agentic AI Market Size](https://www.fortunebusinessinsights.com/agentic-ai-market-114233)
- [Gartner — 40% Enterprise Apps with AI Agents by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025)
- [PwC — AI Agent Survey](https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-agent-survey.html)
- [G2 — Enterprise AI Agents Report](https://learn.g2.com/enterprise-ai-agents-report)
- [CIO Dive — AI Risk Mitigation Budgets](https://www.ciodive.com/news/AI-risk-mitigation-governance-oversight-data/761385/)
- [Wiz — 2026 CISO Budget Benchmark Report](https://www.wiz.io/reports/ciso-security-budget-benchmark-2026)
- [SecureWorld — Cyber Budget Boom: 99% Increasing](https://www.secureworld.io/industry-news/cyber-budget-boom)
- [IBM — AI Agent Governance Challenges](https://www.ibm.com/think/insights/ai-agent-governance)

### Конкурирующие продукты
- [Obot MCP Gateway](https://obot.ai/)
- [Agentgateway — GitHub](https://github.com/agentgateway/agentgateway)
- [MCP Gateway & Registry — GitHub](https://github.com/agentic-community/mcp-gateway-registry)
- [Gravitee — MCP Proxy](https://www.gravitee.io/blog/mcp-proxy-unified-governance-for-agents-tools)
- [Prompt Security — MCP Gateway](https://prompt.security/blog/security-for-agentic-ai-unveiling-mcp-gateway-mcp-risk-assessment)
- [Traefik Hub — MCP Gateway](https://doc.traefik.io/traefik-hub/mcp-gateway/guides/getting-started)
