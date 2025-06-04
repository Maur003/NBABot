export const preprocessText = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Algoritmo de similitud mejorado
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  // Bonus para subcadenas
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.8;
  }

  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matrix = Array.from({ length: len2 + 1 }, (_, i) => [i]);
  for (let j = 0; j <= len1; j++) matrix[0][j] = j;

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      matrix[i][j] =
        str2[i - 1] === str1[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }

  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len2][len1]) / maxLen;
};

// Función mejorada para extraer años
export const extractYear = (text) => {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const years = [];

  // Patrones explícitos de años de 4 dígitos
  const fullYearMatches = normalized.match(/\b(19[4-9]\d|20[0-2]\d)\b/g);
  if (fullYearMatches) {
    for (const match of fullYearMatches) {
      const year = parseInt(match);
      if (year >= 1947 && year <= 2024 && !years.includes(year)) {
        years.push(year);
      }
    }
  }

  const shortYearMatches = normalized.match(/\b(\d{2})\b/g);
  if (shortYearMatches) {
    for (const short of shortYearMatches) {
      const num = parseInt(short);
      let year = null;

      // Rango expandido para años de 2 dígitos
      if (num >= 47 && num <= 99) {
        year = 1900 + num;
      } else if (num >= 0 && num <= 24) {
        year = 2000 + num;
      }

      if (year && year >= 1947 && year <= 2024 && !years.includes(year)) {
        years.push(year);
      }
    }
  }

  return years.length > 0 ? years[0] : null;
};

// Detectar si es una consulta que necesita año
export const needsSpecificYear = (text, category) => {
  if (category !== "champions") return false;

  // Palabras que indican consulta específica de año
  const specificIndicators = [
    "quién",
    "quien",
    "que",
    "qué",
    "ganó",
    "gano",
    "won",
    "winner",
    "campeón",
    "campeon",
    "champion",
    "título",
    "titulo",
    "title",
  ];

  const year = extractYear(text);
  const hasSpecificIndicator = specificIndicators.some((indicator) =>
    text.toLowerCase().includes(indicator)
  );

  return year !== null && hasSpecificIndicator;
};

// Formatear consulta para logging
export const formatQueryForLog = (text, category, year = null) => {
  return {
    originalText: text,
    category: category,
    extractedYear: year,
    timestamp: new Date().toISOString(),
  };
};
