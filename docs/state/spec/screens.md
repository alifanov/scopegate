# Инвентарь экранов

Публичного лендинга нет: `/` редиректит на `/projects` (если есть сессия) или на `/login`.

| Путь | Файл | Кто видит | Назначение |
|---|---|---|---|
| `/` | `src/app/page.tsx` | все | Только редирект |
| `/login` | `(auth)/login/page.tsx` | аноним | Вход по email+паролю |
| `/invite/[token]` | `(auth)/invite/[token]/page.tsx` | по ссылке | Приём приглашения = единственный путь регистрации |
| `/projects` | `(dashboard)/projects/page.tsx` | участник | Список проектов |
| `/projects/[projectId]` | `(dashboard)/projects/[projectId]/page.tsx` | участник | Проект: подключения сервисов, эндпоинты, аудит |
| `/projects/[projectId]/endpoints/[endpointId]` | `.../endpoints/[endpointId]/page.tsx` | участник | Права эндпоинта, URL и ключ, перевыпуск ключа |
| `/projects/[projectId]/settings` | `.../settings/page.tsx` | владелец | Настройки проекта, команда |
| `/projects/[projectId]/select-ads-account` | `.../select-ads-account/page.tsx` | участник | Выбор аккаунта Google Ads после OAuth |
| `/settings` | `(dashboard)/settings/page.tsx` | участник | Личные настройки |
| `/notifications` | `(dashboard)/notifications/page.tsx` | участник | Уведомления (в т.ч. «Reconnect required») |
| `/admin/projects` | `(dashboard)/admin/projects/page.tsx` | админ (`ADMIN_EMAIL`) | Все проекты |
| `/admin/users` | `(dashboard)/admin/users/page.tsx` | админ | Пользователи и инвайты |

Группы роутов `(auth)` / `(dashboard)` задают лейауты; в OTel-именах роутов группы вырезаются.
