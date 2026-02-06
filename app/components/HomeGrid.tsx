"use client";
import { useState } from "react";
import AnimeCard from "./AnimeCard";
import { fetchAnimeList } from "../action"; 
import { User } from "@supabase/supabase-js";

interface HomeGridProps {
  initialAnime: any[];
  user: User | null;
}

export default function HomeGrid({ initialAnime, user }: HomeGridProps) {
  const [animes, setAnimes] = useState(initialAnime);
  const [page, setPage] = useState(1);
  // On renomme les filtres pour être clair : 'airing' (Tendances) vs 'score' (Notes)
  const [filter, setFilter] = useState<'airing' | 'score'>('airing');
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const newAnimes = await fetchAnimeList(nextPage, filter);
    
    setAnimes(prev => {
        const existingIds = new Set(prev.map(a => a.mal_id));
        const uniqueNew = newAnimes.filter((a: any) => !existingIds.has(a.mal_id));
        return [...prev, ...uniqueNew];
    });
    setPage(nextPage);
    setLoading(false);
  };

  const changeFilter = async (newFilter: 'airing' | 'score') => {
      if (newFilter === filter) return;
      setLoading(true);
      setFilter(newFilter);
      setPage(1);
      const data = await fetchAnimeList(1, newFilter);
      setAnimes(data);
      setLoading(false);
  };

  return (
    <div>
      {/* FILTRES */}
      <div className="flex justify-center md:justify-end gap-4 mb-8 px-4">
          <button 
            onClick={() => changeFilter('airing')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition border ${
                filter === 'airing' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30' 
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-white hover:text-white'
            }`}
          >
            🔥 Tendances du Moment
          </button>
          <button 
            onClick={() => changeFilter('score')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition border ${
                filter === 'score' 
                ? 'bg-yellow-600 text-white border-yellow-600 shadow-lg shadow-yellow-500/30' 
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-white hover:text-white'
            }`}
          >
            ⭐ Légendes (Meilleurs notes)
          </button>
      </div>

      {/* GRILLE */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4">
        {animes.map((anime: any) => (
          <AnimeCard key={`${anime.mal_id}-${filter}`} anime={anime} user={user} />
        ))}
      </div>

      {/* BOUTON CHARGER PLUS */}
      <div className="flex justify-center mt-12 mb-8">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-full font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
                <span className="animate-spin">⌛</span>
            ) : (
                <span>▼ Voir plus d'animes</span>
            )}
          </button>
      </div>
    </div>
  );
}