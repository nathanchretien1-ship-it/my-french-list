"use client";
import { useState } from "react";
import AnimeCard from "./AnimeCard";
import { fetchAdvancedMediaList } from "../action"; 
import { User } from "@supabase/supabase-js";

interface HomeGridProps {
  initialData: any[];
  user: User | null;
}

type MediaType = 'anime' | 'manga';

export default function HomeGrid({ initialData, user }: HomeGridProps) {
  // ✅ FIX 1 : Déduplication dès l'initialisation (au cas où l'API renvoie des doublons)
  const [items, setItems] = useState(() => {
      const unique = new Map();
      initialData?.forEach(item => unique.set(item.mal_id, item));
      return Array.from(unique.values());
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // --- ÉTATS DES FILTRES ---
  const [mediaType, setMediaType] = useState<MediaType>('anime');
  const [sort, setSort] = useState('bypopularity');
  const [status, setStatus] = useState('all');
  const [format, setFormat] = useState('all');

  // Fonction centrale de rechargement
  const applyFilters = async (
      newType = mediaType, 
      newSort = sort, 
      newStatus = status, 
      newFormat = format
  ) => {
    setLoading(true);
    setPage(1);
    
    // Mise à jour des états locaux
    setMediaType(newType);
    setSort(newSort);
    setStatus(newStatus);
    setFormat(newFormat);

    // Appel Serveur
    const data = await fetchAdvancedMediaList(newType, 1, {
        sort: newSort,
        status: newStatus,
        format: newFormat
    });
    
    // ✅ FIX 2 : Déduplication sur les résultats de filtre
    const uniqueData = new Map();
    (data || []).forEach((item: any) => uniqueData.set(item.mal_id, item));
    setItems(Array.from(uniqueData.values()));
    
    setLoading(false);
  };

  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const newItems = await fetchAdvancedMediaList(mediaType, nextPage, {
        sort: sort,
        status: status,
        format: format
    });
    
    if (newItems && newItems.length > 0) {
        setItems(prev => {
            // ✅ FIX 3 : Déduplication robuste pour la pagination
            // On combine l'ancien et le nouveau, et le Map élimine les IDs en double
            const combined = [...prev, ...newItems];
            const uniqueMap = new Map();
            combined.forEach(item => uniqueMap.set(item.mal_id, item));
            return Array.from(uniqueMap.values());
        });
        setPage(nextPage);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* --- BARRE DE CONTRÔLE PRINCIPALE --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          {/* 1. Onglets Anime / Manga */}
          <div className="bg-slate-800 p-1 rounded-lg flex shadow-lg border border-white/5">
              <button 
                onClick={() => applyFilters('anime', sort, status, format)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${mediaType === 'anime' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                📺 Animes
              </button>
              <button 
                onClick={() => applyFilters('manga', sort, status, format)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${mediaType === 'manga' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                📖 Mangas
              </button>
          </div>

          {/* 2. Bouton Toggle Filtres */}
          <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition ${showFilters ? 'bg-slate-700 text-white border-white/20' : 'bg-slate-800/50 text-gray-400 border-white/10 hover:border-white/30'}`}
          >
             <span>⚡ Filtres</span>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                 <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
             </svg>
          </button>
      </div>

      {/* --- PANNEAU DE FILTRES DÉPLIABLE --- */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
         <div className="bg-slate-900/80 border border-white/10 p-6 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 shadow-2xl">
             
             {/* Filtre 1 : TRI */}
             <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-400 uppercase">Trier par</label>
                 <select 
                    value={sort} 
                    onChange={(e) => applyFilters(mediaType, e.target.value, status, format)}
                    className="bg-slate-800 text-white border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                 >
                     <option value="bypopularity">❤️ Les plus populaires</option>
                     <option value="score">⭐ Les mieux notés</option>
                     <option value="newest">📅 Les plus récents</option>
                 </select>
             </div>

             {/* Filtre 2 : STATUT */}
             <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-400 uppercase">Statut</label>
                 <select 
                    value={status} 
                    onChange={(e) => applyFilters(mediaType, sort, e.target.value, format)}
                    className="bg-slate-800 text-white border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                 >
                     <option value="all">Tout voir</option>
                     <option value={mediaType === 'anime' ? 'airing' : 'publishing'}>🔥 En cours</option>
                     <option value="complete">✅ Terminé</option>
                     <option value="upcoming">📅 À venir</option>
                 </select>
             </div>

             {/* Filtre 3 : FORMAT */}
             <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-400 uppercase">Format</label>
                 <select 
                    value={format} 
                    onChange={(e) => applyFilters(mediaType, sort, status, e.target.value)}
                    className="bg-slate-800 text-white border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                 >
                     <option value="all">Tous les formats</option>
                     <option value="tv">📺 Série TV</option>
                     <option value="movie">🎬 Film</option>
                     {mediaType === 'anime' && <option value="ova">💿 OVA / Spécial</option>}
                     {mediaType === 'manga' && <option value="novel">📘 Light Novel</option>}
                 </select>
             </div>
         </div>
      </div>

      {/* --- GRILLE DE RÉSULTATS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {items.map((item: any) => (
          <AnimeCard key={`${item.mal_id}-${mediaType}`} anime={item} type={mediaType} user={user} />
        ))}
      </div>

      {items.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
              Aucun résultat pour ces filtres 🏜️
          </div>
      )}

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