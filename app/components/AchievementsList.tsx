"use client";
import { ACHIEVEMENTS, getUnlockedAchievements } from "../lib/achievements";

interface AchievementsListProps {
  library: any[];
}

export default function AchievementsList({ library }: AchievementsListProps) {
  // On calcule les succès obtenus
  const unlocked = getUnlockedAchievements(library);
  const unlockedIds = unlocked.map(a => a.id);

  return (
    <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Succès débloqués</h3>
        <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30">
          {unlocked.length} / {ACHIEVEMENTS.length}
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[250px] custom-scrollbar pr-2">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlockedIds.includes(achievement.id);
          
          return (
            <div 
                key={achievement.id} 
                className={`relative group p-3 rounded-xl border transition-all duration-300 flex flex-col items-center text-center ${
                    isUnlocked 
                    ? `${achievement.color} shadow-sm` 
                    : 'bg-slate-900/40 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                }`}
            >
                <div className="text-2xl mb-1">{isUnlocked ? achievement.icon : "🔒"}</div>
                <div className="text-[10px] font-bold uppercase leading-tight mt-1">{achievement.title}</div>
                
                {/* Infobulle au survol */}
                <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl border border-white/10 z-50">
                    <p className="font-bold mb-1">{achievement.title} {achievement.icon}</p>
                    <p className="text-gray-400">{achievement.description}</p>
                    {/* Petite flèche en bas de l'infobulle */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}