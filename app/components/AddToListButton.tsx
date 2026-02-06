"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// On ajoute userId dans les props pour éviter de le refetcher 50 fois sur la page d'accueil
interface AddButtonProps {
    anime: any;
    mediaType?: "anime" | "manga";
    userId?: string;
}

export default function AddToListButton({ anime, mediaType = "anime", userId }: AddButtonProps) {
  const [loading, setLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      // Si on a déjà l'ID via les props (depuis Home), on l'utilise directement
      let currentUserId = userId;

      // Sinon, on le cherche (cas de la page détail)
      if (!currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          currentUserId = user?.id;
      }
      
      if (!currentUserId) { setLoading(false); return; }

      const { data } = await supabase
        .from("library")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("jikan_id", anime.mal_id)
        .eq("type", mediaType)
        .maybeSingle();

      if (data) setIsAdded(true);
      setLoading(false);
    };
    checkStatus();
  }, [anime.mal_id, mediaType, supabase, userId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche le clic de déclencher le lien de la carte parente
    e.stopPropagation();

    setLoading(true);
    
    // Récupération de l'user (prop ou fetch)
    let currentUserId = userId;
    if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
    }

    if (!currentUserId) {
      toast.error("Connecte-toi pour gérer ta liste !", {
          action: { label: "Connexion", onClick: () => router.push("/auth") }
      });
      setLoading(false);
      return;
    }

    if (isAdded) {
      // SUPPRESSION
      const { error } = await supabase
        .from("library")
        .delete()
        .eq("user_id", currentUserId)
        .eq("jikan_id", anime.mal_id)
        .eq("type", mediaType);

      if (!error) {
        setIsAdded(false);
        toast.info("Retiré de ta bibliothèque");
      } else {
        toast.error("Erreur suppression");
      }
    } else {
      // AJOUT
      const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

      const { error } = await supabase.from("library").upsert({
        user_id: currentUserId,
        jikan_id: anime.mal_id,
        title: anime.title,
        image_url: imageUrl,
        status: "plan_to_watch",
        score: 0,
        type: mediaType
      }, 
      { onConflict: 'user_id, jikan_id, type' }); 

      if (!error) {
        setIsAdded(true);
        toast.success(`Ajouté à ta liste !`);
      } else {
        toast.error("Erreur ajout");
      }
    }
    setLoading(false);
    router.refresh();
  };

  // Version "Mini" pour les cartes (juste l'icône)
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`shadow-xl rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 ${
        isAdded 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
      } ${loading ? "opacity-50 cursor-wait" : "hover:scale-110"}`}
      title={isAdded ? "Retirer" : "Ajouter"}
    >
      {loading ? (
          <span className="animate-spin text-xs">⌛</span>
      ) : isAdded ? (
          <span>🗑️</span> 
      ) : (
          <span>➕</span>
      )}
    </button>
  );
}