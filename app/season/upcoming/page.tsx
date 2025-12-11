import { getSeason, getSeasonNow } from "../../lib/api";
import AnimeCard from "../../components/AnimeCard";
import Link from "next/link";

// Petit dictionnaire pour traduire les saisons
const seasonFr: Record<string, string> = {
  winter: "Hiver",
  spring: "Printemps",
  summer: "Été",
  fall: "Automne",
};

const seasonsOrder = ["winter", "spring", "summer", "fall"];

export default async function SeasonPage({ searchParams }: { searchParams: Promise<{ year?: string; season?: string }> }) {
  const params = await searchParams;
  let animes = [];
  let currentYear: number;
  let currentSeason: string;

  // 1. Déterminer quelle saison afficher
  if (params.year && params.season) {
    // Si l'utilisateur demande une date précise
    currentYear = parseInt(params.year);
    currentSeason = params.season;
    animes = await getSeason(params.year, params.season);
  } else {
    // Sinon, on charge la saison actuelle ("Now")
    // Jikan ne nous dit pas toujours quelle est la saison "Now" dans les métadonnées de l'API simple,
    // donc pour simplifier la navigation, on va simuler la date d'aujourd'hui.
    const now = new Date();
    currentYear = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    // Calcul approximatif de la saison actuelle
    if (month < 3) currentSeason = "winter";
    else if (month < 6) currentSeason = "spring";
    else if (month < 9) currentSeason = "summer";
    else currentSeason = "fall";

    // On utilise l'endpoint spécial "Now" qui est plus précis
    animes = await getSeasonNow();
  }

  // 2. Calculer "Précédent" et "Suivant"
  const currentIndex = seasonsOrder.indexOf(currentSeason);
  
  // Précédent
  let prevSeason = seasonsOrder[currentIndex - 1];
  let prevYear = currentYear;
  if (currentIndex === 0) {
    prevSeason = "fall";
    prevYear = currentYear - 1;
  }

  // Suivant
  let nextSeason = seasonsOrder[currentIndex + 1];
  let nextYear = currentYear;
  if (currentIndex === 3) {
    nextSeason = "winter";
    nextYear = currentYear + 1;
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 pb-20">
      
      {/* En-tête Navigation */}
      <div className="max-w-7xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Calendrier des Saisons
        </h1>

        <div className="flex items-center justify-center gap-6 text-lg font-bold">
          {/* Bouton Précédent */}
          <Link 
            href={`/season?year=${prevYear}&season=${prevSeason}`}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            ← {seasonFr[prevSeason]} {prevYear}
          </Link>

          {/* Titre Actuel */}
          <div className="bg-slate-800 px-6 py-2 rounded-full border border-white/10 shadow-lg capitalize">
            {seasonFr[currentSeason] || currentSeason} {currentYear}
          </div>

          {/* Bouton Suivant */}
          <Link 
            href={`/season?year=${nextYear}&season=${nextSeason}`}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            {seasonFr[nextSeason]} {nextYear} →
          </Link>
        </div>
        
        {/* Lien Bonus : À venir */}
        <div className="mt-4">
            <Link href="/season/upcoming" className="text-sm text-purple-400 hover:text-purple-300 hover:underline">
                Voir les animés à venir prochainement (Upcoming)
            </Link>
        </div>
      </div>

      {/* La Grille */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {animes.map((anime: any) => (
          <AnimeCard key={anime.mal_id} anime={anime} type="anime" />
        ))}
      </div>
    </div>
  );
}