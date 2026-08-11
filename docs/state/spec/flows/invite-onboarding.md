# Поток: приглашение и вход

Публичная регистрация выключена (`disableSignUp: true`): `POST /api/auth/sign-up/email` возвращает ошибку. Единственный вход в систему — инвайт.

1. Админ (`ADMIN_EMAIL`) создаёт инвайт на `/admin/users` → `POST /api/admin/invites` → `InviteToken`.
2. Приглашённый открывает `/invite/[token]`, задаёт пароль.
3. `POST /api/auth/accept-invite` создаёт `User` + `Account` **прямыми вызовами Prisma** (через better-auth нельзя — путь закрыт `disableSignUp`), пароль хэшируется `ctx.password.hash()`, `emailVerified: true`.
4. Пользователь добавляется в проект как `TeamMember`, дальше входит через `/login`.

Первый админ поднимается на старте приложения из `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`bootstrap.ts`).

## Проверка

Регистрация без токена невозможна; использованный токен повторно не срабатывает; после приёма инвайта пользователь видит только свои проекты.
