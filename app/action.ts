"use server";
import { getTopContent, getAdvancedContent } from "./lib/api";

export async function fetchMediaList(type: 'anime' | 'manga', page: number, filter: 'airing' | 'score' | 'bypopularity') {
  try {
    const data = await getTopContent(type, page, filter);
    return { data, error: null };
  } catch (error) {
    console.error("Erreur fetchMediaList:", error);
    return { data: [], error: "Impossible de charger la liste." };
  }
}

export async function fetchAdvancedMediaList(
    type: 'anime' | 'manga', 
    page: number, 
    filters: {
        query?: string;
        status?: string;
        format?: string;
        sort?: string;
        genres?: string;
        min_score?: number;
        rating?: string;
    }
) {
  try {
    const data = await getAdvancedContent(type, page, filters);
    return { data, error: null };
  } catch (error) {
    return { data: [], error: "Erreur lors de la recherche." };
  }
}