# Onboarding Flow Audit — ScopeGate — 2026-03-22

## Test Details
- Desktop email: `onboarding-test-1774201870ftwrqp39149@ildoopgrao.resend.app`
- Mobile email: `onboarding-mobile-1774204711up4rap70636@ildoopgrao.resend.app`
- Magic link / confirmation email received: No (password-based auth — no email confirmation needed)
- Screenshots: `/tmp/onboarding-20260322-185103/` (18 файлов)

## Flow Completion

| Step | Desktop | Mobile | Примечания |
|------|---------|--------|------------|
| Landing loaded | ✅ | ✅ | |
| Signup page reached | ✅ | ✅ | |
| Email submitted | ✅ | ✅ | |
| Email received (confirmation) | N/A | N/A | Парольная auth, email не нужен |
| Post-login redirect | ✅ | ✅ | `/projects?welcome=1` |
| Welcome modal | ✅ | ✅ | 3-шаговая инструкция |
| Dashboard visible | ✅ | ✅ | |
| Core action reached | ✅ | ⚠️ | Desktop: создан проект. Mobile: CTA обрезан |

---

## Screenshot Analysis

### `desktop-01-landing.png` — Лендинг
**Сильные стороны:**
- Заголовок ("Your AI agents have god-mode access to your data") бьёт в боль немедленно
- Структура секций хорошая: проблема → решение → фичи → цены → FAQ → CTA
- Навигация полная: Features, Integrations, Pricing, Compare, Docs
- Pricing-секция прямо на лендинге — хорошо для SaaS

**Проблемы:**
- **Cookie banner перекрывает форму при открытии signup** — баннер появляется поверх полей Name/Email, скрывая их (видно на `desktop-02-signup-full.png`)
- CTA "Start free" в nav и hero — нет кнопки "Sign In" в hero-секции для возвращающихся пользователей
- Headline на мобайле занимает весь экран — CTA ниже fold

### `desktop-02-signup-full.png` — Форма регистрации
**Сильные стороны:**
- Google OAuth как первичная опция — правильно для developer-аудитории
- Форма минималистична: Name + Email + Password
- Tagline под заголовком ("AI Access Proxy Layer...") напоминает зачем пользователь пришёл

**Проблемы:**
- **Cookie banner закрывает поля Email и Password при первой загрузке** — пользователю нужно сначала отклонить/принять баннер, только потом виден весь формат
- Подзаголовок "Sign up to get started with ScopeGate" — generic, не отражает value prop
- Нет социального доказательства на странице регистрации (сколько агентов защищено, сколько пользователей)
- Кнопка "Create Account" — без иконки загрузки при сабмите. После первого клика пользователь не понимает, идёт ли запрос (URL не менялся 3+ секунды)

### `desktop-04-post-submit.png` / `desktop-04c-after-retry.png` — После сабмита
**Проблема (Critical):**
- После нажатия "Create Account" страница **визуально не реагирует** минимум 3 секунды — URL остаётся `/signup`, форма заполнена, кнопка обычная. Пользователь не знает, сработало ли. Это приведёт к повторным кликам и дублированным аккаунтам.
- Только потом происходит редирект на `/projects`

### `desktop-04c-after-retry.png` — Welcome modal
**Сильные стороны:**
- Welcome modal с 3 шагами ("Create a project → Connect a service → Get your MCP URL") — чёткий onboarding path
- CTA "Create Your First Project" прямо в модале
- Toast "Project created" при создании проекта — хорошая обратная связь

**Проблемы:**
- Модал можно закрыть крестиком — и попасть в пустой дашборд. Нет onboarding checklist после закрытия модала

### `desktop-05-dashboard-empty.png` — Пустой дашборд
**Сильные стороны:**
- Empty state информативный: иконка + "No projects yet" + 3-шаговый туториал + CTA
- Кнопка "Create Your First Project" заметна (фиолетовая, крупная)

**Проблемы:**
- Sidebar показывает только Projects / Billing / Settings — нет подсказки о следующем шаге после создания проекта
- Нет примера проекта или quickstart-шаблона

### `desktop-06-create-project.png` — Модал создания проекта
**Проблемы:**
- Только поле "Project Name" — нет подсказки какое имя дать ("My Sales Agent", "Marketing Bot"...)
- Placeholder "My Project" — слишком generic, не обучает пользователя

