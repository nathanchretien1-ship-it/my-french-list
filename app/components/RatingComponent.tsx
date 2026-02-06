"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { toast } from "sonner";

interface RatingProps {
  mediaId: number;
  mediaType: "anime" | "manga";
  mediaTitle: string;
  mediaImage: string;
  userId: string;
}

export default function RatingComponent({ mediaId, mediaType, mediaTitle, mediaImage, userId }: RatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    // Charger la note existante
    const fetchRating = async () => {
        const { data } = await supabase.from('library').select('score').eq('user_id', userId).eq('jikan_id', mediaId).maybeSingle();
        if (data?.score) setRating(data.score);
    };
    if(userId) fetchRating();
  }, [userId, mediaId, supabase]);

  const handleRate = async (score: number) => {
      if (!userId) return toast.error("Connecte-toi pour noter !");
      
      setRating(score);
      
      // 1. Sauvegarder dans Library
      const { error } = await supabase.from('library').upsert({
          user_id: userId,
          jikan_id: mediaId,
          type: mediaType,
          title: mediaTitle,
          image_url: mediaImage,
          score: score,
          // Si l'objet n'existe pas, on met un statut par défaut, sinon on garde l'existant (grâce au upsert partiel implicite si on omet status ? Non, il faut faire attention)
          // Mieux : On update juste le score si existe, sinon on insère tout.
      }, { onConflict: 'user_id, jikan_id, type' });

      if (error) {
          toast.error("Erreur sauvegarde note");
          return;
      }

      // 2. Ajouter dans Activity Feed
      await supabase.from('activities').insert({
          user_id: userId,
          media_id: mediaId,
          media_type: mediaType,
          media_title: mediaTitle,
          media_image: mediaImage,
          action_type: 'rated',
          rating: score
      });

      toast.success(`Noté ${score}/10 !`);
  };

  return (
    <div className="flex flex-col gap-2 bg-[#1e293b]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <span className="text-xs font-bold text-gray-400 uppercase">Ma Note</span>
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className={`text-lg transition-transform hover:scale-125 ${star <= (hover || rating) ? "text-yellow-400" : "text-gray-700"}`}
                    title={`${star}/10`}
                >
                    ★
                </button>
            ))}
        </div>
        <div className="text-right text-xs text-gray-500 font-mono h-4">
            {(hover || rating) > 0 ? `${hover || rating}/10` : 'Pas encore noté'}
        </div>
    </div>
  );
}