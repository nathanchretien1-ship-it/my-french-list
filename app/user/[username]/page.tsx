"use client";

import { useEffect, useState, useCallback, use } from "react";
import { createClient } from "../../lib/supabase";
import Image from "next/image";
import Link from "next/link";
import FriendButton from "../../components/FriendButton"; // Assure-toi que c'est le nouveau FriendButton "passif"
import AnimeCard from "../../components/AnimeCard";
import RankBadge from "../../components/RankBadge";

// On définit le type de statut
type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "self";

interface PublicProfileProps {
  params: Promise<{ username: string }>;
}

export default function PublicProfile({ params }: PublicProfileProps) {
  // Déballage des paramètres (Next.js 15)
  const { username } = use(params);
  const decodedUsername = decodeURIComponent(username);

  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👈 NOUVEAU : On stocke le statut d'amitié ici
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");

  const supabase = createClient();

  // Fonction de chargement des données (Utilisateur + Liste + Amitié)
  const fetchData = useCallback(async () => {
    // 1. Qui suis-je ?
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 2. Trouver le PROFIL CIBLE par son pseudo
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", decodedUsername)
      .single();

    if (!userProfile) {
      setLoading(false);
      return;
    }
    setProfile(userProfile);

    // 3. Calculer le STATUT D'AMITIÉ
    if (currentUser) {
      if (currentUser.id === userProfile.id) {
        setFriendStatus("self");
      } else {
        // On cherche une relation dans les deux sens
        const { data: relation } = await supabase
          .from("friends")
          .select("*")
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userProfile.id}),and(user_id.eq.${userProfile.id},friend_id.eq.${currentUser.id})`)
          .maybeSingle();

        if (!relation) {
          setFriendStatus("none");
        } else if (relation.status === "accepted") {
          setFriendStatus("accepted");
        } else if (relation.status === "pending") {
          // Si c'est moi l'expéditeur (user_id), c'est "envoyé"
          setFriendStatus(relation.user_id === currentUser.id ? "pending_sent" : "pending_received");
        }
      }
    }

    // 4. Récupérer sa LISTE (Anime/Manga)
    const { data: list } = await supabase
      .from("user_list")
      .select("*")
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false });

    if (list) {
      const formatted = list.map((item) => ({
        mal_id: item.mal_id,
        title: item.title,
        images: { jpg: { large_image_url: item.image_url } },
        score: item.score,
        status: item.status,
        media_type: item.media_type || "anime"
      }));
      setItems(formatted);
    }
    setLoading(false);
  }, [decodedUsername, supabase]);

  // Chargement initial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] text-white flex items-center justify-center">Chargement...</div>;
  
  if (!profile) return (
    <div className="min-h-screen bg-[#0f111a] text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl mb-4">😕</h1>
      <p>Utilisateur <strong>{decodedUsername}</strong> introuvable.</p>
      <Link href="/friends" className="text-purple-400 mt-4 hover:underline">Retourner à la recherche</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 pb-10">
      
      {/* HEADER PROFIL */}
      <div className="max-w-4xl mx-auto mb-10 bg-slate-900/50 p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-xl">
        
        {/* Avatar */}
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-slate-700 flex-shrink-0">
          {profile.avatar_url ? (
            <Image 
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`}
              alt={profile.username} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-purple-600 flex items-center justify-center text-3xl font-bold">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Infos */}
        <div className="text-center md:text-left flex-1 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {profile.username}
            </h1>
            
            <RankBadge count={items.length} admin={profile.is_admin} />
            
            {/* 👇 LE BOUTON EST MAINTENANT CORRECTEMENT CONFIGURÉ */}
            <FriendButton 
              friendId={profile.id} 
              initialStatus={friendStatus} 
              onUpdate={fetchData} // Recharge la page si on clique (ex: Accepter)
            />
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
            <p className="text-gray-300 italic whitespace-pre-wrap">
              {profile.bio || "Cet utilisateur préfère garder le mystère..."}
            </p>
          </div>
        </div>
      </div>

      {/* COLLECTION */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
          <span className="text-purple-400">📚</span> Collection de {profile.username}
        </h2>
        
        {items.length === 0 ? (
          <p className="text-gray-500 italic text-center py-10">La collection est vide pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {items.map((item) => (
              <div key={`${item.media_type}-${item.mal_id}`} className="relative group">
                <Link href={`/${item.media_type}/${item.mal_id}`}>
                   <AnimeCard anime={item} type={item.media_type} />
                </Link>
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                  {item.media_type === "manga" ? "MANGA" : "ANIME"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}