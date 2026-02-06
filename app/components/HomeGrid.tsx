"use client";
import { useState } from "react";
import AnimeCard from "./AnimeCard";
import { fetchMediaList } from "../action"; // Nouvelle action
import { User } from "@supabase/supabase-js";

interface HomeGridProps {
  initialData: any[];
  user: User | null;
}

type MediaType = 'anime' | 'manga';
type FilterType = 'airing' | 'score' | 'bypopularity';

export default function HomeGrid({ initialData, user }: HomeGridProps) {
  const [items, setItems] = useState(initialData);
  const [page, setPage] = useState(1);
  
  // États combinés
  const [mediaType, setMediaType] = useState<MediaType>('anime');
  const [filter, setFilter] = useState<FilterType>('airing'); // 'airing' par défaut (Tendances)
  
  const [loading, setLoading] = useState(false);

  // Fonction pour tout recharger (changement filtre OU type)
  const refreshList = async (newType: MediaType, newFilter: FilterType) => {
    setLoading(true);
    setMediaType(newType);
    setFilter(newFilter);
    setPage(1);
    
    // On appelle l'action serveur mise à jour
    const data = await fetchMediaList(newType, 1, newFilter);
    setItems(data);
    setLoading(false);
  };

  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const newItems = await fetchMediaList(mediaType, nextPage, filter);
    
    setItems(prev => {
        const existingIds = new Set(prev.map(a => a.mal_id));
        const uniqueNew = newItems.filter((a: any) => !existingIds.has(a.mal_id));
        return [...prev, ...uniqueNew];
    });
    setPage(nextPage);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 px-4">
          
          {/* 1. SELECTEUR TYPE (ANIME / MANGA) */}
          <div className="bg-slate-800 p-1 rounded-lg flex shadow-lg border border-white/5">
              <button 
                onClick={() => refreshList('anime', filter)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${mediaType === 'anime' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                📺 Animes
              </button>
              <button 
                onClick={() => refreshList('manga', filter)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${mediaType === 'manga' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                📖 Mangas
              </button>
          </div>

          {/* 2. SELECTEUR FILTRES */}
          <div className="flex gap-2">
              <button 
                onClick={() => refreshList(mediaType, 'airing')}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition border ${
                    filter === 'airing' 
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' 
                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-white hover:text-white'
                }`}
              >
                🔥 Tendances
              </button>
              <button 
                onClick={() => refreshList(mediaType, 'bypopularity')}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition border ${
                    filter === 'bypopularity' 
                    ? 'bg-pink-600/20 text-pink-300 border-pink-500/50' 
                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-white hover:text-white'
                }`}
              >
                ❤️ Populaires
              </button>
              <button 
                onClick={() => refreshList(mediaType, 'score')}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition border ${
                    filter === 'score' 
                    ? 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50' 
                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-white hover:text-white'
                }`}
              >
                ⭐ Légendes
              </button>
          </div>
      </div>

      {/* GRILLE */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4">
        {items.map((item: any) => (
          // On passe bien le 'mediaType' actuel à la carte pour que les liens soient bons (/anime/123 vs /manga/123)
          <AnimeCard key={`${item.mal_id}-${mediaType}`} anime={item} type={mediaType} user={user} />
        ))}
      </div>

      {/* CHARGER PLUS */}
      <div className="flex justify-center mt-12 mb-8">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-full font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="animate-spin">⌛</span> : <span>▼ Voir plus</span>}
          </button>
      </div>
    </div>
  );
}