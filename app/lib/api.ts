import { translate } from 'google-translate-api-x';
import { JikanEntry } from "../types/jikan"; // Importez vos types
const BASE_URL = "https://api.jikan.moe/v4";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ✅ Traduction plus robuste (insensible à la casse)
export function translateStatus(status: string): string {
  if (!status) return "Inconnu";
  const s = status.toLowerCase().trim();
  
  if (s === "finished airing" || s === "finished") return "Terminé";
  if (s === "currently airing") return "En cours"; // Anime
  if (s === "publishing" || s === "currently publishing") return "En cours"; // Manga
  if (s === "not yet aired" || s === "not yet published") return "À venir";
  if (s === "on hiatus") return "En pause";
  if (s === "discontinued") return "Abandonné";
  
  return status; // Retourne l'original si pas de match
}

async function fetchWithCache(endpoint: string, revalidateTime: number) {
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
      console.warn("Rate limit Jikan atteint");
      await delay(1000); 
      return null; 
    }
    
    if (!response.ok) {
      console.error(`Erreur API Jikan: ${response.status} sur ${endpoint}`);
      return null;
    }
    
    const json = await response.json();
    return json.data;
  } catch (error) { 
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("La requête API a expiré (timeout)");
    }
    return null; 
  }
}

// ✅ Fonction générique pour récupérer Top Anime OU Manga avec filtres
export async function getTopContent(type: 'anime' | 'manga', page = 1, filter: 'airing' | 'score' | 'bypopularity' = 'bypopularity') {
  let queryParams = `page=${page}&limit=24&sfw=true`;

  if (filter === 'airing') {
      // "Tendances"
      if (type === 'anime') queryParams += '&filter=airing';
      else queryParams += '&filter=publishing'; // Pour les mangas, c'est 'publishing'
  } else if (filter === 'score') {
      // "Légendes"
      queryParams += '&order_by=score&sort=desc';
  } else {
      // "Populaire" (Défaut)
      queryParams += '&order_by=members&sort=desc';
  }

  const endpoint = type === 'anime' ? '/top/anime' : '/top/manga';
  const data = await fetchWithCache(`${endpoint}?${queryParams}`, 3600);
  
  if (data) {
      return data.map((item: JikanEntry) => ({
          ...item,
          status: translateStatus(item.status)
      }));
  }
  return [];
}

// ✨ FONCTION DE RECHERCHE AVANCÉE & FILTRES
export async function getAdvancedContent(
  type: 'anime' | 'manga', 
  page = 1, 
  filters: {
    query?: string;
    status?: string;
    format?: string;
    sort?: string;
  }
) {
  let queryParams = `page=${page}&limit=24&sfw=true`;

  // 1. Recherche Texte
  if (filters.query && filters.query.trim() !== '') {
      queryParams += `&q=${encodeURIComponent(filters.query)}`;
  }

  // 2. Statut
  if (filters.status && filters.status !== 'all') {
      queryParams += `&status=${filters.status}`;
  }

  // 3. Format
  if (filters.format && filters.format !== 'all') {
      queryParams += `&type=${filters.format}`;
  }

  // 4. Tri
  if (filters.sort === 'score') {
      queryParams += '&order_by=score&sort=desc';
  } else if (filters.sort === 'newest') {
      queryParams += '&order_by=start_date&sort=desc';
  } else {
      // Par défaut : Popularité (sauf si recherche texte, Jikan gère la pertinence seul, mais on force popularité si vide)
      if (!filters.query) {
          queryParams += '&order_by=members&sort=desc';
      }
  }

  const endpoint = type === 'anime' ? '/anime' : '/manga';
  const data = await fetchWithCache(`${endpoint}?${queryParams}`, 3600);
  
  if (data) {
      return data.map((item: any) => ({
          ...item,
          status: translateStatus(item.status)
      }));
  }
  return [];
}

// --- Wrappers pour compatibilité existante ---
export async function getTopAnime(page = 1, filter: 'airing' | 'score' | 'bypopularity' = 'bypopularity') {
    return getTopContent('anime', page, filter);
}

export async function getTopManga(page = 1, filter: 'airing' | 'score' | 'bypopularity' = 'bypopularity') {
    return getTopContent('manga', page, filter);
}

export async function getAnimeById(id: string) {
  const data = await fetchWithCache(`/anime/${id}/full`, 86400);
  if (!data) return null;
  if (data.synopsis) { try { const res = await translate(data.synopsis, { to: 'fr' }) as any; data.synopsis = res.text; } catch (e) { } }
  data.status = translateStatus(data.status);
  return data;
}

export async function getMangaById(id: string) {
  const data = await fetchWithCache(`/manga/${id}/full`, 86400);
  if (!data) return null;
  if (data.synopsis) { try { const res = await translate(data.synopsis, { to: 'fr' }) as any; data.synopsis = res.text; } catch (e) { } }
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
export async function getRecommendations(genres: number[], type: 'anime' | 'manga' = 'anime', excludeId: number) {
  if (!genres || genres.length === 0) return [];
  
  const genresString = genres.slice(0, 3).join(',');
  const endpoint = type === 'anime' ? '/anime' : '/manga';
  const url = `${endpoint}?genres=${genresString}&order_by=members&sort=desc&limit=6&sfw=true`;
  
  const data = await fetchWithCache(url, 3600); 
  
  if (!data) return [];
  
  return data
    .filter((item: any) => item.mal_id !== excludeId)
    .slice(0, 5)
    .map((item: any) => ({
        ...item,
        status: translateStatus(item.status)
    }));
}