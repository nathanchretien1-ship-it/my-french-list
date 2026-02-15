"use client";
import { useState, useEffect } from "react";
import AnimeCard from "../components/AnimeCard";
import { fetchAdvancedMediaList } from "../action";
import { createClient } from "../lib/supabase"; 
import { toast } from "sonner";

const GENRES = [
  { id: 1, name: "Action" }, { id: 2, name: "Aventure" }, { id: 4, name: "Comédie" },
  { id: 8, name: "Drame" }, { id: 10, name: "Fantasy" }, { id: 14, name: "Horreur" },
  { id: 7, name: "Mystère" }, { id: 22, name: "Romance" }, { id: 24, name: "Sci-Fi" },
  { id: 36, name: "Slice of Life" }, { id: 30, name: "Sports" }
];

export default function SearchPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Filtres
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<'anime' | 'manga'>('anime');
  const [status, setStatus] = useState('all');
  const [format, setFormat] = useState('all');
  const [sort, setSort] = useState('bypopularity');
  const [minScore, setMinScore] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [rating, setRating] = useState('all');

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const result = await fetchAdvancedMediaList(mediaType, 1, {
      query,
      status: status !== 'all' ? status : undefined,
      format: format !== 'all' ? format : undefined,
      sort,
      min_score: minScore > 0 ? minScore : undefined,
      genres: selectedGenres.length > 0 ? selectedGenres.join(',') : undefined,
      rating: mediaType === 'anime' && rating !== 'all' ? rating : undefined
    });

    if (result.error) toast.error(result.error);
    else setItems(result.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(handleSearch, 500);
    return () => clearTimeout(timer);
  }, [query, mediaType, status, format, sort, minScore, selectedGenres, rating]);

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-8">🔍 Recherche Avancée</h1>

        <div className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl mb-8 space-y-6">
          {/* Barre de recherche principale */}
          <input 
            type="text" 
            placeholder="Nom de l'oeuvre..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type & Format */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Support</label>
              <select value={mediaType} onChange={(e) => { setMediaType(e.target.value as any); setFormat('all'); }} className="w-full bg-slate-800 text-white rounded-lg p-2 border border-white/5 outline-none">
                <option value="anime">Anime</option>
                <option value="manga">Manga</option>
              </select>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-2 border border-white/5 outline-none">
                <option value="all">Tous les formats</option>
                {mediaType === 'anime' ? (
                  <>
                    <option value="tv">Série TV</option>
                    <option value="movie">Film</option>
                    <option value="ova">OVA</option>
                    <option value="special">Spécial</option>
                  </>
                ) : (
                  <>
                    <option value="manga">Manga</option>
                    <option value="novel">Light Novel</option>
                    <option value="one_shot">One Shot</option>
                  </>
                )}
              </select>
            </div>

            {/* Note & Statut */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Critères</label>
              <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full bg-slate-800 text-white rounded-lg p-2 border border-white/5 outline-none text-yellow-400 font-bold">
                <option value="0">Toutes les notes</option>
                {[9, 8, 7, 6].map(n => <option key={n} value={n}>Note {n}+ ★</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-2 border border-white/5 outline-none">
                <option value="all">Tous les statuts</option>
                <option value={mediaType === 'anime' ? 'airing' : 'publishing'}>En cours</option>
                <option value="complete">Terminé</option>
                <option value="upcoming">À venir</option>
              </select>
            </div>

            {/* Tri & Public (Rating) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Tri & Public</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-2 border border-white/5 outline-none">
                <option value="bypopularity">Popularité</option>
                <option value="score">Mieux notés</option>
                <option value="newest">Sortie récente</option>
              </select>
              {mediaType === 'anime' && (
                <select value={rating} onChange={(e) => setRating(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-2 border border-white/5 outline-none">
                  <option value="all">Tous publics</option>
                  <option value="pg13">Ados (PG-13)</option>
                  <option value="r17">Adultes (R-17)</option>
                </select>
              )}
            </div>

            {/* Genres */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Genres</label>
              <div className="bg-slate-800 rounded-lg p-2 h-[84px] overflow-y-auto border border-white/5 flex flex-wrap gap-1 custom-scrollbar">
                {GENRES.map(g => (
                  <button 
                    key={g.id} 
                    onClick={() => setSelectedGenres(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                    className={`text-[9px] px-2 py-1 rounded-full border transition ${selectedGenres.includes(g.id) ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-white/10 text-gray-400'}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Liste de résultats */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {items.map((item) => (
              <AnimeCard 
                key={`${item.mal_id}-${mediaType}`} 
                anime={item} // ✅ On utilise "anime" car c'est ce qu'attend le composant
                type={mediaType} 
                user={user} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}