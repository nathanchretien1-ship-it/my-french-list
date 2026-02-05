"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import Image from "next/image";

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

  if (isHidden) return null;

  // --- CONFIGURATION DES PUBS ---
  const product = side === "left" ? {
    // PUB GAUCHE
    title: "Coffret One Piece",
    desc: "L'arc East Blue (Tomes 1-12).",
    image: "https://m.media-amazon.com/images/I/91JmC7o30LL._SL1500_.jpg", 
    link: "https://amzn.to/TON_LIEN_ONE_PIECE", // Ton lien affilié ici
    color: "bg-blue-600"
  } : {
    // PUB DROITE
    title: "Berserk Deluxe",
    desc: "Édition cuir grand format.",
    image: "https://m.media-amazon.com/images/I/81sF-YN1VVL._SL1500_.jpg",
    link: "https://amzn.to/TON_LIEN_BERSERK", // Ton lien affilié ici
    color: "bg-[#FF9900]"
  };

  return (
    // 👇 MODIFICATION : Largeur fixée à w-[240px] (plus fin)
    <aside className={`hidden ${side === 'left' ? '2xl:block' : 'xl:block'} w-[240px] flex-shrink-0 space-y-4 sticky top-24`}>
      
      {/* BLOC PRODUIT */}
      <div className="bg-white text-black rounded-lg overflow-hidden shadow-xl group border-2 border-white transition hover:scale-[1.02]">
        <div className="bg-gray-100 px-2 py-1 text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center border-b">
          {side === "left" ? "Coup de ❤️" : "Sponsorisé"}
        </div>

        <a href={product.link} target="_blank" rel="noopener noreferrer" className="block">
            {/* Image un peu moins haute pour aller avec la largeur réduite */}
            <div className="relative h-48 w-full bg-white p-3">
                <Image 
                    src={product.image} 
                    alt={product.title}
                    fill
                    className="object-contain group-hover:scale-110 transition duration-500"
                    unoptimized
                />
            </div>

            <div className="p-3 bg-gradient-to-b from-white to-gray-50">
                {/* Texte plus petit pour que ça rentre */}
                <h4 className="font-black text-sm leading-tight mb-1">{product.title}</h4>
                <p className="text-[10px] text-gray-600 mb-3 line-clamp-2 leading-snug">{product.desc}</p>
                
                <div className={`w-full ${product.color} text-white font-bold py-1.5 rounded text-center text-xs shadow-md hover:opacity-90 transition`}>
                    Voir le prix
                </div>
            </div>
        </a>
      </div>

      {/* BLOC BANNIÈRE CLASSIQUE (Uniquement à droite) */}
      {side === "right" && (
        <div className="w-full aspect-[240/400] bg-slate-800 border border-white/10 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <span className="text-2xl mb-2">📺</span>
            <p className="text-gray-500 text-[10px]">
                Publicité<br/>(AdSense / Crunchyroll)
            </p>
        </div>
      )}

    </aside>
  );
}