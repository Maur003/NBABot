import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;
import puppeteer from "puppeteer";

const browserPath = puppeteer.executablePath();

import qrcode from "qrcode-terminal";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

import { faqCorpus } from "./config/corpus.js";
import { welcomeUsersList } from "./config/usersList.js";
import { delay } from "./utils/helpers.js";
import { welcomeMessage } from "./utils/messages.js";
import { handleIncomingMessage } from "./handlers/messageHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WhatsAppBot {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: "nba-bot" }),
      puppeteer: {
        executablePath: browserPath,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    this.faqCorpus = faqCorpus;
    this.welcomeUsersList = welcomeUsersList;
    this.unrecognizedQueries = [];
    this.activeConversations = new Map();
  }

  inicializarBot = async () => {
    this.client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
    this.client.on("ready", () => this.enviarMensajesDeBienvenida());
    this.client.on("message", (msg) => handleIncomingMessage(msg, this));
    this.client.on("auth_failure", (msg) =>
      console.error(`❌ Falló la autenticación: ${msg}`)
    );
    this.client.on("disconnected", (reason) =>
      console.log(`🔌 Cliente desconectado: ${reason}`)
    );
    try {
      await this.client.initialize();
    } catch (err) {
      console.error("Error en la inicialización del cliente:", err);
    }
  };

  enviarMensajesDeBienvenida = async () => {
    const imagenPromo = await this.crearImagenPromocional();

    for (const userId of this.welcomeUsersList) {
      try {
        if (imagenPromo) {
          await this.client.sendMessage(userId, imagenPromo, {
            caption: welcomeMessage,
          });
          console.log(`✅ Imagen promocional enviada a ${userId}`);
        } else {
          await this.client.sendMessage(userId, welcomeMessage);
          console.log(`✅ Mensaje de bienvenida enviado a ${userId}`);
        }

        await delay(2000);
      } catch (err) {
        console.error(
          `❌ Error al enviar mensaje de bienvenida a ${userId}: ${err.message}`
        );
      }
    }
  };

  crearImagenPromocional = async () => {
    try {
      const rutaImagen = path.join(
        __dirname,
        "../../public/nba-promocional.png"
      );
      await fs.access(rutaImagen);
      console.log("✅ Imagen promocional encontrada");
      const media = MessageMedia.fromFilePath(rutaImagen);
      return media;
    } catch (error) {
      console.log(
        "⚠️ No se encontró imagen promocional, se enviará solo texto"
      );
      return null;
    }
  };
}
