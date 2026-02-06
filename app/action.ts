'use server'
import { getTopContent } from "./lib/api";

export async function fetchMediaList(type: 'anime' | 'manga', page: number, filter: 'airing' | 'score' | 'bypopularity') {
    return await getTopContent(type, page, filter);
}