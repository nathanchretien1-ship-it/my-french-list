import { createClient } from "../lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AnimeCard from "../components/AnimeCard";
import ProfileStats from "../components/ProfileStats";
import AutoSyncGenres from "../components/AutoSyncGenres"; 
import AchievementsList from "../components/AchievementsList"; // ✅ Import des succès
import { getRank } from "../lib/ranks";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const pseudo = profile?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || "Otaku";
  
  let avatarUrl = profile?.avatar_url;
  if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  } else if (!avatarUrl) {
      avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  }

  const { data: library } = await supabase
    .from("library")
    .select("*")
    .eq("user_id", user.id)
    .order('created_at', { ascending: false });

  const items = library || [];

  const totalItems = items.length;
  const completedCount = items.filter(i => i.status === 'completed').length;
  const planCount = items.filter(i => i.status === 'plan_to_watch').length;
  const rank = getRank(totalItems, isAdmin);

  const ratedItems = items.filter(i => i.score > 0);
  const avgScore = ratedItems.length > 0 
      ? (ratedItems.reduce((acc, i) => acc + i.score, 0) / ratedItems.length).toFixed(1) 
      : "—";

  return (
    <div className="min-h-screen bg-[#0f111a] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <AutoSyncGenres items={items} userId={user.id} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm shadow-xl">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl">
                {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white">
                        {pseudo[0].toUpperCase()}
                    </div>
                )}
            </div>
            <div className="text-center md:text-left space-y-3 flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <h1 className="text-4xl font-black text-white">{pseudo}</h1>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${rank.color} shadow-lg`}>
                        <span>{rank.emoji}</span>
                        <span>{rank.title}</span>
                    </div>
                </div>
                <p className="text-gray-400 text-sm">Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex gap-3">
                <Link href="/profile/edit" className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold transition border border-white/10 text-sm">
                    Modifier
                </Link>
                <Link href="/auth/signout" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-5 py-2.5 rounded-xl font-bold transition border border-red-500/20 text-sm">
                    Déconnexion
                </Link>
            </div>
        </div>

        {/* --- NOUVELLE GRILLE : STATS + GRAPH + SUCCÈS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Colonne 1 : Les 4 blocs de chiffres */}
            <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
                    <div className="text-3xl font-black text-white mb-1">{totalItems}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</div>
                </div>
                <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
                    <div className="text-3xl font-black text-green-400 mb-1">{completedCount}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Terminés</div>
                </div>
                <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
                    <div className="text-3xl font-black text-indigo-400 mb-1">{planCount}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">À voir</div>
                </div>
                <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
                    <div className="text-3xl font-black text-yellow-400 mb-1">★ {avgScore}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Moyenne</div>
                </div>
            </div>
            
            {/* Colonne 2 : Le graphique */}
            <div className="lg:col-span-1 h-full">
                <ProfileStats items={items} />
            </div>

            {/* Colonne 3 & 4 : Les Succès */}
            <div className="lg:col-span-2 h-full">
                {/* 💥 Intégration du composant des succès */}
                <AchievementsList library={items} />
            </div>
        </div>

        {/* MA COLLECTION */}
        <div className="space-y-6 pt-4">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">Ma Collection</h2>
            {items.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-white/5 border-dashed">
                    <p className="text-gray-400">Ta bibliothèque est vide.</p>
                    <Link href="/" className="text-indigo-400 font-bold hover:underline mt-2 inline-block">Parcourir les animes</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {items.map((item) => (
                        <div key={`${item.type}-${item.jikan_id}`} className="relative group">
                            <AnimeCard 
                                anime={{
                                    mal_id: item.jikan_id,
                                    title: item.title,
                                    images: { jpg: { large_image_url: item.image_url } },
                                    score: item.score > 0 ? item.score : null,
                                    status: item.status === 'completed' ? 'Terminé' : 'En cours',
                                    genres: item.genres 
                                }} 
                                type={item.type as 'anime' | 'manga'}
                                user={user}
                            />
                            {item.score > 0 && (
                                <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-md shadow-lg z-20">
                                    Ma note: {item.score}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}