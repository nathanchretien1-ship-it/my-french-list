export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  color: string; // Classes Tailwind
  // La condition prend la bibliothèque complète d'un utilisateur et retourne true si validée
  condition: (library: any[]) => boolean; 
}

export const ACHIEVEMENTS: Achievement[] = [
  // --- QUANTITÉ GLOBALE ---
  {
    id: "first_blood",
    title: "Premier Sang",
    description: "Ajouter un premier anime ou manga à sa liste.",
    icon: "🩸",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    condition: (lib) => lib.length >= 1
  },
  {
    id: "collector_10",
    title: "Collectionneur (Bronze)",
    description: "Avoir 10 œuvres dans sa liste.",
    icon: "🥉",
    color: "bg-amber-700/20 text-amber-500 border-amber-700/30",
    condition: (lib) => lib.length >= 10
  },
  {
    id: "collector_50",
    title: "Collectionneur (Argent)",
    description: "Avoir 50 œuvres dans sa liste.",
    icon: "🥈",
    color: "bg-gray-400/20 text-gray-300 border-gray-400/30",
    condition: (lib) => lib.length >= 50
  },
  {
    id: "collector_100",
    title: "Collectionneur (Or)",
    description: "Avoir 100 œuvres dans sa liste.",
    icon: "🥇",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    condition: (lib) => lib.length >= 100
  },

  // --- COMPLÉTION ---
  {
    id: "finisher_10",
    title: "Binge Watcher",
    description: "Terminer 10 animes ou mangas.",
    icon: "📺",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    condition: (lib) => lib.filter(i => i.status === 'completed').length >= 10
  },

  // --- GENRES SPÉCIFIQUES ---
  // Note: On utilise toLowerCase() pour être sûr de matcher "Action" ou "action"
  {
    id: "genre_action",
    title: "Bagarreur",
    description: "Avoir au moins 5 œuvres du genre 'Action'.",
    icon: "🥊",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    condition: (lib) => lib.filter(i => {
        const genres = i.genres?.map((g: any) => g.name.toLowerCase()) || [];
        return genres.includes('action');
    }).length >= 5
  },
  {
    id: "genre_romance",
    title: "Cœur Tendre",
    description: "Avoir au moins 5 œuvres du genre 'Romance'.",
    icon: "💖",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    condition: (lib) => lib.filter(i => {
        const genres = i.genres?.map((g: any) => g.name.toLowerCase()) || [];
        return genres.includes('romance');
    }).length >= 5
  },
  {
    id: "genre_fantasy",
    title: "Isekai Traveler",
    description: "Avoir au moins 5 œuvres du genre 'Fantasy'.",
    icon: "🧙‍♂️",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    condition: (lib) => lib.filter(i => {
        const genres = i.genres?.map((g: any) => g.name.toLowerCase()) || [];
        return genres.includes('fantasy');
    }).length >= 5
  },

  // --- CRITIQUE ---
  {
    id: "critic",
    title: "Critique d'Art",
    description: "Noter au moins 10 œuvres.",
    icon: "✍️",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    condition: (lib) => lib.filter(i => i.score > 0).length >= 10
  },
  {
    id: "hater",
    title: "Hater",
    description: "Donner une note inférieure à 4.",
    icon: "🤬",
    color: "bg-zinc-800 text-zinc-400 border-zinc-600",
    condition: (lib) => lib.some(i => i.score > 0 && i.score < 4)
  }
];

// Fonction utilitaire pour récupérer les succès débloqués d'un utilisateur
export function getUnlockedAchievements(library: any[]): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.condition(library));
}