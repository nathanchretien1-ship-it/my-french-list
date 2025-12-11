import { getRank } from "../lib/ranks";

// 👇 J'ai ajouté 'isAdmin' dans les propriétés (props)
export default function UserBadge({ 
  role, 
  isAdmin = false, // Par défaut faux
  isPremium, 
  animeCount = 0 
}: { 
  role: string, 
  isAdmin?: boolean, // Le ? rend la propriété optionnelle
  isPremium: boolean, 
  animeCount?: number 
}) {
  
  const normalizedRole = role?.toLowerCase().trim() || 'member';

  // 👇 COMBINAISON : On est Admin si le rôle est 'admin' OU si la case isAdmin est vraie
  const showAdminBadge = normalizedRole === 'admin' || isAdmin === true;

  // Récupération du rang d'anime
  const progressionRank = getRank(animeCount, false);

  return (
    <div className="flex gap-2 mt-2 flex-wrap items-center">
      
      {/* --- BADGE ADMIN (Rouge) --- */}
      {showAdminBadge && (
        <div className="flex items-center gap-1 bg-red-600/20 border border-red-500 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-[0_0_10px_rgba(220,38,38,0.3)]">
          <span className="text-xs">👑</span>
          Admin
        </div>
      )}

      {/* --- BADGE STAFF / MODO (Indigo) --- */}
      {(normalizedRole === 'modo' || normalizedRole === 'staff') && (
        <div className="flex items-center gap-1 bg-indigo-500/20 border border-indigo-500 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
          Staff
        </div>
      )}

      {/* --- BADGE PREMIUM (Rose/Violet) --- */}
      {isPremium && (
        <div className="flex items-center gap-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/60 text-pink-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-[0_0_8px_rgba(236,72,153,0.3)]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Premium
        </div>
      )}

      {/* --- BADGE DE PROGRESSION --- */}
      {animeCount >= 0 && (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${progressionRank.color}`}>
          <span className="text-xs">{progressionRank.emoji}</span>
          {progressionRank.title}
        </div>
      )}
      
      <div className="text-[10px] text-gray-500 font-mono ml-1 opacity-60">
        ({animeCount} vus)
      </div>
    </div>
  );
}