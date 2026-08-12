# Stage 10: SCORING — Финальный скоринг
# AI Access Proxy — Permission Gateway for AI Agents
> Дата: 2026-02-24

---

## Сводная таблица скоринга

| # | Категория | Score | Вес | Взвешенный |
|---|---|---|---|---|
| 1 | Market (Рынок) | 88 | 0.10 | 8.80 |
| 2 | Competitors (Конкуренты) | 51 | 0.05 | 2.55 |
| 3 | Audience (Аудитория) | 85 | 0.15 | 12.75 |
| 4 | UVP (Уникальное преимущество) | 70 | 0.10 | 7.00 |
| 5 | Business Model (Бизнес-модель) | 85 | 0.10 | 8.50 |
| 6 | Marketing (Маркетинг) | 79 | 0.05 | 3.95 |
| 7 | **Speed to Money** | **78** | **0.30** | **23.40** |
| 8 | Risks (Риски) | 42 | 0.15 | 6.30 |
| | **ИТОГО** | | **1.00** | **73.25** |

---

## Финальный балл: 73/100

## Вердикт: CONDITIONAL GO

---

## Проверка красных флагов

| Red Flag | Условие | Статус |
|---|---|---|
| Speed to Money < 40 | Вердикт не выше CONDITIONAL GO | **НЕ СРАБОТАЛ** (78 > 40) |
| MVP > 8 недель | Build Speed cap 40 | **НЕ СРАБОТАЛ** (4-5 недель) |
| Нет быстрых каналов | Traffic Speed cap 50 | **НЕ СРАБОТАЛ** (6+ каналов) |
| Sales cycle > 30 дней | Conversion Speed cap 40 | **НЕ СРАБОТАЛ** (developer self-service) |
| Network effects required | STM cap 30 | **НЕ СРАБОТАЛ** (независимая ценность) |
| Buyer ≠ User | Conversion cap 50 | **ЧАСТИЧНО** — Enterprise сегмент (10% revenue Y1), не влияет на доминантные тиры |

**Ни один критический red flag не сработал.**

---

## Сравнение с другими идеями пайплайна

| Идея | Score | Verdict | Лучшая сторона | Слабая сторона |
|---|---|---|---|---|
| **AI Access Proxy** | **73** | **CONDITIONAL GO** | Market 88, Audience 85, Business 85 | Risks 42, Competitors 51 |
| Google Ads AI Chat | 71 | CONDITIONAL GO | STM 73, Urgency 7/10 | UVP 62, Market 72 |
| QABot | 67 | CONDITIONAL GO | Market 76, Audience 78 | STM 69, Conversion 58 |
| Website Security Scanner | 54 | PIVOT | — | STM 59, Urgency 3.75/10 |

**AI Access Proxy — лидер пайплайна с самым высоким баллом (73).**

---

## Анализ: что тянет вниз и что тянет вверх

### Сильные стороны (тянут вверх):
1. **Market 88** — взрывной рост AI agents (42-50% CAGR), MCP ecosystem 58x за 11 месяцев, EU AI Act как регуляторный драйвер
2. **Audience 85** — подтверждённая боль (88% организаций с AI security инцидентами), 97M+ MCP SDK downloads, высокий WTP
3. **Business Model 85** — proxy economics (78% gross margin), MVP за $62-575, breakeven на 15-20 клиентах
4. **Speed to Money 78** — лучший STM в пайплайне, MVP за 4-5 недель, MCP registries как уникальный канал, EU AI Act ускоряет конверсию

### Слабые стороны (тянут вниз):
1. **Risks 42** — platform risk от AI-гигантов (70%), bus factor=1 на security-инфраструктуре, потенциальный breach экзистенциален
2. **Competitors 51** — 35+ конкурентов, $200M+ funding в категории, окно 6-12 месяцев до серьёзной конкуренции
3. **UVP Defensibility 44** — технология воспроизводима за 3-6 месяцев, слабые network effects

---

## Что нужно для перехода в GO (>80)

Для достижения **GO** (80+) нужно:

1. **Risks → 60** (+18): Привлечь co-founder или первого сотрудника (снижает bus factor), получить SOC 2 attestation, создать incident response plan
   - Эффект: +2.7 пунктов к итогу

2. **Competitors → 65** (+14): Захватить developer mindshare до конкурентов (5,000+ GitHub stars, 50+ MCP registry listings), заключить 2-3 partnership с AI platforms
   - Эффект: +0.7 пунктов к итогу

3. **UVP → 80** (+10): Углубить интеграции до 20+ сервисов (switching cost), построить community вокруг open-source (brand moat)
   - Эффект: +1.0 пункт к итогу

**Суммарный потенциал: 73 + 4.4 = 77.4** — всё ещё CONDITIONAL GO. Для GO нужен прорыв по рискам (найм) или значительный рост STM/Audience.

---

## Ключевой инсайт

AI Access Proxy — это **"great idea, challenging execution for solo-founder"**. Рынок горячий (88), боль реальная (85), экономика отличная (85), скорость высокая (78). Но security-critical infrastructure + bus factor=1 + $200M+ funded competitors = высокий риск (42).

**Рекомендация:** Стартовать с developer-first open-core подходом, агрессивно захватывать community, планировать найм на $15K MRR (не $30K), и строго следить за kill signals.
