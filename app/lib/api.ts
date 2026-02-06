import { translate } from 'google-translate-api-x';

const BASE_URL = "https://api.jikan.moe/v4";

// Fonction utilitaire pour attendre (Déclarée une seule fois ici)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function translateStatus(status: string): string {
  switch (status) {
    case "Finished Airing": return "Terminé";
    case "Currently Airing": return "En cours de diffusion";
    case "Not yet aired": return "À venir";
    case "Finished": return "Terminé";
    case "Publishing": return "En cours de publication";
    case "On Hiatus": return "En pause";
    case "Discontinued": return "Abandonné";
    case "Not yet published": return "À venir";
    default: return status || "Inconnu";
  }
}

async function fetchWithCache(endpoint: string, revalidateTime: number) {
  // On utilise la fonction delay définie plus haut
  await delay(250);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      next: { revalidate: revalidateTime },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
        console.warn(`⚠️ Rate Limit Jikan sur ${endpoint}, attente...`);
        await delay(1000); 
        return null; 
    }

    if (!response.ok) {
      console.warn(`⚠️ API Jikan a répondu ${response.status} sur ${endpoint}`);
      return null;
    }
    
    const json = await response.json();
    return json.data;

  } catch (error) {
    console.error(`❌ Erreur fetch sur ${endpoint}:`, error);
    return null;
  }
}

// --- LES FONCTIONS EXPORTÉES ---

export async function getTopAnime(page = 1, filter: 'bypopularity' | 'favorite' | 'airing' = 'bypopularity') {
  let queryParams = `page=${page}&limit=24&sfw=true`;
  if (filter === 'favorite') {
      queryParams += '&order_by=score&sort=desc';
  } else if (filter === 'bypopularity') {
      queryParams += '&order_by=members&sort=desc';
  } else if (filter === 'airing') {
      queryParams += '&filter=airing';
  }

  const data = await fetchWithCache(`/top/anime?${queryParams}`, 3600);
  return data || [];
}

export async function getTopManga() {
  const data = await fetchWithCache("/top/manga?filter=bypopularity", 3600);
  return data || [];
}

export async function getAnimeById(id: string) {
  const data = await fetchWithCache(`/anime/${id}/full`, 86400);
  if (!data) return null;

  if (data.synopsis) {
    try {
      const res = await translate(data.synopsis, { to: 'fr' }) as any;
      data.synopsis = res.text;
    } catch (e) { }
  }
  
  data.status = translateStatus(data.status);
  return data;
}

export async function getMangaById(id: string) {
  const data = await fetchWithCache(`/manga/${id}/full`, 86400);
  if (!data) return null;

  if (data.synopsis) {
    try {
      const res = await translate(data.synopsis, { to: 'fr' }) as any;
      data.synopsis = res.text;
    } catch (e) { }
  }
  
  data.status = translateStatus(data.status);
  return data;
}

export async function searchAnime(query: string) {
  const data = await fetchWithCache(`/anime?q=${encodeURIComponent(query)}&sfw=true&limit=10`, 300);
  return data || [];
}

export async function getSeasonNow() {
  const data = await fetchWithCache("/seasons/now", 3600);
  return data || [];
}

export async function getSeason(year: string, season: string) {
  const data = await fetchWithCache(`/seasons/${year}/${season}`, 3600);
  return data || [];
}

export async function getUpcomingSeason() {
  const data = await fetchWithCache("/seasons/upcoming", 3600);
  return data || [];
}

export async function getAnimeByYear(year: number) {
  const url = `/anime?start_date=${year}-01-01&end_date=${year}-12-31&order_by=members&sort=desc&limit=25&sfw=true`;
  const data = await fetchWithCache(url, 7200);
  return data || [];
}