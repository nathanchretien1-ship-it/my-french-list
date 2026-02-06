'use server'
import { getTopAnime } from "./lib/api";

export async function fetchAnimeList(page: number, filter: 'airing' | 'score') {
    return await getTopAnime(page, filter);
}