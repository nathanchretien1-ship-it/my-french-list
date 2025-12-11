"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import Image from "next/image";
import { toast } from "sonner";
import Confetti from "react-confetti";
import Link from "next/link";

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

export default function GachaPage() {
  const supabase = createClient();
  const { width, height } = useWindowSize();
  
  const [loading, setLoading] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Debug
  const [debugInfo, setDebugInfo] = useState<string>("Chargement...");

  useEffect(() => {
    checkDailyLimit();
  }, []);

  async function checkDailyLimit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setDebugInfo("Non connecté");
        return;
    }
    setUser(user);

    // 👇 ON RÉCUPÈRE 'is_admin' EN PLUS DE 'role'
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('last_daily_pull, role, is_admin') // <--- AJOUT ICI
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile) {
        setDebugInfo("Erreur profil ou profil vide");
        return;
    }

    // Mise à jour du debug pour que tu voies ce qui est récupéré
    setDebugInfo(`Role: ${profile.role} | Is_Admin: ${profile.is_admin}`);

    // 👇 LOGIQUE CORRIGÉE : On vérifie les deux cas possibles
    const hasAdminRole = profile.role === 'admin';
    const hasAdminBool = profile.is_admin === true; // Vérifie la case à cocher

    if (hasAdminRole || hasAdminBool) {
        setIsAdmin(true);
        setCanPull(true);
        return; 
    }

    // Logique normale (si pas admin)
    if (!profile.last_daily_pull) {
      setCanPull(true);
    } else {
      const lastDate = new Date(profile.last_daily_pull).toDateString();
      const today = new Date().toDateString();
      setCanPull(lastDate !== today);
    }
  }

  const handleSummon = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const rand = Math.random() * 100;
      let targetRarity = 'common';
      if (rand < 5) targetRarity = 'legendary'; 
      else if (rand < 30) targetRarity = 'rare'; 

      const { data: pool } = await supabase
        .from('characters')
        .select('*')
        .eq('rarity', targetRarity);

      if (!pool || pool.length === 0) throw new Error("Aucun perso trouvé");
      
      const randomChar = pool[Math.floor(Math.random() * pool.length)];

      await supabase.from('user_characters').insert({
        user_id: user.id,
        character_id: randomChar.id
      });

      await supabase.from('profiles').update({
        last_daily_pull: new Date().toISOString()
      }).eq('id', user.id);

      setReward(randomChar);
      
      // Si PAS admin, on bloque
      if (!isAdmin) setCanPull(false);
      
      toast.success(`Tu as obtenu ${randomChar.name} !`);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 flex flex-col items-center bg-slate-950">
      {reward && reward.rarity === 'legendary' && (
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
      )}

      {/* ZONE DE DEBUG */}
      <div className="bg-red-900/50 border border-red-500 p-4 rounded mb-8 text-xs font-mono text-red-200">
          <p className="font-bold border-b border-red-500 mb-2">DIAGNOSTIC</p>
          <p>{debugInfo}</p>
          <p>Admin Détecté : {isAdmin ? "OUI ✅" : "NON ❌"}</p>
      </div>

      <div className="mb-8 text-center">
        <Link href="/profile" className="text-gray-500 hover:text-white text-sm mb-4 inline-block">
            ← Retour au profil
        </Link>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Invocation Quotidienne
        </h1>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 rounded-xl border border-white/10 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
        {reward ? (
          <div className="animate-in zoom-in duration-500 flex flex-col items-center">
            <div className={`relative w-64 h-80 rounded-lg overflow-hidden border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] 
              ${reward.rarity === 'legendary' ? 'border-yellow-400 shadow-yellow-500/50' : 
                reward.rarity === 'rare' ? 'border-blue-400 shadow-blue-500/50' : 'border-slate-500'}
            `}>
               <Image src={reward.image_url} alt={reward.name} fill className="object-cover" unoptimized />
               <div className="absolute bottom-0 w-full bg-black/70 p-2 text-center">
                 <p className="text-white font-bold text-lg">{reward.name}</p>
                 <p className="text-xs text-gray-300 uppercase">{reward.rarity}</p>
               </div>
            </div>
            <p className="mt-6 text-white text-xl font-bold animate-bounce">
              {reward.rarity === 'legendary' ? '✨ LÉGENDAIRE ! ✨' : 'Nouveau compagnon !'}
            </p>
            {isAdmin && <button onClick={() => setReward(null)} className="mt-4 text-sm text-gray-400 underline">Rejouer (Admin)</button>}
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-400 mb-6">Tente ta chance !</p>
            <div className="text-6xl mb-4 animate-pulse">🔮</div>
          </div>
        )}
      </div>

      <div className="mt-8">
        {loading ? (
          <button disabled className="bg-slate-700 text-gray-400 px-8 py-3 rounded-full font-bold">
            ...
          </button>
        ) : canPull ? (
          <button 
            onClick={handleSummon}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition transform px-10 py-4 rounded-full font-black text-white text-xl shadow-[0_0_20px_rgba(129,140,248,0.5)]"
          >
            {isAdmin ? 'INVOQUER (∞ Admin)' : 'INVOQUER (Gratuit)'}
          </button>
        ) : (
          <div className="text-center">
            <button disabled className="bg-slate-800 border border-white/10 text-gray-500 px-8 py-3 rounded-full font-bold cursor-not-allowed">
              Reviens demain
            </button>
          </div>
        )}
      </div>
    </div>
  );
}