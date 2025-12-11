"use client";
import { useState, useEffect } from "react"; // Ajout de useEffect
import { createClient } from "../lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "self";

interface FriendButtonProps {
  friendId: string;
  initialStatus: FriendStatus; // 👈 Le parent nous donne l'info directement
  onUpdate?: () => void;
}

export default function FriendButton({ friendId, initialStatus, onUpdate }: FriendButtonProps) {
  // On initialise l'état avec ce que le parent nous donne
  const [status, setStatus] = useState<FriendStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // 👇 MAGIE : Si le parent change l'info (après un clic ailleurs), on se met à jour !
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleAction = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Connecte-toi !"); return; }
    
    setLoading(true);

    try {
      if (status === "none") {
        const { error } = await supabase.from("friends").insert({ user_id: user.id, friend_id: friendId, status: "pending" });
        if (error) throw error;
        toast.success("Demande envoyée !");
      } 
      else if (status === "pending_received") {
        const { error } = await supabase.from("friends").update({ status: "accepted" }).eq("user_id", friendId).eq("friend_id", user.id);
        if (error) throw error;
        toast.success("Demande acceptée !");
      } 
      else if (status === "accepted" || status === "pending_sent") {
        const { error } = await supabase.from("friends").delete().or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
        if (error) throw error;
        toast.info(status === "accepted" ? "Ami retiré" : "Annulé");
      }

      // On prévient le parent de tout recharger
      if (onUpdate) onUpdate();
      router.refresh();

    } catch (error: any) {
      toast.error(error.message);
      // En cas d'erreur, on remet l'ancien statut visuel (optionnel mais propre)
      setStatus(initialStatus); 
    } finally {
      setLoading(false);
    }
  };

  if (status === "self") return null;

  if (loading) return <button disabled className="px-4 py-2 rounded-full font-bold text-sm bg-slate-800 text-slate-500">...</button>;

  if (status === "accepted") {
    return (
      <button onClick={handleAction} className="px-4 py-2 rounded-full font-bold text-sm bg-slate-700 text-gray-300 border border-gray-600 hover:bg-red-900/80 hover:text-white transition group flex-shrink-0">
        <span className="group-hover:hidden">Ami ✔</span>
        <span className="hidden group-hover:inline">Retirer</span>
      </button>
    );
  }
  if (status === "pending_sent") {
    return (
      <button onClick={handleAction} className="px-4 py-2 rounded-full font-bold text-sm bg-gray-800 text-gray-400 border border-gray-700 hover:bg-red-900/50 hover:text-white transition flex-shrink-0">
        En attente...
      </button>
    );
  }
  if (status === "pending_received") {
    return (
      <button onClick={handleAction} className="px-4 py-2 rounded-full font-bold text-sm bg-green-600 text-white hover:bg-green-700 shadow-lg animate-pulse transition flex-shrink-0">
        Accepter
      </button>
    );
  }
  return (
    <button onClick={handleAction} className="px-4 py-2 rounded-full font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition flex-shrink-0">
      Ajouter +
    </button>
  );
}