# Spend-o-meter

React + Vite приложение, которое синхронизирует разделы «Калькулятор финансов», «Планировщик кэшбэка» и «Избранные товары» с таблицей Google Sheets. Пользователь проходит авторизацию через Google OAuth, после чего данные автоматически подтягиваются из таблицы и отправляются обратно с учётом квот API.

## Основные возможности

1. **Авторизация Google OAuth** — @react-oauth/google, хранение профиля и токена в localStorage, проверка прав доступа по листу `Access`.
2. **FinanceCalculator ⇄ лист Payments** — все изменения платежей синкаются с таблицей и отображаются в диаграмме.
3. **CashbackPlanner ⇄ лист Cashback** — банки и категории подтягиваются и пишутся обратно с дебаунсом, чтобы не превышать лимиты 60 записей/мин.
4. **Favorites (ProductComparator) ⇄ лист SavedGoods** — избранные продукты сохраняются локально и в таблице с использованием стабильных ID.
5. **Обработка ошибок и статусов** — текстовые сообщения «Syncing…»/warning при проблемах Google Sheets.

## Требования

- Node.js ≥ 18
- npm ≥ 9
- Доступ к нужной Google таблице и OAuth-клиент со scope `https://www.googleapis.com/auth/spreadsheets`

## Установка и запуск

```bash
npm install
npm run dev
```

Приложение по умолчанию стартует на `http://localhost:5173`.

## Переменные окружения

Создайте файл `.env` (или `.env.local`) с настройками:

```
VITE_GOOGLE_CLIENT_ID=<OAuth client ID>
VITE_GOOGLE_SHEET_ID=<Spreadsheet ID из URL>
```

## Настройка Google Cloud

1. **Создайте проект** в [Google Cloud Console](https://console.cloud.google.com/) и включите API *Google Sheets API*.
2. **Экран согласия OAuth**: тип *Internal/Test*, добавьте адреса тестировщиков (те же emails, что будут в листе `Access`), укажите scope `.../auth/spreadsheets`.
3. **Учётные данные → OAuth client ID**: тип *Web application*, добавьте в `Authorized JavaScript origins` `http://localhost:5173`, а в `Authorized redirect URIs` `http://localhost:5173`.
4. Сохраните выданный `client_id` и пропишите его в `.env` как `VITE_GOOGLE_CLIENT_ID`.

## Конфигурация Google Sheets

Убедитесь, что ваш Google аккаунт имеет доступ *Редактор* к таблице. Внутри таблицы должны быть листы и заголовки:

| Лист | Диапазон | Заголовки |
| --- | --- | --- |
| `Access` | `Access!A:D` | `ID_user`, `email`, `role`, `active` (`active` = TRUE для разрешённого пользователя) |
| `Payments` | `Payments!A:H` | `ID_required_pay`, `name`, `amount`, `start_date`, `end_date`, `frequency`, `last_paid_at`, `is_active` |
| `Cashback` | `Cashback!A:E` | `ID_cashback_element`, `cashbackUserName`, `bankName`, `categoryCashBack`, `percentCashback` |
| `SavedGoods` | `SavedGoods!A:D` | `ID_saved_product`, `productName`, `productPrice`, `productUnits` |

> ⚠️ Строка заголовков обязательна. Приложение автоматически добавляет значения, сопоставляя их по именам колонок.

## Локальное хранение

- `auth:user` — профиль, токен и права доступа.
- `financeData`, `cashbackBanks`, `favoriteProducts` — кэши соответствующих секций, которые помогают мгновенно отрисовать данные даже без сети.

## Поведение синхронизации

- Каждый раздел использует `useSheetSync`: сперва `pull`, затем `push`.
- Запись в Google Sheets выполняется с дебаунсом (1–1.2 c) и через операции `clear+write`, чтобы поддерживать порядок строк.
- Если пользователь не имеет доступа (нет записи или `active != TRUE`), разделы остаются в офлайн-режиме и показывают предупреждение.

## Пошаговое тестирование

1. **Подготовка**: заполните `.env`, убедитесь, что ваш email присутствует в листе `Access` и отмечен `active = TRUE`.
2. **Запуск**: `npm run dev` и откройте `http://localhost:5173`.
3. **Логин**: нажмите кнопку входа, выберите тестовый Google аккаунт.
4. **FinanceCalculator**:
   - Убедитесь, что платежи загрузились из листа `Payments`.
   - Добавьте/измените запись, ждите статуса «Syncing…», проверьте, что изменения появились в таблице.
5. **CashbackPlanner**:
   - Добавьте банк/категорию; изменения должны появиться в листе `Cashback` после короткой задержки.
   - Проверьте, что кнопка удаления также синхронизируется.
6. **Favorites**:
   - В разделе сравнения товаров заполните имя/цену/единицы и добавьте в избранное.
   - Проверьте лист `SavedGoods` — появится новая строка.
7. **Перезагрузка страницы**: данные должны подтянуться автоматически без повторного логина (токен и права берутся из localStorage).

## Траблшутинг

- **`access_denied`** — добавьте email пользователя в список тестировщиков OAuth и в лист `Access`.
- **`Quota exceeded` (429)** — подождите минуту; приложение уже дебаунсит записи, избегайте массовых быстрых правок.
- **Пустые данные после логина** — проверьте, что столбцы в таблице именуются точно как указано выше.
- **Нужно вынуть пользователя из списка** — отметьте `active = FALSE` в листе `Access`, удалите `auth:user` из localStorage.

## Продуктивная сборка

```bash
npm run build
npm run preview
```

Сборка Vite будет использовать те же переменные окружения, что и dev, поэтому убедитесь, что `.env.production` содержит правильный `client_id` и `sheet_id`.
