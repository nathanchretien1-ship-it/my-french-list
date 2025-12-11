import { translate } from 'google-translate-api-x';

const BASE_URL = "https://api.jikan.moe/v4";

// On force un petit délai pour ne pas se faire bannir par Jikan (Rate Limit)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction utilitaire pour traduire le statut
function translateStatus(status: string): string {
  switch (status) {
    // --- STATUS ANIME ---
    case "Finished Airing": return "Terminé";
    case "Currently Airing": return "En cours de diffusion";
    case "Not yet aired": return "À venir";
    
    // --- STATUS MANGA ---
    case "Finished": return "Terminé";
    case "Publishing": return "En cours de publication";
    case "On Hiatus": return "En pause";
    case "Discontinued": return "Abandonné";
    case "Not yet published": return "À venir";
    
    default: return status || "Inconnu";
  }
}

// Fonction FETCH sécurisée avec Gestion d'Erreur
async function fetchWithCache(endpoint: string, revalidateTime: number) {
  // 1. On attend 500ms avant chaque requête pour être gentil avec l'API
  await delay(500);

  try {
    // 2. On lance la requête avec un Timeout de 10 secondes (si ça prend plus, on annule)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      next: { revalidate: revalidateTime },
      signal: controller.signal // On attache le signal d'annulation
    });

    clearTimeout(timeoutId); // On annule le timer si la réponse est arrivée

    if (!response.ok) {
      // Si erreur 404 (pas trouvé) ou 429 (trop de requêtes)
      console.warn(`⚠️ API Jikan a répondu ${response.status} sur ${endpoint}`);
      return null;
    }
    
    const json = await response.json();
    return json.data;

  } catch (error) {
    // 3. Si ça plante (Timeout ou pas de connexion), on ne CRASHE PAS l'app
    console.error(`❌ Erreur de connexion sur ${endpoint}`);
    return null; // On renvoie null pour dire "pas de données" sans casser le site
  }
}

// --- LES FONCTIONS EXPORTÉES ---

export async function getTopAnime() {
  const data = await fetchWithCache("/top/anime?filter=bypopularity", 3600);
  return data || []; // Si erreur, on renvoie une liste vide pour ne pas casser la page
}

export async function getTopManga() {
  const data = await fetchWithCache("/top/manga?filter=bypopularity", 3600);
  return data || [];
}

export async function getAnimeById(id: string) {
  const data = await fetchWithCache(`/anime/${id}/full`, 86400);
  if (!data) return null;

  // Traduction (sécurisée aussi)
  if (data.synopsis) {
    try {
      const res = await translate(data.synopsis, { to: 'fr' }) as any;
      data.synopsis = res.text;
    } catch (e) { 
      // Si la trad échoue, on garde l'anglais, pas grave
    }
  }
  
  data.status = translateStatus(data.status);
  return data;
}

export async function getMangaById(id: string) {
  const data = await fetchWithCache(`/manga/${id}/full`, 86400); // Cache 24h
  if (!data) return null;

  // 1. Traduction du Synopsis (Manga)
  if (data.synopsis) {
    try {
      const res = await translate(data.synopsis, { to: 'fr' }) as any;
      data.synopsis = res.text;
    } catch (e) { 
      // Si erreur, on garde l'anglais
    }
  }
  
  // 2. Traduction du Statut (Manga)
  data.status = translateStatus(data.status);

  return data;
}

export async function searchAnime(query: string) {
  // Pour la recherche, on ne cache que 5 minutes (300s)
  // On limite à 10 résultats pour aller plus vite (&limit=10)
  const data = await fetchWithCache(`/anime?q=${encodeURIComponent(query)}&sfw=true&limit=10`, 300);
  return data || [];
}

export async function getSeasonNow() {
  // Cache de 1 heure (3600s)
  const data = await fetchWithCache("/seasons/now", 3600);
  return data || [];
}

// Récupérer une saison spécifique (ex: 2023, "spring")
export async function getSeason(year: string, season: string) {
  const data = await fetchWithCache(`/seasons/${year}/${season}`, 3600);
  return data || [];
}

// Récupérer les animes à venir (Prochaine saison)
export async function getUpcomingSeason() {
  const data = await fetchWithCache("/seasons/upcoming", 3600);
  return data || [];
}
// Récupérer le top d'une année entière (Jan -> Dec)
export async function getAnimeByYear(year: number) {
  // On utilise la recherche avec start_date et end_date
  // On trie par nombre de membres (popularité)
  const url = `/anime?start_date=${year}-01-01&end_date=${year}-12-31&order_by=members&sort=desc&limit=25&sfw=true`;
  
  // Cache de 2 heures pour une année entière
  const data = await fetchWithCache(url, 7200);
  return data || [];
}