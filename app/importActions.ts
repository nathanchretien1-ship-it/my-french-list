"use server";

import { createClient } from "./lib/supabase/server";

export async function importFromMAL(malUsername: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Vous devez être connecté pour importer une liste." };
    if (!malUsername.trim()) return { error: "Veuillez entrer un pseudo MyAnimeList valide." };

    try {
        let allItems: any[] = [];
        let offset = 0;
        let hasMore = true;

        // On boucle par tranche de 300 animes (limite de l'API MyAnimeList)
        // On sécurise à 3000 animes max pour éviter que le serveur tourne à l'infini
        while (hasMore && offset < 3000) { 
            // 💥 NOUVELLE MÉTHODE : On interroge directement les serveurs de MyAnimeList !
            const response = await fetch(`https://myanimelist.net/animelist/${malUsername}/load.json?offset=${offset}&status=7`, {
                headers: {
                    // On se fait passer pour un navigateur normal pour ne pas être bloqué
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                cache: 'no-store'
            });

            if (response.status === 400 || response.status === 404) {
                if (offset === 0) return { error: "Utilisateur MAL introuvable ou liste privée." };
                break; // Si ça plante après la première page, on s'arrête juste là.
            }

            if (!response.ok) throw new Error(`Erreur MyAnimeList (Code ${response.status})`);

            const data = await response.json();
            
            // Si MyAnimeList renvoie un tableau vide, c'est qu'on a atteint la fin de la liste
            if (!Array.isArray(data) || data.length === 0) {
                hasMore = false;
            } else {
                allItems = allItems.concat(data);
                offset += 300; // On passe aux 300 suivants
                
                // Petite pause de sécurité (0.3s) pour ne pas se faire bannir par MAL
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        if (allItems.length === 0) return { error: "La liste trouvée est vide." };

        // 2. Formatage des données pour correspondre à notre table `library`
        const itemsToInsert = allItems.map((item: any) => {
            // Traduction des statuts MAL (1=Watching, 2=Completed, 3=OnHold, 4=Dropped, 6=PTW)
            let status = 'plan_to_watch'; 
            if (item.status === 1) status = 'watching'; 
            if (item.status === 2) status = 'completed'; 
            
            // Nettoyage de l'image (MAL donne des miniatures par défaut via ce lien)
            // On retire le "/r/96x136" de l'URL pour forcer l'image HD
            let imgUrl = item.anime_image_path || "";
            if (imgUrl.includes('/r/')) {
                imgUrl = imgUrl.replace(/\/r\/\d+x\d+/, '').split('?')[0];
            } else {
                imgUrl = imgUrl.split('?')[0];
            }

            return {
                user_id: user.id,
                jikan_id: item.anime_id,
                title: item.anime_title,
                image_url: imgUrl,
                status: status,
                score: item.score > 0 ? item.score : 0, 
                type: 'anime', 
                genres: null 
            };
        });

        // 3. Insertion en masse dans Supabase
        // On insère par paquets de 500 pour ne pas saturer TA base de données d'un coup
        const chunkSize = 500;
        for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
            const chunk = itemsToInsert.slice(i, i + chunkSize);
            const { error: dbError } = await supabase
                .from('library')
                .upsert(chunk, { onConflict: 'user_id, jikan_id, type' });
            
            if (dbError) throw dbError;
        }

        // 4. Ajouter l'activité sur le feed global
        await supabase.from('activities').insert({
            user_id: user.id,
            media_id: itemsToInsert[0].jikan_id, 
            media_type: 'anime',
            media_title: `sa liste MAL (${itemsToInsert.length} animes)`,
            media_image: itemsToInsert[0].image_url,
            action_type: 'imported_list'
        });

        return { success: true, count: itemsToInsert.length };

    } catch (error: any) {
        console.error("Erreur importFromMAL:", error);
        return { error: `Erreur d'importation : ${error.message || "Erreur serveur"}` };
    }
}