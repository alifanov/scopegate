# Модель данных

Источник: `prisma/schema.prisma`. Клиент генерируется в `src/generated/prisma` — импорт оттуда, не из `@prisma/client`.

```mermaid
erDiagram
  User ||--o{ TeamMember : состоит
  Project ||--o{ TeamMember : команда
  Project ||--o{ ServiceConnection : подключения
  Project ||--o{ McpEndpoint : эндпоинты
  Project ||--o{ AuditLog : аудит
  Project ||--o{ Notification : уведомления
  McpEndpoint ||--o{ EndpointPermission : права
  ServiceConnection ||--o{ EndpointPermission : на что права
  McpEndpoint ||--o{ RateLimitBucket : лимиты
  User ||--o{ Session : сессии
  User ||--o{ Account : пароль/провайдер
  Project ||--o{ ProviderCredential : BYO OAuth-креды
  User ||--o{ MonthlyUsage : квота
```

## Сущности

| Модель | Назначение | Важное |
|---|---|---|
| `User` · `Session` · `Account` · `Verification` | Аутентификация (better-auth) | Пароль хэшируется через `ctx.password.hash()`, не bcrypt напрямую |
| `Project` | Единица изоляции: подключения, эндпоинты, аудит | |
| `TeamMember` (`ProjectRole`) | Членство и роль в проекте | Проверяется в `project-auth.ts` |
| `ServiceConnection` (`ServiceProvider`, `ServiceConnectionStatus`) | Подключённый внешний сервис | `accessToken` шифрован AES-256-GCM; `metadata` хранит, например, `linkedinMemberUrn`; `consecutiveFailures` — счётчик перед revoke |
| `McpEndpoint` | Один MCP-URL с ключом `sg_…` | Ключ можно перевыпустить (`regenerateEndpointKey`) |
| `EndpointPermission` | Разрешённое действие эндпоинта над подключением | Гранулярность = action, определения в `mcp/permissions.ts` |
| `AuditLog` (`AuditStatus`) | Кто, каким инструментом, с каким исходом | Пишется в `handler.ts`; сбой записи не отменяет результат вызова |
| `RateLimitBucket` | Атомарный счётчик лимита | `INSERT … ON CONFLICT DO UPDATE` |
| `Notification` (`NotificationType`) | Уведомления команде | Единственный автор текста «Reconnect required» — `notifyConnectionRevoked()` |
| `InviteToken` | Приглашение в закрытую систему | Регистрация возможна только по нему |
| `ProviderCredential` | Собственные OAuth-креды проекта (BYO) | Ключ — «группа кредов» (`appGroup`), не провайдер; читается `resolveOAuthApp()` в `oauth-credentials.ts`; в облаке группы из `OWN_APP_REQUIRED_GROUPS` без своих кредов падают `OAuthAppNotConfiguredError` (428) |
| `MonthlyUsage` | Месячный счётчик MCP-запросов для лимитов плана (cloud only) | Ключ `[userId, month]`, атомарный `INSERT … ON CONFLICT DO UPDATE`, не `COUNT` по `AuditLog`; проверяется в `api/mcp/[apiKey]/route.ts`, fail-open при ошибке БД |

## Правила изменений

- Любая правка модели — только через миграцию (`prisma migrate`), никогда `db push` по живой БД.
- `pnpm build` выполняет `migrate deploy` и требует живой БД — в CI используется `prisma generate && tsc --noEmit`.
