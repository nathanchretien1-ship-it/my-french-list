import { getSchedulesByDay } from "../lib/api";
import AnimeCard from "../components/AnimeCard";
import Link from "next/link";

const DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" }
];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const resolvedParams = await searchParams;
  const currentDay = resolvedParams.day || "monday"; // Lundi par défaut
  
  // On récupère uniquement le jour sélectionné, ce qui permet à Jikan de tout nous renvoyer sans couper à 25.
  const schedules = await getSchedulesByDay(currentDay);

  // Sécurité anti-doublons (Jikan bug parfois)
  const uniqueAnimes = Array.from(
      new Map(schedules.map((anime: any) => [anime.mal_id, anime])).values()
  ) as any[];

  return (
    <div className="min-h-screen bg-[#0f111a] pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
          📅 Calendrier Simulcast
        </h1>
        
        {/* Navigation par onglets (Ergonomie améliorée) */}
        <div className="flex gap-2 overflow-x-auto pb-6 custom-scrollbar mb-6">
            {DAYS.map(d => {
                const isActive = currentDay === d.key;
                return (
                    <Link 
                        key={d.key} 
                        href={`/calendar?day=${d.key}`} 
                        className={`px-6 py-2.5 rounded-full whitespace-nowrap font-bold transition-all ${
                            isActive 
                            ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
                            : 'bg-[#1e293b]/50 text-gray-400 hover:bg-[#1e293b] hover:text-white border border-white/5'
                        }`}
                    >
                        {d.label}
                    </Link>
                );
            })}
        </div>
        
        {/* Grille de résultats */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {uniqueAnimes.length === 0 ? (
                <div className="text-center py-20 text-gray-500">Aucun anime prévu pour ce jour.</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {uniqueAnimes.map((anime: any) => (
                    <AnimeCard 
                        key={anime.mal_id} 
                        anime={anime} 
                        type="anime" 
                    />
                ))}
                </div>
            )}
        </section>
      </div>
    </div>
  );
}