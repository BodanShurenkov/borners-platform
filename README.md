# BORNERS GROUP — Strategy & Product Development Platform (v1.0 | 2026–2027)

Закрытая корпоративная веб-платформа стратегического управления, продуктовой лаборатории (**Product Lab**) и бизнес-аналитики для портфеля брендов мужского нижнего белья **BORNERS** и **НА ТЕЛЕ**, расширяемая на новые бренды.

---

## 1. Три ключевых контура платформы
1. **Strategy Platform** — интерактивная презентация стратегии брендов (`BORNERS` / `НА ТЕЛЕ`), 14 обязательных стратегических блоков с версионностью, черновиками, статусами согласования (`Черновик / На согласовании / Утверждено`), защитой утверждённых версий по ролям, **Strategy Mode** и базой `Market Intelligence`.
2. **Product Development System** — единый сквозной цикл от концепции в `Product Lab` (`IDEA → RESEARCH → DESIGN → PROTOTYPE → TESTING → APPROVED → PRODUCTION → READY TO LAUNCH`) и трёхъязычного производственного ТЗ для фабрики (`中文 / ENGLISH / РУССКИЙ`, китайский первым + экспорт в PDF) до карточки в `Product Catalog` и коммерческого релиза в `Launch Calendar`.
3. **Business Management System** — управление `Launch Calendar` (10 этапов запуска, предупреждение о конфликтах сроков при переносе даты без молчаливого сдвига), `Finance` (6 подразделов, сценарии `Conservative / Base / Optimistic`, формулы выручки и юнит-экономики, 8-шаговый импорт CSV/Excel), `Roadmap & Tasks`, `Documents` и `Team & Access Control`.

---

## 2. Технический стек (п. 16 ТЗ)
- **Frontend & Framework:** Next.js (App Router) + React + TypeScript
- **Styling & UI:** Tailwind CSS + кастомная дизайн-система *Premium Minimalism × Fashion Tech × Business Intelligence* (`#F7F7F5`, `#FFFFFF`, `#171717`, `#737373`, `#E8E8E5`, `#111111`, `BORNERS #D97745`, `НА ТЕЛЕ #8B8078`, `#16805D`, `#D99527`, `#C94B4B`)
- **Charts & Analytics:** Recharts
- **Database & Auth / Storage:** PostgreSQL / Supabase (полные SQL-миграции и RLS-политики в [`supabase/migrations/`](./supabase/migrations)) + локальное персистентное хранилище (`localStorage`) с предзагруженными DEMO-данными (`BIG LOVE`, `Skin Tone Collection`)

---

## 3. Инструкция локального запуска (п. 26 ТЗ)

### Шаг 1. Установка зависимостей
```bash
npm install
```

### Шаг 2. Настройка переменных окружения
Скопируйте шаблон `.env.example` в `.env.local`:
```bash
cp .env.example .env.local
```
*Примечание:* Платформа запускается сразу в автономном персистентном режиме с демонстрационными данными (`NEXT_PUBLIC_ENABLE_DEMO_MODE=true`). Для подключения облачного проекта Supabase укажите `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` и примените миграции из папки `supabase/migrations/`.

### Шаг 3. Запуск сервера разработки
```bash
npm run dev
```
Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Шаг 4. Запуск автоматических тестов
```bash
node --experimental-strip-types --test tests/platform.test.ts
```

---

## 4. Сценарий приёмки (п. 25 ТЗ)
Пользователь без участия разработчика может пройти весь сквозной путь:
1. Войти в систему → выбрать бренд **BORNERS** в верхнем переключателе.
2. Открыть **Product Lab** → нажать **+ NEW PRODUCT CONCEPT** → создать концепцию → загрузить фото / AI-рендер → добавить характеристики → сохранить.
3. Изменить статус концепции на `APPROVED` → нажать **Создать Продукт в каталоге**.
4. Перейти во вкладку **Запуск, Задачи, Бюджет & Связи** → установить дату и маркетинговый бюджет → нажать **Создать запуск с бюджетом** → назначить задачи и ответственных.
5. Увидеть созданный запуск в **Launch Calendar** и в блоке **Upcoming Launches** на **Dashboard**.
6. Открыть запуск с **Dashboard** → нажать **Перейти обратно к продукту**.
7. Включить **Strategy Mode** в верхней панели → просмотреть презентацию стратегии.
8. Нажать **Выйти из системы** в меню профиля и снова войти — все созданные объекты и связи сохраняются без потерь.
