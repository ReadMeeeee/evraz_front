const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const AdmZip = require("adm-zip");

const supportedExtensions = [".zip", ".py", ".cs", ".ts"];
const archiveExtensions = [".py", ".cs", ".ts"];

// Проверка расширения файла
const validateFileExtension = (extension) => {
    if (!supportedExtensions.includes(extension)) {
        throw new Error(`Unsupported file type: ${extension}`);
    }
};

// Переименование файла
const renameFile = (uploadedFilePath, extension) => {
    const renamedFilePath = path.join(__dirname, "uploads", `${crypto.randomUUID()}${extension}`);
    fs.renameSync(uploadedFilePath, renamedFilePath);
    return renamedFilePath;
};

// Обработка .zip файлов
const handleZipFile = (zipFilePath) => {
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) {
        throw new Error("The .zip file is empty.");
    }

    let detectedType = null;
    zipEntries.forEach((entry) => {
        if (!entry.isDirectory && !detectedType) {
            const fileExtension = path.extname(entry.entryName).toLowerCase();
            if (archiveExtensions.includes(fileExtension)) {
                detectedType = fileExtension.slice(1); // Убираем точку из расширения
            }
        }
    });

    if (!detectedType) {
        throw new Error("The .zip file must contain at least one .py, .cs, or .ts file.");
    }

    return detectedType;
};

module.exports = { validateFileExtension, renameFile, handleZipFile };
