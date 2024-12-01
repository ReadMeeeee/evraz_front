const { validateFileExtension, renameFile, handleZipFile } = require("./fileUtils");
const axiosClient = require("./axiosClient");
const fs = require("fs");
const path = require("path");

const processFile = async (req, res) => {
    const uploadedFilePath = req.file?.path;
    if (!uploadedFilePath) return res.status(400).send("No file uploaded.");

    const originalExtension = path.extname(req.file.originalname).toLowerCase();

    try {
        validateFileExtension(originalExtension);

        const renamedFilePath = renameFile(uploadedFilePath, originalExtension);

        if (originalExtension === ".zip") {
            req.headers["type"] = handleZipFile(renamedFilePath);
        } else {
            req.headers["type"] = originalExtension.slice(1);
        }

        const fileType = req.headers["type"];
        const response = await axiosClient.sendFile(renamedFilePath, originalExtension, req.file.originalname, fileType);

        const pdfFilePath = path.join(__dirname, "corrections.pdf");
        const pdfWriteStream = fs.createWriteStream(pdfFilePath);

        response.data.pipe(pdfWriteStream);

        pdfWriteStream.on("finish", () => {
            console.log("PDF file successfully saved:", pdfFilePath);
            res.download(pdfFilePath, "corrections.pdf", (err) => {
                if (err) {
                    console.error("Error while sending PDF to client:", err);
                    res.status(500).send("Error while sending PDF to client.");
                } else {
                    console.log("PDF successfully sent to client.");
                }
            });
        });

        pdfWriteStream.on("error", (err) => {
            console.error("Error while writing PDF:", err);
            res.status(500).send("Error while saving PDF.");
        });
    } catch (error) {
        console.error("Error processing the file:", error.message);
        res.status(500).send("An error occurred while processing the file.");
    }
};

module.exports = { processFile };
