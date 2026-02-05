"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

export default function AdSidebar({ side = "right" }: { side?: "left" | "right" }) {
  const [isHidden, setIsHidden] = useState(true);
  const supabase = createClient();

  // 1. Logique Premium
  useEffect(() => {
    const checkPremium = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("is_premium").eq("id", user.id).single();
        setIsHidden(data?.is_premium || false);
      } else {
        setIsHidden(false);
      }
    };
    checkPremium();
  }, [supabase]);

  // 2. Initialisation de la pub spécifique
  useEffect(() => {
    if (!isHidden) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [isHidden, side]); // On relance si le côté change

  if (isHidden) return null;

  // 3. Choix du Slot ID selon le côté
  const adSlot = side === "left" ? "7507047080" : "2250124623";

  return (
    <aside 
      key={side} // Important pour différencier les deux instances
      className={`hidden ${side === 'left' ? '2xl:block' : 'xl:block'} w-[240px] flex-shrink-0 sticky top-24`}
    >
      <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
        <div className="bg-gray-100/5 px-2 py-1 text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center border-b border-white/10">
          Publicité {side === "left" ? "1" : "2"}
        </div>
        
        <div className="p-2 min-h-[600px] flex items-center justify-center">
          <ins className="adsbygoogle"
               style={{ display: 'block', minWidth: '200px' }}
               data-ad-client="ca-pub-8276754611976179"
               data-ad-slot={adSlot}
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
        </div>
      </div>
    </aside>
  );
}