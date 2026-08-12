# Product Requirements Document
# Scopegate Cloud — Granular Permission Gateway for AI Agents

> Version: 1.0
> Date: 2026-02-25
> Status: Draft

---

## 1. Executive Summary

Scopegate Cloud — это SaaS-версия open-source проекта Scopegate. Продукт представляет собой permission gateway между AI-агентами и внешними сервисами: позволяет задавать granular scopes для каждого агента, выдаёт MCP-endpoint, логирует все действия и обеспечивает мгновенный отзыв доступа.

**Позиционирование:** "The Stripe of AI agent permissions. Connect services, define scopes per agent, get an MCP endpoint — in under 5 minutes."

**Итоговый скоринг идеи:** 73/100 — CONDITIONAL GO
**Ключевые метрики рынка:** TAM $130B+, 97M+ monthly MCP SDK downloads, 88% организаций с AI security инцидентами, EU AI Act enforcement — август 2026.

---

## 2. Проблема

### 2.1 Корневая проблема

AI-агенты (Claude, GPT, custom agents) получают доступ к внешним сервисам через API-ключи или OAuth-токены с **полными правами**. Нет механизма, который позволял бы:

- Ограничить агента до read-only или конкретной папки / лейбла
- Выдать разным агентам разные права на один и тот же сервис
- Видеть полный audit trail: что агент делал, с какими параметрами
- Мгновенно отозвать доступ агента ко всем сервисам одним действием

### 2.2 Масштаб боли (подтверждённые данные)

| Метрика | Значение |
|---|---|
| Организации с AI agent security инцидентами | **88%** |
| MCP серверов с dangerous default configs | **>90%** |
| Компаний с AI security controls | Только **34%** |
| Команд с полным security-одобрением AI агентов | Только **14.4%** |
| Организаций, использующих shared API keys для агентов | **45.6%** |

### 2.3 Реальные инциденты

- **GitHub MCP Exploit** (май 2025) — malicious commands в Issues угнали приватный код и ключи через AI агентов
- **Slack AI Data Exfiltration** (авг 2024) — prompt injection переслал sensitive conversations на внешний адрес
- **Claude Desktop RCE** (2025) — Extensions дали 10,000+ пользователям remote code execution с full host privileges
- **ServiceNow Agent Exploit** (ноя 2025) — agent-to-agent injection эксфильтровал корпоративные данные

### 2.4 Regulatory Pressure

EU AI Act enforcement начинается **2 августа 2026**. Article 14 требует human oversight для high-risk AI систем. Нарушение — штраф до **7% от global revenue**. Это создаёт deadline-driven demand в Q2-Q3 2026.

---

## 3. Решение

Scopegate Cloud — cloud-hosted permission proxy layer. Схема работы:

```
AI Agent → [Scopegate MCP Endpoint] → [Permission Engine] → External Service API
                                              ↓
                                        Audit Log
```

**Ключевые функции:**
1. **OAuth connect** — подключение внешних сервисов через стандартный OAuth flow
2. **Per-agent scopes** — каждый агент получает уникальный permission profile (read-only, specific folders, rate limits)
3. **MCP endpoint generation** — авто-генерация уникального MCP endpoint URL per agent
4. **Audit trail** — логирование всех действий агента с параметрами и статусами
5. **Instant revocation** — мгновенный отзыв доступа агента ко всем сервисам одним кликом
6. **Rate limiting** — per-agent, per-service лимиты запросов

---

## 4. Целевая аудитория

### 4.1 Персоны

#### Персона 1: "Cautious Carlos" — AI Agent Developer (Individual/Startup)
- Indie developer или small startup (1-5 чел), строит AI agent продукт
- **Pain:** Хочет подключить агента к Google Drive/Gmail пользователей, но full OAuth scopes = liability
- **Trigger:** Enterprise клиент спрашивает "какие security controls у вас есть?" ИЛИ читает про MCP exploit на HN
- **WTP:** $29-79/мес
- **Decision maker:** Сам
- **Urgency:** 7/10

