"use server";
import { getTopContent, getAdvancedContent } from "./lib/api";

export async function fetchMediaList(type: 'anime' | 'manga', page: number, filter: 'airing' | 'score' | 'bypopularity') {
  return await getTopContent(type, page, filter);
}

// ✨ MISE À JOUR : Ajout de "query" dans l'interface
export async function fetchAdvancedMediaList(
    type: 'anime' | 'manga', 
    page: number, 
    filters: {
        query?: string; // 👈 Nouveau !
        status?: string;
        format?: string;
        sort?: string;
    }
) {
  return await getAdvancedContent(type, page, filters);
}