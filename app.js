const express = require("express");          // Создание веб-сервера
const multer = require("multer");            // Обработка загрузки файлов
const axios = require("axios");              // Отправка HTTP-запросов
const fs = require("fs");                    // Работа с файловой системой
const FormData = require("form-data");       // Работа с данными форм

const path = require("path");                // Корректная работа с путями
const crypto = require("crypto");            // Создание уникального идентификатора

const app = express();
const PORT = 28563;

const upload = multer({ dest: "uploads/" });

// Глобальные параметры axios
const axiosConfig = {
    headers: {
        "Content-Type": "multipart/form-data",
    },
};

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
            <form action="/send" method="POST" enctype="multipart/form-data">
                <input type="file" name="file" accept=".zip" required>
                <button type="submit">Upload</button>
            </form>
        </body>
        </html>
    `);
});

app.post("/send", upload.single("file"), async (req, res) => {
    const targetServerUrl = "https://bba8pjurs296duc29tsm.containers.yandexcloud.net/zip"; // Адрес бэкенд сервера
    const uploadedFilePath = req.file?.path; // Путь к загруженному файлу

    if (!uploadedFilePath) {
        return res.status(400).send("No file uploaded.");
    }

    const uniqueFileName = `${crypto.randomUUID()}.zip`;
    const renamedFilePath = path.join(__dirname, "uploads", uniqueFileName);

    try {
        console.log(`File received: ${req.file.originalname}`);
        console.log("Uploaded file path:", uploadedFilePath);

        // Проверка размера файла
        const fileStats = fs.statSync(uploadedFilePath);
        if (fileStats.size === 0) {
            console.error("Uploaded file is empty.");
            return res.status(400).send("Uploaded file is empty.");
        }
        console.log(`Uploaded file size: ${fileStats.size} bytes`);

        // Переименовываем файл
        fs.renameSync(uploadedFilePath, renamedFilePath);

        // Проверка содержимого файла (файл = .zip)
        const fileBuffer = fs.readFileSync(renamedFilePath);
        if (!fileBuffer.slice(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
            console.error("Uploaded file is not a valid .zip archive.");
            return res.status(400).send("Uploaded file is not a valid .zip archive.");
        }

        // Формируем данные для отправки
        const formData = new FormData();
        // Отправляем файл с полем 'some'
        formData.append("some", fs.createReadStream(renamedFilePath), uniqueFileName);

        // Отправка файла
        const response = await axios.post(targetServerUrl, formData, {
            ...axiosConfig,  // Включаем кфг axios
            headers: {
                ...axiosConfig.headers,        // Заголовки по умолчанию
                ...formData.getHeaders(),      // Заголовки для формы
            },
        });

        console.log("File successfully sent. Response from target server:", response.data);

        res.status(200).send("File sent successfully!");
    } catch (error) {
        console.error("Error sending the file:", error.message);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        res.status(500).send("An error occurred while sending the file.");
    } finally {
        // Удаляем временный переименованный файл
        fs.unlink(renamedFilePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
    }
});


// Запуск
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