#### Персона 2: "Worried Wendy" — Engineering Manager / Team Lead
- Mid-size tech company, 50-300 сотрудников
- **Pain:** 15-30% сотрудников уже используют MCP серверы с Claude/Cursor к корпоративным данным. Нет видимости. CISO задаёт вопросы.
- **Trigger:** CISO audit ИЛИ security incident в команде
- **WTP:** $199-499/мес
- **Decision maker:** VP Engineering + CISO
- **Urgency:** 8/10

> "I have 30 developers, and at least 20 of them have connected Claude Code to our Google Workspace via MCP servers. I have zero visibility into what these agents can access. We need a centralized gateway — yesterday."

#### Персона 3: "Pressured Pavel" — CISO / Head of Security
- Enterprise, 500-5,000+ сотрудников
- **Pain:** Board требует AI adoption, но security team не консультировалась. Agents everywhere, zero control. EU AI Act deadline.
- **WTP:** $999-5,000+/мес
- **Urgency:** 9/10

#### Персона 4: "Builder Ben" — AI Startup CTO
- AI-first startup, 5-20 чел, Seed-A
- **Pain:** Enterprise клиенты требуют SOC 2, granular permissions, audit trails. Custom build занял 3 инженеров на 2 месяца, всё равно неполный.
- **WTP:** $299-999/мес
- **Urgency:** 8/10

> "Every enterprise prospect asks: 'Can you limit what your AI agent sees in our Google Drive to just the Sales folder?' Right now, our answer is 'sort of.'"

---

## 5. Конкурентный ландшафт

### 5.1 Конкурентная позиция

```
                    Enterprise-First
                         |
            Keycard      |      Aembit
            ($38M)       |      ($45M)
                         |
         Traefik --------|-------- Zenity
         Hub             |         ($59.5M)
                         |
   Permission-     ------|------     Integration-
   First                 |           First
                         |
     [SCOPEGATE    ------|-------- Composio
      CLOUD]             |         ($29M)
                         |
         MetaMCP --------|-------- Arcade
         (OSS)           |         (YC)
                         |
                    Developer-First
```

**Scopegate Cloud занимает уникальную позицию:** permission-first × developer-first. Ни один конкурент не находится в этом квадранте.

### 5.2 Конкурентные GAPs (что мы закрываем)

| Gap | Состояние рынка | Наше решение |
|---|---|---|
| Developer self-service MCP permission proxy | **Не существует** | 5-минутный onboarding, visual dashboard |
| Per-agent, per-service granular scope control | Только team/org-level RBAC | Permission engine с per-agent профилями |
| Open-core с self-hosted parity | Cloud-only (Keycard, Arcade) ИЛИ OSS без features (MetaMCP) | Полный feature parity в обоих режимах |
| Instant cross-service revocation | Long-lived tokens, per-service revoke | One-click, все сервисы, мгновенно |
| Cross-service permission dashboard | Нет нигде | Unified view: "что может агент X" |
| SMB/developer pricing $20-50/мес | Enterprise-only или per-execution | Transparent tiers от $29/мес |

---

## 6. Тарифная сетка

