# TGate Frontend - GitHub Pages Deployment

🚀 **Рабочий сайт:** https://vibegrind.github.io/tgate-clean/

Этот фронтенд развернут на GitHub Pages и подключен к локальным API через Cloudflare туннели.

## 📋 Архитектура

```
GitHub Pages (Статический хостинг)
       ↓
Cloudflare Tunnels (Публичный доступ)
       ↓
Локальные Docker API сервисы
       ↓
PostgreSQL База данных
```

## 🔧 Активная конфигурация

### API Endpoints:
- **Основной API (БД):** https://raised-britannica-cafe-sleeps.trycloudflare.com
- **API Индексатора:** https://granted-alumni-manitoba-pt.trycloudflare.com/api
- **WebSocket:** wss://raised-britannica-cafe-sleeps.trycloudflare.com

### Локальные сервисы:
- **tggate-api:** localhost:8000 (через Docker)
- **tg-index-manual-online:** localhost:5005 (через Docker)
- **PostgreSQL:** localhost:5433

## 🚀 Быстрый старт

### 1. Запуск локальных сервисов
```bash
cd /home/user/TGate/containers/tg-storage
docker compose up -d tg-postgres tggate-api tg-index-manual-online
```

### 2. Проверка сервисов
```bash
# Проверка API БД
curl http://localhost:8000
# Ответ: {"message":"TGate Database API"}

# Проверка API индексатора
curl http://localhost:5005/api/counter
# Ответ: JSON с данными счетчика
```

### 3. Запуск туннелей
```bash
# В отдельных терминалах или фоне
cloudflared tunnel --url http://localhost:8000
cloudflared tunnel --url http://localhost:5005
```

## 🔄 Деплой обновлений (пошагово)

### Метод 1: Автоматический деплой

1. **Обновите код фронтенда**
2. **Соберите проект:**
   ```bash
   cd /home/user/TGate/frontend/tg-database
   rm -rf dist
   npm run build
   ```

3. **Автоматический деплой:**
   ```bash
   # Скрипт для автоматического деплоя
   cd dist
   touch .nojekyll
   git init
   git add .
   git commit -m "Update frontend - $(date)"
   git push --force https://YOUR_TOKEN@github.com/VibeGrind/tgate-clean.git master:gh-pages
   ```

### Метод 2: Ручной деплой через gh-pages

1. **Установите gh-pages (если не установлен):**
   ```bash
   npm install -g gh-pages
   ```

2. **Добавьте в package.json:**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist -r https://YOUR_TOKEN@github.com/VibeGrind/tgate-clean.git"
     }
   }
   ```

3. **Деплой:**
   ```bash
   npm run build
   touch dist/.nojekyll
   npm run deploy
   ```

## 🔗 Обновление туннелей

### При изменении туннелей:

1. **Запустите новые туннели:**
   ```bash
   cloudflared tunnel --url http://localhost:8000 > /tmp/tunnel8000.log 2>&1 &
   cloudflared tunnel --url http://localhost:5005 > /tmp/tunnel5005.log 2>&1 &
   ```

2. **Получите новые URL:**
   ```bash
   grep -o "https://[^[:space:]]*\.trycloudflare\.com" /tmp/tunnel8000.log
   grep -o "https://[^[:space:]]*\.trycloudflare\.com" /tmp/tunnel5005.log
   ```

3. **Обновите .env.production:**
   ```bash
   cd /home/user/TGate/frontend/tg-database
   cat > .env.production << EOF
   VITE_API_URL=https://НОВЫЙ-URL-8000.trycloudflare.com
   VITE_WS_URL=wss://НОВЫЙ-URL-8000.trycloudflare.com
   VITE_INDEX_API_URL=https://НОВЫЙ-URL-5005.trycloudflare.com/api
   EOF
   ```

4. **Пересоберите и деплойте** (см. выше)

## 🏗️ Структура проекта

```
frontend/tg-database/           # Основной фронтенд
├── src/
│   ├── components/
│   │   ├── IndexViewer.tsx     # Компонент индексатора
│   │   └── TableViewer.tsx     # Компонент просмотра таблиц
│   ├── hooks/
│   │   ├── useTableData.ts     # Хук для работы с API БД
│   │   ├── useWebSocket.ts     # Хук для WebSocket
│   │   └── useTablesStatus.ts  # Хук статуса таблиц
│   └── types/index.ts          # TypeScript типы
├── .env.production             # Переменные окружения (PROD)
├── vite.config.ts              # Конфигурация Vite
└── dist/                       # Собранные файлы для деплоя

backend/tg-index-manual/        # API индексатора (Flask)
└── server.py                   # CORS: origins=['*']

services/backend/               # API БД (FastAPI)  
└── app.py                      # CORS: vibegrind.github.io
```

## 🛠️ Конфигурация

### Vite (vite.config.ts):
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/tgate-clean/',  // Базовый путь для GitHub Pages
  // ...
})
```

### CORS настройки:
- **API БД (FastAPI):** Разрешен домен `https://vibegrind.github.io`
- **API Индексатора (Flask):** Разрешены все origins `*`

## 🔐 Безопасность

### Что НЕ публикуется:
- ✅ База данных (только локальная)
- ✅ Пароли и токены (в переменных окружения Docker)
- ✅ Прямой доступ к портам (только через туннели)

### Что публично доступно:
- 🌐 Статический фронтенд (GitHub Pages)
- 🔒 API через HTTPS туннели (Cloudflare)

## 📊 Мониторинг

### Проверка работы:
```bash
# Статус Docker сервисов
docker compose -f containers/tg-storage/docker-compose.yml ps

# Доступность API
curl https://raised-britannica-cafe-sleeps.trycloudflare.com
curl https://granted-alumni-manitoba-pt.trycloudflare.com/api/counter

# Логи туннелей
tail -f /tmp/tunnel8000.log
tail -f /tmp/tunnel5005.log
```

### Restart всего стека:
```bash
# Остановка
docker compose -f containers/tg-storage/docker-compose.yml down
pkill cloudflared

# Запуск
docker compose -f containers/tg-storage/docker-compose.yml up -d tg-postgres tggate-api tg-index-manual-online
cloudflared tunnel --url http://localhost:8000 &
cloudflared tunnel --url http://localhost:5005 &
```

## 🐛 Решение проблем

### Белый экран на сайте:
1. Проверьте наличие `.nojekyll` файла в деплое
2. Убедитесь в корректности базового пути в vite.config.ts
3. Проверьте загрузку JS файлов в DevTools

### API недоступно:
1. Проверьте запуск Docker сервисов
2. Убедитесь, что туннели активны
3. Проверьте CORS настройки

### Туннели не работают:
1. Перезапустите cloudflared
2. Обновите URL в .env.production
3. Пересоберите и деплойте фронтенд

## 📝 История версий

- **v1.0** - Первоначальный деплой на tgate_pro (проблемы с Jekyll)
- **v2.0** - Чистый деплой на tgate-clean (рабочая версия)
- **v2.1** - Подключение к локальным API через туннели

---

**🎯 Результат:** Полнофункциональный фронтенд доступный всему интернету с подключением к приватным локальным API через безопасные туннели.