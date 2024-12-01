const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const baseUrl = "https://bba8pjurs296duc29tsm.containers.yandexcloud.net";
const endpointMap = {
    ".zip": `${baseUrl}/zip`,
    ".py": `${baseUrl}/file`,
    ".cs": `${baseUrl}/file`,
    ".ts": `${baseUrl}/file`,
};

const getEndpoint = (fileExtension) => {
    return endpointMap[fileExtension] || null;
};

const axiosClient = {
    async sendFile(filePath, fileExtension, originalName, fileType) {
        const endpoint = getEndpoint(fileExtension);

        if (!endpoint) {
            throw new Error(`Unsupported file extension: ${fileExtension}`);
        }

        const formData = new FormData();
        formData.append("some", fs.createReadStream(filePath), originalName);

        const config = {
            url: endpoint,
            method: "post",
            headers: {
                ...formData.getHeaders(),
                type: fileType,
            },
            data: formData,
            responseType: "stream",
        };

        try {
            const response = await axios(config);
            return response;
        } catch (error) {
            console.error("Error in Axios request:", error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
            }
            throw error;
        }
    },
};

module.exports = axiosClient;
