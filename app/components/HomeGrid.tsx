"use client";
import { useState } from "react";
import AnimeCard from "./AnimeCard";
import { fetchAnimeList } from "../action"; // Import de la server action créée juste avant
import { User } from "@supabase/supabase-js";

interface HomeGridProps {
  initialAnime: any[];
  user: User | null; // On récupère l'user pour le bouton "Ajouter"
}

export default function HomeGrid({ initialAnime, user }: HomeGridProps) {
  const [animes, setAnimes] = useState(initialAnime);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'bypopularity' | 'favorite'>('bypopularity');
  const [loading, setLoading] = useState(false);

  // Fonction pour charger plus
  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const newAnimes = await fetchAnimeList(nextPage, filter);
    
    // On évite les doublons (Jikan renvoie parfois des doublons sur les pages)
    setAnimes(prev => {
        const existingIds = new Set(prev.map(a => a.mal_id));
        const uniqueNew = newAnimes.filter((a: any) => !existingIds.has(a.mal_id));
        return [...prev, ...uniqueNew];
    });
    setPage(nextPage);
    setLoading(false);
  };

  // Fonction pour changer le tri
  const changeFilter = async (newFilter: 'bypopularity' | 'favorite') => {
      if (newFilter === filter) return;
      setLoading(true);
      setFilter(newFilter);
      setPage(1);
      // On remet à zéro la liste avec le nouveau filtre
      const data = await fetchAnimeList(1, newFilter);
      setAnimes(data);
      setLoading(false);
  };

  return (
    <div>
      {/* FILTRES */}
      <div className="flex justify-end gap-2 mb-6 px-4">
          <button 
            onClick={() => changeFilter('bypopularity')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${filter === 'bypopularity' ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            🔥 Populaires
          </button>
          <button 
            onClick={() => changeFilter('favorite')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${filter === 'favorite' ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            ⭐ Mieux notés
          </button>
      </div>

      {/* GRILLE */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4">
        {animes.map((anime: any) => (
          <AnimeCard key={`${anime.mal_id}-${filter}`} anime={anime} user={user} />
        ))}
      </div>

      {/* BOUTON LOAD MORE */}
      <div className="flex justify-center mt-12 mb-8">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-full font-bold transition flex items-center gap-2"
          >
            {loading ? 'Chargement...' : 'Voir plus d\'animes'}
          </button>
      </div>
    </div>
  );
}