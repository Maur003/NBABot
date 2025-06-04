import { champions, teamChampionships } from "./teamData.js";
import { detectTeamFromMessage } from "./teamDetector.js";

// Capitaliza cada palabra de una frase (e.g. "los angeles lakers" → "Los Angeles Lakers")
function capitalizeEachWord(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Devuelve el campeón de la NBA para un año específico
export const getNBAChampion = (year) => {
  try {
    if (!year || typeof year !== "number") {
      return {
        success: false,
        message: "❌ Año no válido. Debe ser un número entre 1947 y 2024.",
      };
    }

    if (year < 1947 || year > 2024) {
      return {
        success: false,
        message: `❌ Año inválido. La NBA existe desde 1947 hasta 2024.`,
      };
    }

    return getChampionFromData(year);
  } catch (error) {
    console.error(`❌ Error al obtener el campeón del año ${year}:`, error);
    return {
      success: false,
      message: `🔧 Error al consultar información del año ${year}. Intenta de nuevo.`,
    };
  }
};

// Devuelve cuántos títulos tiene un equipo
export const getTeamTitles = (input) => {
  try {
    if (!input || typeof input !== "string") {
      return {
        success: false,
        message: "❌ Nombre de equipo no válido.",
      };
    }

    // Usar SOLO la función de detección robusta
    const teamKey = detectTeamFromMessage(input);

    if (teamKey && teamChampionships[teamKey]) {
      const { titles, lastTitle } = teamChampionships[teamKey];
      const teamDisplayName = capitalizeEachWord(teamKey);

      return {
        success: true,
        data: {
          titles,
          lastTitle,
          message:
            titles > 0
              ? `🏆 Los ${teamDisplayName} han ganado **${titles} título${
                  titles > 1 ? "s" : ""
                } NBA**, el más reciente en **${lastTitle}**.`
              : `🤔 Los ${teamDisplayName} aún no han ganado un campeonato NBA.`,
        },
      };
    }

    // Si no se detectó el equipo
    return {
      success: false,
      message: `❌ No pude identificar el equipo "${input}". Intenta con nombres como: Lakers, Celtics, Bulls, Warriors, etc.`,
    };
  } catch (error) {
    console.error(`❌ Error al consultar títulos para ${input}:`, error);
    return {
      success: false,
      message: `🔧 Hubo un problema al consultar los títulos de "${input}".`,
    };
  }
};

const getChampionFromData = (year) => {
  const champion = champions[year];

  if (champion) {
    return {
      success: true,
      data: {
        year: year,
        champion: champion.team,
        defeated: champion.defeated,
        seriesResult: champion.seriesResult,
        lastGameResult: champion.lastGameResult,
        message: `🏆 **Campeón NBA ${year}** \n\n🎯 **Ganador:** ${champion.team}\n⚔️ **Derrotó a:** ${champion.defeated}\n📊 **Resultado de la serie:** ${champion.seriesResult}\n🏀 **Último partido:** ${champion.lastGameResult}\n\n¿Te interesa saber sobre otro año?`,
      },
    };
  } else {
    return {
      success: false,
      message: `❌ No encontré información del campeón para el año ${year}.`,
    };
  }
};
