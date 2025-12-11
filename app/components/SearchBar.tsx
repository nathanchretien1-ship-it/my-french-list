"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
// On n'a plus besoin de searchAnime importé, on va faire le fetch directement ici pour avoir les deux types
import Image from "next/image";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- LE DEBOUNCING (Mis à jour pour Anime + Manga) ---
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setShowDropdown(true);
      try {
        // 1. On lance les deux recherches en parallèle (limité à 3 résultats chacun pour pas inonder le menu)
        const [animeRes, mangaRes] = await Promise.all([
            fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=3&sfw=true`),
            fetch(`https://api.jikan.moe/v4/manga?q=${query}&limit=3&sfw=true`)
        ]);

        const animeData = await animeRes.json();
        const mangaData = await mangaRes.json();

        // 2. On ajoute la catégorie manuellement
        const animes = (animeData.data || []).map((item: any) => ({ ...item, category: 'anime' }));
        const mangas = (mangaData.data || []).map((item: any) => ({ ...item, category: 'manga' }));

        // 3. On fusionne les résultats
        setResults([...animes, ...mangas]);

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // --- GESTION DE LA VALIDATION (Entrée) ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      // Redirige vers la page de recherche globale qu'on vient de créer
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // --- FERMER SI ON CLIQUE AILLEURS ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className="relative hidden md:block w-72">
      {/* Champ de recherche */}
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          className="w-full bg-slate-800/80 text-sm text-white rounded-full pl-4 pr-10 py-2 border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm placeholder-gray-500"
        />
        {/* Icône Loupe ou Spinner */}
        <button 
          type="submit" 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
             // Si tu n'as pas heroicons, remplace <MagnifyingGlassIcon /> par <span>🔍</span>
            <span>🔍</span>
          )}
        </button>
      </form>

      {/* --- LA LISTE DÉROULANTE (Dropdown) --- */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <ul className="divide-y divide-slate-800 max-h-[60vh] overflow-y-auto">
            {results.map((item) => (
              <li key={`${item.category}-${item.mal_id}`}>
                <Link 
                  // LIEN DYNAMIQUE : /anime/123 ou /manga/456
                  href={`/${item.category}/${item.mal_id}`}
                  className="flex items-center gap-3 p-3 hover:bg-slate-800 transition cursor-pointer group"
                  onClick={() => {
                    setShowDropdown(false);
                    setQuery("");
                  }}
                >
                  {/* Petite image */}
                  <div className="relative h-12 w-9 flex-shrink-0 rounded overflow-hidden bg-slate-800">
                    {item.images?.jpg?.small_image_url ? (
                      <Image
                        src={item.images.jpg.small_image_url}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition duration-300"
                        unoptimized
                      />
                    ) : (
                        <div className="w-full h-full bg-slate-700"></div>
                    )}
                  </div>
                  
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-200 truncate group-hover:text-indigo-400 transition">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {/* Badge Anime/Manga */}
                        <span className={`text-[10px] px-1.5 rounded font-bold uppercase
                            ${item.category === 'anime' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}
                        `}>
                            {item.category === 'anime' ? 'TV' : 'Book'}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                        {item.year || item.status || "Inconnu"}
                        </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Lien "Voir tout" en bas */}
          <button 
            onClick={handleSearch}
            className="w-full text-center py-2.5 text-xs text-indigo-400 font-bold bg-slate-950 hover:bg-indigo-900/20 transition border-t border-slate-800"
          >
            Voir tous les résultats pour "{query}"
          </button>
        </div>
      )}
    </div>
  );
}