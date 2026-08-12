# Валидация: AI Access Proxy — Permission Gateway for AI Agents
> Дата: 2026-02-24

---

## Executive Summary

- **Общий балл: 73/100 — CONDITIONAL GO**
- **Топ-3 сильные стороны:**
  1. Взрывной рынок (88/100): AI agents растут на 42-50% CAGR, MCP ecosystem вырос 58x за 11 месяцев, EU AI Act (август 2026) конвертирует "nice-to-have" в юридическое требование
  2. Proxy economics (85/100): 78% gross margin (vs 50-60% у AI-first SaaS), MVP за $62-575, breakeven на 15-20 клиентах, LTV:CAC 35:1
  3. Сильная подтверждённая боль (85/100): 88% организаций с AI security инцидентами, 90% MCP серверов с dangerous default configs, реальные CVE и эксплойты
- **Топ-3 риска:**
  1. Platform risk (70% вероятность, Critical): Anthropic/OpenAI/Google могут встроить native permission layers
  2. Bus factor = 1 (80% вероятность, Critical): Solo-founder на security-critical инфраструктуре с OAuth токенами клиентов
  3. Конкурентное давление: 35+ конкурентов, $200M+ funding, окно 6-12 месяцев

---

## 1. Профиль идеи

| Поле | Значение |
|---|---|
| **Название** | AI Access Proxy — Granular Permission Gateway for AI Agents |
| **Проблема** | AI-агенты получают доступ к сервисам через API-ключи с полными правами. Нет способа ограничить scopes, нет audit trail, нет мгновенного отзыва. 90% MCP серверов over-permissioned. Компании не могут безопасно дать AI-агентам доступ к корпоративным данным. EU AI Act (август 2026) скоро потребует controls. |
| **Решение** | Permission gateway: подключи сервисы (Google Drive, Gmail, Calendar, Sheets) через OAuth → задай granular scopes per agent → получи MCP endpoint. Audit trail, rate limits, instant revocation. |
| **ЦА** | 1) Разработчики AI-агентов 2) Компании / Team Leads 3) AI-стартапы |
| **Монетизация** | SaaS: Free / $29 / $149 / $500-5000+ мес |
| **География** | Global (English) |
| **Формат** | Open-core: Cloud SaaS + self-hosted |

---

## 2. Анализ рынка — 88/100

- **TAM:** $130B+ (2025) — пересечение AI agents ($7.6B, 42-50% CAGR), AI cybersecurity ($25.4B), AI infrastructure ($90B), API management ($6.9-10B)
- **SAM:** $5-15B — AI governance, agent security, MCP ecosystem
- **SOM:** $15K-220K ARR (Year 1-3), до $1M с enterprise tier
- 17.4M AI-разработчиков, 97M+ monthly MCP SDK downloads
- MCP ecosystem вырос с 100 до 5,800+ серверов за 11 месяцев (58x)
- Enterprise AI agent adoption: <5% → 40% приложений за год (Gartner)
- 90% AI-агентов over-permissioned; только 34% компаний имеют AI security controls
- $238B AI startup funding в 2025 (47% всего VC)

**Ключевой инсайт:** "MCP permission proxy" — greenfield категория. Спрос подтверждён (CVE, регуляция), предложение near-zero. Окно 6-12 месяцев.

---

## 3. Конкуренты — 51/100

| Сегмент | Игроки | Funding | Проблема |
|---|---|---|---|
| AI agent credentials | Keycard Labs | $38M (a16z) | Enterprise-only, нет developer self-service |
| MCP gateway | Obot MCP Gateway | $35M seed | Enterprise hosting/registry, не permission-focused |
| MCP runtime | Arcade.dev | YC-backed | Per-execution pricing, tool catalog не permissions |
| AI agent IAM | Alter | YC (2 employees) | Zero-trust IAM, очень ранняя стадия |
| MCP auth | Scalekit | $5.5M seed | OAuth stack для MCP серверов, не proxy |
| AI security | Zenity | $59.5M | Enterprise AI governance, не MCP-specific |
| AI security | Lasso Security | $30M+ | AI agent monitoring, не permission management |
| Tool aggregation | Composio | $29M | Tool/API integration, не security/permissions |
| MCP aggregators | MetaMCP, MCPJungle | OSS | Нет permission layer, нет enterprise features |
| Cloud infra | Microsoft, Docker, Traefik | Giant | MCP gateways как side-feature |

**7 конкурентных GAPs:**
1. Developer self-service MCP permission proxy ("Stripe of AI agent permissions") — не существует
2. Per-agent, per-service granular scope control — все дают coarse team/org-level
3. Open-core с genuine self-hosted parity
4. Instant one-click revocation across all services
5. Cross-service permission dashboard
6. Intelligent per-agent rate limiting
7. SMB/developer pricing ($20-50/mo)

