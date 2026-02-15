"use server";

import { createClient } from "./lib/supabase/server";

export async function submitReview(mediaId: number, mediaType: 'anime' | 'manga', content: string, score: number) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Auth Error:", authError);
        return { error: "Vous devez être connecté pour laisser une critique." };
    }
    
    if (!content.trim() || content.length < 10) return { error: "Ta critique est trop courte (minimum 10 caractères)." };
    if (score === 0) return { error: "Tu dois donner une note." };

    try {
        console.log("Tentative d'insertion review pour l'user:", user.id);
        
        // 1. Sauvegarde ou mise à jour de la Critique
        const { data: reviewData, error: reviewError } = await supabase.from('reviews').upsert({
            user_id: user.id,
            media_id: mediaId,
            media_type: mediaType,
            content: content.trim(),
            score: score,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, media_id, media_type' })
        .select(); // Le .select() est important pour forcer Supabase à renvoyer la ligne créée (ou l'erreur)

        if (reviewError) {
            console.error("Erreur critique venant de Supabase:", reviewError);
            throw reviewError;
        }

        console.log("Review insérée avec succès:", reviewData);

        // 2. Synchronisation de la note dans la Bibliothèque (library)
        const { data: libItem } = await supabase.from('library')
            .select('id')
            .eq('user_id', user.id)
            .eq('jikan_id', mediaId)
            .eq('type', mediaType)
            .maybeSingle();

        if (libItem) {
            await supabase.from('library')
                .update({ score: score })
                .eq('user_id', user.id)
                .eq('jikan_id', mediaId)
                .eq('type', mediaType);
        } else {
              await supabase.from('library').insert({
                user_id: user.id,
                jikan_id: mediaId,
                type: mediaType,
                score: score,
                status: 'completed',
                title: "Added via Review", 
                image_url: ""
            });
        }

        return { success: true };
    } catch (err: any) {
        console.error("ERREUR FINALE submitReview:", err);
        // On renvoie l'erreur détaillée au front-end pour la voir dans le toast
        return { error: `Erreur Supabase: ${err.message || err.details || "Inconnue"}` };
    }
}

export async function deleteReview(reviewId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', user.id);
    if (error) return { error: "Erreur lors de la suppression." };
    return { success: true };
}