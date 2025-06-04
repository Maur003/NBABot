import { knownTeams } from "./constants.js";

// Mapa de sinónimos adicionales para algunos equipos
const extraAliases = {
  lakers: ["los angeles lakers", "la lakers"],
  celtics: ["boston celtics", "boston"],
  bulls: ["chicago bulls", "chicago"],
  warriors: ["golden state", "golden state warriors", "gsw"],
  spurs: ["san antonio spurs", "san antonio"],
  heat: ["miami heat", "miami"],
  rockets: ["houston rockets", "houston"],
  knicks: ["new york knicks", "ny knicks", "ny", "new york"],
  mavericks: ["dallas mavericks", "mavs", "dallas"],
  cavaliers: ["cleveland cavaliers", "cavs", "cleveland"],
  sixers: ["philadelphia 76ers", "philly", "76ers", "philadelphia"],
  bucks: ["milwaukee bucks", "milwaukee"],
  raptors: ["toronto raptors", "toronto"],
  nuggets: ["denver nuggets", "denver"],
  suns: ["phoenix suns", "phoenix"],
  thunder: [
    "oklahoma city thunder",
    "okc",
    "oklahoma city",
    "okc thunder",
    "oklahoma",
  ],
  hawks: ["atlanta hawks", "atlanta"],
  nets: ["brooklyn nets", "new jersey nets", "brooklyn"],
  blazers: ["trail blazers", "portland trail blazers", "portland"],
  wizards: ["washington wizards", "washington"],
  pacers: ["indiana pacers", "indiana"],
  jazz: ["utah jazz", "utah"],
  magic: ["orlando magic", "orlando"],
  hornets: ["charlotte hornets", "charlotte bobcats", "charlotte"],
  kings: ["sacramento kings", "sacramento"],
  grizzlies: ["memphis grizzlies", "memphis"],
  timberwolves: ["minnesota timberwolves", "wolves", "minnesota"],
  pelicans: ["new orleans pelicans", "new orleans"],
  clippers: ["los angeles clippers", "la clippers"],
};

const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function detectTeamFromMessage(message) {
  const normalizedMessage = normalize(message);

  for (const team of knownTeams) {
    const aliases = [team, ...(extraAliases[team] || [])];

    for (const alias of aliases) {
      if (normalizedMessage.includes(normalize(alias))) {
        return team; // clave final que usarás en teamChampionships
      }
    }
  }

  return null;
}