---

## 4. Целевая аудитория — 85/100

| Персона | Роль | WTP | Urgency |
|---|---|---|---|
| "Cautious Carlos" | Indie AI agent developer | $29-79/мес | 7/10 |
| "Worried Wendy" | Engineering Manager, mid-size | $199-499/мес | 8/10 |
| "Pressured Pavel" | Enterprise CISO | $999-5000+/мес | 9/10 |
| "Builder Ben" | AI startup CTO | $299-999/мес | 8/10 |

**Подтверждённая боль:**
- 88% организаций сообщают об AI agent security инцидентах
- 6+ задокументированных инцидентов: GitHub MCP exploit, Slack AI exfiltration, Claude Desktop RCE
- 90%+ MCP серверов с dangerous default configurations
- HN/Reddit: массовая фрустрация "MCP has no auth story", "agents have god mode access"

**Размер аудитории:** 97M+ monthly MCP SDK downloads, 15M GitHub Copilot users, 79% enterprises adopting AI agents

---

## 5. Уникальное преимущество — 70/100

**UVP:** "The Stripe of AI agent permissions. Connect services, define scopes per agent, get an MCP endpoint — in under 5 minutes. Open-core, self-hostable, developer-first."

| Параметр | Балл |
|---|---|
| Уникальность | 72 — developer self-service MCP permission proxy не существует |
| Защищаемость | 44 — технология воспроизводима за 3-6 мес, слабые network effects |
| Релевантность | 86 — прямо решает #1 боль аудитории |
| Слабые места конкурентов | 78 — заполняет все 7 выявленных gaps |

**4 ключевых дифференциатора:**
1. Per-agent, per-service granular scope control (medium defensibility)
2. Developer self-service with 5-minute onboarding (easy to copy, hard to reposition)
3. Open-core with genuine self-hosted parity (medium-hard defensibility)
4. Instant cross-service revocation with audit trail (medium defensibility)

**Главная слабость:** Defensibility 44/100 — moat строится через integration depth (20+ сервисов) и community (open-source adoption), не через technology.

---

## 6. Бизнес-модель — 85/100

**Тарифная сетка:**

| План | Цена | Включено | ЦА |
|---|---|---|---|
| Free | $0/мес | 2 сервиса, 2 агента, 5K запросов, 7-day logs | PLG funnel |
| Pro | $29/мес | 10 сервисов, 15 агентов, 100K запросов | Indie devs |
| Team | $149/мес | 50 сервисов, 100 агентов, 1M запросов, SSO | Eng managers |
| Enterprise | $500-5000+/мес | Unlimited, self-hosted, SOC 2, CISO dashboard | Enterprise |

**Юнит-экономика:**

| Метрика | Значение |
|---|---|
| Blended ARPU | $212/мес |
| Gross Margin | 78% (proxy economics, не AI inference) |
| Monthly Churn | 3.9% (blended) |
| LTV | $4,236 |
| CAC (blended) | $33-50 |
| LTV:CAC | 35:1 |
| MVP Cost | $62-575 |
| Breakeven | 15-20 платящих клиентов |
| CAC Payback | ~1 месяц (vs 6.8 мес industry median) |

**Ключевой инсайт:** Proxy economics, not AI economics — 78% gross margin потому что продукт проксирует API calls, а не запускает inference. Структурное преимущество перед AI-first конкурентами.

---

## 7. Маркетинг и продвижение — 79/100

| Канал | Тип | CAC |
|---|---|---|
| MCP registries (PulseMCP, Smithery, Glama) | Free, protocol-native | $0 |
| GitHub open-source | Free, compound | $0-5 |
| Product Hunt, Hacker News | Free, launch spike | $0-10 |
| Reddit (r/LocalLLaMA, r/MachineLearning) | Free, targeted | $0-5 |
| Twitter/X AI community | Free, ongoing | $0-10 |
| SEO content | Medium-term, compound | $5-15 |
| LinkedIn (enterprise) | Paid, targeted | $50-100 |

**SEO-данные (DataForSEO):**

| Keyword | Volume/мес | CPC | Competition |
|---|---|---|---|
| MCP gateway | 1,000 | $12.50 | 0.30 |
| MCP security | 880 | $8.20 | 0.40 |
| MCP authentication | 720 | $15.30 | 0.45 |
| docker mcp gateway | 480 | $5.00 | 0.05 |
| MCP OAuth | 390 | $18.70 | 0.35 |
| agentic AI security | 320 | $43.73 | 0.65 |

**Уникальное преимущество:** MCP registries (5,500+ серверов) = zero-cost, protocol-native app store для exact target audience. Ни одна другая идея в пайплайне не имеет такого канала.

