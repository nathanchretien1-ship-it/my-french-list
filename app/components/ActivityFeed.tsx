"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Activity {
  id: string;
  user_id: string;
  media_id: number;
  media_type: string;
  media_title: string;
  media_image: string;
  action_type: string;
  rating?: number;
  created_at: string;
  profiles?: { username: string; avatar_url: string }; // Join
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchActivities();

    // Abonnement Temps Réel
    const channel = supabase.channel('public:activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, 
      (payload) => {
          // Pour faire simple, on recharge tout pour avoir les infos profil jointes
          fetchActivities(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchActivities() {
    // Récupère les 10 dernières activités avec les infos de l'utilisateur
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setActivities(data as any);
  }

  // Helper pour le texte de l'action
  const getActionText = (act: Activity) => {
      switch(act.action_type) {
          case 'add_plan': return act.media_type === 'anime' ? "veut voir" : "veut lire";
          case 'add_completed': return act.media_type === 'anime' ? "a regardé" : "a lu";
          case 'rated': return `a noté ${act.rating}/10`;
          default: return "a interagi avec";
      }
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📡 Activité de la communauté
        </h3>
        <div className="space-y-4">
            {activities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">C'est calme... trop calme.</p>
            ) : (
                activities.map((act) => (
                    <div key={act.id} className="flex gap-3 items-start border-b border-white/5 pb-3 last:border-0 last:pb-0 animate-in fade-in slide-in-from-left-2">
                        {/* Avatar */}
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10">
                            {act.profiles?.avatar_url ? (
                                <Image src={act.profiles.avatar_url.startsWith('http') ? act.profiles.avatar_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${act.profiles.avatar_url}`} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">{act.profiles?.username?.[0] || "?"}</div>
                            )}
                        </div>
                        
                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300">
                                <span className="font-bold text-white hover:underline cursor-pointer">
                                    {act.profiles?.username || "Inconnu"}
                                </span>
                                <span className="mx-1 text-gray-500">{getActionText(act)}</span>
                                <Link href={`/${act.media_type}/${act.media_id}`} className="font-medium text-indigo-400 hover:text-indigo-300 truncate transition">
                                    {act.media_title}
                                </Link>
                            </p>
                            <span className="text-[10px] text-gray-600">
                                {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: fr })}
                            </span>
                        </div>

                        {/* Image Média (Miniature) */}
                        {act.media_image && (
                            <Link href={`/${act.media_type}/${act.media_id}`} className="relative w-8 h-10 rounded overflow-hidden flex-shrink-0 border border-white/10 hover:border-white/30 transition">
                                <Image src={act.media_image} alt={act.media_title} fill className="object-cover" unoptimized />
                            </Link>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
  );
}