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
  // useRef empêche le useEffect de s'exécuter plusieurs fois (comportement strict mode React)
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // On cherche les éléments de la bibliothèque qui n'ont pas de genres
    const missing = items.filter(i => !i.genres);
    if (missing.length === 0) return; // Si tout est à jour, on ne fait rien

    const syncMissingGenres = async () => {
      const supabase = createClient();
      let updated = false;

      // On boucle sur les éléments manquants
      for (const item of missing) {
        try {
          // Pause de 500ms obligatoire pour ne pas se faire bloquer par l'API Jikan (rate limit)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const res = await fetch(`https://api.jikan.moe/v4/${item.type}/${item.jikan_id}`);
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

      // Si on a corrigé au moins un élément, on demande à Next.js de rafraîchir les données de la page 
      // (Cela mettra à jour le graphique sans recharger la page pour l'utilisateur)
      if (updated) {
        router.refresh();
      }
    };

    // Lancement de la tâche de fond
    syncMissingGenres();

  }, [items, userId, router]);

  // Ce composant ne retourne rien, il est 100% invisible sur la page
  return null;
}