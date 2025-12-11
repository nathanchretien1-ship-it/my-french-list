import { searchAnime } from "../lib/api";
import AnimeCard from "../components/AnimeCard";

// Dans Next.js 15, searchParams est une Promesse, il faut l'attendre
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  // 1. On récupère le mot clé depuis l'URL
  const { q } = await searchParams;
  
  // 2. On lance la recherche
  const animes = await searchAnime(q);

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 sm:px-8 pb-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Titre de la recherche */}
        <div className="mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold">
            Résultats pour : <span className="text-purple-400">"{q}"</span>
          </h1>
          <p className="text-gray-400 mt-2">
            {animes.length} résultats trouvés
          </p>
        </div>

        {/* Grille de résultats */}
        {animes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {animes.map((anime: any) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
          </div>
        ) : (
          // Si rien n'est trouvé
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h2 className="text-2xl font-bold mb-2">Aucun résultat trouvé</h2>
            <p className="text-gray-400">Essaie avec un autre titre ou vérifie l'orthographe.</p>
          </div>
        )}
      </div>
    </div>
  );
}