### `desktop-07-project-created.png` — Страница проекта
**Сильные стороны:**
- Getting Started прогресс-бар из 3 шагов в верхней части — отлично
- Список интеграций сразу виден (Gmail, Drive, Calendar, Ads, GSC, OpenRouter, LinkedIn, Twitter)
- Toast "Project created" появился
- Кнопки "Connect a service", "Create MCP endpoint", "Copy MCP URL" — логичный порядок

**Проблемы:**
- Кнопка "Copy MCP URL → use in your AI agent" присутствует до того, как пользователь подключил хоть один сервис — нажав её сейчас, получишь пустой endpoint, что запутает
- Нет объяснения разницы между вкладками "MCP Endpoints" и "Auth Connections" для нового пользователя

### `mobile-01-landing.png` — Мобильный лендинг
**Сильные стороны:**
- Заголовок отображается полностью в fold: большой, читаемый шрифт
- Hamburger-меню работает
- Теги "Open-core · Self-hostable · MCP-native" хорошо расположены

**Проблемы:**
- **CTA "Start free" не виден без скролла** — субтайтл "ScopeGate is a permission gateway..." занимает место, кнопка уходит ниже fold
- Нет инлайн email-формы как на некоторых лендингах (только кнопка-ссылка)

### `mobile-03-form-filled.png` — Мобильная форма
**Сильные стороны:**
- Форма адаптирована хорошо: поля full-width, читаемый шрифт
- Password toggle-глаз виден

**Проблемы:**
- Кнопка "Create Account" не видна на скриншоте — уходит под keyboard на мобайле
- **Та же проблема с задержкой сабмита** что и на desktop

### `mobile-05-dashboard.png` / `mobile-06-dashboard-cta.png` — Мобильный дашборд
**Проблемы:**
- **CTA "Create Your First Project" не виден без скролла** — empty state слишком высокий, кнопка уходит за границу экрана 393px
- Sidebar скрыт в hamburger — новый пользователь не видит навигации
- Cookie settings FAB (синий кружок) перекрывает левый нижний угол на всех mobile-скриншотах — мешает тапам по контенту

---

## Issues Found

### Critical — блокирует конверсию

**C1. Отсутствие loading state при сабмите формы регистрации**
Форма молча "зависает" на 3–5 секунд после клика "Create Account" без любого визуального фидбека. URL не меняется, кнопка не меняет состояние. Пользователь не знает, работает ли запрос, и нажимает повторно — что может создать дублированные аккаунты или ошибки.

**C2. Cookie banner закрывает форму регистрации**
На `/signup` cookie banner появляется поверх полей Email и Password. На мобайле это критично — пользователь видит только поле Name и Google-кнопку, не понимает что есть email-форма ниже.

### High — существенное трение

**H1. CTA "Start free" уходит ниже fold на мобайле**
На iPhone 14 (393×852) основная кнопка действия не видна без скролла — субтайтл и теги занимают место. Это снижает мобильную конверсию лендинга.

**H2. "Create Your First Project" CTA уходит ниже fold на мобильном дашборде**
Empty state содержит 3-шаговый туториал + кнопку, но на экране 393px кнопка не помещается. Новый пользователь не видит следующего шага.

**H3. После закрытия Welcome modal нет постоянного онбординг-трекера**
Пользователь закрывает модал → попадает в пустой дашборд. Нет checklist или progress indicator напоминающего, что нужно сделать. Если пользователь отвлечётся — он потеряет путь.

**H4. Кнопка "Copy MCP URL" активна до подключения сервиса**
Нажав её сразу, пользователь получит endpoint без сервисов — что приведёт к путанице при попытке использовать в агенте.

### Medium — заметное трение

**M1. Cookie FAB перекрывает контент на мобайле**
Синяя кнопка настроек cookie в нижнем левом углу постоянно присутствует и потенциально закрывает тапаемые элементы.

**M2. Placeholder "My Project" не обучает**
Нет примеров имён проектов. Для developer-аудитории подошли бы примеры типа "sales-agent", "marketing-bot" — сразу объясняет паттерн использования.

**M3. Нет обратной связи по password strength**
При вводе пароля нет индикатора сложности — только текст "Minimum 8 characters". Пользователь не знает, принят ли его пароль до клика.

