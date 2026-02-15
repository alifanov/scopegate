# ScopeGate — Product Requirements Document

## 1. Problem

Текущие MCP-серверы запрашивают полный OAuth scope к внешним сервисам. Пользователь не может ограничить AI-агента — например, разрешить только чтение календаря, но не редактирование. Если MCP-сервер имеет доступ к Gmail с scope `mail.google.com`, агент может читать, отправлять и удалять письма без ограничений.

ScopeGate решает эту проблему, выступая прокси-слоем между AI-агентом и внешними сервисами, предоставляя гранулярный контроль на уровне конкретных действий.

## 2. Target Users

- **Разработчики** — строят AI-агентов и хотят безопасно подключать внешние сервисы с минимальными привилегиями.
- **Команды и компании** — нужен централизованный контроль доступа AI-агентов к корпоративным сервисам.
- **Энтузиасты AI** — пользователи Claude, Cursor, Windsurf и других AI-инструментов, которые хотят безопасно подключать свои аккаунты.

## 3. Core Concept

ScopeGate — это **AI Access Proxy Layer**:

1. Пользователь подключает внешний сервис (например, Google) через OAuth.
2. Выбирает конкретные разрешённые действия (read emails, create calendar events, ...).
3. Получает MCP endpoint URL с встроенным API key.
4. Вставляет этот URL в своего AI-агента.
5. AI-агент видит и может вызывать только разрешённые tools.
6. Все вызовы логируются в audit log.

## 4. User Flow

```
Регистрация (email/password)
    → Создание проекта (workspace)
        → Подключение Google аккаунта (OAuth2)
            → Выбор permissions (чеклист конкретных действий)
                → Генерация MCP endpoint URL
                    → Использование URL в AI-агенте
```

Пользователь может создавать **несколько MCP endpoint-ов** с разными наборами permissions. Например:
- "Email assistant" — только чтение Gmail
- "Calendar planner" — полный доступ к Calendar
- "Research agent" — чтение Drive + чтение Gmail

## 5. MVP Scope

### 5.1 Аутентификация

- Регистрация и вход по email + password.
- Сессии и cookie-based auth.

### 5.2 Проекты и команды

- Пользователь создаёт проекты (workspaces).
- Внутри проекта — подключённые сервисы и MCP endpoints.
- Поддержка команд — несколько пользователей могут управлять одним проектом.
- Роли в команде: owner, member.

### 5.3 Интеграции (MVP)

**Google** (через OAuth2):
- **Gmail** — действия: read emails, send email, delete email, search emails, manage labels, manage drafts
- **Google Calendar** — действия: read events, create event, update event, delete event, list calendars
- **Google Drive** — действия: read files, upload file, delete file, search files, manage permissions

Каждое действие — это отдельный checkbox, который пользователь включает или выключает.

### 5.4 MCP Endpoint

- **Transport**: Streamable HTTP.
- **Аутентификация**: API key встроен в URL (`https://<host>/mcp/<api-key>`).
- **Permissions enforcement**: AI-агент видит только те tools, которые соответствуют разрешённым действиям. При попытке прямого вызова неразрешённого действия — возвращается ошибка 403.
- **Rate limiting**: Настраиваемые лимиты на количество запросов к MCP endpoint (per-endpoint).

### 5.5 Audit Log

- Логирование каждого вызова через MCP endpoint: timestamp, action, parameters, result status.
- Просмотр логов в UI с фильтрацией по endpoint, action, времени.

### 5.6 Dashboard

- Список проектов.
- Список подключённых сервисов и их статус.
- Список MCP endpoints с возможностью revoke/regenerate API key.
- Audit log viewer.

## 6. Permission Model

Permissions определяются на уровне **конкретных действий** (action-level granularity):

```
Service: Google Gmail
├── gmail:read_emails        — Чтение писем
├── gmail:send_email         — Отправка писем
├── gmail:delete_email       — Удаление писем
├── gmail:search_emails      — Поиск по письмам
├── gmail:manage_labels      — Управление метками
└── gmail:manage_drafts      — Управление черновиками

Service: Google Calendar
├── calendar:read_events     — Чтение событий
├── calendar:create_event    — Создание событий
├── calendar:update_event    — Изменение событий
├── calendar:delete_event    — Удаление событий
└── calendar:list_calendars  — Список календарей

Service: Google Drive
├── drive:read_files         — Чтение файлов
├── drive:upload_file        — Загрузка файлов
├── drive:delete_file        — Удаление файлов
├── drive:search_files       — Поиск файлов
└── drive:manage_permissions — Управление доступом к файлам
```

Каждый MCP endpoint содержит свой набор включённых actions. ScopeGate маппит эти actions в MCP tools, которые видит AI-агент.

## 7. Deployment

**Self-hosted** — пользователь разворачивает ScopeGate у себя. Open-source проект под MIT License.

Облачная (hosted) версия планируется как отдельный проект.

## 8. Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **ORM**: Prisma
- **Package manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk` (Streamable HTTP transport)
- **Auth**: email/password (bcrypt + JWT sessions)

## 9. Future (Post-MVP)

- Дополнительные интеграции: GitHub, Slack, Notion, Linear, Jira.
- Фильтры на уровне ресурсов (e.g., read emails только из определённой папки).
- Готовые presets permissions (Read-only, Full access, и т.д.).
- Webhooks для уведомлений о действиях агента.
- Analytics dashboard с метриками по использованию.
- SSE transport как fallback.
