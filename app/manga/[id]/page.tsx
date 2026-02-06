import { getMangaById } from "../../lib/api";
import Image from "next/image";
import AddToListButton from "../../components/AddToListButton";
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

  const authors = manga.authors?.map((a: any) => a.name).join(", ");
  const serializations = manga.serializations?.map((s: any) => s.name).join(", ");
  const genres = manga.genres?.map((g: any) => g.name).join(", ");
  const themes = manga.themes?.map((t: any) => t.name).join(", ");

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-20">
      
      {/* --- HEADER BANNER --- */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 opacity-40 blur-xl scale-110">
           {manga.images?.jpg?.large_image_url && (
             <Image src={manga.images.jpg.large_image_url} alt="Bg" fill className="object-cover" loading="lazy" unoptimized />
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
                 <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Rang</span>
                     <span className="text-2xl font-bold text-white">#{manga.rank || "N/A"}</span>
                 </div>
                 <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <span className="text-xs text-gray-400 uppercase font-bold">Popularité</span>
                     <span className="text-2xl font-bold text-white">#{manga.popularity || "N/A"}</span>
                 </div>
             </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-16 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* --- GAUCHE --- */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border-4 border-[#1e293b] bg-gray-800">
              {manga.images?.jpg?.large_image_url && (
                <Image src={manga.images.jpg.large_image_url} alt={manga.title} fill className="object-cover" loading="lazy" unoptimized />
              )}
            </div>
            
            {user ? (
                <AddToListButton anime={manga} mediaType="manga" userId={user.id} compact={false} />
            ) : (
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/10 text-sm text-gray-400">
                    Connectez-vous pour ajouter à votre liste
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

            {/* Liens externes */}
<div className="flex flex-wrap gap-2 mt-6">
     {manga.external?.map((link: any, i: number) => (
         <a 
            key={`${link.name}-${i}`} // ✅ Correction ici : Ajout de l'index
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition"
         >
             {link.name}
         </a>
     ))}
</div>
          </div>

          {/* --- DROITE --- */}
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

            {/* Auteurs Détails (Optionnel si tu veux plus de détails sur les auteurs) */}
             {manga.authors?.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4 text-white">Auteurs</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {manga.authors.map((author: any) => (
                            <a key={author.mal_id} href={author.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#1e293b]/50 p-3 rounded-lg border border-white/5 hover:bg-[#1e293b] transition">
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

          </div>
        </div>
      </div>
    </div>
  );
}