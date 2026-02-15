"use client";
import { useEffect, useState, useCallback } from "react";
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
  profiles?: { username: string; avatar_url: string };
}

interface ActivityFeedProps {
    onClose?: () => void;
    currentUserId?: string; // ✅ Ajouté pour savoir qui est connecté
}

export default function ActivityFeed({ onClose, currentUserId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<'all' | 'friends'>('all'); // ✅ État du filtre
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select(`*, profiles (username, avatar_url)`)
        .order('created_at', { ascending: false })
        .limit(30);

      // ✅ Logique du filtre "Amis"
      if (filter === 'friends' && currentUserId) {
        const { data: friends } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', currentUserId);
        
        const friendIds = friends?.map(f => f.friend_id) || [];
        // On affiche les activités des amis + ses propres activités
        query = query.in('user_id', [...friendIds, currentUserId]);
      }

      const { data } = await query;
      if (data) setActivities(data as any);
    } catch (error) {
      console.error("Erreur lors de la récupération des activités", error);
    } finally {
      setLoading(false);
    }
  }, [filter, currentUserId, supabase]);

  useEffect(() => {
    fetchActivities();
    const channel = supabase.channel('public:activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, 
      (payload) => fetchActivities())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchActivities, supabase]);

  const getActionText = (act: Activity) => {
      switch(act.action_type) {
          case 'add_plan': return act.media_type === 'anime' ? "veut voir" : "veut lire";
          case 'add_completed': return act.media_type === 'anime' ? "a vu" : "a lu";
          case 'rated': return `a mis ${act.rating}/10 à`;
          default: return "a update";
      }
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl flex flex-col h-[450px] shadow-lg backdrop-blur-sm overflow-hidden">
        
        {/* Header avec Filtres et Bouton Fermer */}
        <div className="p-3 border-b border-white/5 flex-shrink-0 bg-slate-900/80 flex justify-between items-center">
            <div className="flex gap-4 items-center">
                <button 
                    onClick={() => setFilter('all')}
                    className={`text-xs font-bold uppercase tracking-widest transition-colors ${filter === 'all' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    📡 Direct
                </button>
                {currentUserId && (
                    <button 
                        onClick={() => setFilter('friends')}
                        className={`text-xs font-bold uppercase tracking-widest transition-colors ${filter === 'friends' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        👥 Amis
                    </button>
                )}
            </div>

            {onClose && (
                <button 
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition p-1 rounded-md hover:bg-white/10"
                    title="Masquer le fil d'actualité"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
        
        <div className="overflow-y-auto p-2 space-y-3 custom-scrollbar flex-1">
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8 opacity-50"><p className="text-xs">Aucune activité trouvée.</p></div>
            ) : (
                activities.map((act) => (
                    <div key={act.id} className="flex gap-2 items-start pb-2 border-b border-white/5 last:border-0 last:pb-0 animate-in fade-in slide-in-from-left-1">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10 mt-0.5">
                            {act.profiles?.avatar_url ? (
                                <Image src={act.profiles.avatar_url.startsWith('http') ? act.profiles.avatar_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${act.profiles.avatar_url}`} alt="Avatar" fill className="object-cover" />
                            ) : ( <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white">{act.profiles?.username?.[0] || "?"}</div> )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-gray-400 leading-tight">
                                <span className="font-bold text-gray-200 hover:text-white cursor-pointer transition mr-1">{act.profiles?.username || "Inconnu"}</span>
                                <span>{getActionText(act)}</span>
                                <Link href={`/${act.media_type}/${act.media_id}`} className="font-bold text-indigo-400 hover:text-indigo-300 transition block mt-0.5 truncate">{act.media_title}</Link>
                            </div>
                            <span className="text-[9px] text-gray-600 block mt-0.5">{formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: fr })}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
}