**M4. Отсутствует Sign In в hero-секции лендинга**
Возвращающийся пользователь должен искать "Sign In" в навбаре — на мобайле он скрыт за hamburger.

### Low — косметика

**L1. Подзаголовок signup-страницы generic**
"Sign up to get started with ScopeGate" — не напоминает value prop. Лучше: "Start protecting your AI agents in 5 minutes — free."

**L2. Нет описания вкладок "MCP Endpoints" / "Auth Connections" для новых пользователей**
Термины не очевидны без знания архитектуры.

---

## Mobile-Specific Issues

1. **CTA below fold на лендинге** — Start free не виден без скролла на 393px
2. **CTA below fold на дашборде** — Create Your First Project обрезан
3. **Cookie FAB** постоянно присутствует, закрывает левый нижний угол
4. **Кнопка "Create Account" скрывается под keyboard** при заполненной форме (возможно)
5. **Sidebar полностью скрыт** — новый пользователь видит только hamburger, не понимает структуру приложения

---

## Prioritized Recommendations

### 1. Loading state при сабмите — Critical
**Где:** `/signup`, кнопка "Create Account"
**Проблема:** 3–5 сек тишины после клика; пользователь не видит фидбека, нажимает повторно
**Фикс:** При клике кнопка переходит в `disabled` + spinner + текст "Creating account...". Реализация: `isLoading` state в форме, `<Button disabled={isLoading}>`.
**Impact на activation:** Прямой — предотвращает дублированные аккаунты и тревогу пользователя

### 2. Cookie banner не должен закрывать signup-форму — Critical
**Где:** `/signup`
**Проблема:** Banner появляется поверх формы, скрывая поля
**Фикс:** На `/signup` и `/login` показывать баннер снизу (fixed bottom) без overlay, или откладывать показ до после заполнения формы, или уменьшить z-index баннера
**Impact на activation:** Высокий — пользователь может не найти поля для ввода на mobile

### 3. Onboarding checklist в дашборде — High
**Где:** `/projects` (после закрытия Welcome modal)
**Проблема:** Нет постоянного напоминания о следующих шагах после закрытия модала
**Фикс:** Compact progress bar или checklist в верхней части дашборда: `✅ Account created → ⬜ Create project → ⬜ Connect service → ⬜ Copy MCP URL`. Скрывается когда все шаги выполнены.
**Impact на activation:** Высокий — направляет пользователя к aha-moment без повторных посещений модала

### 4. CTA виден без скролла на мобайле (лендинг) — High
**Где:** `scopegate.dev` на 393px
**Проблема:** Кнопка "Start free" ниже fold
**Фикс:** Убрать или сократить субтайтл в hero на мобайле, подтянуть кнопку выше. Или добавить sticky CTA-бар снизу экрана на мобайле.
**Impact на activation:** Прямой — мобильная конверсия лендинга

### 5. Empty state CTA виден без скролла на мобайле — High
**Где:** `/projects` empty state на 393px
**Проблема:** "Create Your First Project" не виден без скролла
**Фикс:** Сократить 3-шаговый список в empty state на мобайле (свернуть или убрать), поднять CTA-кнопку выше. Или использовать compact layout на мобайле.
**Impact на activation:** Прямой — пользователь не видит следующий шаг

### 6. Заблокировать "Copy MCP URL" до подключения сервиса — Medium
**Где:** Страница проекта
**Проблема:** Кнопка активна когда нет подключённых сервисов → confusing empty endpoint
**Фикс:** Disabled state + tooltip "Connect a service first to get a working MCP URL" пока нет Auth Connections
**Impact на activation:** Предотвращает разочарование при первом использовании

---

## Quick Wins (< 1 дня)

- **Loading state на кнопке "Create Account"** — `isLoading` + spinner + disabled (2 часа)
- **Subheadline signup-страницы** — заменить на benefit-oriented копи (30 мин)
- **Cookie banner z-index** — не перекрывать форму на `/signup` (1 час)
- **Disabled "Copy MCP URL"** когда нет Auth Connections + tooltip (2 часа)
- **Placeholder в Create Project** — добавить примеры имён ("e.g. sales-agent, marketing-bot") (15 мин)
- **Mobile: уменьшить empty state** — скрыть checklist на мобайле, поднять CTA (1 час)
