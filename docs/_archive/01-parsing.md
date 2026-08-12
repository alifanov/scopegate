# Stage 1: PARSING — Извлечение структуры
# AI Access Proxy Layer — Permission Gateway for AI Agents
> Дата: 2026-02-23

---

## Gate Check (проверка ограничений)

| # | Ограничение | Статус | Комментарий |
|---|---|---|---|
| 1 | Интернет-бизнес | **PASS** | Cloud SaaS + self-hosted вариант, полностью онлайн-продукт (API gateway / web dashboard) |
| 2 | Micro SaaS / SaaS | **PASS** | Подписочная модель — по количеству подключённых сервисов / агентов / запросов. Recurring revenue. |
| 3 | Solo-founder friendly | **PASS** | Proxy-layer — технически это middleware между AI-агентом и API сервисов. MVP на Node.js/Go + OAuth + MCP SDK реалистичен для одного разработчика за 4-6 недель. Стартовые затраты минимальны (облачный хостинг). |

---

## Профиль идеи

| Поле | Значение |
|---|---|
| **Название** | AI Access Proxy — Granular Permission Gateway for AI Agents |
| **Проблема** | AI-агенты (Claude, GPT, custom agents) получают доступ к внешним сервисам через API-ключи с полными правами. Нет способа ограничить, что именно агент может делать — read-only vs write, конкретные scopes, rate limits, audit trail. Это создаёт security risk: агент может случайно удалить данные, превысить лимиты, получить доступ к чувствительной информации. Компании не могут безопасно дать сотрудникам AI-агентов с доступом к корпоративным сервисам. |
| **Решение** | Permission gateway, который: (1) подключается к внешним сервисам (Google Drive, Gmail, Calendar, Sheets и др.) через OAuth, (2) позволяет задать granular scopes и permissions для каждого AI-агента (read-only, specific folders, rate limits), (3) выдаёт MCP endpoint, который агент использует вместо прямого API-ключа, (4) логирует все действия агента для audit trail, (5) позволяет мгновенно отозвать доступ |
| **Целевая аудитория** | 1) Разработчики AI-агентов — хотят безопасно подключить агентов к API 2) Компании / Team Leads — хотят контролировать доступ AI-агентов сотрудников к корпоративным сервисам 3) AI-стартапы — строят продукты с агентами и нуждаются в permission management |
| **Ниша** | AI Infrastructure / AI Security / MCP Ecosystem / Developer Tools |
| **Монетизация** | SaaS подписка — по количеству подключённых сервисов, агентов и объёму запросов |
| **География** | Global (English) |
| **Стадия** | Концепт |
| **Формат продукта** | Open-core: Cloud SaaS (hosted gateway + web dashboard) + self-hosted вариант для enterprise. Developer-first: API + MCP endpoint + dashboard для управления permissions |

---

## Уточняющие вопросы (ответы пользователя)

1. **Целевая аудитория:** Оба сегмента — и разработчики AI-агентов, и компании/team leads (разные тарифные планы)
2. **Формат:** Self-hosted + Cloud (open-core модель)
3. **MVP сервисы:** Google Services (Drive, Gmail, Calendar, Sheets) — первые интеграции в MVP
4. **География:** Global (English)
5. **Ключевая ценность:** Granular permissions + MCP endpoint generation + audit trail
