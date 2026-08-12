# Stage 2: MARKET — Анализ рынка
# AI Access Proxy Layer — Permission Gateway for AI Agents
> Дата: 2026-02-23
> Целевая аудитория: AI agent developers, компании/team leads, AI-стартапы

---

## 1. Размер рынка (TAM / SAM / SOM)

### TAM (Total Addressable Market) — AI Agent Infrastructure + AI Security + API Management

Продукт находится на пересечении нескольких крупных и быстрорастущих рынков:

**Рынок AI-агентов / Agentic AI:**
- Глобальный рынок AI-агентов оценивается в **$7.55–7.63 млрд в 2025 году** и прогнозируется рост до **$10.86–10.91 млрд в 2026 году**.
- Прогноз на 2033–2034: **$182.97–199.05 млрд** при CAGR **42–49.6%**.
- Gartner прогнозирует, что agentic AI может обеспечить **$450 млрд** дохода от enterprise application software к 2035 году (30% от всех enterprise app revenue, вверх от 2% в 2025).

**Рынок AI Infrastructure:**
- Рынок AI Infrastructure: **$90 млрд в 2026 году**, прогноз — **$465 млрд к 2033 году** при CAGR 24%.

**Рынок AI в кибербезопасности:**
- Глобальный рынок AI in cybersecurity: **$25.35 млрд в 2024 году**, прогноз — **$93.75–134 млрд к 2030 году** при CAGR 21.9–27.8%.
- Generative AI cybersecurity (подсегмент): **$8.65 млрд (2025)** → **$35.50 млрд (2031)**, CAGR 26.5%.

**Рынок API Management / API Gateway:**
- API management market: **$6.85–10.02 млрд в 2025 году**, прогноз — **$32.48–108.61 млрд к 2032–2033 году** при CAGR 24.9–34.7%.
- API Gateway market (подсегмент): **$5.2 млрд (2025)** → **$20.2 млрд (2033)** при CAGR 20.8%.

**Суммарная TAM оценка (пересечение рынков):**

| Рынок | Размер 2025 | Прогноз 2030–2033 | CAGR |
|---|---|---|---|
| AI Agents / Agentic AI | $7.6 млрд | $183–199 млрд | 42–50% |
| AI in Cybersecurity | $25.4 млрд | $94–134 млрд | 22–28% |
| AI Infrastructure | $90 млрд (2026) | $465 млрд (2033) | 24% |
| API Management | $6.9–10 млрд | $32–109 млрд | 25–35% |

> **TAM = $130+ млрд (2025)** — сумма релевантных рынков с учётом overlap. Это один из самых быстрорастущих сегментов IT-индустрии.

