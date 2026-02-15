"use client";

import { useEffect, useState, useCallback, use } from "react";
import { createClient } from "../../lib/supabase";
import Image from "next/image";
import Link from "next/link";
import FriendButton from "../../components/FriendButton"; 
import AnimeCard from "../../components/AnimeCard";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "self";

interface PublicProfileProps {
  params: Promise<{ username: string }>;
}

export default function PublicProfile({ params }: PublicProfileProps) {
  const { username } = use(params);
  const decodedUsername = decodeURIComponent(username);

  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  
  // 💥 NOUVEAU : État pour stocker l'affinité
  const [affinity, setAffinity] = useState<{ rate: number, common: number } | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", decodedUsername)
      .single();

    if (!userProfile) { setLoading(false); return; }
    setProfile(userProfile);

    // Statut Amitié
    if (currentUser) {
      if (currentUser.id === userProfile.id) setFriendStatus("self");
      else {
        const { data: relation } = await supabase
          .from("friends")
          .select("*")
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userProfile.id}),and(user_id.eq.${userProfile.id},friend_id.eq.${currentUser.id})`)
          .maybeSingle();

        if (!relation) setFriendStatus("none");
        else if (relation.status === "accepted") setFriendStatus("accepted");
        else setFriendStatus(relation.user_id === currentUser.id ? "pending_sent" : "pending_received");
      }
    }

    // Récupérer SA liste (la cible)
    const { data: theirList } = await supabase
      .from("library") // Assure-toi que c'est bien la table "library" (tu avais "user_list" dans ton ancien code, mais on utilise "library" partout ailleurs)
      .select("*")
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false });

    const targetList = theirList || [];
    setItems(targetList);

    // 💥 CALCUL DE L'AFFINITÉ (Si on est connecté et qu'on ne regarde pas notre propre profil)
    if (currentUser && currentUser.id !== userProfile.id) {
        // On récupère NOTRE liste
        const { data: myList } = await supabase.from("library").select("jikan_id, type, score").eq("user_id", currentUser.id);
        
        if (myList && targetList.length > 0 && myList.length > 0) {
            let commonCount = 0;
            let totalDiff = 0;
            let scoredCommonCount = 0;

            targetList.forEach(theirItem => {
                const myItem = myList.find(m => m.jikan_id === theirItem.jikan_id && m.type === theirItem.type);
                if (myItem) {
                    commonCount++; // Ils ont l'œuvre en commun
                    
                    // Si les DEUX ont noté l'œuvre
                    if (theirItem.score > 0 && myItem.score > 0) {
                        scoredCommonCount++;
                        // On calcule la différence de note (ex: il a mis 8, j'ai mis 6 = diff de 2)
                        totalDiff += Math.abs(theirItem.score - myItem.score);
                    }
                }
            });

            // S'ils ont au moins 3 œuvres notées en commun, on calcule un %.
            // Formule : Différence max possible par anime c'est 10. 
            // Taux = 100 - ((totalDiff / (scoredCommonCount * 10)) * 100)
            if (scoredCommonCount >= 3) {
                const maxDiff = scoredCommonCount * 10;
                const affinityScore = 100 - ((totalDiff / maxDiff) * 100);
                setAffinity({ rate: Math.round(affinityScore), common: commonCount });
            } else if (commonCount > 0) {
                // Pas assez de notes en commun, on affiche juste le nombre d'œuvres en commun
                setAffinity({ rate: 0, common: commonCount });
            }
        }
    }

    setLoading(false);
  }, [decodedUsername, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] text-white flex items-center justify-center">Chargement...</div>;
  if (!profile) return ( <div className="min-h-screen bg-[#0f111a] text-white flex flex-col items-center justify-center"><h1 className="text-4xl mb-4">😕</h1><p>Utilisateur <strong>{decodedUsername}</strong> introuvable.</p><Link href="/friends" className="text-purple-400 mt-4 hover:underline">Retourner à la recherche</Link></div> );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 pb-10">
      
      <div className="max-w-4xl mx-auto mb-10 bg-slate-900/50 p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-xl">
        
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-slate-700 flex-shrink-0 shadow-2xl">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`} alt={profile.username} fill className="object-cover" unoptimized />
          ) : (
            <div className="h-full w-full bg-purple-600 flex items-center justify-center text-3xl font-bold">{profile.username?.charAt(0).toUpperCase()}</div>
          )}
        </div>
        
        <div className="text-center md:text-left flex-1 w-full space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{profile.username}</h1>
            <FriendButton friendId={profile.id} initialStatus={friendStatus} onUpdate={fetchData} />
          </div>

          {/* 💥 AFFICHAGE DE L'AFFINITÉ */}
          {affinity && (
              <div className="flex items-center gap-4 justify-center md:justify-start bg-black/30 p-3 rounded-xl border border-white/5 inline-flex">
                  <div className="flex flex-col items-center pr-4 border-r border-white/10">
                      <span className="text-2xl font-black text-indigo-400">{affinity.common}</span>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">En commun</span>
                  </div>
                  <div className="flex flex-col items-center pl-2">
                      {affinity.rate > 0 ? (
                          <>
                              <span className={`text-2xl font-black ${affinity.rate > 80 ? 'text-green-400' : affinity.rate > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {affinity.rate}%
                              </span>
                              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Affinité</span>
                          </>
                      ) : (
                          <span className="text-xs text-gray-500 italic max-w-[120px] text-center leading-tight">Pas assez de notes pour l'affinité</span>
                      )}
                  </div>
              </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 border-l-4 border-indigo-500 pl-4">Collection de {profile.username}</h2>
        {items.length === 0 ? (
          <p className="text-gray-500 italic text-center py-20 bg-slate-900/20 rounded-2xl border border-white/5 border-dashed">La collection est vide pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {items.map((item) => (
              <div key={`${item.type}-${item.jikan_id}`} className="relative group">
                <AnimeCard 
                    anime={{ mal_id: item.jikan_id, title: item.title, images: { jpg: { large_image_url: item.image_url } }, score: item.score, status: item.status === 'completed' ? 'Terminé' : 'En cours' }} 
                    type={item.type as 'anime' | 'manga'} 
                />
                {item.score > 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold shadow-lg z-20">★ {item.score}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}