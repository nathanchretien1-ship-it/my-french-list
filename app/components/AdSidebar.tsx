"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

export default function AdSidebar({ side = "right" }: { side?: "left" | "right" }) {
  const [isHidden, setIsHidden] = useState(true);
  const supabase = createClient();

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

  // Initialisation de la pub une fois le composant monté
  useEffect(() => {
    if (!isHidden) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [isHidden]);

  if (isHidden) return null;

  return (
    <aside className={`hidden ${side === 'left' ? '2xl:block' : 'xl:block'} w-[240px] flex-shrink-0 space-y-4 sticky top-24`}>
      <div className="text-center text-[10px] text-gray-400 uppercase mb-2">Publicité</div>
      
      {/* Conteneur AdSense */}
      <div className="overflow-hidden flex justify-center bg-gray-50/5 rounded-lg border border-white/5">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '240px', height: '600px' }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // 👈 TON ID ICI
             data-ad-slot="XXXXXXXXXX"               // 👈 TON ID DE BLOC ICI
             data-ad-format="vertical"
             data-full-width-responsive="false">
        </ins>
      </div>
    </aside>
  );
}