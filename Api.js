const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(express.json({ limit: "50mb" }));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
});

client.initialize();

client.on("qr", (qr) => {
    console.log("Escanea este código QR:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("✅ WhatsApp Web listo para enviar mensajes");
});

// ⚙️ Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "WhatsAPI",
            version: "1.0.0",
            description: "API para enviar mensajes y archivos por WhatsApp",
        },
    },
    apis: ["./Api.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /send-message:
 *   post:
 *     summary: Enviar un mensaje de texto por WhatsApp
 *     description: Envía un mensaje de texto a un número de WhatsApp.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *                 example: "573001234567"
 *               message:
 *                 type: string
 *                 example: "Hola, este es un mensaje de prueba"
 *     responses:
 *       200:
 *         description: Mensaje enviado correctamente
 *       400:
 *         description: Faltan parámetros
 *       500:
 *         description: Error en el servidor
 */
app.post("/send-message", async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: "Faltan parámetros" });
    }

    try {
        const whatsappNumber = number.includes("@c.us") ? number : `${number}@c.us`;
        await client.sendMessage(whatsappNumber, message);
        console.log(`📩 Mensaje enviado a ${number}: ${message}`);
        res.json({ success: true, message: "Mensaje enviado correctamente" });
    } catch (error) {
        console.error("❌ Error al enviar mensaje:", error);
        res.status(500).json({ error: "No se pudo enviar el mensaje" });
    }
});

/**
 * @swagger
 * /send-image:
 *   post:
 *     summary: Enviar una imagen por WhatsApp
 *     description: Envía una imagen a un número de WhatsApp desde una URL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *                 example: "573001234567"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               caption:
 *                 type: string
 *                 example: "Esta es una imagen de prueba"
 *     responses:
 *       200:
 *         description: Imagen enviada correctamente
 *       400:
 *         description: Faltan parámetros
 *       500:
 *         description: Error en el servidor
 */
app.post("/send-image", async (req, res) => {
    const { number, imageUrl, caption } = req.body;

    if (!number || !imageUrl) {
        return res.status(400).json({ error: "Faltan parámetros" });
    }

    try {
        const whatsappNumber = number.includes("@c.us") ? number : `${number}@c.us`;
        const media = await MessageMedia.fromUrl(imageUrl);
        await client.sendMessage(whatsappNumber, media, { caption });
        console.log(`🖼️ Imagen enviada a ${number} desde URL: ${imageUrl}`);
        res.json({ success: true, message: "Imagen enviada correctamente" });
    } catch (error) {
        console.error("❌ Error al enviar imagen:", error);
        res.status(500).json({ error: "No se pudo enviar la imagen" });
    }
});

/**
 * @swagger
 * /send-file:
 *   post:
 *     summary: Enviar un archivo por WhatsApp
 *     description: Envía un archivo a un número de WhatsApp en formato base64.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *                 example: "573001234567"
 *               filename:
 *                 type: string
 *                 example: "documento.pdf"
 *               base64:
 *                 type: string
 *                 example: "JVBERi0xLjQKJe..."
 *     responses:
 *       200:
 *         description: Archivo enviado correctamente
 *       400:
 *         description: Faltan parámetros
 *       500:
 *         description: Error en el servidor
 */
app.post("/send-file", async (req, res) => {
    const { number, filename, base64 } = req.body;

    if (!number || !filename || !base64) {
        return res.status(400).json({ error: "Faltan parámetros" });
    }

    try {
        const whatsappNumber = number.includes("@c.us") ? number : `${number}@c.us`;
        const media = new MessageMedia("application/pdf", base64, filename);
        await client.sendMessage(whatsappNumber, media);
        console.log(`📄 Archivo enviado a ${number}: ${filename}`);
        res.json({ success: true, message: "Archivo enviado correctamente" });
    } catch (error) {
        console.error("❌ Error al enviar archivo:", error);
        res.status(500).json({ error: "No se pudo enviar el archivo" });
    }
});

app.listen(3000, () => {
    console.log("🚀 API corriendo en http://localhost:3000");
    console.log("📄 Swagger UI disponible en http://localhost:3000/api-docs");
});
