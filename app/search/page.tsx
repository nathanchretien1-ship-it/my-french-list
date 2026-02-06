"use client";
import { useState, useEffect } from "react";
import AnimeCard from "../components/AnimeCard";
import { fetchAdvancedMediaList } from "../action";
import { createClient } from "../lib/supabase"; 
import { useSearchParams, useRouter } from "next/navigation";

export default function SearchPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Filtres
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<'anime' | 'manga'>('anime');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('bypopularity');

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Charger l'utilisateur au montage
  useEffect(() => {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // 2. Lancer la recherche
  const handleSearch = async () => {
      setLoading(true);
      const data = await fetchAdvancedMediaList(mediaType, 1, {
          query: query,
          status: status,
          sort: sort
      });
      // Déduplication
      const uniqueData = new Map();
      (data || []).forEach((item: any) => uniqueData.set(item.mal_id, item));
      setItems(Array.from(uniqueData.values()));
      setLoading(false);
  };

  // 3. Recherche automatique au changement de filtres (Debounce sur le texte)
  useEffect(() => {
      const timeoutId = setTimeout(() => {
          handleSearch();
      }, 500); // Attend 500ms après la fin de la frappe
      return () => clearTimeout(timeoutId);
  }, [query, mediaType, status, sort]);

  return (
    <div className="min-h-screen bg-[#0f111a] pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
            
            <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
                🔍 Recherche Avancée
            </h1>

            {/* --- BARRE DE FILTRES --- */}
            <div className="bg-[#1e293b]/50 border border-white/5 p-6 rounded-2xl mb-8 space-y-6">
                
                {/* 1. Champ Texte */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Rechercher un titre (ex: One Piece, Naruto...)" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-slate-900/80 border border-white/10 text-white rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-indigo-500 transition text-lg"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>

                {/* 2. Sélecteurs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Type */}
                    <div className="flex bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setMediaType('anime')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition ${mediaType === 'anime' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Animes
                        </button>
                        <button 
                            onClick={() => setMediaType('manga')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition ${mediaType === 'manga' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Mangas
                        </button>
                    </div>

                    {/* Statut */}
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="bg-slate-800 text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value={mediaType === 'anime' ? 'airing' : 'publishing'}>En cours</option>
                        <option value="complete">Terminé</option>
                        <option value="upcoming">À venir</option>
                    </select>

                    {/* Tri */}
                    <select 
                        value={sort} 
                        onChange={(e) => setSort(e.target.value)}
                        className="bg-slate-800 text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="bypopularity">Popularité</option>
                        <option value="score">Note</option>
                        <option value="newest">Récent</option>
                    </select>
                </div>
            </div>

            {/* --- RÉSULTATS --- */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    {query ? "Aucun résultat trouvé..." : "Commencez à taper pour rechercher."}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {items.map((item) => (
                        <AnimeCard key={`${item.mal_id}-${mediaType}`} anime={item} type={mediaType} user={user} />
                    ))}
                </div>
            )}

        </div>
    </div>
  );
}