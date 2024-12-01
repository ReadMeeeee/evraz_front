const express = require("express");
const multer = require("multer");
const path = require("path");
const { processFile } = require("./requestHandler");

const app = express();
const PORT = 8080;

const upload = multer({ dest: "uploads/" });

app.use(express.static(path.join(__dirname, "public")));

app.post("/send", upload.single("file"), processFile);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
