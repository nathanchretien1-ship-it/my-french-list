'use server'
import { getTopAnime } from "./lib/api";

export async function fetchAnimeList(page: number, filter: any) {
    return await getTopAnime(page, filter);
}