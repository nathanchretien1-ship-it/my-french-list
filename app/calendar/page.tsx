import { getSchedules } from "../lib/api";
import AnimeCard from "../components/AnimeCard";

export default async function CalendarPage() {
  const schedules = await getSchedules();
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-12">
      <h1 className="text-3xl font-black mb-8">📅 Calendrier des Sorties</h1>
      <div className="space-y-12">
        {days.map(day => (
          <section key={day}>
            <h2 className="text-xl font-bold uppercase text-indigo-400 mb-6 border-b border-indigo-500/20 pb-2">{day}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {schedules.filter((a: any) => a.broadcast?.day?.toLowerCase().includes(day)).map((anime: any) => (
                <AnimeCard key={anime.mal_id} anime={anime} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}