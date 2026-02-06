import { getMangaById } from "../../lib/api";
import Image from "next/image";
import AddToListButton from "../../components/AddToListButton";
import { createClient } from "../../lib/supabase/server"; 

export default async function MangaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manga = await getMangaById(id); // Utilisation de l'API Manga
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!manga) return <div className="text-white text-center py-20">Manga introuvable...</div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-20">
      
      {/* BANNIÈRE */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 opacity-30 blur-xl scale-110">
           {manga.images?.jpg?.large_image_url && (
             <Image 
               src={manga.images.jpg.large_image_url} 
               alt="Background" 
               fill className="object-cover" loading="lazy" unoptimized
             />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/50 to-transparent" />
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-32 z-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Colonne Gauche */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-64 flex flex-col gap-4">
            <div className="relative h-[360px] w-full rounded-xl overflow-hidden shadow-2xl border-4 border-[#1e293b] bg-gray-800">
              {manga.images?.jpg?.large_image_url && (
                <Image 
                  src={manga.images.jpg.large_image_url} 
                  alt={manga.title} 
                  fill className="object-cover" loading="lazy" unoptimized
                />
              )}
            </div>
            
            {/* BOUTONS D'ACTION (MANGA) */}
            {user ? (
                <AddToListButton 
                    anime={manga} 
                    mediaType="manga" // 👈 IMPORTANT
                    userId={user.id} 
                    compact={false} 
                />
            ) : (
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/10">
                    <p className="text-sm text-gray-400">Connectez-vous pour gérer votre liste</p>
                </div>
            )}
          </div>

          {/* Colonne Droite */}
          <div className="flex-1 pt-4 md:pt-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {manga.title}
            </h1>
            <p className="text-lg text-gray-400 mb-6 italic">{manga.title_japanese}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-sm font-bold">
                ★ {manga.score || "?"}
              </span>
              
              {/* Badge Statut */}
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                  manga.status === 'Terminé' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  manga.status === 'En cours' || manga.status === 'En cours de publication' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {manga.status || "Inconnu"}
              </span>

              {/* Distinction Chapitres / Volumes */}
              <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-sm font-bold">
                {manga.chapters ? `${manga.chapters} Chapitres` : "En cours"}
              </span>
            </div>

            <div className="bg-[#1e293b]/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
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