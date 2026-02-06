import { getAnimeById, getRecommendations } from "../../lib/api";
import Image from "next/image";
import Link from "next/link"; // ✅ N'oublie pas d'importer Link
import AddToListButton from "../../components/AddToListButton";
import RatingComponent from "../../components/RatingComponent";
import AnimeCard from "../../components/AnimeCard";
import { createClient } from "../../lib/supabase/server";

// ... (Garde le composant InfoRow tel quel) ...
const InfoRow = ({ label, value }: { label: string, value: string | number | null | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
            <span className="text-gray-400 text-sm font-medium">{label}</span>
            <span className="text-white text-sm text-right max-w-[60%]">{value}</span>
        </div>
    );
};

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const anime = await getAnimeById(id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!anime) return <div className="text-white text-center py-20">Anime introuvable...</div>;

  const genreIds = anime.genres?.map((g: any) => g.mal_id) || [];
  const recommendations = await getRecommendations(genreIds, 'anime', anime.mal_id);

  // --- 1. EXTRACTION DES RELATIONS ---
  const relations = anime.relations || [];
  const prequels = relations.find((r: any) => r.relation === 'Prequel')?.entry || [];
  const sequels = relations.find((r: any) => r.relation === 'Sequel')?.entry || [];
  const otherSeasons = relations.find((r: any) => r.relation === 'Side story' || r.relation === 'Spin-off')?.entry || [];

  // Formatage
  const studios = anime.studios?.map((s: any) => s.name).join(", ");
  const producers = anime.producers?.map((p: any) => p.name).join(", ");
  const genres = anime.genres?.map((g: any) => g.name).join(", ");
  const themes = anime.themes?.map((t: any) => t.name).join(", ");

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-20">
      
      {/* ... (HEADER BANNER reste identique) ... */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 opacity-40 blur-xl scale-110">
           {anime.images?.jpg?.large_image_url && (
             <Image src={anime.images.jpg.large_image_url} alt="Background" fill className="object-cover" loading="lazy" unoptimized />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 max-w-7xl mx-auto flex flex-col md:flex-row items-end md:items-center gap-6 z-10 pb-12 md:pb-24">
             <div className="flex-1">
                 <h1 className="text-4xl md:text-6xl font-black mb-2 text-white drop-shadow-lg leading-tight">
                    {anime.title}
                 </h1>
                 <p className="text-lg md:text-xl text-gray-300 italic font-light">{anime.title_japanese}</p>
             </div>
             
             {/* ... (Badges Score/Rang/Popu restent identiques) ... */}
             <div className="flex gap-4">
                 <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Score</span>
                     <span className="text-2xl font-bold text-yellow-400">★ {anime.score || "N/A"}</span>
                     <span className="text-[10px] text-gray-500">{anime.scored_by?.toLocaleString()} votes</span>
                 </div>
                 <div className="hidden sm:flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Rang</span>
                     <span className="text-2xl font-bold text-white">#{anime.rank || "N/A"}</span>
                 </div>
                 <div className="hidden sm:flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Popularité</span>
                     <span className="text-2xl font-bold text-white">#{anime.popularity || "N/A"}</span>
                 </div>
             </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-16 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* --- COLONNE GAUCHE --- */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Affiche */}
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border-4 border-[#1e293b] bg-gray-800">
              {anime.images?.jpg?.large_image_url && (
                <Image src={anime.images.jpg.large_image_url} alt={anime.title} fill className="object-cover" loading="lazy" unoptimized />
              )}
            </div>
            
            {/* Actions */}
            {user ? (
                <div className="flex flex-col gap-4">
                    <AddToListButton anime={anime} mediaType="anime" userId={user.id} compact={false} />
                    <RatingComponent 
                        mediaId={anime.mal_id} 
                        mediaType="anime" 
                        mediaTitle={anime.title} 
                        mediaImage={anime.images?.jpg?.large_image_url} 
                        userId={user.id} 
                    />
                </div>
            ) : (
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/10 text-sm text-gray-400">
                    Connectez-vous pour ajouter à votre liste et noter.
                </div>
            )}

            {/* SIDEBAR INFOS */}
            <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-white/5 backdrop-blur-sm">
                <h3 className="text-white font-bold mb-4 uppercase text-sm border-b border-white/10 pb-2">Informations</h3>
                <div className="flex flex-col gap-1">
                    <InfoRow label="Type" value={anime.type} />
                    <InfoRow label="Épisodes" value={anime.episodes || "Inconnu"} />
                    <InfoRow label="Statut" value={anime.status} />
                    <InfoRow label="Diffusion" value={anime.aired?.string} />
                    <InfoRow label="Saison" value={anime.season ? `${anime.season} ${anime.year}` : null} />
                    <InfoRow label="Studio" value={studios} />
                    <InfoRow label="Source" value={anime.source} />
                    <InfoRow label="Durée" value={anime.duration} />
                    <InfoRow label="Rating" value={anime.rating} />
                </div>
            </div>

            {/* --- 2. NOUVEAU BLOC : CHRONOLOGIE / RELATIONS --- */}
            {(prequels.length > 0 || sequels.length > 0) && (
                <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-white font-bold mb-4 uppercase text-sm border-b border-white/10 pb-2 flex items-center gap-2">
                        <span>⏳</span> Chronologie
                    </h3>
                    <div className="flex flex-col gap-4">
                        
                        {/* Préquelles */}
                        {prequels.length > 0 && (
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-2">Précédemment</span>
                                <div className="flex flex-col gap-2">
                                    {prequels.map((ref: any) => (
                                        <Link 
                                            key={ref.mal_id} 
                                            href={`/${ref.type}/${ref.mal_id}`} 
                                            className="group flex items-center gap-2 bg-black/20 hover:bg-white/10 p-2 rounded-lg border border-white/5 hover:border-white/20 transition"
                                        >
                                            <span className="text-indigo-400 text-xs group-hover:text-indigo-300">⬅</span>
                                            <span className="text-xs text-gray-300 group-hover:text-white font-medium line-clamp-1">{ref.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Séquelles */}
                        {sequels.length > 0 && (
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-2">La suite</span>
                                <div className="flex flex-col gap-2">
                                    {sequels.map((ref: any) => (
                                        <Link 
                                            key={ref.mal_id} 
                                            href={`/${ref.type}/${ref.mal_id}`} 
                                            className="group flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 transition"
                                        >
                                            <span className="text-indigo-400 text-xs">➡</span>
                                            <span className="text-xs text-indigo-200 group-hover:text-white font-medium line-clamp-1">{ref.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
             
             {/* Liens Externes */}
             <div className="flex flex-wrap gap-2">
                 {anime.external?.map((link: any, i: number) => (
                     <a key={`${link.name}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition">
                         {link.name}
                     </a>
                 ))}
             </div>
          </div>

          {/* --- COLONNE DROITE (Contenu Principal) reste identique --- */}
          <div className="lg:col-span-3 flex flex-col gap-8 pt-4 lg:pt-0">
                {/* ... (Tout le contenu Synopsis, Trailer, Staff, Musiques, Recommandations) ... */}
                
                {/* Je te remets le code de la colonne droite pour être sûr, mais rien ne change ici */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-indigo-500 rounded-full"></span>Synopsis</h2>
                    <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 text-gray-300 leading-relaxed text-base">
                        {anime.synopsis || "Aucun synopsis disponible."}
                    </div>
                    {anime.background && <div className="mt-4 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-200/80"><span className="font-bold block mb-1">Contexte :</span> {anime.background}</div>}
                </section>

                {anime.trailer?.embed_url && (
                <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-red-500 rounded-full"></span>Bande-annonce</h2>
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black">
                    <iframe src={anime.trailer.embed_url} className="w-full h-full" allowFullScreen title="Trailer" />
                    </div>
                </section>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5">
                        <h3 className="font-bold text-lg mb-4 text-indigo-300">Genres & Thèmes</h3>
                        <div className="flex flex-wrap gap-2">
                            {genres && genres.split(', ').map((g: string) => <span key={g} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">{g}</span>)}
                            {themes && themes.split(', ').map((t: string) => <span key={t} className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">{t}</span>)}
                        </div>
                    </div>
                    <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5">
                        <h3 className="font-bold text-lg mb-4 text-pink-300">Staff & Production</h3>
                        <div className="space-y-3">
                            {producers && <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Producteurs</span><p className="text-sm text-gray-300">{producers}</p></div>}
                            {anime.licensors && anime.licensors.length > 0 && <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Licencié par</span><p className="text-sm text-gray-300">{anime.licensors.map((l:any) => l.name).join(', ')}</p></div>}
                        </div>
                    </div>
                </div>

                {(anime.theme?.openings?.length > 0 || anime.theme?.endings?.length > 0) && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-green-500 rounded-full"></span>Musiques</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {anime.theme?.openings?.length > 0 && (
                                <div className="bg-[#1e293b]/30 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-bold text-green-400 uppercase mb-3">Openings 🎵</h4>
                                    <ul className="space-y-2 text-sm text-gray-400 list-disc pl-4 max-h-40 overflow-y-auto custom-scrollbar">
                                        {anime.theme.openings.map((op: string, i: number) => <li key={i}>{op}</li>)}
                                    </ul>
                                </div>
                            )}
                            {anime.theme?.endings?.length > 0 && (
                                <div className="bg-[#1e293b]/30 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase mb-3">Endings 🌙</h4>
                                    <ul className="space-y-2 text-sm text-gray-400 list-disc pl-4 max-h-40 overflow-y-auto custom-scrollbar">
                                        {anime.theme.endings.map((ed: string, i: number) => <li key={i}>{ed}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {recommendations.length > 0 && (
                    <section className="mt-8 border-t border-white/10 pt-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><span className="w-1 h-6 bg-orange-500 rounded-full"></span>Vous aimerez aussi</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {recommendations.map((rec: any) => <AnimeCard key={rec.mal_id} anime={rec} type="anime" user={user} />)}
                        </div>
                    </section>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}