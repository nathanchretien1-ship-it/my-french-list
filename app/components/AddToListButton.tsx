"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AddButtonProps {
    anime: any;
    mediaType?: "anime" | "manga";
    userId?: string;
    compact?: boolean; 
}

type ListStatus = "plan_to_watch" | "completed" | null;

export default function AddToListButton({ anime, mediaType = "anime", userId, compact = true }: AddButtonProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ListStatus>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const textPlan = mediaType === 'manga' ? "À lire" : "À voir";
  const textCompleted = mediaType === 'manga' ? "Lu" : "Vu";
  const textFullPlan = mediaType === 'manga' ? "À lire plus tard" : "À regarder plus tard";
  const textFullCompleted = mediaType === 'manga' ? "Déjà lu" : "Déjà vu";

  useEffect(() => {
    const checkStatus = async () => {
      let currentUserId = userId;
      if (!currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          currentUserId = user?.id;
      }
      
      if (!currentUserId) { setLoading(false); return; }

      const { data } = await supabase
        .from("library")
        .select("status")
        .eq("user_id", currentUserId)
        .eq("jikan_id", anime.mal_id)
        .eq("type", mediaType)
        .maybeSingle();

      if (data) setStatus(data.status as ListStatus);
      setLoading(false);
    };
    checkStatus();
  }, [anime.mal_id, mediaType, supabase, userId]);

  const handleUpdate = async (e: React.MouseEvent, newStatus: ListStatus) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setLoading(true);

    let currentUserId = userId;
    if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
    }

    if (!currentUserId) {
      toast.error("Connecte-toi d'abord !");
      setLoading(false);
      return;
    }

    if (newStatus === status) newStatus = null;

    if (newStatus === null) {
      // SUPPRESSION
      await supabase.from("library").delete().eq("user_id", currentUserId).eq("jikan_id", anime.mal_id).eq("type", mediaType);
      setStatus(null);
      toast.info("Retiré de ta liste");
    } else {
      // AJOUT / MODIFICATION
      const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
      const { error } = await supabase.from("library").upsert({
        user_id: currentUserId,
        jikan_id: anime.mal_id,
        title: anime.title,
        image_url: imageUrl,
        status: newStatus, 
        type: mediaType,
        genres: anime.genres // ✅ MODIFICATION: On enregistre les genres pour les Stats de Profil
      }, { onConflict: 'user_id, jikan_id, type' });

      if (!error) {
        setStatus(newStatus);
        const actionText = newStatus === 'plan_to_watch' ? textFullPlan : textFullCompleted;
        toast.success(`Ajouté à : ${actionText}`);
        
        if (newStatus) { 
            const action = newStatus === 'completed' ? 'add_completed' : 'add_plan';
            supabase.from('activities').insert({
                user_id: currentUserId,
                media_id: anime.mal_id,
                media_type: mediaType,
                media_title: anime.title,
                media_image: imageUrl,
                action_type: action
            }).then(({ error }) => {
                if (error) console.error("Erreur activité", error);
            });
        }
      } else {
        console.error("Erreur upsert library", error);
        toast.error("Erreur lors de la mise à jour (Vérifie que la colonne 'genres' existe en base de données)");
      }
    }
    setLoading(false);
    router.refresh();
  };

  // --- 1. RENDU COMPACT ---
  if (compact) {
      return (
        <div className="relative group/menu">
            <button
                className={`shadow-xl rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 border border-white/10 ${
                    status === 'completed' ? "bg-green-600 text-white" :
                    status === 'plan_to_watch' ? "bg-indigo-600 text-white" :
                    "bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
                } ${loading ? "opacity-50" : ""}`}
            >
                {loading ? <span className="animate-spin text-[10px]">⌛</span> : 
                status === 'completed' ? <span>✓</span> :
                status === 'plan_to_watch' ? <span>👀</span> : 
                <span>➕</span>}
            </button>

            <div className="absolute top-0 left-0 pt-10 hidden group-hover/menu:block z-50">
                <div className="flex flex-col gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-lg shadow-xl -ml-1">
                    <button onClick={(e) => handleUpdate(e, 'plan_to_watch')} className={`w-8 h-8 rounded-md flex items-center justify-center transition ${status === 'plan_to_watch' ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-indigo-600/50 text-gray-300'}`} title={textFullPlan}>
                        👀
                    </button>
                    <button onClick={(e) => handleUpdate(e, 'completed')} className={`w-8 h-8 rounded-md flex items-center justify-center transition ${status === 'completed' ? 'bg-green-600 text-white' : 'bg-white/5 hover:bg-green-600/50 text-gray-300'}`} title={textFullCompleted}>
                        ✓
                    </button>
                    {status && (
                        <button onClick={(e) => handleUpdate(e, null)} className="w-8 h-8 rounded-md flex items-center justify-center bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition mt-1 border border-red-500/20" title="Retirer de la liste">
                            🗑️
                        </button>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- 2. RENDU COMPLET ---
  return (
    <div className="flex flex-col gap-2 w-full">
        <button
            onClick={(e) => handleUpdate(e, status === 'plan_to_watch' ? null : 'plan_to_watch')}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition border ${
                status === 'plan_to_watch' 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                : "bg-indigo-900/30 border-indigo-500/30 text-indigo-200 hover:bg-indigo-900/50 hover:border-indigo-400"
            }`}
        >
            {loading ? <span className="animate-spin">⌛</span> : (<span>{status === 'plan_to_watch' ? "Retirer de 'À voir'" : `⏰ ${textFullPlan}`}</span>)}
        </button>

        <button
            onClick={(e) => handleUpdate(e, status === 'completed' ? null : 'completed')}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition border ${
                status === 'completed' 
                ? "bg-green-600 border-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.5)]" 
                : "bg-green-900/30 border-green-500/30 text-green-200 hover:bg-green-900/50 hover:border-green-400"
            }`}
        >
            {loading ? <span className="animate-spin">⌛</span> : (<span>{status === 'completed' ? `✓ ${textFullCompleted} (Retirer)` : `✓ Marquer comme ${textCompleted}`}</span>)}
        </button>
    </div>
  );
}