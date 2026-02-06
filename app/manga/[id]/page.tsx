import { getMangaById, getRecommendations } from "../../lib/api";
import Image from "next/image";
import Link from "next/link"; // ✅ Import Link ajouté
import AddToListButton from "../../components/AddToListButton";
import RatingComponent from "../../components/RatingComponent";
import AnimeCard from "../../components/AnimeCard"; 
import { createClient } from "../../lib/supabase/server"; 

const InfoRow = ({ label, value }: { label: string, value: string | number | null | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
            <span className="text-gray-400 text-sm font-medium">{label}</span>
            <span className="text-white text-sm text-right max-w-[60%]">{value}</span>
        </div>
    );
};

export default async function MangaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const manga = await getMangaById(id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!manga) return <div className="text-white text-center py-20">Manga introuvable...</div>;

  const genreIds = manga.genres?.map((g: any) => g.mal_id) || [];
  const recommendations = await getRecommendations(genreIds, 'manga', manga.mal_id);

  // --- 1. EXTRACTION DES RELATIONS ---
  const relations = manga.relations || [];
  const prequels = relations.find((r: any) => r.relation === 'Prequel')?.entry || [];
  const sequels = relations.find((r: any) => r.relation === 'Sequel')?.entry || [];
  // Tu peux aussi ajouter 'Adaptation' si tu veux voir l'anime lié au manga
  const adaptations = relations.find((r: any) => r.relation === 'Adaptation')?.entry || [];

  const authors = manga.authors?.map((a: any) => a.name).join(", ");
  const serializations = manga.serializations?.map((s: any) => s.name).join(", ");
  const genres = manga.genres?.map((g: any) => g.name).join(", ");
  const themes = manga.themes?.map((t: any) => t.name).join(", ");

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-20">
      
      {/* HEADER BANNER */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 opacity-40 blur-xl scale-110">
           {manga.images?.jpg?.large_image_url && (
             <Image src={manga.images.jpg.large_image_url} alt="Background" fill className="object-cover" loading="lazy" unoptimized />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 max-w-7xl mx-auto flex flex-col md:flex-row items-end md:items-center gap-6 z-10 pb-12 md:pb-24">
             <div className="flex-1">
                 <h1 className="text-4xl md:text-6xl font-black mb-2 text-white drop-shadow-lg leading-tight">
                    {manga.title}
                 </h1>
                 <p className="text-lg md:text-xl text-gray-300 italic font-light">{manga.title_japanese}</p>
             </div>
             
             <div className="flex gap-4">
                 <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Score</span>
                     <span className="text-2xl font-bold text-yellow-400">★ {manga.score || "N/A"}</span>
                     <span className="text-[10px] text-gray-500">{manga.scored_by?.toLocaleString()} votes</span>
                 </div>
                 <div className="hidden sm:flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Rang</span>
                     <span className="text-2xl font-bold text-white">#{manga.rank || "N/A"}</span>
                 </div>
                 <div className="hidden sm:flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Popularité</span>
                     <span className="text-2xl font-bold text-white">#{manga.popularity || "N/A"}</span>
                 </div>
             </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-16 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* --- COLONNE GAUCHE --- */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border-4 border-[#1e293b] bg-gray-800">
              {manga.images?.jpg?.large_image_url && (
                <Image src={manga.images.jpg.large_image_url} alt={manga.title} fill className="object-cover" loading="lazy" unoptimized />
              )}
            </div>
            
            {user ? (
                <div className="flex flex-col gap-4">
                    <AddToListButton anime={manga} mediaType="manga" userId={user.id} compact={false} />
                    <RatingComponent 
                        mediaId={manga.mal_id} 
                        mediaType="manga" 
                        mediaTitle={manga.title} 
                        mediaImage={manga.images?.jpg?.large_image_url} 
                        userId={user.id} 
                    />
                </div>
            ) : (
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/10 text-sm text-gray-400">
                    Connectez-vous pour gérer votre liste
                </div>
            )}

            <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-white/5 backdrop-blur-sm">
                <h3 className="text-white font-bold mb-4 uppercase text-sm border-b border-white/10 pb-2">Informations</h3>
                <div className="flex flex-col gap-1">
                    <InfoRow label="Type" value={manga.type} />
                    <InfoRow label="Volumes" value={manga.volumes || "?"} />
                    <InfoRow label="Chapitres" value={manga.chapters || "?"} />
                    <InfoRow label="Statut" value={manga.status} />
                    <InfoRow label="Publication" value={manga.published?.string} />
                    <InfoRow label="Auteurs" value={authors} />
                    <InfoRow label="Magazine" value={serializations} />
                    <InfoRow label="Membres" value={manga.members?.toLocaleString()} />
                    <InfoRow label="Favoris" value={manga.favorites?.toLocaleString()} />
                </div>
            </div>

            {/* --- 2. NOUVEAU BLOC : CHRONOLOGIE / RELATIONS --- */}
            {(prequels.length > 0 || sequels.length > 0 || adaptations.length > 0) && (
                <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-white font-bold mb-4 uppercase text-sm border-b border-white/10 pb-2 flex items-center gap-2">
                        <span>⏳</span> Univers
                    </h3>
                    <div className="flex flex-col gap-4">
                        
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

                        {/* BONUS : Adaptations Anime */}
                        {adaptations.length > 0 && (
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-2">Anime</span>
                                <div className="flex flex-col gap-2">
                                    {adaptations.map((ref: any) => (
                                        <Link 
                                            key={ref.mal_id} 
                                            href={`/anime/${ref.mal_id}`} 
                                            className="group flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 p-2 rounded-lg border border-pink-500/20 hover:border-pink-500/40 transition"
                                        >
                                            <span className="text-pink-400 text-xs">📺</span>
                                            <span className="text-xs text-pink-200 group-hover:text-white font-medium line-clamp-1">{ref.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                 {manga.external?.map((link: any, i: number) => (
                     <a key={`${link.name}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition">
                         {link.name}
                     </a>
                 ))}
             </div>
          </div>

          {/* --- COLONNE DROITE --- */}
          <div className="lg:col-span-3 flex flex-col gap-8 pt-4 lg:pt-0">
            
            <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>Synopsis
                </h2>
                <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 text-gray-300 leading-relaxed text-base">
                    {manga.synopsis || "Aucun synopsis disponible."}
                </div>
                {manga.background && (
                    <div className="mt-4 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-200/80">
                        <span className="font-bold block mb-1">Contexte :</span> {manga.background}
                    </div>
                )}
            </section>

            <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg mb-4 text-pink-300 flex items-center gap-2">
                    <span className="w-1 h-5 bg-pink-500 rounded-full"></span> Genres & Thèmes
                </h3>
                <div className="flex flex-wrap gap-2">
                    {genres && genres.split(', ').map((g: string) => <span key={g} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">{g}</span>)}
                    {themes && themes.split(', ').map((t: string) => <span key={t} className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">{t}</span>)}
                    {!genres && !themes && <span className="text-gray-500 text-sm">Non spécifié</span>}
                </div>
            </div>

            {/* Auteurs Détails */}
             {manga.authors?.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4 text-white">Auteurs</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {manga.authors.map((author: any, i: number) => (
                            <a key={`${author.mal_id}-${i}`} href={author.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#1e293b]/50 p-3 rounded-lg border border-white/5 hover:bg-[#1e293b] transition">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-400">
                                    {author.name[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{author.name}</p>
                                    <p className="text-xs text-gray-400">Auteur</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}

            {/* Recommandations */}
            {recommendations.length > 0 && (
                <section className="mt-8 border-t border-white/10 pt-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                        Lectures recommandées
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {recommendations.map((rec: any) => (
                            <AnimeCard key={rec.mal_id} anime={rec} type="manga" user={user} />
                        ))}
                    </div>
                </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}