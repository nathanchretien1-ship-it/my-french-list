"use client";
import Image from "next/image";
import Link from "next/link";

interface AnimeCardProps {
  anime: any;
  type?: "anime" | "manga"; // 👈 On ajoute ce paramètre optionnel
}

// Par défaut, type vaut "anime"
export default function AnimeCard({ anime, type = "anime" }: AnimeCardProps) {
  if (!anime) return null;

  // On construit le lien dynamiquement
  const linkHref = `/${type}/${anime.mal_id}`;

  return (
    <Link 
      href={linkHref} 
      className="block group relative h-[380px] w-full rounded-2xl overflow-hidden bg-gray-900 shadow-xl border border-white/5 cursor-pointer hover:-translate-y-2 transition-transform duration-300"
    >
      
      {/* Image de fond */}
      <div className="absolute inset-0 w-full h-full">
        {anime.images?.jpg?.large_image_url && (
          <Image
            src={anime.images.jpg.large_image_url}
            alt={anime.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            loading="lazy"
            unoptimized // Important pour la vitesse
          />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
      </div>

      {/* Badge Score */}
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-yellow-400 text-xs font-bold shadow-lg">
          <span>★</span>
          <span>{anime.score || "N/A"}</span>
        </div>
      </div>

      {/* Infos du bas */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1 drop-shadow-md">
          {anime.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span className="bg-white/20 px-2 py-0.5 rounded text-white font-medium uppercase">
            {type} {/* Affiche "ANIME" ou "MANGA" */}
          </span>
          <span>{anime.year ? anime.year : (anime.published?.from ? new Date(anime.published.from).getFullYear() : "?")}</span>
        </div>
      </div>
    </Link>
  );
}