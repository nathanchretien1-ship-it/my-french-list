import { getSeason, getAnimeByYear } from "../lib/api"; // 👈 Nouvel import
import AnimeCard from "../components/AnimeCard";
import SeasonNav from "../components/SeasonNav";

export default async function SeasonPage({ searchParams }: { searchParams: Promise<{ year?: string; season?: string }> }) {
  const params = await searchParams;
  
  let animes = [];
  const currentYear = params.year ? parseInt(params.year) : new Date().getFullYear();
  const currentSeason = params.season || "all";

  try {
    if (currentSeason === "all") {
      animes = await getAnimeByYear(currentYear) || [];
    } else {
      animes = await getSeason(currentYear.toString(), currentSeason) || [];
    }
  } catch (error) {
    console.error("Erreur chargement saison:", error);
    animes = []; // Évite le crash
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 pb-20">
      {/* ... reste du header ... */}

      <SeasonNav currentYear={currentYear} currentSeason={currentSeason} />

      <div className="max-w-7xl mx-auto">
        {!animes || animes.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-slate-900/50 rounded-xl border border-white/5">
            Aucun animé trouvé ou l'API est saturée. Réessayez dans quelques secondes.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {animes.map((anime: any, index: number) => (
              // On combine mal_id et index pour être SUR d'avoir une clé unique
              <AnimeCard key={`${anime.mal_id}-${index}`} anime={anime} type="anime" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}