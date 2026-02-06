import { getAnimeById } from "../../lib/api";
import Image from "next/image";
import AddToListButton from "../../components/AddToListButton";
import { createClient } from "../../lib/supabase/server"; 

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anime = await getAnimeById(id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!anime) return <div className="text-white text-center py-20">Introuvable...</div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-20">
      
      {/* HEADER */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 opacity-30 blur-xl scale-110">
           {anime.images?.jpg?.large_image_url && (
             <Image src={anime.images.jpg.large_image_url} alt="Bg" fill className="object-cover" loading="lazy" unoptimized />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-32 z-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* GAUCHE : Affiche + Boutons */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-64 flex flex-col gap-4">
            <div className="relative h-[360px] w-full rounded-xl overflow-hidden shadow-2xl border-4 border-[#1e293b] bg-gray-800">
              {anime.images?.jpg?.large_image_url && (
                <Image src={anime.images.jpg.large_image_url} alt={anime.title} fill className="object-cover" loading="lazy" unoptimized />
              )}
            </div>
            
            {/* BOUTONS D'ACTION (Mode complet) */}
            {user ? (
                <AddToListButton 
                    anime={anime} 
                    mediaType="anime" 
                    userId={user.id} 
                    compact={false} // 👈 Affiche les boutons textes complets
                />
            ) : (
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/10">
                    <p className="text-sm text-gray-400">Connectez-vous pour gérer votre liste</p>
                </div>
            )}
          </div>

          {/* DROITE : Infos */}
          <div className="flex-1 pt-4 md:pt-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {anime.title}
            </h1>
            <p className="text-lg text-gray-400 mb-6 italic">{anime.title_japanese}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-sm font-bold">
                ★ {anime.score || "?"}
              </span>
              {/* ✅ Le statut s'affiche ici (déjà traduit par l'API) */}
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                  anime.status === 'Terminé' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  anime.status === 'En cours' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {anime.status || "Inconnu"}
              </span>
              <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-sm font-bold">
                {anime.episodes ? `${anime.episodes} Épisodes` : "En cours"}
              </span>
            </div>

            <div className="bg-[#1e293b]/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-3 text-purple-300">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                {anime.synopsis || "Pas de synopsis."}
              </p>
            </div>

            {anime.trailer?.embed_url && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-white">Bande-annonce</h3>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <iframe src={anime.trailer.embed_url} className="w-full h-full" allowFullScreen title="Trailer" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}