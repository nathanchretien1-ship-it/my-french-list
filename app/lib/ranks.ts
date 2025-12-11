export interface Rank {
  title: string;
  min: number;
  color: string;
  emoji: string;
}

// Le Rang Spécial
export const ADMIN_RANK: Rank = {
  title: "Admin",
  min: 999999,
  color: "bg-rose-600 text-white border-2 border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.6)]", // Effet néon rouge
  emoji: "👑"
};

export const RANKS: Rank[] = [
  { min: 0, title: "PNJ", color: "bg-gray-600 text-gray-200", emoji: "😐" },
  { min: 5, title: "Isekai Victim", color: "bg-blue-900 text-blue-200", emoji: "🚚" },
  { min: 15, title: "Genin", color: "bg-green-600 text-white", emoji: "🍃" },
  { min: 30, title: "Hunter", color: "bg-green-500 text-white", emoji: "💳" },
  { min: 50, title: "Super Saiyan", color: "bg-yellow-500 text-black", emoji: "🔥" },
  { min: 100, title: "Hokage", color: "bg-orange-600 text-white", emoji: "🦊" },
  { min: 150, title: "Roi des Pirates", color: "bg-red-600 text-white", emoji: "🏴‍☠️" },
  { min: 200, title: "Pilier", color: "bg-indigo-600 text-white", emoji: "⚔️" },
  { min: 300, title: "Mage Noir", color: "bg-purple-600 text-white", emoji: "🧙‍♂️" },
  { min: 500, title: "Divinité", color: "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white border border-white", emoji: "✨" },
];

// 👇 On modifie la fonction pour accepter le paramètre "isAdmin"
export function getRank(count: number = 0, isAdmin: boolean = false) {
  if (isAdmin) return ADMIN_RANK; // Priorité absolue
  return RANKS.slice().reverse().find(r => count >= r.min) || RANKS[0];
}