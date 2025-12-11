"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// 👇 On ajoute 'mediaType' ici (par défaut 'anime' si on précise pas)
export default function AddToListButton({ anime, mediaType = "anime" }: { anime: any, mediaType?: "anime" | "manga" }) {
  const [loading, setLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_list")
        .select("id")
        .eq("user_id", user.id)
        .eq("mal_id", anime.mal_id)
        .eq("media_type", mediaType) // 👈 On vérifie aussi le type !
        .single();

      if (data) setIsAdded(true);
      setLoading(false);
    };
    checkStatus();
  }, [anime.mal_id, mediaType, supabase]);

  const handleToggle = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Connecte-toi pour créer ta liste !", {
          action: { label: "Se connecter", onClick: () => router.push("/auth") }
      });
      setLoading(false);
      return;
    }

    if (isAdded) {
      // SUPPRESSION
      const { error } = await supabase
        .from("user_list")
        .delete()
        .eq("user_id", user.id)
        .eq("mal_id", anime.mal_id)
        .eq("media_type", mediaType); // 👈 Important

      if (!error) {
    setIsAdded(false);
    toast.info("Retiré de ta liste");
}
    } else {
      // AJOUT
      const { error } = await supabase.from("user_list").upsert({
        user_id: user.id,
        mal_id: anime.mal_id,
        title: anime.title,
        image_url: anime.images?.jpg?.large_image_url,
        status: "plan_to_watch",
        score: 0,
        media_type: mediaType // 👈 On sauvegarde le type dans la base
      }, { onConflict: 'user_id, mal_id, media_type' }); // 👈 Nouvelle contrainte

      if (!error) {
    setIsAdded(true);
    toast.success(`Ajouté à ta liste ${mediaType} !`); // Message stylé
}
    }
    setLoading(false);
    router.refresh();
  };

  if (loading) return <button className="mt-4 w-full bg-gray-800 p-3 rounded-lg animate-pulse">...</button>;

  return (
    <button
      onClick={handleToggle}
      className={`mt-4 w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transform active:scale-95 transition ${
        isAdded ? "bg-red-500/10 text-red-400 border border-red-500/50" : "bg-purple-600 text-white"
      }`}
    >
      {isAdded ? "Retirer de ma liste" : "Ajouter à ma liste"}
    </button>
  );
}