| | **Free** | **Pro** | **Team** | **Enterprise** |
|---|---|---|---|---|
| **Цена** | $0/мес | $29/мес | $149/мес | Custom ($500–5,000+) |
| **Persona** | Cautious Carlos (прототипирование) | Carlos + Ben (продакшн инди) | Wendy (команды) | Pavel (CISO, enterprise) |
| **Organizations** | 1 | 1 | 1 | Unlimited |
| **Подключённые сервисы** | 2 | 10 | 50 | Unlimited |
| **AI Agents** | 2 | 15 | 100 | Unlimited |
| **API запросов/мес** | 5,000 | 100,000 | 1,000,000 | Unlimited (fair use) |
| **MCP Endpoints** | 1 | 5 | 25 | Unlimited |
| **Audit Log retention** | 7 дней | 30 дней | 90 дней | 1 год+ |
| **Per-agent scope control** | Basic (read/write) | Granular (folder-level) | Granular + custom policies | Full ABAC/RBAC |
| **Rate limiting** | Fixed (100 req/min) | Configurable per agent | + alerts | + auto-throttle + webhooks |
| **Instant revocation** | ✅ | ✅ | ✅ + bulk revoke | ✅ + emergency kill-switch |
| **Cross-service dashboard** | Basic | Full | Full + team views | Full + org-wide + CISO view |
| **SSO / SCIM** | — | — | SAML SSO | SAML/OIDC SSO + SCIM |
| **Self-hosted** | OSS core | — | — | ✅ full parity |
| **Support** | GitHub Issues | Email 48h | Priority 24h | Dedicated Slack + 4h SLA |
| **Compliance** | — | — | SOC 2 report access | SOC 2 + EU AI Act pack |
| **Overage** | Hard cap | $3/10K req | $2/10K req | Negotiated |

---

## 7. Требования к продукту

### 7.1 MVP (v1.0) — Must Have

#### 7.1.1 Аутентификация и организации
- [ ] Регистрация / логин через email + password
- [ ] Google OAuth login
- [ ] Organization — workspace с несколькими members
- [ ] OrganizationMember roles: `owner`, `admin`, `member`
- [ ] Subscription — привязка организации к тарифному плану (через Stripe)

#### 7.1.2 Подключение сервисов (Service Connections)
- [ ] OAuth connect: **Google Drive** (drive.readonly, drive.file scopes)
- [ ] OAuth connect: **Google Gmail** (gmail.readonly, gmail.send scopes)
- [ ] OAuth connect: **Google Calendar** (calendar.readonly, calendar.events scopes)
- [ ] OAuth connect: **Google Sheets** (spreadsheets.readonly, spreadsheets scopes)
- [ ] Отображение подключённых аккаунтов с email и статусом токена
- [ ] OAuth token refresh (автоматический)
- [ ] Отключение / удаление service connection

#### 7.1.3 Permission Engine (Per-Agent Scopes)
- [ ] Создание MCP Endpoint с привязкой к service connection
- [ ] Конфигурация scopes: read-only / read-write / custom (по набору OAuth scopes)
- [ ] Folder-level permissions для Google Drive (specify folder ID)
- [ ] Rate limit per endpoint: requests/minute, configurable
- [ ] isActive toggle: мгновенно включить / выключить endpoint
- [ ] Unique API key per endpoint (auto-generated, regeneratable)

#### 7.1.4 MCP Proxy Layer
- [ ] MCP endpoint: `POST /api/mcp/{apiKey}` обрабатывает MCP protocol (SSE / Streamable HTTP)
- [ ] Permission enforcement: каждый tool call проверяется против scope конфигурации
- [ ] Request proxying: valid requests forwarded to service API, invalid — rejected с error
- [ ] Rate limit enforcement на уровне proxy
- [ ] Ошибки sanitized (не пропускают internal details в ответ агенту)

#### 7.1.5 Audit Trail
- [ ] Логирование каждого MCP tool call: endpoint, action, params, status, error, duration, timestamp
- [ ] Pagination / фильтрация audit logs в dashboard
- [ ] Retention по плану (7/30/90/365 дней)

#### 7.1.6 Instant Revocation
- [ ] Toggle isActive на endpoint — мгновенно блокирует все последующие запросы
- [ ] Revocation записывается в audit log
- [ ] Bulk revoke для Team/Enterprise (все endpoints проекта)

#### 7.1.7 Web Dashboard
- [ ] Onboarding flow: connect service → create agent → copy MCP endpoint (< 5 min)
- [ ] Projects list / create / delete
- [ ] Service connections management (per project)
- [ ] Endpoints list: status, last activity, request count
- [ ] Endpoint detail: scope config, rate limits, audit logs
- [ ] Cross-service permission view: "что может этот агент" — единая таблица
- [ ] Settings: профиль, API keys, billing

