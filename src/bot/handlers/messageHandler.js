import {
  preprocessText,
  calculateSimilarity,
  extractYear,
} from "../utils/textProcessing.js";
import { getContextualGreeting } from "../utils/helpers.js";
import { logUnrecognizedQuery } from "../utils/logging.js";
import { genericResponses } from "../utils/messages.js";
import { getNBAChampion, getTeamTitles } from "../utils/nbaApi.js";
import { knownTeams } from "../utils/constants.js";

export const handleIncomingMessage = async (message, state) => {
  if (
    message.fromMe ||
    message.from.includes("@g.us") ||
    message.from.includes("status@broadcast") ||
    message.type !== "chat" ||
    !message.body ||
    message.body.trim() === ""
  )
    return;

  const userId = message.from;
  const messageText = message.body.toLowerCase().trim();
  console.log(`📨 Message received from ${userId}: "${message.body}"`);

  try {
    updateConversationContext(userId, messageText, state);
    const response = await generateResponse(messageText, userId, state);
    await message.reply(response);
    console.log(`✅ Response sent to ${userId}: "${response}"`);
  } catch (err) {
    console.error(`❌ Error processing message: ${err.message}`);
    await message.reply(
      "🔧 Lo siento, encontré un error procesando tu mensaje. Intenta de nuevo más tarde."
    );
  }
};

const updateConversationContext = (userId, message, state) => {
  if (!state.activeConversations.has(userId)) {
    state.activeConversations.set(userId, {
      messages: [],
      lastInteraction: new Date(),
      context: {},
    });
  }

  const conversation = state.activeConversations.get(userId);
  conversation.messages.push({ text: message, timestamp: new Date() });
  conversation.lastInteraction = new Date();

  if (conversation.messages.length > 10)
    conversation.messages = conversation.messages.slice(-10);
};

const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const generateResponse = async (messageText, userId, state) => {
  const { faqCorpus, activeConversations } = state;

  const normalizedText = normalizeText(messageText);
  const inputWords = preprocessText(normalizedText).split(" ").filter(Boolean);

  if (inputWords.length === 0) {
    console.log(
      `⚠️ Empty processed message from ${userId}, using generic response`
    );
    return genericResponses[
      Math.floor(Math.random() * genericResponses.length)
    ];
  }

  let bestMatch = {
    response: "",
    confidence: 0,
    category: "",
    needsYear: false,
    needsTeam: false,
  };

  // ALGORITMO DE MATCHING
  for (const [category, faq] of Object.entries(faqCorpus)) {
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const keyword of faq.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      maxPossibleScore += 100; // Peso base

      // Coincidencia exacta en el texto completo
      if (normalizedText.includes(normalizedKeyword)) {
        totalScore += 100;
        continue;
      }

      // Coincidencia exacta por palabra
      for (const word of inputWords) {
        if (word === normalizedKeyword) {
          totalScore += 90;
          break;
        }

        // Similitud por palabra
        const similarity = calculateSimilarity(word, normalizedKeyword);
        if (similarity > 0.7) {
          totalScore += similarity * 80;
          break;
        }
      }
    }

    const confidence = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

    console.log(
      `🔍 Category: ${category}, Confidence: ${confidence.toFixed(3)}`
    );

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        response: faq.response,
        confidence,
        category,
        needsYear: faq.needsYear || false,
        needsTeam: faq.needsTeam || false,
      };
    }
  }

  // THRESHOLD AJUSTADO
  if (bestMatch.confidence > 0.1) {
    console.log(
      `📚 Detected category: ${
        bestMatch.category
      } (confidence: ${bestMatch.confidence.toFixed(3)})`
    );

    // Caso especial: Consulta de campeones (año específico)
    if (bestMatch.needsYear && bestMatch.category === "champions") {
      return await handleChampionQuery(
        messageText,
        userId,
        activeConversations
      );
    }

    // NUEVO: Caso especial: Consulta de títulos de equipos
    if (bestMatch.needsTeam && bestMatch.category === "team_titles") {
      return await handleTeamTitlesQuery(
        messageText,
        userId,
        activeConversations
      );
    }

    // Caso especial: Equipos específicos (info general)
    if (bestMatch.category === "teams") {
      const { detectTeamFromMessage } = await import(
        "../utils/teamDetector.js"
      );
      const foundTeam = detectTeamFromMessage(messageText);

      if (foundTeam) {
        console.log(
          `🏀 Team info query for team '${foundTeam}' from user ${userId}`
        );
        // Devuelve la respuesta genérica de teams por ahora
      }
    }

    // Respuesta normal
    const greeting = getContextualGreeting(activeConversations.get(userId));
    return `${greeting}\n\n${bestMatch.response}`;
  } else {
    // No reconocido - pero primero verificar si es consulta directa de año
    const year = extractYear(messageText);
    if (year) {
      console.log(`🏀 Direct year query for ${year} from user ${userId}`);
      return await handleChampionQuery(
        messageText,
        userId,
        activeConversations
      );
    }

    // Log y respuesta genérica
    if (!userId.includes("status@broadcast") && messageText.length > 0) {
      await logUnrecognizedQuery(messageText, userId, state);
    }
    return genericResponses[
      Math.floor(Math.random() * genericResponses.length)
    ];
  }
};

const handleChampionQuery = async (
  messageText,
  userId,
  activeConversations
) => {
  const year = extractYear(messageText);

  if (year) {
    console.log(`🏀 Champion query for year ${year} from user ${userId}`);
    const championResult = await getNBAChampion(year);

    if (championResult.success) {
      const greeting = getContextualGreeting(activeConversations.get(userId));
      return `${greeting}\n\n${championResult.data.message}`;
    } else {
      return championResult.message;
    }
  } else {
    return `🏆 **Campeones NBA** \n\n¿De qué año específico quieres saber el campeón? \n\nEjemplos:\n• '¿Quién ganó en 1998?'\n• 'Campeón de 2016'\n• 'Título 2020'\n\n📅 Tengo información desde 1947 hasta 2024`;
  }
};

const handleTeamTitlesQuery = async (
  messageText,
  userId,
  activeConversations
) => {
  const { detectTeamFromMessage } = await import("../utils/teamDetector.js");

  const foundTeam = detectTeamFromMessage(messageText);

  if (foundTeam) {
    console.log(`🏀 Team titles query for '${foundTeam}' from user ${userId}`);
    const titlesResult = await getTeamTitles(foundTeam);

    if (titlesResult.success) {
      const greeting = getContextualGreeting(activeConversations.get(userId));
      return `${greeting}\n\n${titlesResult.data.message}`;
    } else {
      return titlesResult.message;
    }
  } else {
    return `🏆 **Títulos de Equipos NBA** \n\n¿De qué equipo específico quieres saber los títulos? \n\nEjemplos:\n• 'Títulos de los Lakers'\n• 'Cuántos anillos tienen los Bulls'\n• 'Campeonatos de los Celtics'\n\n🏀 Equipos disponibles: Lakers, Celtics, Bulls, Warriors, Heat, Spurs, etc.`;
  }
};
