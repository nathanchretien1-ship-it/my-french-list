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

  // Textes dynamiques
  const textPlan = mediaType === 'manga' ? "À lire plus tard" : "À regarder plus tard";
  const textCompleted = mediaType === 'manga' ? "Déjà lu" : "Déjà vu";
  const textMarkCompleted = mediaType === 'manga' ? "Marquer comme lu" : "Marquer comme vu";

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
    e.preventDefault(); e.stopPropagation();
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
        score: 0,
        type: mediaType
      }, { onConflict: 'user_id, jikan_id, type' });

      if (!error) {
        setStatus(newStatus);
        toast.success(newStatus === 'plan_to_watch' ? `Ajouté à '${textPlan}'` : `Marqué comme '${textCompleted}' !`);
      } else {
        toast.error("Erreur...");
      }
    }
    setLoading(false);
    router.refresh();
  };

  // --- RENDU COMPACT (Sur les cartes) ---
  if (compact) {
      return (
        <button
          onClick={(e) => handleUpdate(e, status ? null : 'plan_to_watch')} 
          disabled={loading}
          className={`shadow-xl rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 ${
            status === 'completed' ? "bg-green-600 text-white" :
            status === 'plan_to_watch' ? "bg-indigo-600 text-white" :
            "bg-white text-black hover:bg-gray-200"
          } ${loading ? "opacity-50" : "hover:scale-110"}`}
          title={status ? "Retirer" : textPlan}
        >
          {loading ? <span className="animate-spin text-xs">⌛</span> : 
           status === 'completed' ? <span>✓</span> :
           status === 'plan_to_watch' ? <span>👀</span> : 
           <span>➕</span>}
        </button>
      );
  }

  // --- RENDU COMPLET (Page détail) ---
  return (
    <div className="flex flex-col gap-2 w-full">
        <button
            onClick={(e) => handleUpdate(e, status === 'plan_to_watch' ? null : 'plan_to_watch')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition border ${
                status === 'plan_to_watch' 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                : "bg-indigo-900/30 border-indigo-500/30 text-indigo-200 hover:bg-indigo-900/50 hover:border-indigo-400"
            }`}
        >
            <span>{status === 'plan_to_watch' ? "Retirer de 'À voir'" : `⏰ ${textPlan}`}</span>
        </button>

        <button
            onClick={(e) => handleUpdate(e, status === 'completed' ? null : 'completed')}
            className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition border ${
                status === 'completed' 
                ? "bg-green-600 border-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.5)]" 
                : "bg-green-900/30 border-green-500/30 text-green-200 hover:bg-green-900/50 hover:border-green-400"
            }`}
        >
            <span>{status === 'completed' ? `✓ ${textCompleted} (Retirer)` : `✓ ${textMarkCompleted}`}</span>
        </button>
    </div>
  );
}