import { getSeason, getAnimeByYear } from "../lib/api"; // 👈 Nouvel import
import AnimeCard from "../components/AnimeCard";
import SeasonNav from "../components/SeasonNav";

export default async function SeasonPage({ searchParams }: { searchParams: Promise<{ year?: string; season?: string }> }) {
  const params = await searchParams;
  
  let animes = [];
  let currentYear: number;
  let currentSeason: string;

  // 1. Initialisation de la date
  if (params.year) {
    currentYear = parseInt(params.year);
    // Si l'année est dans l'URL mais pas la saison, on met "all" par défaut
    currentSeason = params.season || "all";
  } else {
    // Par défaut (arrivée sur la page), on met l'année actuelle et "all"
    currentYear = new Date().getFullYear();
    currentSeason = "all";
  }

  // 2. Récupération des données selon le choix
  if (currentSeason === "all") {
    // Cas 1 : Toute l'année
    animes = await getAnimeByYear(currentYear);
  } else {
    // Cas 2 : Une saison précise (hiver, printemps...)
    animes = await getSeason(currentYear.toString(), currentSeason);
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 pb-20">
      
      <div className="max-w-7xl mx-auto text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Calendrier des Saisons
        </h1>
        <p className="text-gray-400">
          {currentSeason === "all" 
            ? `Les animés les plus populaires de ${currentYear}` 
            : `Les sorties de la saison ${currentSeason} ${currentYear}`}
        </p>
      </div>

      <SeasonNav currentYear={currentYear} currentSeason={currentSeason} />

      <div className="max-w-7xl mx-auto">
        {animes.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-slate-900/50 rounded-xl border border-white/5">
            Aucun animé trouvé pour cette période.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {animes.map((anime: any) => (
              <AnimeCard key={anime.mal_id} anime={anime} type="anime" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}