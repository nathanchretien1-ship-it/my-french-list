"use client";
import { useEffect, useRef } from 'react';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface AutoSyncProps {
  items: any[];
  userId: string;
}

export default function AutoSyncGenres({ items, userId }: AutoSyncProps) {
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // On cherche les éléments de la bibliothèque qui n'ont pas de genres
    const missing = items.filter(i => !i.genres);
    if (missing.length === 0) return; // Si tout est à jour, on ne fait rien

    // 💥 CORRECTION : On ne traite que 5 animes par chargement de page !
    // Cela crée un effet "goutte à goutte" qui respecte l'API Jikan à la perfection.
    const batch = missing.slice(0, 5);

    const syncMissingGenres = async () => {
      const supabase = createClient();
      let updated = false;

      for (const item of batch) {
        try {
          // Pause de 1200ms obligatoire pour Jikan (Max 60 req/min, donc 1 par seconde)
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          const res = await fetch(`https://api.jikan.moe/v4/${item.type}/${item.jikan_id}`);
          
          // Si l'API nous dit STOP (429), on coupe la boucle proprement pour cette fois
          if (res.status === 429) {
              console.warn("Jikan Rate Limit atteint. La synchro reprendra à la prochaine visite.");
              break; 
          }

          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.genres) {
              // Mise à jour silencieuse dans Supabase
              await supabase.from('library')
                .update({ genres: json.data.genres })
                .eq('user_id', userId)
                .eq('jikan_id', item.jikan_id)
                .eq('type', item.type);
              
              updated = true;
            }
          }
        } catch (e) {
          console.error("Erreur lors de l'auto-sync silencieuse", e);
        }
      }

      // Si on a corrigé au moins un élément, on rafraîchit les graphiques de la page
      if (updated) {
        router.refresh();
      }
    };

    // Lancement de la tâche de fond
    syncMissingGenres();

  }, [items, userId, router]);

  return null;
}