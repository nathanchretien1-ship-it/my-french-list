"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SeasonNavProps {
  currentYear: number;
  currentSeason: string;
}

const SEASONS = [
  // 👇 Le nouvel onglet "Tout"
  { value: "all", label: "Toute l'année", icon: "📅", color: "hover:bg-purple-500/20 hover:border-purple-500 text-purple-200" },
  { value: "winter", label: "Hiver", icon: "❄️", color: "hover:bg-blue-500/20 hover:border-blue-500 text-blue-200" },
  { value: "spring", label: "Printemps", icon: "🌸", color: "hover:bg-pink-500/20 hover:border-pink-500 text-pink-200" },
  { value: "summer", label: "Été", icon: "☀️", color: "hover:bg-yellow-500/20 hover:border-yellow-500 text-yellow-200" },
  { value: "fall", label: "Automne", icon: "🍂", color: "hover:bg-orange-500/20 hover:border-orange-500 text-orange-200" },
];

export default function SeasonNav({ currentYear, currentSeason }: SeasonNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const years = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() + 1 - i);

  // Quand on change l'année, on remet la saison sur "all" par défaut
  const handleYearChange = (year: number) => {
    setIsOpen(false);
    router.push(`/season?year=${year}&season=all`); // 👈 Force "all"
  };

  const handleSeasonChange = (season: string) => {
    router.push(`/season?year=${currentYear}&season=${season}`);
  };

  return (
    <div className="flex flex-col items-center gap-8 mb-10">
      
      {/* 1. SÉLECTEUR D'ANNÉE */}
      <div className="relative z-20">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 bg-slate-900 border border-slate-700 hover:border-purple-500 text-white text-2xl font-bold py-3 px-8 rounded-2xl transition shadow-lg hover:shadow-purple-500/20 group"
        >
          <span className="text-gray-400 font-normal text-lg">Année</span>
          <span>{currentYear}</span>
          <span className={`text-sm text-purple-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-80 sm:w-96 max-h-80 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-20 custom-scrollbar animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-4 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`py-2 rounded-lg text-sm font-bold transition ${
                      currentYear === year
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. ONGLETS SAISONS (Avec "Tout" inclus) */}
      <div className="flex flex-wrap justify-center gap-3">
        {SEASONS.map((season) => {
          const isActive = currentSeason === season.value;
          return (
            <button
              key={season.value}
              onClick={() => handleSeasonChange(season.value)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold border transition-all duration-300 ${
                isActive
                  ? "bg-white text-black border-white scale-105 shadow-xl shadow-white/10"
                  : `bg-slate-900 border-slate-800 ${season.color}`
              }`}
            >
              <span className="text-xl">{season.icon}</span>
              <span className="capitalize">{season.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}