#### 7.1.8 Billing
- [ ] Stripe Checkout для Pro / Team / Enterprise
- [ ] Stripe Customer Portal (управление подпиской)
- [ ] Stripe Webhooks: subscription.created, updated, deleted, payment_failed
- [ ] Plan limits enforcement (service count, agent count, request count)
- [ ] Usage metering (API requests per billing period)
- [ ] Hard cap / overage flow для Free tier

#### 7.1.9 Landing Page
- [ ] Hero с value prop и demo video
- [ ] Features секция (4 дифференциатора)
- [ ] Pricing таблица
- [ ] Testimonials / социальное доказательство (после первых клиентов)
- [ ] CTA: "Start free" → signup
- [ ] SEO-оптимизация под "MCP gateway", "MCP security", "AI agent permissions"

---

### 7.2 v1.1 — Month 2-3

- [ ] **Slack integration** (OAuth, messages.read, chat.write scopes)
- [ ] **Notion integration** (pages.read, databases.read, pages.write)
- [ ] **OpenRouter integration** (API key connector, model access scoping)
- [ ] Twitter/X connector (улучшенный, с per-agent scope)
- [ ] LinkedIn connector (улучшенный)
- [ ] Google Ads connector
- [ ] Google Search Console connector
- [ ] **Automated anomaly alerts** (spike в запросах → email/webhook)
- [ ] **Docker image** (для self-hosted деплоя, targeting "docker mcp gateway" SEO)
- [ ] Audit log export (CSV / JSON)
- [ ] Team invitations (email invite flow для organization members)

---

### 7.3 v1.2 — Month 3-4

- [ ] **GitHub integration** (repo read, issues read/write, PR read)
- [ ] **Jira integration** (issues read/write, projects read)
- [ ] **AWS integration** (S3 read, specific bucket/prefix scoping)
- [ ] **Self-hosted deployment guide** + Helm chart
- [ ] **SSO/SAML** для Team тира
- [ ] **SCIM provisioning** для Enterprise
- [ ] **Emergency kill-switch** — отозвать ВСЕ endpoints организации одним действием
- [ ] SOC 2 preparation: access logs в immutable storage, encryption at rest/transit documentation
- [ ] **API key management** — programmatic access к платформе (для Builder Ben use case)
- [ ] **Webhook notifications** (endpoint revocation, rate limit hit, anomaly detected)

---

### 7.4 v2.0 — Month 5-6

- [ ] **CISO Dashboard** — org-wide view: все агенты, все сервисы, compliance status
- [ ] **EU AI Act Compliance Pack** — audit reports в формате для compliance audit
- [ ] **Time-based access** — endpoint auto-expires after N hours (для CI/CD use case)
- [ ] **ABAC policies** — attribute-based access control для сложных enterprise сценариев
- [ ] **SOC 2 Type II certification**
- [ ] **ISO 42001 compliance documentation**
- [ ] **Partner API** — для embedding Scopegate в другие AI agent platforms
- [ ] **Usage analytics** — тренды запросов, топ actions per agent
- [ ] **Anomaly detection** ML-модель (baseline поведения per agent)

---

## 8. Технический стек

| Слой | Технология |
|---|---|
| **Runtime** | Node.js / TypeScript |
| **Web Framework** | Next.js 15 (App Router) |
| **MCP Layer** | `@modelcontextprotocol/sdk` |
| **UI** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL (Prisma ORM) |
| **Cache / Rate Limiting** | Redis (Upstash serverless) |
| **Auth** | better-auth |
| **Payments** | Stripe |
| **Hosting** | Hetzner VPS / Vercel |
| **Open-source repo** | GitHub (open-core) |

### 8.1 Prisma Schema (Cloud-specific models)