**Источники:**
- [Grand View Research — AI Agents Market](https://www.grandviewresearch.com/industry-analysis/ai-agents-market-report)
- [Precedence Research — Agentic AI Market](https://www.precedenceresearch.com/agentic-ai-market)
- [MarketsandMarkets — Agentic AI Market](https://www.marketsandmarkets.com/Market-Reports/agentic-ai-market-208190735.html)
- [Fortune Business Insights — Agentic AI Market](https://www.fortunebusinessinsights.com/agentic-ai-market-114233)
- [Mordor Intelligence — Agentic AI Market](https://www.mordorintelligence.com/industry-reports/agentic-ai-market)
- [Coherent Market Insights — AI Infrastructure Market](https://www.coherentmarketinsights.com/industry-reports/ai-infrastructure-market)
- [Grand View Research — AI in Cybersecurity](https://www.grandviewresearch.com/industry-analysis/artificial-intelligence-cybersecurity-market-report)
- [Lakera — AI Security Trends 2025](https://www.lakera.ai/blog/ai-security-trends)
- [MarketsandMarkets — API Management Market](https://www.marketsandmarkets.com/Market-Reports/api-management-market-178266736.html)
- [Global Growth Insights — API Gateway Market](https://www.globalgrowthinsights.com/market-reports/api-gateway-market-116324)

### SAM (Serviceable Available Market) — AI Agent Security + AI Governance + MCP Ecosystem

SAM фокусируется на подсегменте, напрямую релевантном для AI Access Proxy: контроль доступа AI-агентов к внешним сервисам.

**AI Governance Market:**
- Различные оценки: **$309 млн – $2.5 млрд в 2025 году** (разброс из-за разных определений scope).
- Enterprise AI Governance and Compliance: **$2.5 млрд (2025)** → **$68.2 млрд (2035)** при CAGR 39.4%.
- AI Governance (узкое определение): **$620 млн (2024)** → **$7.38 млрд (2030)** при CAGR 51%.

**Responsible AI Market:**
- **$1.58 млрд (2025)** → **$10.26 млрд (2030)** при CAGR 45.3%.

**Non-Human Identity / AI Agent IAM:**
- IAM market: **$25.96 млрд (2025)** → **$42.61 млрд (2030)** при CAGR 10.4%.
- Non-Human Identity Access Management: **$9.45 млрд (2024)** → **$18.71 млрд (2030)** при CAGR 11.9%.
- Подсегмент AI Agent Identity — **формируется сейчас** (Oasis Security запустила Agentic Access Management; Fabrix Security привлёк $8M seed; Okta добавил AI Agent Identities как категорию).

**MCP Ecosystem (формирующийся рынок):**
- MCP Server Market (оценки): **$2.7 млрд (2025)** → **$5.6 млрд (2034)** при CAGR 8.3%. Альтернативная оценка: **$10.3 млрд (2025)** при CAGR 34.6%.
- 97M+ ежемесячных SDK-скачиваний, 5,800+ MCP серверов, 300+ MCP-клиентов.
- Поддержка от всех ключевых AI-компаний: Anthropic, OpenAI, Google, Microsoft, AWS.
- MCP передан Agentic AI Foundation (AAIF) под Linux Foundation в декабре 2025.

**SAM оценка:**

| Сегмент | Размер 2025 | Прогноз 2030 | CAGR |
|---|---|---|---|
| AI Governance & Compliance | $2.5 млрд | ~$15–68 млрд | 39–51% |
| Responsible AI | $1.58 млрд | $10.26 млрд | 45.3% |
| Non-Human Identity (IAM) | $9.45 млрд | $18.71 млрд | 11.9% |
| MCP Ecosystem | $2.7–10.3 млрд | $5.6+ млрд | 8–35% |

> **SAM = $5–15 млрд (2025)** — рынок AI agent security / governance / permission management. Быстро растёт с CAGR 30–50%.

**Источники:**
- [Precedence Research — AI Governance Market](https://www.precedenceresearch.com/ai-governance-market)
- [Market.us — Enterprise AI Governance and Compliance](https://market.us/report/enterprise-ai-governance-and-compliance-market/)
- [MarketsandMarkets — AI Governance Market](https://www.marketsandmarkets.com/Market-Reports/ai-governance-market-176187291.html)
- [Next Move Strategy Consulting — Responsible AI Market](https://www.nextmsc.com/report/responsible-ai-market-ic3581)
- [MarketsandMarkets — IAM Market](https://www.marketsandmarkets.com/Market-Reports/identity-access-management-iam-market-1168.html)
- [MCP Manager — MCP Adoption Statistics](https://mcpmanager.ai/blog/mcp-adoption-statistics/)
- [MCP Evals — MCP Statistics](https://www.mcpevals.io/blog/mcp-statistics)
- [Pento — A Year of MCP](https://www.pento.ai/blog/a-year-of-mcp-2025-review)
- [CData — 2026 Year for Enterprise-Ready MCP](https://www.cdata.com/blog/2026-year-enterprise-ready-mcp-adoption)

### SOM (Serviceable Obtainable Market) — Реально достижимый рынок

**Расчёт SOM для micro SaaS, ориентированного на AI agent developers и small-to-mid teams:**

| Параметр | Значение | Источник / логика |
|---|---|---|
| AI developers worldwide | 17.4 млн (2025) | Arcade.dev / SlashData |
| Developers using AI tools | 84% (14.6 млн) | StackOverflow 2025 |
| Developers building AI agents | ~5–10% от AI devs = 730K–1.46M | Gartner — 45% orgs use agents, но dev adoption ниже |
| MCP SDK monthly downloads | 97M+ | Pento.ai |
| MCP servers available | 5,800+ | PulseMCP Registry |
| Companies using AI agents in production | 45% организаций | Gartner 2025 |
| Enterprise apps with AI agents (2026) | 40% (up from <5% in 2025) | Gartner prediction |
| Average AI tool spend per developer | $500–3,000/year | DX/GetDX survey |
| Average spend on AI security/governance | ~$200–1,000/year per dev | Estimated 20–30% of AI tool budget |
| Developer-first SaaS для MCP security | **SAM сегмент** ~$146–438M | 730K–1.46M devs * $200–300/yr |
| Реалистичный захват (micro SaaS Year 1–3) | 0.01–0.05% | Типичная доля micro SaaS |
| **SOM (Year 1–3)** | **$15K–$220K ARR** | Conservative estimate для solo founder |

**Более оптимистичный SOM (если enterprise adoption):**

| Сценарий | ARR | Логика |
|---|---|---|
| Conservative (developer-first only) | $15K–$50K | 30–100 devs * $500/yr |
| Base (dev + small teams) | $50K–$220K | 100–400 teams * $550/yr |
| Optimistic (early enterprise) | $220K–$1M | 50–200 teams * $1,100–5,000/yr |

> 45% организаций уже используют AI агентов в production, но лишь 34% имеют AI-specific security controls. Этот разрыв — прямое окно возможностей для AI Access Proxy.

**Источники:**
- [Arcade.dev — Global AI Developer Community Statistics 2025](https://blog.arcade.dev/global-ai-developer-community-statistics)
- [StackOverflow 2025 Developer Survey — AI](https://survey.stackoverflow.co/2025/ai/)
- [Gartner — 40% Enterprise Apps Will Feature AI Agents by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025)
- [DX/GetDX — AI Tooling Budget 2026](https://getdx.com/blog/how-are-engineering-leaders-approaching-2026-ai-tooling-budget/)
- [Acuvity — 2025 State of AI Security](https://acuvity.ai/2025-state-of-ai-security/)

---

## 2. Тренд роста

### Количественные данные

| Показатель | Значение |
|---|---|
| CAGR рынка AI Agents | 42–49.6% (2025–2033) |
| CAGR рынка AI in Cybersecurity | 21.9–27.8% (2024–2030) |
| CAGR рынка AI Governance | 39.4–51% (2025–2030) |
| CAGR рынка API Management | 24.9–34.7% (2025–2033) |
| CAGR рынка Responsible AI | 48.4% (2024–2034) |
| Рост MCP server downloads | 100K → 8M (Nov 2024 → Apr 2025), **80x за 5 месяцев** |
| MCP SDK monthly downloads | 97M+ (1 year after launch) |
| MCP servers available | ~100 (Nov 2024) → 5,800+ (Oct 2025), **58x за 11 месяцев** |
| Enterprise AI agents in production | 12% (2023) → 45% (2025), **3.75x за 2 года** |
| Enterprise apps with AI agents | <5% (2025) → 40% (2026 forecast), **8x за 1 год** |
| AI startup funding (2025) | $238 млрд (47% всего VC) |
| AI/ML tool usage growth | 594.82% (Apr 2023 → Jan 2024) |
| Enterprise GenAI spend | $37 млрд (2025), рост 3.2x за год |
| Gartner: agentic AI spending | Превысит chatbot spending к 2027 |
| Gartner: AI agents B2B purchases | $15 трлн к 2028 |

### Качественные тренды

1. **MCP как стандарт де-факто:** За 1 год MCP прошёл путь от внутреннего эксперимента Anthropic до индустриального стандарта с поддержкой Anthropic, OpenAI, Google, Microsoft, AWS. В декабре 2025 передан Agentic AI Foundation (AAIF) под Linux Foundation. Это определяет будущую инфраструктуру AI-агентов — и продукты вокруг MCP окажутся в центре экосистемы.

2. **Кризис безопасности AI-агентов:** 90% агентов over-permissioned. AI-агенты перемещают данные в 16x больше чем human users. 53% AI-агентов имеют доступ к чувствительной информации. Только 34% enterprises имеют AI-specific security controls. Один compromised integration затронул 700+ организаций в 2025.

3. **MCP security — активно обсуждаемая проблема:** CVE-2025-49596 (CVSS 9.4) — RCE через MCP Inspector proxy. CVE-2025-6514 (CVSS 9.6) — RCE через mcp-remote npm package. Сотни MCP серверов обнаружены c binding к 0.0.0.0. Token passthrough, OAuth confusion, confused deputy attacks — системные проблемы. Lasso, MCP Guardian, Docker MCP Toolkit — ранние попытки решения.

4. **Enterprise AI governance — требование рынка:** Gartner: 40% agentic AI проектов будут отменены к 2027 из-за escalating costs, unclear business value, или **inadequate risk controls**. CIO имеют 3–6 месяцев чтобы определить стратегию AI-агентов. EU AI Act требует compliance к августу 2026. ISO 42001 (AI Management Systems) становится стандартом.

5. **Взрывной рост AI agent platforms:** Microsoft Copilot Studio — 1M+ созданных агентов. Salesforce — $440M "agentic" revenue (2025). ServiceNow приобрёл Moveworks. CrewAI — 32K GitHub stars, 1M monthly downloads. OpenAI Agents SDK — 11K GitHub stars. Каждый из этих агентов нуждается в безопасном доступе к внешним сервисам.

6. **Формирование рынка AI Agent Identity:** Oasis Security запустил Agentic Access Management — "первое identity solution для AI-агентов". Fabrix Security привлёк $8M seed. Okta добавил AI Agent Identities как категорию. Aembit — workload identity для agentic AI. Это валидирует рыночную потребность, но решения пока enterprise-grade и не фокусируются на MCP.

7. **Developer-first тренд:** 17.4M developers используют AI/ML tools. 51% профессиональных разработчиков используют AI tools ежедневно. Playwright MCP — 35K monthly searches, Figma MCP — 23K, GitHub MCP — 17K. Разработчики активно ищут MCP-решения — готовая аудитория.

**Источники:**
- [Gartner — 40% Enterprise Apps with AI Agents by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025)
- [Gartner — Over 40% Agentic AI Projects Canceled by 2027](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)
- [Gartner — AI Agents $15T in B2B Purchases by 2028](https://www.digitalcommerce360.com/2025/11/28/gartner-ai-agents-15-trillion-in-b2b-purchases-by-2028/)
- [Gartner — Strategic Predictions for 2026](https://www.gartner.com/en/articles/strategic-predictions-for-2026)
- [Obsidian Security — AI Agent Market Landscape 2025](https://www.obsidiansecurity.com/blog/ai-agent-market-landscape)
- [Obsidian Security — AI Agent Security Risks](https://www.obsidiansecurity.com/blog/ai-agent-security-risks)
- [Adversa AI — MCP Security TOP 25 Vulnerabilities](https://adversa.ai/mcp-security-top-25-mcp-vulnerabilities/)
- [Stytch — MCP Security](https://stytch.com/blog/mcp-security/)
- [Docker — MCP Horror Stories: Drive-By Localhost Breach](https://www.docker.com/blog/mpc-horror-stories-cve-2025-49596-local-host-breach/)
- [Composio — MCP Vulnerabilities](https://composio.dev/blog/mcp-vulnerabilities-every-developer-should-know)
- [Descope — Top 6 MCP Vulnerabilities](https://www.descope.com/blog/post/mcp-vulnerabilities)
- [Thoughtworks — MCP Impact on 2025](https://www.thoughtworks.com/en-us/insights/blog/generative-ai/model-context-protocol-mcp-impact-2025)
- [Oasis Security — Agentic Access Management Launch](https://www.prnewswire.com/news-releases/oasis-security-launches-agentic-access-management-the-first-identity-solution-built-for-ai-agents-302619375.html)
- [Biometric Update — AI Agents IAM](https://www.biometricupdate.com/202509/ai-agents-prompt-new-approaches-to-identity-and-access-management)
- [Crunchbase — AI Startup Funding 2025](https://news.crunchbase.com/venture/north-american-startup-funding-2025-data-ai-us-investment/)
- [Menlo Ventures — State of GenAI 2025](https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/)
- [MCP Manager — MCP Adoption Statistics](https://mcpmanager.ai/blog/mcp-adoption-statistics/)
- [Warmly — AI Agents Statistics 2026](https://www.warmly.ai/p/blog/ai-agents-statistics)
- [Master of Code — 150+ AI Agent Statistics 2026](https://masterofcode.com/blog/ai-agent-statistics)

---

## 3. Зрелость рынка

### Оценка: Рынок на стадии **"Очень ранний / Pre-Growth" (Early Stage → Early Growth)**

Продукт находится на пересечении нескольких рынков с разной зрелостью:

| Рынок | Стадия зрелости | Обоснование |
|---|---|---|
| API Gateway / Management | **Зрелый** | Устоявшиеся игроки (Kong, Apigee, AWS API Gateway). Стабильный рынок $5–10B. |
| AI in Cybersecurity | **Рост** | Множество игроков, высокий CAGR (22–28%), активное VC-финансирование. |
| AI Agent Platforms | **Ранний рост** | Gartner: <5% → 40% enterprise apps с агентами за 1 год. Формируется, но быстро. |
| AI Agent Security / Governance | **Очень ранний** | Только 34% enterprises имеют AI security controls. Первые специализированные стартапы (Oasis, Lasso, Fabrix). |
| MCP Ecosystem | **Очень ранний** | Протокол запущен Nov 2024. 1 год на рынке. Стандартизация ожидается в 2026. |
| MCP Security / Permission Layer | **Зарождение** | Лишь несколько open-source решений (Lasso Gateway, MCP Guardian). Коммерческих продуктов практически нет. |

### Ключевые индикаторы зрелости

| Индикатор | Состояние | Что это значит |
|---|---|---|
| Количество direct competitors | Очень мало (2–4 early-stage) | Рынок формируется, нет лидеров |
| VC-инвестиции в AI agent security | Высокие (Oasis, Fabrix, Lasso получили funding) | Инвесторы видят потенциал |
| Стандартизация MCP | В процессе (AAIF/Linux Foundation) | Стандарт определяется, early mover advantage |
| Enterprise adoption MCP | Начинается (2026 — "pivotal year") | Окно для b2b-позиционирования |
| Developer awareness | Высокий (97M SDK downloads) | Есть аудитория, нет зрелых решений |
| Switching costs | Очень низкие | Лёгкий вход для пользователей, но и лёгкий уход |
| Pricing models | Не устоялись | Можно экспериментировать |
| Security incidents | Растут (CVE-2025-49596, CVE-2025-6514) | Усиливают спрос, но создают urgency |

### Позиция на Hype Cycle

MCP находится между **Peak of Inflated Expectations** и **Trough of Disillusionment** — массовый хайп 2025 года сопровождается обнаружением серьёзных security-проблем. Это идеальный момент для входа с security-focused решением: хайп создаёт awareness, security-инциденты создают спрос на защиту.

> Gartner прогнозирует, что 40% agentic AI проектов будут отменены к 2027 — большинство из-за security и governance проблем. Это создаёт рынок для инструментов, предотвращающих эти отмены.

**Источники:**
- [Lasso — Open Source MCP Security Gateway](https://www.lasso.security/resources/lasso-releases-first-open-source-security-gateway-for-mcp)
- [Zenity — Securing MCP](https://zenity.io/blog/security/securing-the-model-context-protocol-mcp)
- [Docker — MCP Toolkit and Gateway](https://www.docker.com/blog/mcp-toolkit-gateway-explained/)
- [AIM Research — MCP Gateway Deep Dive](https://skywork.ai/skypage/en/A-Deep-Dive-into-MCP-Gateways-The-Essential-Infrastructure-for-Enterprise-AI-Agents/1971412524392837120)
- [Research AIM Multiple — Centralizing AI Tool Access with MCP Gateway 2026](https://research.aimultiple.com/mcp-gateway/)
- [Mirantis — Securing MCP for Enterprise](https://www.mirantis.com/blog/securing-model-context-protocol-for-mass-enterprise-adoption/)
- [Gartner — Over 40% Agentic AI Projects Canceled by 2027](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)
- [Astrix — State of MCP Server Security 2025](https://astrix.security/learn/blog/state-of-mcp-server-security-2025/)
- [Red Hat — MCP Security Risks and Controls](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)

---

## 4. Регуляторные барьеры и драйверы

### Регуляторные драйверы (попутный ветер)

| Фактор | Сила | Описание |
|---|---|---|
| **EU AI Act (August 2026)** | **Очень сильный** | Дедлайн 2 августа 2026 для high-risk AI systems. Штрафы до **EUR 35 млн или 7% мирового оборота**. Требуются conformity assessments, audit trails, risk management. AI Access Proxy напрямую помогает с compliance. |
| **SOC 2 AI-specific criteria** | **Сильный** | AICPA добавляет AI-specific criteria: model governance, training data provenance, immutable audit trails. Privacy TSC scoped в **85% AI и SaaS сделок**. SOC 2 compliance стоит ~$2.5M для Fortune 500 AI infrastructure. |
| **ISO 42001** | **Средний** | Стандарт AI Management Systems опубликован, становится де-факто сертификацией для enterprise AI governance. Требует аудитируемости AI-процессов. |
| **AI agent over-permissioning crisis** | **Очень сильный** | 90% агентов over-permissioned. 53% имеют доступ к sensitive data. HackerNews (Jan 2026): "AI Agents Are Becoming Authorization Bypass Paths". Растущее awareness создаёт срочный спрос. |
| **MCP security incidents** | **Сильный** | Серия CVE (CVSS 9.4, 9.6) в MCP-инфраструктуре в 2025 году. Каждый инцидент увеличивает market awareness и спрос на security-решения. |
| **NIST AI Risk Management Framework** | **Средний** | Федеральные требования к AI risk management. Обязательны для government contractors, влияют на enterprise standards. |
| **GDPR + Data Privacy** | **Средний** | AI-агенты с доступом к Google Drive/Gmail обрабатывают PII. Нужен audit trail и ability to demonstrate compliance. Прокси-слой с логированием — готовое решение. |

### Регуляторные барьеры (препятствия)

| Фактор | Уровень | Описание |
|---|---|---|
| SOC 2 Type II для продукта | Средний–высокий | Необходим для enterprise-продаж. 6–18 месяцев на получение, $50K–$200K. Барьер для enterprise tier, но не для developer/SMB. |
| OAuth и API Terms of Service | Низкий–средний | Google API ToS, OAuth consent screen approval. Нужна верификация приложения в Google. Может занять 2–4 недели. |
| Data residency requirements | Низкий | Для EU-клиентов может потребоваться EU-hosted instance. Решается self-hosted опцией. |
| Лицензирование | Нет | Не требуются специальные лицензии для security middleware. |

### Ключевой регуляторный инсайт

**EU AI Act deadline (Aug 2026) создаёт time-bound urgency:**
- Компании, использующие AI-агентов в HR, кредитных решениях, образовании — ОБЯЗАНЫ обеспечить audit trail и risk management к августу 2026.
- AI Access Proxy с audit trail, permission control, и rate limiting — **прямой инструмент compliance**.
- Штрафы до 7% мирового оборота создают сильный экономический стимул для покупки.
- Это означает, что **с февраля по август 2026 — окно повышенного спроса** на AI governance tools.

> EU AI Act превращает "nice to have" (AI agent permission control) в "must have" (compliance requirement). Это фундаментально меняет unit economics: из $20/mo developer tool в $200–2,000/mo compliance tool.

**Источники:**
- [EU AI Act — Official Page](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [LegalNodes — EU AI Act 2026 Updates](https://www.legalnodes.com/article/eu-ai-act-2026-updates-compliance-requirements-and-business-risks)
- [SecurePrivacy — EU AI Act 2026 Compliance Guide](https://secureprivacy.ai/blog/eu-ai-act-2026-compliance)
- [Trilateral Research — EU AI Act Timeline](https://trilateralresearch.com/responsible-ai/eu-ai-act-implementation-timeline-mapping-your-models-to-the-new-risk-tiers)
- [Sombra — AI Regulations 2026 Guide](https://sombrainc.com/blog/ai-regulations-2026-eu-ai-act)
- [Indeed Innovation — EU AI Act Compliance 2025](https://www.indeed-innovation.com/the-mensch/eu-ai-act-compliance-2025/)
- [CompAI — SOC 2 for AI Companies](https://trycomp.ai/soc-2-for-ai-companies)
- [Introl — Compliance Frameworks for AI Infrastructure](https://introl.com/blog/compliance-frameworks-ai-infrastructure-soc2-iso27001-gdpr)
- [BrightDefense — SOC 2 for AI Startups](https://www.brightdefense.com/resources/soc-2-for-ai-startups/)
- [HackerNews — AI Agents Authorization Bypass](https://thehackernews.com/2026/01/ai-agents-are-becoming-privilege.html)
- [Palo Alto Networks — Agentic AI Governance Guide](https://www.paloaltonetworks.com/cyberpedia/what-is-agentic-ai-governance)
- [Microsoft — AI Identity and Network Access Security 2026](https://www.microsoft.com/en-us/security/blog/2026/01/20/four-priorities-for-ai-powered-identity-and-network-access-security-in-2026/)
- [Microsoft — Securing AI Agents: Runtime Risk to Real-time Defense](https://www.microsoft.com/en-us/security/blog/2026/01/23/runtime-risk-realtime-defense-securing-ai-agents/)
- [HelpNetSecurity — Enterprises Racing to Secure AI Agents](https://www.helpnetsecurity.com/2026/02/23/ai-agent-security-risks-enterprise/)
- [K&L Gates — EU AI Act Recent Developments](https://www.klgates.com/EU-and-Luxembourg-Update-on-the-European-Harmonised-Rules-on-Artificial-IntelligenceRecent-Developments-1-20-2026)

---

## 5. Спрос со стороны разработчиков и enterprise

### Статистика целевой аудитории

| Показатель | Значение | Источник |
|---|---|---|
| Разработчики, использующие AI/ML tools | 17.4 млн (64% всех devs) | Arcade.dev |
| Разработчики, использующие AI ежедневно | 51% professional devs | StackOverflow 2025 |
| Организации с AI agents в production | 45% | Gartner 2025 |
| Microsoft Copilot Studio: созданные агенты | 1M+ | Microsoft |
| Salesforce agentic revenue | $440M | Salesforce 2025 |
| MCP SDK monthly downloads | 97M+ | Pento.ai |
| MCP servers available | 5,800+ | PulseMCP |
| Playwright MCP monthly searches | 35,000 | Ahrefs via MCP Manager |
| Total MCP server monthly searches (top 20) | 180,000+ | Ahrefs via MCP Manager |
| Enterprises с AI-specific security controls | Только 34% | Acuvity |
| Организации с regular AI security testing | <40% | Obsidian Security |
| IT leaders planning AI cybersecurity investments | 82% | Lakera |

### Ключевые pain points

1. **Over-permissioning:** 90% AI-агентов over-permissioned. Нет granular control — агенты получают полный доступ через API keys. Один compromised API key = доступ ко всей организации.

2. **Отсутствие audit trail:** Когда AI-агент удаляет файл из Google Drive или отправляет email — нет способа узнать что, когда и почему произошло. Для compliance (EU AI Act, SOC 2) audit trail обязателен.

3. **Невозможность быстрой отмены:** Если агент скомпрометирован, единственный способ отозвать доступ — rotate API keys для всего. Нет granular revocation для конкретного агента.

4. **MCP security gaps:** Текущий MCP spec не имеет встроенного permission layer. Token passthrough, OAuth confusion, privilege escalation — системные проблемы протокола. Разработчики ищут middleware решение.

5. **Compliance pressure:** EU AI Act deadline (Aug 2026). SOC 2 AI criteria. ISO 42001. Компании ЗНАЮТ что нужно решение — но рынок не предлагает простого developer-friendly варианта.

**Источники:**
- [Obsidian Security — AI Agent Security Risks](https://www.obsidiansecurity.com/blog/ai-agent-security-risks)
- [Noma Security — Access Control for AI Agents](https://noma.security/resources/access-control-for-ai-agents/)
- [Cerbos — Permission Management for AI Agents](https://www.cerbos.dev/blog/permission-management-for-ai-agents)
- [WorkOS — AI Agent Access Control](https://workos.com/blog/ai-agent-access-control)
- [Glean — Security Permissions-Aware AI](https://www.glean.com/perspectives/security-permissions-aware-ai)
- [Curity — IAM for AI Agents](https://curity.io/blog/identity-and-access-management-for-AI-agents/)
- [WorkOS — MCP Security Risks and Best Practices](https://workos.com/blog/mcp-security-risks-best-practices)
- [Rippling — Agentic AI Security Guide](https://www.rippling.com/blog/agentic-ai-security)
- [Data Science Dojo — MCP Security Risks 2025](https://datasciencedojo.com/blog/mcp-security-risks-and-challenges/)
- [Fluid Attacks — MCP Security](https://fluidattacks.com/blog/model-context-protocol-mcp-security)

---

## 6. Скоринг параметров рынка

### Размер рынка (TAM/SAM/SOM) — **82/100**

| Фактор | Оценка | Обоснование |
|---|---|---|
| TAM | Очень высокий | $130+ млрд (2025) на пересечении AI agents + AI security + API management |
| SAM | Очень высокий | $5–15 млрд — AI governance + agent security + MCP ecosystem |
| SOM | Средний | $15K–$220K ARR (Year 1–3 micro SaaS), до $1M с enterprise tier |
| User base | Очень высокий | 17.4M AI developers, 97M+ MCP SDK downloads/month, 5,800+ MCP servers |
| Growth trajectory | Взрывной | TAM растёт 42–50% CAGR; MCP ecosystem выросла 58x за 11 месяцев |

**Обоснование 82:** Рынок масштабный и взрывной. AI agents market растёт с CAGR 42–50%, AI governance — 39–51%. MCP ecosystem выросла с 0 до 5,800+ серверов за 1 год. 97M monthly SDK downloads подтверждают массовый developer adoption. Два ключевых user base — 17.4M AI developers и 45% enterprises с AI agents в production — обеспечивают огромный потенциал. SOM ограничен типичными micro SaaS constraints (solo founder, limited marketing budget), но enterprise tier расширяет ceiling. Выше 78 (QABot) потому что пересечение рынков шире, growth rates значительно выше (42–50% vs 18–22%), и MCP ecosystem создаёт прямой distribution channel.

---

### Тренд роста — **95/100**

| Фактор | Оценка | Обоснование |
|---|---|---|
| CAGR основного рынка | Взрывной | AI Agents 42–50%, AI Governance 39–51%, Responsible AI 48.4% |
| MCP adoption trajectory | Экспоненциальный | 100K→8M downloads за 5 мес, 100→5,800+ серверов за 11 мес |
| Enterprise adoption | Стремительный | <5% → 40% enterprise apps с агентами за 1 год (Gartner) |
| Security awareness | Критически растёт | CVE 9.4, CVE 9.6 в MCP; 90% агентов over-permissioned |
| Regulatory urgency | Ускоряющийся | EU AI Act Aug 2026 deadline; SOC 2 AI criteria; ISO 42001 |
| VC funding | Рекордный | $238B AI startup funding в 2025 (47% всего VC); AI security hottest vertical |
| Industry convergence | Все крупные players | Anthropic + OpenAI + Google + Microsoft + AWS поддерживают MCP |

**Обоснование 95:** Это один из самых сильных growth stories в текущем tech-рынке. Совпадение 5 мощных трендов: (1) экспоненциальный рост AI-агентов (42–50% CAGR), (2) MCP как стандарт де-факто (поддержка всех major AI companies), (3) кризис безопасности AI-агентов (90% over-permissioned), (4) регуляторный deadline (EU AI Act Aug 2026), (5) рекордное VC-финансирование ($238B в AI). Отличие от любого другого рынка — все тренды усиливают друг друга: больше агентов → больше security проблем → больше регуляторного давления → больше спрос на governance → больше VC-интерес. Это positive feedback loop. Выше 90 (QABot) потому что convergence трендов значительно сильнее, regulatory urgency (EU AI Act deadline) создаёт time-bound demand, и MCP ecosystem growth rate беспрецедентный.

---

### Зрелость рынка — **88/100**

| Фактор | Оценка | Обоснование |
|---|---|---|
| MCP permission/security layer | Зарождение | 2–4 early competitors (Lasso, MCP Guardian), нет коммерческих лидеров |
| AI agent security | Очень ранний | Oasis, Fabrix — seed-stage; 34% enterprises с AI security controls |
| Developer awareness | Высокий | 97M MCP SDK downloads; активный поиск MCP серверов |
| Switching costs | Очень низкие | Proxy-layer — лёгкий plug-and-play |
| Pricing models | Не определены | Возможность определить pricing standard для категории |
| Стандартизация | В процессе | MCP spec evolving; полная стандартизация ожидается 2026 |
| Window of opportunity | Открыто | 6–12 месяцев до появления серьёзных конкурентов |

**Обоснование 88:** Идеальная стадия для входа — рынок формируется, спрос подтверждён (security incidents + regulation), но решений практически нет. Лишь 2–4 early-stage open-source проекта (Lasso MCP Gateway, MCP Guardian). Нет ни одного established commercial product с фокусом на "MCP permission proxy for AI agents". Это "greenfield" — возможность стать category-defining product. Значительно выше 65 (QABot), потому что AI testing market уже имеет 20+ конкурентов с $50–200M funding, а MCP security/permissions — практически пустое поле. Risk: если рынок не материализуется (MCP не станет стандартом) — идея теряет фундамент. Но текущие сигналы (Linux Foundation, все major AI companies) минимизируют этот риск.

---

### Регуляторные барьеры / драйверы — **85/100**

| Фактор | Оценка | Обоснование |
|---|---|---|
| EU AI Act | Очень сильный драйвер | Deadline Aug 2026 — штрафы до 7% оборота. Audit trail = requirement. |
| SOC 2 AI criteria | Сильный драйвер | 85% AI SaaS deals require Privacy TSC. AI-specific criteria добавляются. |
| ISO 42001 | Средний драйвер | Становится стандартом enterprise AI governance. |
| MCP security incidents | Сильный драйвер | CVE серии создают awareness и urgency. |
| Барьер: SOC 2 для продукта | Средний | Нужен для enterprise, но не для developer/SMB tier. |
| Барьер: Google OAuth approval | Низкий | 2–4 недели, не blocker. |
| Барьер: Лицензирование | Нет | Не требуется. |

**Обоснование 85:** Регуляторная среда — один из главных катализаторов этого рынка. EU AI Act (Aug 2026 deadline) буквально превращает AI agent permission control из "nice to have" в legal requirement для EU-компаний. SOC 2 AI-specific criteria усиливают спрос в US/global enterprise. Серия MCP CVE (CVSS 9.4, 9.6) создаёт urgency. При этом barriers to entry для продукта минимальны — не нужны лицензии, не нужен SOC 2 для MVP/developer tier. Значительно выше 70 (QABot) потому что регуляторное давление здесь — прямой demand driver (EU AI Act требует audit trail для AI-систем), а не побочный фактор.

---

## 7. Итоговый market_score

| Параметр | Балл | Вес | Взвешенный |
|---|---|---|---|
| Размер рынка (TAM/SAM/SOM) | 82 | 25% | 20.50 |
| Тренд роста | 95 | 25% | 23.75 |
| Зрелость рынка | 88 | 25% | 22.00 |
| Регуляторные барьеры / драйверы | 85 | 25% | 21.25 |
| **ИТОГО (market_score)** | | **100%** | **87.50** |

### market_score = 88 / 100

---

## 8. Выводы и ключевые инсайты

### Сильные стороны рынка (для micro SaaS)

1. **Взрывные growth rates:** AI agents market 42–50% CAGR, AI governance 39–51% CAGR, MCP ecosystem 58x growth за 11 месяцев. Это один из самых быстрорастущих сегментов в tech.

2. **Greenfield opportunity:** Практически нет commercial products в нише "MCP permission proxy". Lasso (open-source), MCP Guardian (open-source) — единственные ранние попытки. Нет ни одного developer-friendly SaaS с dashboard + audit trail + revocation.

3. **Регуляторный tailwind:** EU AI Act deadline (Aug 2026) превращает compliance в обязательство. SOC 2 AI criteria. ISO 42001. Каждый из этих frameworks требует audit trail и access control для AI-систем — это прямой use case AI Access Proxy.

4. **Подтверждённая боль:** 90% агентов over-permissioned. 53% имеют доступ к sensitive data. Серия CVE (CVSS 9.4, 9.6). 45% организаций используют AI agents, но лишь 34% имеют security controls. Gap = market opportunity.

5. **Мощная distribution platform:** MCP ecosystem с 97M+ monthly SDK downloads и 5,800+ серверов. Публикация в MCP registry = прямой distribution channel к целевой аудитории. Все major AI platforms (OpenAI, Google, Microsoft, Anthropic) поддерживают MCP.

6. **Convergence of buyers:** И developers (хотят безопасно подключать агентов), и enterprises (хотят compliance), и AI startups (хотят security для своих продуктов) — все нуждаются в одном решении. Multi-segment demand.

### Риски рынка (для micro SaaS)

1. **MCP ecosystem risk:** Если MCP не станет доминирующим стандартом (маловероятно с учётом Linux Foundation + major backers, но теоретически возможно), продукт теряет ключевой distribution channel.

2. **Platform risk:** OpenAI, Google, Microsoft, Anthropic могут встроить permission layer напрямую в свои платформы. "Feature, not a product" risk. Mitigation: open-core model + self-hosted вариант + multi-platform support.

3. **Enterprise sales cycle:** B2B enterprise tier подразумевает длинный sales cycle (3–6 месяцев). Mitigation: developer-first PLG (product-led growth) + freemium tier.

4. **Security product trust:** Продукт для безопасности должен сам быть безопасным. Один breach = потеря доверия. Нужен security-first engineering с самого начала.

5. **Timing risk (early market):** 40% agentic AI проектов будут отменены к 2027 (Gartner). Если market hype спадёт раньше, чем продукт наберёт critical mass — risk of being "too early".

### Рекомендация для следующих этапов

Рынок **исключительно благоприятен** для AI Access Proxy. Это один из самых сильных market scores в pipeline (88/100). Ключевые факторы успеха:

- **Timing:** Войти в рынок сейчас (Q1 2026), пока нет commercial leaders. EU AI Act deadline Aug 2026 создаёт 6-месячное окно повышенного спроса.
- **MCP-first:** Позиционироваться как "the MCP permission layer" — опубликовать в MCP registries, интегрировать со всеми major MCP clients.
- **Developer-first PLG:** Free tier для individual developers → Team tier для small teams → Enterprise tier с SOC 2 compliance.
- **Open-core advantage:** Open-source core для trust + community adoption; commercial tier для audit, advanced permissions, SLA.
- **Security-by-design:** Audit trail, encryption, zero-trust — с Day 1. Это не feature, а core value proposition.

---

## Источники (полный список)

### Рыночные отчёты — AI Agents / Agentic AI
- [Grand View Research — AI Agents Market Report](https://www.grandviewresearch.com/industry-analysis/ai-agents-market-report)
- [Grand View Research — Enterprise Agentic AI Market](https://www.grandviewresearch.com/industry-analysis/enterprise-agentic-ai-market-report)
- [Precedence Research — Agentic AI Market](https://www.precedenceresearch.com/agentic-ai-market)
- [MarketsandMarkets — Agentic AI Market](https://www.marketsandmarkets.com/Market-Reports/agentic-ai-market-208190735.html)
- [MarketsandMarkets — AI Agents Market](https://www.marketsandmarkets.com/Market-Reports/ai-agents-market-15761548.html)
- [Fortune Business Insights — Agentic AI Market](https://www.fortunebusinessinsights.com/agentic-ai-market-114233)
- [Mordor Intelligence — Agentic AI Market](https://www.mordorintelligence.com/industry-reports/agentic-ai-market)
- [MarkNTel Advisors — AI Agent Market](https://www.marknteladvisors.com/research-library/ai-agent-market.html)

### AI Security / Cybersecurity
- [Grand View Research — AI in Cybersecurity Market](https://www.grandviewresearch.com/industry-analysis/artificial-intelligence-cybersecurity-market-report)
- [Mordor Intelligence — AI Cybersecurity Solutions Market](https://www.mordorintelligence.com/industry-reports/ai-cybersecurity-solutions-market)
- [MarketsandMarkets — Generative AI Cybersecurity Market](https://www.marketsandmarkets.com/Market-Reports/generative-ai-cybersecurity-market-164202814.html)
- [Lakera — AI Security Trends 2025](https://www.lakera.ai/blog/ai-security-trends)
- [Obsidian Security — AI Agent Market Landscape 2025](https://www.obsidiansecurity.com/blog/ai-agent-market-landscape)
- [Obsidian Security — AI Agent Security Risks](https://www.obsidiansecurity.com/blog/ai-agent-security-risks)
- [Acuvity — 2025 State of AI Security](https://acuvity.ai/2025-state-of-ai-security/)

### AI Governance / Responsible AI
- [Precedence Research — AI Governance Market](https://www.precedenceresearch.com/ai-governance-market)
- [Market.us — Enterprise AI Governance and Compliance](https://market.us/report/enterprise-ai-governance-and-compliance-market/)
- [MarketsandMarkets — AI Governance Market](https://www.marketsandmarkets.com/Market-Reports/ai-governance-market-176187291.html)
- [Grand View Research — AI Governance Market](https://www.grandviewresearch.com/industry-analysis/ai-governance-market-report)
- [Next Move Strategy Consulting — Responsible AI Market](https://www.nextmsc.com/report/responsible-ai-market-ic3581)
- [Knowledge Sourcing — Responsible AI Market Report](https://www.knowledge-sourcing.com/report/responsible-ai-market)
- [Deloitte — State of AI in Enterprise 2026](https://www.deloitte.com/cz-sk/en/issues/generative-ai/state-of-ai-in-enterprise.html)

### MCP Ecosystem
- [Thoughtworks — MCP Impact on 2025](https://www.thoughtworks.com/en-us/insights/blog/generative-ai/model-context-protocol-mcp-impact-2025)
- [CData — 2026 Year for Enterprise-Ready MCP](https://www.cdata.com/blog/2026-year-enterprise-ready-mcp-adoption)
- [Pento — A Year of MCP: From Internal Experiment to Industry Standard](https://www.pento.ai/blog/a-year-of-mcp-2025-review)
- [Zuplo — State of MCP Report](https://zuplo.com/mcp-report)
- [MCP Manager — MCP Adoption Statistics](https://mcpmanager.ai/blog/mcp-adoption-statistics/)
- [MCP Evals — MCP Statistics](https://www.mcpevals.io/blog/mcp-statistics)
- [Equinix — What Is MCP? Enabling Agentic AI](https://blog.equinix.com/blog/2025/08/06/what-is-the-model-context-protocol-mcp-how-will-it-enable-the-future-of-agentic-ai/)
- [Dave Patten — MCP's Next Phase: Nov 2025 Specification](https://medium.com/@dave-patten/mcps-next-phase-inside-the-november-2025-specification-49f298502b03)
- [DEV Community — Predictions for MCP in 2026](https://dev.to/blackgirlbytes/my-predictions-for-mcp-and-ai-assisted-coding-in-2026-16bm)
- [Gartner insights on MCP 2025](https://www.k2view.com/blog/mcp-gartner/)

### MCP Security
- [Adversa AI — MCP Security TOP 25 Vulnerabilities](https://adversa.ai/mcp-security-top-25-mcp-vulnerabilities/)
- [Stytch — Securing MCP](https://stytch.com/blog/mcp-security/)
- [Red Hat — MCP Security Risks and Controls](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)
- [Docker — MCP Horror Stories: CVE-2025-49596](https://www.docker.com/blog/mpc-horror-stories-cve-2025-49596-local-host-breach/)
- [Composio — MCP Vulnerabilities](https://composio.dev/blog/mcp-vulnerabilities-every-developer-should-know)
- [Descope — Top 6 MCP Vulnerabilities](https://www.descope.com/blog/post/mcp-vulnerabilities)
- [Fluid Attacks — MCP Security](https://fluidattacks.com/blog/model-context-protocol-mcp-security)
- [Data Science Dojo — MCP Security Risks 2025](https://datasciencedojo.com/blog/mcp-security-risks-and-challenges/)
- [Astrix — State of MCP Server Security 2025](https://astrix.security/learn/blog/state-of-mcp-server-security-2025/)
- [WorkOS — MCP Security Risks Best Practices](https://workos.com/blog/mcp-security-risks-best-practices)
- [Lasso — Open Source MCP Security Gateway](https://www.lasso.security/resources/lasso-releases-first-open-source-security-gateway-for-mcp)
- [Zenity — Securing MCP Deep Dive](https://zenity.io/blog/security/securing-the-model-context-protocol-mcp)

### AI Agent Access Control / IAM
- [Noma Security — Access Control for AI Agents](https://noma.security/resources/access-control-for-ai-agents/)
- [Cerbos — Permission Management for AI Agents](https://www.cerbos.dev/blog/permission-management-for-ai-agents)
- [WorkOS — AI Agent Access Control](https://workos.com/blog/ai-agent-access-control)
- [Curity — IAM for AI Agents](https://curity.io/blog/identity-and-access-management-for-AI-agents/)
- [Glean — Security Permissions-Aware AI](https://www.glean.com/perspectives/security-permissions-aware-ai)
- [Oasis Security — Agentic Access Management](https://www.prnewswire.com/news-releases/oasis-security-launches-agentic-access-management-the-first-identity-solution-built-for-ai-agents-302619375.html)
- [Biometric Update — AI Agents and IAM](https://www.biometricupdate.com/202509/ai-agents-prompt-new-approaches-to-identity-and-access-management)
- [MarketsandMarkets — IAM Market](https://www.marketsandmarkets.com/Market-Reports/identity-access-management-iam-market-1168.html)
- [IDSA — IAM in the AI Era 2025](https://www.idsalliance.org/blog/identity-and-access-management-in-the-ai-era-2025-guide/)

### API Gateway / Management
- [MarketsandMarkets — API Management Market](https://www.marketsandmarkets.com/Market-Reports/api-management-market-178266736.html)
- [Grand View Research — API Management Market](https://www.grandviewresearch.com/industry-analysis/application-programing-interface-api-management-market)
- [Global Growth Insights — API Gateway Market](https://www.globalgrowthinsights.com/market-reports/api-gateway-market-116324)
- [Coherent Market Insights — API Management Market](https://www.coherentmarketinsights.com/industry-reports/api-management-market)

### Gartner Predictions
- [Gartner — 40% Enterprise Apps with AI Agents by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025)
- [Gartner — Over 40% Agentic AI Projects Canceled by 2027](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)
- [Gartner — AI Agents $15T B2B Purchases by 2028](https://www.digitalcommerce360.com/2025/11/28/gartner-ai-agents-15-trillion-in-b2b-purchases-by-2028/)
- [Gartner — Strategic Predictions for 2026](https://www.gartner.com/en/articles/strategic-predictions-for-2026)
- [Gartner — Top Technology Trends 2026](https://www.gartner.com/en/newsroom/press-releases/2025-10-20-gartner-identifies-the-top-strategic-technology-trends-for-2026)
- [Gartner — Agentic AI Overtakes Chatbot Spending by 2027](https://softwarestrategiesblog.com/2026/02/16/gartner-forecasts-agentic-ai-overtakes-chatbot-spending-2027/)

### Regulatory / Compliance
- [EU AI Act Official Page](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [EU AI Act Implementation Timeline](https://artificialintelligenceact.eu/implementation-timeline/)
- [LegalNodes — EU AI Act 2026 Updates](https://www.legalnodes.com/article/eu-ai-act-2026-updates-compliance-requirements-and-business-risks)
- [SecurePrivacy — EU AI Act 2026 Compliance](https://secureprivacy.ai/blog/eu-ai-act-2026-compliance)
- [Trilateral Research — EU AI Act Timeline](https://trilateralresearch.com/responsible-ai/eu-ai-act-implementation-timeline-mapping-your-models-to-the-new-risk-tiers)
- [Indeed Innovation — EU AI Act Compliance 2025](https://www.indeed-innovation.com/the-mensch/eu-ai-act-compliance-2025/)
- [Sombra — AI Regulations 2026](https://sombrainc.com/blog/ai-regulations-2026-eu-ai-act)
- [CompAI — SOC 2 for AI Companies](https://trycomp.ai/soc-2-for-ai-companies)
- [Introl — Compliance Frameworks for AI Infrastructure](https://introl.com/blog/compliance-frameworks-ai-infrastructure-soc2-iso27001-gdpr)
- [BrightDefense — SOC 2 for AI Startups](https://www.brightdefense.com/resources/soc-2-for-ai-startups/)
- [HackerNews — AI Agents Authorization Bypass Paths](https://thehackernews.com/2026/01/ai-agents-are-becoming-privilege.html)

### VC Funding / Market Dynamics
- [Crunchbase — North American Startup Funding 2025](https://news.crunchbase.com/venture/north-american-startup-funding-2025-data-ai-us-investment/)
- [Crunchbase — Big AI Funding Trends 2025](https://news.crunchbase.com/ai/big-funding-trends-charts-eoy-2025/)
- [TechCrunch — 49 US AI Startups $100M+ in 2025](https://techcrunch.com/2025/11/26/here-are-the-49-us-ai-startups-that-have-raised-100m-or-more-in-2025/)
- [TechCrunch — 17 US AI Companies $100M+ in 2026](https://techcrunch.com/2026/02/17/here-are-the-17-us-based-ai-companies-that-have-raised-100m-or-more-in-2026/)
- [Foundation Capital — Where AI is Headed in 2026](https://foundationcapital.com/where-ai-is-headed-in-2026/)

### Developer / Enterprise Statistics
- [Arcade.dev — Global AI Developer Community Statistics 2025](https://blog.arcade.dev/global-ai-developer-community-statistics)
- [StackOverflow 2025 Developer Survey — AI](https://survey.stackoverflow.co/2025/ai/)
- [Warmly — AI Agents Statistics 2026](https://www.warmly.ai/p/blog/ai-agents-statistics)
- [Master of Code — 150+ AI Agent Statistics 2026](https://masterofcode.com/blog/ai-agent-statistics)
- [Index.dev — AI Agents Statistics 2025](https://www.index.dev/blog/ai-agents-statistics)
- [Microsoft — Global AI Adoption 2025](https://www.microsoft.com/en-us/corporate-responsibility/topics/ai-economy-institute/reports/global-ai-adoption-2025/)
- [Salesmate — AI Agent Trends for 2026](https://www.salesmate.io/blog/future-of-ai-agents/)
- [Coherent Market Insights — AI Infrastructure Market](https://www.coherentmarketinsights.com/industry-reports/ai-infrastructure-market)
