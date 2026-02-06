"use client";
import Image from "next/image";
import Link from "next/link";
import AddToListButton from "./AddToListButton";
import { User } from "@supabase/supabase-js";

interface AnimeCardProps {
  anime: any;
  type?: "anime" | "manga"; // 'anime' ou 'manga'
  user?: User | null;
}

export default function AnimeCard({ anime, type = "anime", user }: AnimeCardProps) {
  if (!anime) return null;

  const linkHref = `/${type}/${anime.mal_id}`;

  // Gestion des couleurs de statut
  const getStatusColor = (status: string) => {
      // On vérifie le texte traduit OU le texte original anglais par sécurité
      const s = status?.toLowerCase() || "";
      if (s.includes("en cours") || s.includes("publishing") || s.includes("airing")) return "bg-green-500 text-white";
      if (s.includes("à venir") || s.includes("not yet")) return "bg-blue-500 text-white";
      if (s.includes("terminé") || s.includes("finished")) return "bg-red-500 text-white";
      return "bg-gray-500 text-white";
  };

  // Récupération de l'année (fallback pour les mangas qui n'ont pas toujours le champ 'year')
  const getYear = () => {
      if (anime.year) return anime.year;
      if (anime.published?.from) return new Date(anime.published.from).getFullYear();
      if (anime.aired?.from) return new Date(anime.aired.from).getFullYear();
      return "?";
  };

  // Formatage Épisodes / Chapitres
  const getCountInfo = () => {
      if (type === 'manga') {
          return anime.chapters ? `${anime.chapters} ch.` : 'En cours';
      }
      return anime.episodes ? `${anime.episodes} eps` : 'En cours';
  };

  return (
    <div className="group relative h-[400px] w-full rounded-2xl overflow-hidden bg-gray-900 shadow-xl border border-white/5 hover:-translate-y-2 transition-transform duration-300">
        <Link href={linkHref} className="block w-full h-full">
            {/* --- IMAGE DE FOND --- */}
            <div className="absolute inset-0 w-full h-full">
                {anime.images?.jpg?.large_image_url ? (
                <Image
                    src={anime.images.jpg.large_image_url}
                    alt={anime.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    loading="lazy"
                    unoptimized
                />
                ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-gray-500 text-xs">Image non disponible</div>
                )}
                {/* Dégradé plus prononcé pour lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
            </div>

            {/* --- BADGES (Haut Droite) --- */}
            <div className="absolute top-3 right-3 z-10 pointer-events-none flex flex-col items-end gap-2">
                {/* Note */}
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-yellow-400 text-xs font-bold shadow-lg">
                    <span>★</span><span>{anime.score || "N/A"}</span>
                </div>
                {/* Statut */}
                {anime.status && (
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md uppercase tracking-wider shadow-lg ${getStatusColor(anime.status)}`}>
                        {anime.status}
                    </div>
                )}
            </div>

            {/* --- INFOS (Bas) --- */}
            <div className="absolute bottom-0 left-0 w-full p-4 pt-12 flex flex-col justify-end h-1/2">
                
                {/* Titre */}
                <h3 className="text-white font-bold text-base leading-tight line-clamp-2 mb-2 drop-shadow-md group-hover:text-indigo-400 transition-colors">
                    {anime.title}
                </h3>
                
                {/* Métadonnées : Type • Année • Épisodes */}
                <div className="flex items-center flex-wrap gap-2 text-[10px] text-gray-300 mb-2 font-medium">
                    <span className="bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-indigo-200 uppercase tracking-wider">
                        {anime.type || type}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span>{getYear()}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-white">{getCountInfo()}</span>
                </div>

                {/* Genres (Max 3) */}
                <div className="flex flex-wrap gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {anime.genres?.slice(0, 3).map((g: any) => (
                        <span key={g.mal_id} className="text-[9px] text-gray-400 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {g.name}
                        </span>
                    ))}
                    {/* Studio (Anime seulement) */}
                    {type === 'anime' && anime.studios?.[0] && (
                        <span className="text-[9px] text-indigo-300 bg-indigo-900/30 border border-indigo-500/30 px-2 py-0.5 rounded-full whitespace-nowrap truncate max-w-[80px]">
                            {anime.studios[0].name}
                        </span>
                    )}
                </div>
            </div>
        </Link>

        {/* --- BOUTON AJOUT --- */}
        {user && (
            <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <AddToListButton 
                    anime={anime} 
                    mediaType={type} 
                    userId={user.id} 
                    compact={true}
                />
            </div>
        )}
    </div>
  );
}