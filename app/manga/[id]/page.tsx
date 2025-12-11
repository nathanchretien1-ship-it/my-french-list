import { getMangaById } from "../../lib/api";
import Image from "next/image";
import AddToListButton from "../../components/AddToListButton";

// Next.js 15 : Les params sont une Promesse
export default async function MangaPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 1. On récupère l'ID
  const { id } = await params;
  
  // 2. On appelle l'API Manga (assure-toi que cette fonction existe dans lib/api.ts)
  const manga = await getMangaById(id);

  if (!manga) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl mb-4">😕</h1>
          <p>Manga introuvable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-20">
      
      {/* --- BANNIÈRE HEADER (Fond flou) --- */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 opacity-30 blur-xl scale-110">
           {manga.images?.jpg?.large_image_url && (
             <Image 
               src={manga.images.jpg.large_image_url} 
               alt="Background" 
               fill 
               className="object-cover" 
               unoptimized
                loading="lazy"

             />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/50 to-transparent" />
      </div>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-32 z-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* COLONNE GAUCHE (Image + Bouton) */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-64">
            <div className="relative h-[360px] w-full rounded-xl overflow-hidden shadow-2xl border-4 border-[#1e293b] bg-gray-800">
              {manga.images?.jpg?.large_image_url && (
                <Image 
                  src={manga.images.jpg.large_image_url} 
                  alt={manga.title} 
                  fill 
                  className="object-cover"
                  unoptimized
                loading="lazy"

                />
              )}
            </div>
            
            {/* 👇 LE BOUTON MAGIQUE CONFIGURÉ POUR MANGA 👇 */}
            <AddToListButton anime={manga} mediaType="manga" />
          </div>

          {/* COLONNE DROITE (Infos) */}
          <div className="flex-1 pt-4 md:pt-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {manga.title}
            </h1>
            <p className="text-lg text-gray-400 mb-6 italic">
              {manga.title_japanese}
            </p>

            {/* Badges d'information */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
              {/* Note */}
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-sm font-bold">
                ★ {manga.score || "N/A"}
              </span>
              
              {/* Statut (Publishing, Finished...) */}
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-sm font-bold">
                {manga.status}
              </span>
              
              {/* Volumes / Chapitres (Spécifique Manga) */}
              <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-sm font-bold">
                {manga.volumes ? `${manga.volumes} Volumes` : "Volumes inconnus"}
              </span>
              <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full text-sm font-bold">
                {manga.chapters ? `${manga.chapters} Chapitres` : "En cours"}
              </span>
            </div>

            {/* Auteurs (Spécifique Manga) */}
            {manga.authors && manga.authors.length > 0 && (
               <div className="mb-6 text-gray-300">
                 <span className="font-bold text-purple-400">Auteur(s) : </span>
                 {manga.authors.map((author: any) => author.name).join(", ")}
               </div>
            )}

            {/* Synopsis */}
            <div className="bg-[#1e293b]/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
              <h2 className="text-xl font-bold mb-3 text-purple-300">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                {manga.synopsis || "Aucun synopsis disponible."}
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}