"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { submitReview, deleteReview } from "../reviewActions"; 
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReviewSectionProps {
  mediaId: number;
  mediaType: "anime" | "manga";
  currentUserId?: string;
}

export default function ReviewSection({ mediaId, mediaType, currentUserId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const supabase = createClient();

  const fetchData = async () => {
    // 💥 On ajoute la capture d'erreur pour ne plus être aveugle !
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select('*, profiles(username, avatar_url)')
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Erreur de chargement des critiques:", error);
    }

    if (reviewsData) {
        setReviews(reviewsData);
    }
    
    if (currentUserId) {
        const myReview = reviewsData?.find(r => r.user_id === currentUserId);
        
        if (myReview) {
            // La critique existe ! On la met dans le formulaire pour la modifier
            setContent(myReview.content);
            setScore(myReview.score);
        } else {
            // Pas de critique, on cherche s'il y a juste une note
            const { data: libraryData } = await supabase
                .from('library')
                .select('score')
                .eq('user_id', currentUserId)
                .eq('jikan_id', mediaId)
                .eq('type', mediaType)
                .maybeSingle();
                
            if (libraryData && libraryData.score > 0) {
                setScore(libraryData.score);
            }
        }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [mediaId]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUserId) return toast.error("Connecte-toi pour donner ton avis !");
      if (score === 0) return toast.error("N'oublie pas de mettre une note sur 10 !");
      
      setSubmitting(true);
      const res = await submitReview(mediaId, mediaType, content, score);
      
      if (res.error) {
          toast.error(res.error);
      } else {
          toast.success("Critique enregistrée !");
          await fetchData(); // Recharge instantané !
      }
      setSubmitting(false);
  };

  const handleDelete = async (reviewId: string) => {
      if (!confirm("Voulez-vous vraiment supprimer votre critique ? (Votre note globale sera conservée)")) return;
      const res = await deleteReview(reviewId);
      if (res.success) {
          toast.info("Critique supprimée");
          setContent("");
          await fetchData();
      } else toast.error(res.error);
  };

  // On vérifie si l'utilisateur a une review pour adapter l'affichage du formulaire
  const userReview = reviews.find(r => r.user_id === currentUserId);

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Avis de la Communauté ({reviews.length})
        </h2>

        {/* --- FORMULAIRE DE CRITIQUE --- */}
        {currentUserId ? (
            <form onSubmit={handleSubmit} className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-8 shadow-inner">
                <h3 className="text-sm font-bold text-indigo-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    {userReview ? "✏️ Modifier ma critique" : "✍️ Écrire une critique"}
                </h3>
                
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400 font-bold">Ma Note :</span>
                        <div className="flex gap-1">
                            {[1,2,3,4,5,6,7,8,9,10].map(s => (
                                <button 
                                    key={s} type="button" onClick={() => setScore(s)}
                                    className={`text-xl transition-transform hover:scale-125 ${s <= score ? 'text-yellow-400' : 'text-gray-700'}`}
                                >★</button>
                            ))}
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{score > 0 ? `${score}/10` : ''}</span>
                    </div>
                </div>

                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Qu'as-tu pensé de cette œuvre ? (Scénario, animation, personnages...)"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none min-h-[120px] resize-none mb-4"
                />
                
                <div className="flex justify-end gap-3">
                    {userReview && (
                        <button type="button" onClick={() => handleDelete(userReview.id)} className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition">
                            Supprimer
                        </button>
                    )}
                    <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        {submitting ? "Publication..." : (userReview ? "Mettre à jour" : "Publier")}
                    </button>
                </div>
            </form>
        ) : (
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/5 mb-8 text-center text-sm text-gray-400">
                <Link href="/auth" className="text-indigo-400 font-bold hover:underline">Connecte-toi</Link> pour partager ton avis avec la communauté.
            </div>
        )}

        {/* --- LISTE DE TOUTES LES CRITIQUES (y compris la tienne) --- */}
        {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>
        ) : reviews.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">Aucun avis de la communauté pour le moment.</p>
        ) : (
            <div className="space-y-6">
                {reviews.map(review => {
                    const isMyReview = review.user_id === currentUserId;

                    return (
                        <div key={review.id} className={`p-5 rounded-xl border flex gap-4 ${isMyReview ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-[#1e293b]/40 border-white/5'}`}>
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                {review.profiles?.avatar_url ? (
                                    <Image src={review.profiles.avatar_url.startsWith('http') ? review.profiles.avatar_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${review.profiles.avatar_url}`} alt="Avatar" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full bg-slate-700 flex items-center justify-center font-bold text-white">
                                        {review.profiles?.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/user/${review.profiles?.username}`} className="font-bold text-white hover:text-indigo-300 transition">
                                                {review.profiles?.username || "Inconnu"}
                                            </Link>
                                            {isMyReview && (
                                                <span className="bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Mon Avis</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-500 block">
                                            il y a {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true, locale: fr })}
                                        </span>
                                    </div>
                                    <div className="bg-black/40 px-2 py-1 rounded-md text-yellow-400 font-bold text-sm border border-white/5 shadow-sm">
                                        ★ {review.score}/10
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{review.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
}