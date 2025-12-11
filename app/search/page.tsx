"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q"); // On récupère le mot clé ?q=...

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'anime' | 'manga'>('all');

  useEffect(() => {
    if (q) {
      fetchData();
    }
  }, [q]);

const fetchData = async () => {
    setLoading(true);
    setResults([]);

    try {
      const [animeRes, mangaRes] = await Promise.all([
        fetch(`https://api.jikan.moe/v4/anime?q=${q}&sfw=true`),
        fetch(`https://api.jikan.moe/v4/manga?q=${q}&sfw=true`)
      ]);

      const animeData = await animeRes.json();
      const mangaData = await mangaRes.json();

      // 1. On catégorise
      const animes = (animeData.data || []).map((item: any) => ({ ...item, category: 'anime' }));
      const mangas = (mangaData.data || []).map((item: any) => ({ ...item, category: 'manga' }));

      // 2. On fusionne
      const allItems = [...animes, ...mangas];

      // 3. 🛡️ DÉDUPLICATION (La correction est ici)
      // On ne garde que le PREMIER élément trouvé pour chaque combinaison ID + Catégorie
      const uniqueItems = allItems.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.mal_id === item.mal_id && t.category === item.category
        ))
      );

      setResults(uniqueItems);

    } catch (error) {
      console.error("Erreur de recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Logique de filtrage (comme sur le profil)
  const filteredResults = results.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 sm:px-8 pb-10">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE AVEC FILTRES */}
        <div className="mb-8 border-b border-gray-800 pb-4 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Résultats pour : <span className="text-purple-400">"{q}"</span>
            </h1>
            <p className="text-gray-400 mt-2">
              {filteredResults.length} résultats trouvés
            </p>
          </div>

          {/* BOUTONS DE FILTRE */}
          {results.length > 0 && (
            <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10">
                {(['all', 'anime', 'manga'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-md text-sm font-bold uppercase transition
                            ${filter === f 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {f === 'all' ? 'Tout' : f}
                    </button>
                ))}
            </div>
          )}
        </div>

        {/* CONTENU */}
        {loading ? (
            // Spinner de chargement
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        ) : filteredResults.length > 0 ? (
          
          /* GRILLE DE RÉSULTATS */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredResults.map((item) => (
              <Link 
                key={`${item.category}-${item.mal_id}`} 
                href={`/${item.category}/${item.mal_id}`} // Lien dynamique (anime ou manga)
                className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-white/5 shadow-lg hover:scale-105 transition duration-300"
              >
                {/* IMAGE */}
                {item.images?.jpg?.large_image_url ? (
                  <Image
                    src={item.images.jpg.large_image_url}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:opacity-80 transition"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 bg-slate-800">Pas d'image</div>
                )}

                {/* BADGE TYPE */}
                <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded border border-white/10 backdrop-blur text-white
                    ${item.category === 'anime' ? 'bg-blue-600/80' : 'bg-green-600/80'}
                `}>
                    {item.category === 'anime' ? 'ANIME' : 'MANGA'}
                </div>

                {/* OVERLAY TITRE */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition duration-300">
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-xs mt-1">
                    {item.year || item.status || "Inconnu"}
                  </p>
                </div>
                
                {/* TITRE PAR DÉFAUT (BAS) */}
                <div className="absolute bottom-0 w-full bg-slate-900/90 p-3 group-hover:opacity-0 transition duration-300 border-t border-white/5">
                    <h3 className="text-gray-100 font-semibold text-xs truncate">
                        {item.title}
                    </h3>
                </div>
              </Link>
            ))}
          </div>

        ) : (
          // SI RIEN TROUVÉ
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h2 className="text-2xl font-bold mb-2">Aucun résultat trouvé</h2>
            <p className="text-gray-400">Essaie de vérifier l'orthographe ou change de filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
}