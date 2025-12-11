"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddToListButton({ anime, mediaType = "anime" }: { anime: any, mediaType?: "anime" | "manga" }) {
  const [loading, setLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // 👇 CORRECTION : On lit dans 'library' avec les bonnes colonnes
      const { data } = await supabase
        .from("library")
        .select("id")
        .eq("user_id", user.id)
        .eq("jikan_id", anime.mal_id) // On map mal_id vers jikan_id
        .eq("type", mediaType)        // On map mediaType vers type
        .maybeSingle(); // Utilise maybeSingle pour éviter les erreurs 406

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
      // SUPPRESSION (Table library)
      const { error } = await supabase
        .from("library")
        .delete()
        .eq("user_id", user.id)
        .eq("jikan_id", anime.mal_id)
        .eq("type", mediaType);

      if (!error) {
        setIsAdded(false);
        toast.info("Retiré de ta bibliothèque");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } else {
      // AJOUT (Table library)
      // On sécurise l'image car Jikan change parfois de structure
      const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

      const { error } = await supabase.from("library").upsert({
        user_id: user.id,
        jikan_id: anime.mal_id, // Important : nom de colonne SQL
        title: anime.title,
        image_url: imageUrl,
        status: "plan_to_watch",
        score: 0,
        type: mediaType // Important : nom de colonne SQL
      }, 
      // La contrainte d'unicité définie dans le SQL précédent
      { onConflict: 'user_id, jikan_id, type' }); 

      if (!error) {
        setIsAdded(true);
        toast.success(`Ajouté à ta collection ${mediaType} !`);
      } else {
        console.error(error);
        toast.error("Erreur lors de l'ajout");
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
        isAdded ? "bg-red-500/10 text-red-400 border border-red-500/50" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
      }`}
    >
      {isAdded ? (
        <>
            <span>🗑️</span> Retirer de ma liste
        </>
      ) : (
        <>
            <span>➕</span> Ajouter à ma liste
        </>
      )}
    </button>
  );
}