```
Plan          — тарифный план с лимитами и Stripe price IDs
Organization  — мультитенантный workspace
OrganizationMember — user-org membership с ролями (owner/admin/member)
Subscription  — org → plan binding с Stripe integration
Project       — связан с Organization (organizationId FK)
```

---

## 9. Ограничения и non-goals для MVP

### Non-goals (v1.0)

- Поддержка протоколов, отличных от MCP (REST, GraphQL — v2+)
- SSO/SAML — только Team tier, v1.2
- SOC 2 certification — v2.0
- Mobile app — не планируется
- On-premise installer с GUI — только Docker Compose, v1.1
- AI-powered anomaly detection — v2.0
- Partner / reseller program — v2+
- Integrations с Salesforce, HubSpot, SAP — Enterprise roadmap

### Ограничения MVP

- **Google OAuth verification** может занять 2-8 недель для restricted scopes (Gmail, Drive). Митигация: запуск в testing mode (100 пользователей), параллельно подать verification request в Day 1.
- **Масштаб:** single-region деплой на старте, multi-region — после $30K MRR
- **Audit log search:** full-text search — v1.1, базовая фильтрация — v1.0

---

## 10. Метрики успеха

### 10.1 Acquisition

| Метрика | Target Month 1-3 | Target Month 6 | Kill Signal |
|---|---|---|---|
| GitHub stars (open-core) | 500+ | 3,000+ | < 100 на Month 3 |
| Free signups | 200+ | 2,000+ | < 50 |
| Active users (connected ≥1 service) | 50+ | 500+ | < 20 |

### 10.2 Revenue

| Метрика | Target | Kill Signal |
|---|---|---|
| First paying customer | Month 1 (week 5-8) | Нет в Month 2 |
| $1K MRR | Month 3 | Нет на Month 4 |
| $5K MRR | Month 4 | — |
| $10K MRR | Month 5 | Плато < $3K на 3+ мес |
| $25K MRR | Month 6 | — |

### 10.3 Product Health

| Метрика | Target | Kill Signal |
|---|---|---|
| Free → Paid conversion | 5-8% | < 3% |
| Monthly churn | < 5% (Pro), < 3% (Team) | > 8% |
| NPS | 40+ | < 20 |
| Time-to-first-MCP-endpoint | < 5 мин | > 15 мин |
| Security incidents | 0 | Любой breach = existential |

---

## 11. Go-to-Market

### 11.1 Launch Channels (Week 1-2)

| Канал | Действие | Цель |
|---|---|---|
| **GitHub** | Open-source repo, README с architecture diagram | 200+ stars, 50 signups |
| **Hacker News** | Show HN: "Granular permissions for AI agents via MCP" | 100-500 signups if frontpage |
| **Product Hunt** | Developer Security Tools категория | 500-3,000 upvotes |
| **Reddit** | r/LocalLLaMA, r/MachineLearning, r/selfhosted, r/cybersecurity | 50-200 signups |
| **Twitter/X** | Thread: "AI agents have god-mode access to your data. Here's how to fix it." | 50K+ impressions |
| **MCP Registries** | PulseMCP, Smithery, Glama, mcp.run | Passive discovery, $0 CAC |

### 11.2 SEO Приоритеты

| Keyword | Volume/мес | Competition | Priority |
|---|---|---|---|
| mcp gateway | 1,000 | 0.30 | P0 |
| mcp security | 720-880 | 0.40-0.47 | P0 |
| docker mcp gateway | 480 | 0.05 | P1 |
| mcp authentication | 720 | 0.45 | P1 |
| mcp oauth | 390 | 0.35 | P1 |
| agentic ai security | 320 | 0.65 | P2 |

### 11.3 Unit Economics

| Метрика | Значение |
|---|---|
| Blended ARPU | $212/мес |
| Gross Margin | 78% (proxy economics) |
| Blended CAC | $33-50 |
| LTV:CAC | 35:1 |
| CAC Payback | ~1 месяц |
| Breakeven | 15-20 платящих клиентов |

