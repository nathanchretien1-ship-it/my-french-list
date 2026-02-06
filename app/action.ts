"use server";
import { getTopContent, getAdvancedContent } from "./lib/api";

// Action existante (garde-la pour ne rien casser)
export async function fetchMediaList(type: 'anime' | 'manga', page: number, filter: 'airing' | 'score' | 'bypopularity') {
  return await getTopContent(type, page, filter);
}

// ✨ NOUVELLE ACTION POUR LE FILTRAGE COMPLET
export async function fetchAdvancedMediaList(
    type: 'anime' | 'manga', 
    page: number, 
    filters: {
        status?: string;
        format?: string;
        sort?: string;
    }
) {
  return await getAdvancedContent(type, page, filters);
}