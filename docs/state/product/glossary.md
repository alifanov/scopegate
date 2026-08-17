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
| **Инвайт** (InviteToken) | Одноразовая ссылка — в self-host единственный способ завести пользователя; в облаке пользователи также заходят сами через Google-вход или magic link | `InviteToken`, `/api/auth/accept-invite` |
| **Облако / self-host** | Один и тот же образ, режим переключается `SCOPEGATE_CLOUD=1`: в облаке — лендинг, `/pricing`, `/signup`, лимиты плана; в self-host — без ограничений, только по инвайту | `isCloud()`, `SCOPEGATE_CLOUD` |
| **План** (PlanDef) | Тариф с лимитами проектов/эндпоинтов/месячных запросов; действует только в облаке, всегда no-op в self-host | `PLAN_REGISTRY` (`src/lib/plans.ts`), `assertWithinLimit()` |
| **Месячная квота** | Счётчик MCP-запросов проекта за месяц, атомарный upsert как у `RateLimitBucket`; списывается на владельца проекта, fail-open при ошибке БД | `MonthlyUsage`, `api/mcp/[apiKey]/route.ts` |
| **Собственное OAuth-приложение (BYO)** | Проект регистрирует свой OAuth-клиент вместо оператора ScopeGate; в облаке для «своих» групп (google/meta/instagram/threads/linkedin/twitter) обязательно — без него запрос падает 428 | `resolveOAuthApp()`, `OAuthAppNotConfiguredError` (`src/lib/oauth-credentials.ts`) |
| **Группа кредов** (credential group) | BYO-приложения выдаются не по провайдеру, а по группе — один Google-клиент покрывает Gmail/Calendar/Drive/Ads/GSC/YouTube/GTM, а Meta Ads/Instagram/Threads — три разных приложения | `ProviderCredential`, `getCredentialGroup()`, `OWN_APP_REQUIRED_GROUPS` |
| **Аудит** (AuditLog) | Запись факта вызова инструмента с исходом | `recordAudit()` |