---

## 12. Риски и митигации

| Риск | Вероятность | Импакт | Митигация |
|---|---|---|---|
| **Platform risk:** Anthropic/OpenAI/Google строят native permission layers | 70% | Critical | Multi-protocol (не только MCP), open-source community lock-in, compliance features которые платформы не будут строить |
| **Bus factor = 1** на security-critical infra | 80% | Critical | Найм co-founder или первого сотрудника к **$15K MRR** (не $30K) |
| **Security breach** прокси-инфраструктуры | 25% | Existential | Zero-trust architecture, encrypted token storage, bug bounty, SOC 2 |
| **Google OAuth verification** задержка (8+ недель) | 30% | Medium | Начать Day 1, testing mode launch, non-Google integrations как fallback |
| **Low free-to-paid conversion** (< 3%) | 20% | High | Tighten free limits, Pro trial с CC, urgency messaging EU AI Act |
| **Конкурент запускает аналог** | 35% | Medium | First-mover в MCP registries, open-source trust, скорость |
| **Scope creep** → MVP > 8 недель | 40% | Medium | Строго MVP: Google 4 services + permission engine + dashboard + billing |

### Kill Signals (когда остановить)

1. **Zero платящих клиентов** через 8 недель после запуска
2. **Major AI platform** шипит native permission layer с аналогичным функционалом
3. **Security breach** proxy инфраструктуры
4. **MRR plateau < $3K** на 3+ последовательных месяца
5. **Clinical-level burnout**

---

## 13. Roadmap Timeline

```
Week 1-5:   MVP Development
            ├── Google OAuth integration (Drive, Gmail, Calendar, Sheets)
            ├── Permission/scope engine
            ├── MCP endpoint generator + proxy layer
            ├── Audit trail (PostgreSQL)
            ├── Web dashboard (Next.js + shadcn)
            ├── Organization / Subscription models (Prisma)
            ├── Stripe billing (Free/Pro/Team)
            └── Landing page (SEO-optimized)

Week 5-6:   Launch Blitz
            ├── Show HN + Product Hunt + Reddit + Twitter/X
            ├── MCP registry listings
            ├── GitHub open-source repo
            └── Google OAuth verification (начать Week 1)

Month 2:    v1.1 — Integrations + Team Features
            ├── Slack, Notion, additional Google services
            ├── Docker image + self-hosted guide
            ├── Team invitations
            └── Audit log export

Month 3-4:  v1.2 — Enterprise Layer
            ├── GitHub, Jira, AWS integrations
            ├── SSO/SAML (Team tier)
            ├── Self-hosted Helm chart
            ├── Emergency kill-switch
            └── SOC 2 preparation

Month 5-6:  v2.0 — Compliance + Scale
            ├── CISO Dashboard
            ├── EU AI Act Compliance Pack
            ├── SOC 2 Type II
            └── Partner API
```

---

## 14. Open-Core разделение

| Компонент | Open-Source (Scopegate) | Cloud-Only (Scopegate Cloud) |
|---|---|---|
| MCP proxy layer | ✅ | — |
| Service connectors (Google, LinkedIn, Twitter…) | ✅ | + новые платные |
| Permission engine core | ✅ | + ABAC/custom policies |
| Audit logging (basic) | ✅ | + retention policies, export |
| Self-hosted deployment | ✅ | — |
| Organizations / мультитенантность | — | ✅ |
| Billing / Plans / Subscriptions | — | ✅ |
| Usage quotas enforcement | — | ✅ |
| SSO / SAML / SCIM | — | ✅ |
| CISO Dashboard | — | ✅ |
| EU AI Act Compliance Pack | — | ✅ |
| Managed OAuth token storage | — | ✅ |
| Cloud infrastructure (hosting, HA, backups) | — | ✅ |
| Dedicated support | — | ✅ |

---

*Следующий шаг: создание лендинга на основе этого PRD.*
