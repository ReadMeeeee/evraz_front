# Используем официальный базовый образ Node.js
FROM --platform=linux/amd64 node:18-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --no-cache

# Копируем все файлы проекта (кроме игнорируемых в .dockerignore)
COPY . .

# Открываем порт, на котором работает приложение
EXPOSE 8080

# Указываем команду для запуска приложения
CMD ["node", "app.js"]