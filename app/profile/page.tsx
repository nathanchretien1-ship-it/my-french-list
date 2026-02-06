import { createClient } from "../lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AnimeCard from "../components/AnimeCard";
import AddToListButton from "../components/AddToListButton"; // Pour pouvoir retirer de la liste

export default async function ProfilePage() {
  const supabase = await createClient();

  // 1. Vérification Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // 2. Récupération Profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const pseudo = profile?.username || user.user_metadata?.full_name || "Otaku";
  
  // Avatar : Priorité Profile > Google > Défaut
  let avatarUrl = profile?.avatar_url;
  if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  } else if (!avatarUrl) {
      avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  }

  // 3. Récupération Bibliothèque Complète
  const { data: library } = await supabase
    .from("library")
    .select("*")
    .eq("user_id", user.id)
    .order('created_at', { ascending: false }); // Les plus récents en premier

  const items = library || [];

  // --- 📊 CALCUL DES STATS ---
  const totalItems = items.length;
  const animeCount = items.filter(i => i.type === 'anime').length;
  const mangaCount = items.filter(i => i.type === 'manga').length;
  const completedCount = items.filter(i => i.status === 'completed').length;
  const planCount = items.filter(i => i.status === 'plan_to_watch').length;
  
  // Note moyenne (on ne compte que ceux qui ont une note > 0)
  const ratedItems = items.filter(i => i.score > 0);
  const avgScore = ratedItems.length > 0 
      ? (ratedItems.reduce((acc, i) => acc + i.score, 0) / ratedItems.length).toFixed(1) 
      : "—";

  return (
    <div className="min-h-screen bg-[#0f111a] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* --- EN-TÊTE PROFIL --- */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-[#1e293b]/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl">
                {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white">
                        {pseudo[0].toUpperCase()}
                    </div>
                )}
            </div>
            <div className="text-center md:text-left space-y-2 flex-1">
                <h1 className="text-4xl font-black text-white">{pseudo}</h1>
                <p className="text-gray-400">Membre depuis {new Date(user.created_at).getFullYear()}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-500/30">
                        Otaku Confirmé
                    </span>
                    {totalItems > 50 && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-bold border border-yellow-500/30">
                            Collectionneur
                        </span>
                    )}
                </div>
            </div>
            
            {/* BOUTON DÉCONNEXION (Optionnel si déjà dans la navbar) */}
            <Link href="/auth/signout" className="bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 px-6 py-3 rounded-xl font-bold transition border border-white/10 hover:border-red-500/30">
                Se déconnecter
            </Link>
        </div>

        {/* --- 📊 STATISTIQUES --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 text-center">
                <div className="text-3xl font-black text-white mb-1">{totalItems}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dans la liste</div>
            </div>
            <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 text-center">
                <div className="text-3xl font-black text-green-400 mb-1">{completedCount}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Terminés</div>
            </div>
            <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 text-center">
                <div className="text-3xl font-black text-indigo-400 mb-1">{planCount}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">À voir / lire</div>
            </div>
            <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 text-center">
                <div className="text-3xl font-black text-yellow-400 mb-1">★ {avgScore}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Note Moyenne</div>
            </div>
        </div>

        {/* --- MA LISTE --- */}
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4">Ma Collection</h2>
            
            {items.length === 0 ? (
                <div className="text-center py-20 bg-[#1e293b]/20 rounded-2xl border border-white/5 border-dashed">
                    <p className="text-gray-400 text-lg">Ta liste est vide pour l'instant...</p>
                    <Link href="/" className="text-indigo-400 font-bold hover:underline mt-2 inline-block">
                        Découvrir des animes
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {items.map((item) => (
                        <div key={`${item.type}-${item.jikan_id}`} className="relative group">
                            {/* On reconstruit un objet "anime" compatible avec AnimeCard */}
                            <AnimeCard 
                                anime={{
                                    mal_id: item.jikan_id,
                                    title: item.title,
                                    images: { jpg: { large_image_url: item.image_url } },
                                    score: item.score > 0 ? item.score : null, // Affiche MA note perso si elle existe
                                    status: item.status === 'completed' ? 'Terminé' : 'À voir'
                                }} 
                                type={item.type as 'anime' | 'manga'} 
                                user={user}
                            />
                            
                            {/* Petit badge perso */}
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