**Blended CAC:** $33-50 → LTV:CAC 48:1-73:1. CAC payback < 1 месяц.

---

## 8. Speed to Money — 78/100 ⭐

| Фаза | Балл | Вес | Комментарий |
|---|---|---|---|
| Build Speed | 80 | 0.25 | MVP за 4-5 недель, стандартный стек, MCP SDK тривиален |
| Traffic Speed | 82 | 0.35 | 6+ быстрых каналов, MCP registries уникальны, 800 signups Month 1 |
| Conversion Speed | 74 | 0.40 | $29 = no-think zone, EU AI Act ускоряет, urgency 7.5/10 |

**Speed to Money = 80×0.25 + 82×0.35 + 74×0.40 = 20.0 + 28.7 + 29.6 = 78.3 ≈ 78**

**Лучший STM в пайплайне** (vs Google Ads 73, QABot 69, Security Scanner 59).

**Red flags:** Ни один не сработал.

**MVP компоненты:**
- Google OAuth integration (Drive, Gmail, Calendar, Sheets)
- Permission/scope management engine
- MCP endpoint generator
- Audit trail / logging
- Web dashboard
- Landing page + Stripe billing

**Tech stack:** Node.js + TypeScript, Next.js, MCP SDK, PostgreSQL, Stripe

**Timeline:**
- MVP: 4-5 недель
- First paying customer: Month 1 (Week 5-8)
- $1K MRR: Month 3
- $10K MRR: Month 5
- $25K MRR: Month 6

**Критическая зависимость:** Google OAuth verification для restricted scopes (Gmail, Drive) может занять 2-8 недель. Митигация: начать верификацию в Day 1, запуск в testing mode (100 users).

---

## 9. Риски — 42/100

### 21 риск идентифицирован в 5 категориях

| Категория | Балл | Вес | Главная угроза |
|---|---|---|---|
| Market Risks | 38 | 25% | Platform risk от AI-гигантов (70%, Critical) |
| Operational (Solo) | 32 | 25% | Bus factor=1 на security infra (80%, Critical) |
| Technology Risks | 48 | 20% | OAuth breach экзистенциален (25%, Critical) |
| Financial Risks | 45 | 20% | Enterprise sales slow + free tier drain |
| Regulatory Risks | 62 | 10% | Net positive — регуляция драйвит спрос |

### Топ-3 самых опасных риска:

| Риск | Вероятность | Импакт | Митигация |
|---|---|---|---|
| Platform risk: AI-гиганты строят native permissions | 70% | Critical | Мультивендорность, открытый стандарт, community lock-in |
| Bus factor = 1 на security infra | 80% | Critical | Найм на $15K MRR, automated monitoring, incident runbook |
| Security breach proxy | 25% | Critical (existential) | Zero-trust architecture, minimal token storage, SOC 2, bug bounty |

### Kill Signals:
1. Zero платящих клиентов через 8 недель после запуска
2. Major AI platform шипит native permission layer
3. Security breach proxy инфраструктуры
4. MRR plateau ниже $3K на 3+ месяцев
5. Clinical-level burnout

---

## 10. Скоринг

| Категория | Балл | Вес | Взвешенный |
|---|---|---|---|
| Market | 88 | 0.10 | 8.80 |
| Competitors | 51 | 0.05 | 2.55 |
| **Audience** | **85** | 0.15 | **12.75** |
| UVP | 70 | 0.10 | 7.00 |
| **Business Model** | **85** | 0.10 | **8.50** |
| Marketing | 79 | 0.05 | 3.95 |
| **Speed to Money** ⭐ | **78** | **0.30** | **23.40** |
| Risks | 42 | 0.15 | 6.30 |
| **ИТОГО** | | **1.00** | **73.25 → 73** |

### Final Score: 73/100 — CONDITIONAL GO

**Сравнение с другими идеями:**

| Идея | Score | Verdict |
|---|---|---|
| **AI Access Proxy** | **73** | **CONDITIONAL GO** |
| Google Ads AI Chat | 71 | CONDITIONAL GO |
| QABot | 67 | CONDITIONAL GO |
| Website Security Scanner | 54 | PIVOT |

---

## 11. Вердикт и план действий

### ВЕРДИКТ: CONDITIONAL GO

**Лучшая идея в пайплайне. Стоит реализовывать при выполнении условий.**

### Обоснование

AI Access Proxy попадает в редкое окно: **взрывной рынок (88) + подтверждённая боль (85) + отличная экономика (85) + высокая скорость (78)**. Это "right idea, right time" — MCP ecosystem растёт 58x/год, EU AI Act создаёт deadline-driven demand, а коммерческих решений в категории "developer self-service MCP permission proxy" практически нет.

