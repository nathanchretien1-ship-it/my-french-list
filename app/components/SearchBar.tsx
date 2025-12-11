"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchAnime } from "../lib/api";
import Image from "next/image";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null); // Pour détecter les clics à l'extérieur

  // --- LE DEBOUNCING (La magie) ---
  useEffect(() => {
    // Si la recherche est vide ou trop courte, on nettoie
    if (query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // On crée un délai de 500ms
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setShowDropdown(true);
      try {
        const data = await searchAnime(query);
        // On garde seulement les 5 premiers résultats pour pas polluer l'écran
        setResults(data.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    // Si l'utilisateur tape une autre lettre avant les 500ms, on annule le délai précédent
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // --- GESTION DE LA VALIDATION (Entrée) ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false); // On cache la liste
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
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          placeholder="Rechercher un anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          className="w-full bg-slate-800 text-sm text-white rounded-full pl-4 pr-10 py-2 border border-slate-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
        />
        <button 
          type="submit" 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            ""
          )}
        </button>
      </form>

      {/* --- LA LISTE DÉROULANTE (Dropdown) --- */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <ul className="divide-y divide-slate-800">
            {results.map((anime) => (
              <li key={anime.mal_id}>
                <Link 
                  href={`/anime/${anime.mal_id}`}
                  className="flex items-center gap-3 p-3 hover:bg-slate-800 transition cursor-pointer"
                  onClick={() => {
                    setShowDropdown(false); // On ferme quand on clique
                    setQuery(""); // Optionnel : vider le champ
                  }}
                >
                  {/* Petite image */}
                  <div className="relative h-12 w-10 flex-shrink-0 rounded overflow-hidden">
                    {anime.images?.jpg?.small_image_url && (
                      <Image
                        src={anime.images.jpg.small_image_url}
                        alt={anime.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {anime.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {anime.year || "Année inconnue"} • {anime.type}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Lien "Voir tout" en bas */}
          <button 
            onClick={handleSearch}
            className="w-full text-center py-2 text-xs text-purple-400 font-bold bg-slate-950/50 hover:bg-slate-950 transition"
          >
            Voir tous les résultats
          </button>
        </div>
      )}
    </div>
  );
}