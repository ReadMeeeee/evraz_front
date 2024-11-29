// Перед запуском установить следующие зависимости:
// sudo apt update               (или dnf вместо apt)
// sudo apt install nodejs npm   (или dnf вместо apt)
// npm install express multer axios form-data
// Проверка:
// npm init -y
// Запуск:
// node app.js

const express = require("express");          // Создание веб-сервера
const multer = require("multer");  // Обработка загрузки файлов
const axios = require("axios");                            // Отправка HTTP-запросов
const fs = require("fs");                                 // Работа с файловой системой
const FormData = require("form-data");                         // Работа с данными формами

const path = require("path"); // Корректная работа с фс
const crypto = require("crypto");        // Создание уникального идентификатора

const app = express();
const PORT = 28563;

const upload = multer({ dest: "uploads/" });

// HTML страницы
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Upload .zip</title>
        </head>
        <body>
            <h1>Upload a .zip File</h1>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <input type="file" name="file" accept=".zip" required>
                <button type="submit">Upload</button>
            </form>
        </body>
        </html>
    `);
});

// Обработка загрузки и передачи данных
//TODO уточнить за проверку размеров архива
app.post("/upload", upload.single("file"),
    async (req, res) => {
    //TODO написть Мише, протестировать на сервере
    const backendServerUrl = "http://localhost:28563/upload"; // Адрес бэкенд сервера
    const uploadedFilePath = req.file?.path;                         // Путь к загруженному файлу

    if (!uploadedFilePath) {
        return res.status(400).send("No file uploaded.");
    }

    const uniqueFileName = `${crypto.randomUUID()}.txt`;                        // Уникальное имя, чтобы
    const correctionFilePath = path.join(__dirname, "uploads", uniqueFileName); // не ошибиться из-за асинхр.
    // Папка с временными файлами создается в той же директории, что и app.js

    try {
        console.log(`File received: ${req.file.originalname}`);
        console.log("Uploaded file path:", uploadedFilePath);

        // Формируем данные для отправки
        const formData = new FormData();
        formData.append("file", fs.createReadStream(uploadedFilePath), req.file.originalname);

        // Отправляем архив на бэкенд сервер
        const response = await axios.post(backendServerUrl, formData, {
            headers: formData.getHeaders(),
        });

        console.log("File successfully sent. Receiving corrections...");

        //TODO получение ответа от бэкенда:
        // 1. тип файла?
        // 2. займется ли бэкенд отправкой файла ответа уже по уникальному ключу?
        //    (по уже существующему названию архива)
        //    (или в архиве может быть много файлов?)

        // Сохраняем данные из ответа сервера в файл
        fs.writeFileSync(correctionFilePath, response.data);

        // Отправляем клиенту файл с корректировками
        res.download(correctionFilePath, uniqueFileName, (err) => {
            if (err) {
                console.error("Error sending correction file:", err);
            }

            // Удаляем файл с корректировками после отправки
            fs.unlink(correctionFilePath, (err) => {
                if (err) console.error("Error deleting correction file:", err);
            });
        });
    } catch (error) {
        console.error("Error processing the file:", error.message);
        res.status(500).send("An error occurred while processing the file.");
    } finally {
        // Удаляем временный загруженный файл
        fs.unlink(uploadedFilePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
    }
});

// Запуск
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// При тестировании на одном устройстве получаем рекурсию.
// Андрей, не убей ноут. Используй докер, или проверяй онли дизайн =)