Что держит от GO: **высокие риски (42)** — security-critical infrastructure с bus factor=1, $200M+ funded competitors, и 70% вероятность что AI-гиганты построят native solutions. Это паттерн "great idea, challenging execution for solo-founder".

### Условия для GO

1. **Снизить bus factor:** Найти co-founder или первого сотрудника к $15K MRR (не $30K). Для security product это критично.
2. **Валидация скорости:** MVP за 5 недель, первый платящий клиент в Month 1-2. Если нет — kill signal.
3. **Community-first:** 1,000+ GitHub stars до Month 3. Open-source adoption = moat.
4. **Google OAuth verification:** Начать процесс в Day 1. Если блокируется >8 недель — запуск с не-restricted scopes (Calendar, Sheets).

### 5 следующих шагов

1. **День 1-3:** Подать Google OAuth verification request для Drive и Gmail scopes. Это длинный процесс (2-8 недель) — начать немедленно.
2. **Неделя 1-5:** MVP — Google OAuth + Permission engine + MCP endpoint generator + Audit trail + Dashboard + Landing page + Stripe. Stack: Node.js/TS + Next.js + MCP SDK + PostgreSQL + Stripe.
3. **Неделя 5-6:** Launch на Product Hunt + HN + Reddit + Twitter/X + все MCP registries (PulseMCP, Smithery, Glama, mcp.run). Open-source core на GitHub. Цель: 500 signups, 50 active users.
4. **Неделя 7-10:** Iterate на фидбеке, первые платящие клиенты ($29 Pro tier). A/B тест messaging: "Stripe of AI permissions" vs "MCP security gateway" vs "AI agent access control".
5. **Месяц 3-6:** Расширить до 10+ сервисов (Slack, Notion, Jira, AWS, GitHub). Enterprise tier с self-hosted. SOC 2 preparation. Community building (Discord, blog, security advisories).

### Рекомендуемый MVP-скоуп

| Компонент | Must Have | Nice to Have |
|---|---|---|
| Google OAuth (Drive, Gmail, Calendar, Sheets) | ✅ | |
| Per-agent permission/scope definition | ✅ | |
| MCP endpoint generation | ✅ | |
| Audit trail (action logging) | ✅ | |
| Web dashboard | ✅ | |
| Instant access revocation | ✅ | |
| Rate limiting per agent | ✅ | |
| Landing page + Stripe billing | ✅ | |
| Slack integration | | ✅ (Month 2) |
| Notion integration | | ✅ (Month 2) |
| GitHub integration | | ✅ (Month 3) |
| Self-hosted deployment | | ✅ (Month 3) |
| SSO/SAML (Team tier) | | ✅ (Month 4) |
| SOC 2 compliance pack | | ✅ (Month 5) |
| CISO dashboard | | ✅ (Month 6) |

### Ключевые метрики

| Метрика | Target Month 1-3 | Target Month 6 | Kill Signal |
|---|---|---|---|
| GitHub stars | 500+ | 3,000+ | < 100 (Month 3) |
| Signups (free) | 200+ | 2,000+ | < 50 |
| Active users | 50+ | 500+ | < 20 |
| Free → Paid conversion | 5-8% | 8-12% | < 3% |
| MRR | $1K+ | $15K+ | $0 (Month 2) |
| Monthly churn | < 5% | < 3.5% | > 8% |
| NPS | 40+ | 50+ | < 20 |
| Security incidents | 0 | 0 | Any breach = existential |

### Kill Signals (когда остановиться)

1. **Zero платящих клиентов** через 8 недель после запуска → pivot или no-go
2. **Major AI platform** (Anthropic/OpenAI/Google) шипит native permission layer с аналогичным функционалом → assess impact, likely pivot
3. **Security breach** proxy инфраструктуры → немедленная пауза, assess damage
4. **MRR plateau < $3K** на 3+ последовательных месяца → рынок не конвертит
5. **Clinical-level burnout** → здоровье важнее стартапа

---

## Источники

Полные списки источников (65+ для Market, 35+ для Audience, 20+ для Competitors и остальных стадий) в файлах отдельных стадий:

- [01-parsing.md](./01-parsing.md) — профиль идеи
- [02-market.md](./02-market.md) — рыночные данные (65+ источников)
- [03-competitors.md](./03-competitors.md) — анализ 35+ конкурентов
- [04-audience.md](./04-audience.md) — данные об аудитории (35+ источников)
- [05-uvp.md](./05-uvp.md) — анализ дифференциации
- [06-business-model.md](./06-business-model.md) — юнит-экономика
- [07-marketing.md](./07-marketing.md) — каналы и SEO (DataForSEO)
- [08-speed-to-money.md](./08-speed-to-money.md) — speed assessment
- [09-risks.md](./09-risks.md) — матрица 21 риска
- [10-scoring.md](./10-scoring.md) — финальный скоринг
