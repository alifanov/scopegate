# Глоссарий

| Термин | Значение | Где в коде |
|---|---|---|
| **Проект** (Project) | Единица изоляции: своя команда, свои подключения, свои эндпоинты, свой аудит | `Project` |
| **Подключение** (ServiceConnection) | Один подключённый по OAuth/API-ключу внешний сервис в рамках проекта | `ServiceConnection` |
| **Провайдер** (ServiceProvider) | Внешний сервис как таковой: google, meta, linkedin, stripe… | `PROVIDER_REGISTRY` |
| **Эндпоинт** (McpEndpoint) | MCP-URL с ключом `sg_…`, который отдаётся агенту | `McpEndpoint`, `/api/mcp/[apiKey]` |
| **Право** (EndpointPermission) | Разрешение одного эндпоинта на одно действие над одним подключением | `EndpointPermission`, `mcp/permissions.ts` |
| **Инструмент** (tool) | Действие, доступное агенту по MCP: `gmail:list_messages`, `threads:publish`… | `mcp/tools/*.ts` |
| **Группа прав** (permission group) | Набор действий провайдера, выводится из реестра | `PERMISSION_GROUPS` |
| **Отзыв** (revoke) | Перевод подключения в `revoked` при мёртвом токене + уведомление команде | `revokeConnectionWithNotification()` |
| **Permanent / transient ошибка** | Мёртвый токен против сетевого сбоя; permanent → сразу revoke, transient → счётчик до порога 3 | `classifyOAuthError()` |
| **Инвайт** (InviteToken) | Одноразовая ссылка: единственный способ завести пользователя | `InviteToken`, `/api/auth/accept-invite` |
| **Аудит** (AuditLog) | Запись факта вызова инструмента с исходом | `recordAudit()` |
