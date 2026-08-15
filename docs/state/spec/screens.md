# Инвентарь экранов

`/` ведёт себя по-разному в зависимости от режима: в облаке (`SCOPEGATE_CLOUD=1`) рендерит маркетинговый лендинг, в self-host — редиректит на `/projects` (если есть сессия) или на `/login`. Маркетинговые страницы (лендинг, `/pricing`, `/features`, `/docs`, `/integrations`, `/compare`, `/blog`, `/glossary`, `/privacy`, `/terms`, `/cookies`) публично доступны в обоих режимах на уровне роутинга (`src/middleware.ts`); часть из них дополнительно скрывает контент через `notFound()` при выключенном `SCOPEGATE_CLOUD` — см. колонку «Облако».

| Путь | Файл | Кто видит | Облако | Назначение |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | все | контент отличается | Лендинг (cloud) или редирект на `/projects`/`/login` (self-host) |
| `/login` | `(auth)/login/page.tsx` | аноним | доп. Google/magic-link в cloud | Вход |
| `/signup` | `(auth)/signup/page.tsx` | аноним | только cloud (`notFound()`) | Регистрация через Google/magic-link |
| `/invite/[token]` | `(auth)/invite/[token]/page.tsx` | по ссылке | оба | Приём приглашения — путь регистрации в self-host |
| `/magic-link` | `magic-link/page.tsx` | по ссылке | оба | Клиентский редирект на верификацию magic-link (защита от pre-fetch сканеров почты) |
| `/pricing` | `pricing/page.tsx` | все | только cloud (`notFound()`) | Тарифы, Polar checkout |
| `/features` | `features/page.tsx` | все | оба | Маркетинг: возможности |
| `/docs` | `docs/page.tsx` | все | оба | Маркетинг: как настроить MCP-прокси |
| `/integrations` | `integrations/page.tsx` | все | оба | Список интеграций |
| `/integrations/[slug]` | `integrations/[slug]/page.tsx` | все | оба | Страница конкретной интеграции |
| `/compare` | `compare/page.tsx` | все | оба | Список сравнений с конкурентами |
| `/compare/[slug]` | `compare/[slug]/page.tsx` | все | оба | Сравнение с конкретным конкурентом |
| `/blog` | `blog/page.tsx` | все | оба | Список статей блога |
| `/blog/[slug]` | `blog/[slug]/page.tsx` | все | оба | Статья блога |
| `/glossary` | `glossary/page.tsx` | все | оба | Список терминов глоссария |
| `/glossary/[slug]` | `glossary/[slug]/page.tsx` | все | оба | Статья глоссария |
| `/privacy` | `privacy/page.tsx` | все | оба | Политика конфиденциальности |
| `/terms` | `terms/page.tsx` | все | оба | Условия использования |
| `/cookies` | `cookies/page.tsx` | все | оба | Политика cookies |
| `/projects` | `(dashboard)/projects/page.tsx` | участник | оба | Список проектов |
| `/projects/[projectId]` | `(dashboard)/projects/[projectId]/page.tsx` | участник | оба | Проект: подключения сервисов, эндпоинты, аудит |
| `/projects/[projectId]/endpoints/[endpointId]` | `.../endpoints/[endpointId]/page.tsx` | участник | оба | Права эндпоинта, URL и ключ, перевыпуск ключа |
| `/projects/[projectId]/settings` | `.../settings/page.tsx` | владелец | оба | Настройки проекта, команда |
| `/projects/[projectId]/select-ads-account` | `.../select-ads-account/page.tsx` | участник | оба | Выбор аккаунта Google Ads после OAuth |
| `/settings` | `(dashboard)/settings/page.tsx` | участник | оба | Личные настройки |
| `/billing` | `(dashboard)/billing/page.tsx` | владелец | только cloud (`notFound()`) | Тариф проекта, Polar customer portal |
| `/notifications` | `(dashboard)/notifications/page.tsx` | участник | оба | Уведомления (в т.ч. «Reconnect required») |
| `/admin/projects` | `(dashboard)/admin/projects/page.tsx` | админ (`ADMIN_EMAIL`) | оба | Все проекты |
| `/admin/users` | `(dashboard)/admin/users/page.tsx` | админ | оба | Пользователи и инвайты |

Группы роутов `(auth)` / `(dashboard)` задают лейауты; в OTel-именах роутов группы вырезаются.

`isCloud()` (`src/lib/cloud.ts`) — единственный читатель `SCOPEGATE_CLOUD`; проверка идёт в самом компоненте страницы (`notFound()`/`redirect()`), а не в `middleware.ts` — edge-бандл инлайнит `process.env` при сборке, поэтому мидлварь не может читать флаг надёжно и просто открывает публичные пути для обоих режимов.
