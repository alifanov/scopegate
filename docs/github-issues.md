# GitHub Issues — цикл рекомендаций

Описывает, как агент (Claude Code) и человек совместно ведут очередь задач через GitHub Issues. Рекомендации из снимков `insights/*` становятся issue → человек помечает их лейблом → агент подхватывает одобренные.

See also: [`decisions/`](./decisions/) for the ADR explaining why this approach was chosen.

---

## Таксономия лейблов

Все имена — на английском, формат `prefix:value`. Ставить ровно по одному лейблу из каждой группы `status:*`, `source:*`, `priority:*`.

### `status:*` — жизненный цикл (state machine)

Ровно один `status:*` на issue в каждый момент. `status:done` не нужен — закрытое через PR issue уже является финальным.

| Лейбл | Цвет | Когда ставить | Кто ставит |
|---|---|---|---|
| `status:proposed` | жёлтый `#fbca04` | Дефолт при создании issue агентом | Агент |
| `status:approved` | зелёный `#0e8a16` | Человек одобрил — агент может брать в работу | Человек |
| `status:rejected` | красный `#b60205` | Не делаем. Закрыть issue с этим лейблом | Человек |
| `status:needs-info` | лавандовый `#d4c5f9` | Не хватает контекста — агент уточняет в комменте | Человек |
| `status:in-progress` | синий `#1d76db` | Агент начал работу; оставил коммент со ссылкой на ветку/PR | Агент |
| `status:blocked` | розовый `#e99695` | Заблокировано внешним фактором (доступы, зависимость) | Любой |

### `source:*` — откуда пришла рекомендация

Один лейбл на issue. В **теле issue** — прямая ссылка на конкретный снимок или секцию (например, `docs/insights/analytics/2026-05-16.md`).

| Лейбл | Источник |
|---|---|
| `source:posthog` | `docs/insights/analytics/*.md` (PostHog / HogQL) |
| `source:gsc` | `docs/insights/search-console/*.md` (Google Search Console) |
| `source:ads` | `docs/insights/ads/*.md` (Google Ads) |
| `source:signoz` | SigNoz observability (`/check-signoz`) |
| `source:security-review` | Аудит безопасности (`/security-review`) |
| `source:ux-audit` | UI-ревью (`impeccable`, `critique`, session recordings) |
| `source:user-feedback` | `docs/insights/qualitative/*` (интервью, письма) |
| `source:manual` | Гипотеза без data-источника |

### `priority:*` — срочность

Ровно один. Заменяет суффиксы `/P0`–`/P3` в заголовках.

| Лейбл | Цвет | Семантика |
|---|---|---|
| `priority:p0` | красный `#b60205` | Бьёт по revenue или выключает фичу прямо сейчас |
| `priority:p1` | оранжевый `#d93f0b` | На этой неделе |
| `priority:p2` | жёлтый `#fbca04` | В этом месяце |
| `priority:p3` | серый `#cccccc` | Когда-нибудь / nice-to-have |

### Тип задачи — стандартные GitHub-лейблы

Не создаём параллельный `type:*`. Используем встроенные: `bug`, `enhancement`, `documentation`, `dependencies`.

---

## Роли: кто что делает

### Агент (Claude Code)

1. **Создаёт issue** из каждой рекомендации снимка `insights/*`:
   ```bash
   gh issue create \
     --title "Короткое действенное описание" \
     --label "status:proposed,source:<...>,priority:<...>,<тип>" \
     --body "$(cat <<'EOF'
   ## Контекст

   Источник: docs/insights/analytics/2026-05-16.md

   <Краткое описание проблемы и её impact на метрику>

   ## Acceptance criteria

   - [ ] <конкретный измеримый результат>
   - [ ] <второй критерий, если нужен>
   EOF
   )"
   ```

2. **Перед началом любой сессии** — проверяет approved-очередь:
   ```bash
   gh issue list \
     --label "status:approved" \
     --state open \
     --json number,title,labels,body \
     --limit 20
   ```
   Если есть approved issue, совпадающие с текущим контекстом — берёт их первыми.

3. **При старте работы над issue** — переключает статус и оставляет коммент:
   ```bash
   gh issue edit <N> --add-label "status:in-progress" --remove-label "status:approved"
   gh issue comment <N> --body "Начинаю реализацию. Ветка: <branch-name>"
   ```

4. **При закрытии** — PR с `Closes #N` или `gh issue close <N>` — issue переходит в закрытое (done).

### Человек

- Смотрит issue с `status:proposed` → добавляет `status:approved`, `status:rejected`, или `status:needs-info`.
- При `status:rejected` — закрывает issue. Агент **не пересоздаёт** её в следующих снимках без новых данных; в снимке помечает: `Не пересоздаём — отклонено в #N`.
- При `status:needs-info` — оставляет вопрос в комменте; агент отвечает и переключает обратно на `status:proposed`.

---

## Антипаттерны

- **Не ставить датированные source-лейблы** (`posthog-2026-05-16`) — используй `source:posthog` + ссылку на снимок в теле issue.
- **Не кодировать приоритет в заголовке** (`[SEO/P0]`) — ставь `priority:p0`.
- **Не пересоздавать rejected issue** без новых данных — укажи в снимке `Не пересоздаём — отклонено в #N`.
- **Не закрывать issue вручную как "done"** без PR или ссылки — закрытие через `Closes #N` в PR даёт трассируемость.

---

## Setup: создать лейблы в GitHub

Запустить один раз при инициализации репо (или после сброса лейблов):

```bash
# status
gh label create "status:proposed"    --color "fbca04" --description "Рекомендация создана агентом, ожидает решения"
gh label create "status:approved"    --color "0e8a16" --description "Одобрено — агент может брать в работу"
gh label create "status:rejected"    --color "b60205" --description "Отклонено — не делаем"
gh label create "status:needs-info"  --color "d4c5f9" --description "Нужен контекст — агент уточняет в комменте"
gh label create "status:in-progress" --color "1d76db" --description "Агент начал работу"
gh label create "status:blocked"     --color "e99695" --description "Заблокировано внешним фактором"

# source
gh label create "source:posthog"         --color "5319e7" --description "Из insights/analytics/* (PostHog/HogQL)"
gh label create "source:gsc"             --color "5319e7" --description "Из insights/search-console/* (GSC)"
gh label create "source:ads"             --color "5319e7" --description "Из insights/ads/* (Google Ads)"
gh label create "source:signoz"          --color "5319e7" --description "Из SigNoz observability"
gh label create "source:security-review" --color "5319e7" --description "Из security-аудита"
gh label create "source:ux-audit"        --color "5319e7" --description "Из UI-ревью / session recordings"
gh label create "source:user-feedback"   --color "5319e7" --description "Из insights/qualitative/*"
gh label create "source:manual"          --color "5319e7" --description "Гипотеза без data-источника"

# priority
gh label create "priority:p0" --color "b60205" --description "Бьёт по revenue / выключает фичу сейчас"
gh label create "priority:p1" --color "d93f0b" --description "На этой неделе"
gh label create "priority:p2" --color "fbca04" --description "В этом месяце"
gh label create "priority:p3" --color "cccccc" --description "Когда-нибудь / nice-to-have"
```
