"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import UserBadge from "../components/UserBadge";

// --- 🚧 CONFIGURATION DE LA PRODUCTION 🚧 ---
// Mets 'true' le jour où tu veux réactiver le Gacha
const ENABLE_GACHA = false; 

// --- CONFIGURATION ---
const DEFAULT_BANNERS = [
  { id: 'basic_1', name: 'Bleu Nuit', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80', isPremium: false },
  { id: 'basic_2', name: 'Forêt Sombre', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80', isPremium: false },
  { id: 'basic_3', name: 'Gris Minimal', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', isPremium: false },
  { id: 'prem_1', name: 'Cyber City', url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=800&q=80', isPremium: true },
  { id: 'prem_2', name: 'Neon Vibes', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80', isPremium: true },
  { id: 'prem_3', name: 'Galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80', isPremium: true },
  { id: 'prem_4', name: 'Tokyo Rain', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', isPremium: true },
];

const PRESET_STATUSES = [
    { emoji: '👋', text: 'Nouveau ici', isPremium: false },
    { emoji: '😴', text: 'Absent', isPremium: false },
    { emoji: '💻', text: 'En train de coder', isPremium: false },
    { emoji: '🎮', text: 'En jeu', isPremium: false },
    { emoji: '🚀', text: 'En mission', isPremium: true },
    { emoji: '🦁', text: 'Roi de la jungle', isPremium: true },
    { emoji: '💎', text: 'Rich life', isPremium: true },
    { emoji: '🔥', text: 'On fire', isPremium: true },
    { emoji: '👾', text: 'Mode Gaming Ultimate', isPremium: true },
];

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Données Profil
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [nameColor, setNameColor] = useState("#ffffff");
  const [isPremium, setIsPremium] = useState(false);
  const [role, setRole] = useState("member");
  const [bio, setBio] = useState("");
  const [statusText, setStatusText] = useState("");
  const [statusEmoji, setStatusEmoji] = useState("👋");
  
  // Gacha Stats
  const [animeCount, setAnimeCount] = useState(0);
  const [collection, setCollection] = useState<any[]>([]);

  // États UI
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // 1. Compteur d'animes
      const { count: libCount } = await supabase
        .from('library')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setAnimeCount(libCount || 0);

      // 2. Collection Gacha (Seulement si activé, pour économiser la ressource)
      if (ENABLE_GACHA) {
          const { data: myCards } = await supabase
            .from('user_characters')
            .select('*, characters(*)')
            .eq('user_id', user.id);
          setCollection(myCards || []);
      }

      // 3. Profil
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (data) {
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
        setNameColor(data.name_color || "#ffffff");
        setIsPremium(data.is_premium || false);
        setRole(data.role || "member");
        setBio(data.bio || "");
        setStatusText(data.status_text || "");
        setStatusEmoji(data.status_emoji || "👋");

        if (data.avatar_url) {
            if (data.avatar_url.startsWith('http')) setAvatarUrl(data.avatar_url);
            else {
                const { data: img } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
                setAvatarUrl(img.publicUrl);
            }
        }
        
        if (data.banner_url) {
            if (data.banner_url.startsWith('http')) setBannerUrl(data.banner_url);
            else {
                const { data: img } = supabase.storage.from('banners').getPublicUrl(data.banner_url);
                setBannerUrl(img.publicUrl);
            }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveUsername() {
      if (username.length < 3) return toast.error("Le pseudo est trop court");
      if (username === originalUsername) {
          setIsEditingUsername(false);
          return;
      }
      try {
          setIsCheckingUsername(true);
          const { data: existingUser } = await supabase.from('profiles').select('id').eq('username', username).neq('id', user.id).maybeSingle();

          if (existingUser) {
              toast.error("Ce pseudo est déjà pris !");
              return;
          }

          if (!window.confirm(`Confirmer le changement vers "${username}" ?`)) return;

          const { error } = await supabase.from('profiles').update({ username }).eq('id', user.id);
          if (error) throw error;

          toast.success("Pseudo mis à jour !");
          setOriginalUsername(username);
          setIsEditingUsername(false);
          router.refresh();
      } catch (error) {
          toast.error("Erreur changement pseudo");
      } finally {
          setIsCheckingUsername(false);
      }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const colorToSave = isPremium ? nameColor : '#ffffff';
      const { error } = await supabase.from("profiles").upsert({
        id: user?.id as string,
        name_color: colorToSave,
        bio,
        status_text: statusText,
        status_emoji: statusEmoji,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Profil sauvegardé !");
      router.refresh(); 
    } catch (error) {
      toast.error("Erreur sauvegarde");
    } finally {
      setLoading(false);
    }
  }

  async function uploadCustomImage(event: any, bucket: 'avatars' | 'banners') {
    if (bucket === 'banners' && !isPremium) {
        toast.error("Réservé aux membres Premium !");
        return;
    }
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (bucket === 'avatars') {
          setAvatarUrl(data.publicUrl);
          await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', user.id);
      } else {
          setBannerUrl(data.publicUrl); 
      }
      toast.success("Image chargée !");
    } catch (error) {
      toast.error("Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  const selectDefaultBanner = (banner: any) => {
    if (banner.isPremium && !isPremium) return toast.error("Réservé aux VIP ⭐");
    setBannerUrl(banner.url);
    setShowBannerSelector(false);
  };

  const selectPresetStatus = (preset: any) => {
    if (preset.isPremium && !isPremium) return toast.error("Réservé aux VIP ⭐");
    setStatusEmoji(preset.emoji);
    setStatusText(preset.text);
    setShowStatusSelector(false);
  };

  if (loading) return <div className="pt-24 text-center text-white">Chargement...</div>;

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* --- CARTE PROFIL --- */}
      <div className="w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group">
        
        {/* BANNIÈRE */}
        <div className="h-60 w-full bg-slate-800 relative group/banner">
            {bannerUrl ? (
                <Image src={bannerUrl} alt="Bannière" fill className="object-cover" unoptimized priority />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />
            )}
            <button onClick={() => { setShowBannerSelector(!showBannerSelector); setShowStatusSelector(false); }} className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur border border-white/20 transition opacity-0 group-hover/banner:opacity-100 flex items-center gap-2 font-bold text-sm">
                📷 Modifier
            </button>
        </div>

        {/* TIROIR BANNIÈRE */}
        {showBannerSelector && (
            <div className="relative z-50 bg-slate-950 border-y border-white/10 p-6 animate-in slide-in-from-top-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold">Choisir une bannière</h3>
                    <button onClick={() => setShowBannerSelector(false)} className="text-gray-400 hover:text-white">❌</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className={`relative h-24 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-2 transition hover:bg-slate-800 cursor-pointer ${!isPremium && 'opacity-70'}`}>
                        <span className="text-2xl">📤</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Upload</span>
                        {!isPremium && <span className="absolute top-1 right-1 text-xs">🔒</span>}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadCustomImage(e, 'banners')} disabled={!isPremium || uploading} />
                    </label>
                    {DEFAULT_BANNERS.map((banner) => (
                        <div key={banner.id} onClick={() => selectDefaultBanner(banner)} className={`relative h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition hover:scale-105 ${bannerUrl === banner.url ? 'border-green-500' : 'border-transparent'} ${banner.isPremium && !isPremium ? 'border-yellow-500/50' : 'hover:border-white'}`}>
                            <Image src={banner.url} alt={banner.name} fill className="object-cover" unoptimized />
                            <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] p-1 text-center font-bold truncate">{banner.name}</div>
                            {banner.isPremium && !isPremium && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><span className="text-2xl drop-shadow-lg">🔒</span></div>}
                            {banner.isPremium && isPremium && <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[8px] px-1 rounded font-bold">VIP</div>}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TIROIR STATUT */}
        {showStatusSelector && (
            <div className="relative z-50 bg-slate-950 border-y border-white/10 p-6 animate-in slide-in-from-top-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold">Choisir un statut</h3>
                    <button onClick={() => setShowStatusSelector(false)} className="text-gray-400 hover:text-white">❌</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PRESET_STATUSES.map((preset, idx) => (
                        <button key={idx} onClick={() => selectPresetStatus(preset)} className={`group flex items-center gap-3 p-3 rounded-xl border transition text-left relative ${statusEmoji === preset.emoji && statusText === preset.text ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-900 border-white/10 hover:border-white/30'}`}>
                            <span className="text-2xl">{preset.emoji}</span>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate">{preset.text}</span>
                            {preset.isPremium && !isPremium && <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl backdrop-blur-[1px]"><span className="text-xl">🔒</span></div>}
                             {preset.isPremium && isPremium && <span className="absolute top-1 right-1 text-[8px] text-yellow-500 font-bold">VIP</span>}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* CONTENU PROFIL */}
        <div className="px-6 pb-6 relative">
            <div className={`flex justify-between items-end mb-4 transition-all duration-300 ease-in-out ${(showBannerSelector || showStatusSelector) ? 'mt-4' : '-mt-16'}`}>
                <div className="relative w-32 h-32 rounded-full border-[6px] border-slate-900 bg-slate-800 shadow-lg group/avatar">
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" fill className="object-cover rounded-full" unoptimized priority />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-slate-600 rounded-full">{username?.[0]?.toUpperCase()}</div>
                    )}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 cursor-pointer rounded-full transition z-10">
                        <span className="text-xs font-bold">EDIT</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadCustomImage(e, 'avatars')} disabled={uploading} />
                    </label>
                </div>
                <button onClick={updateProfile} className="mb-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition shadow-lg flex items-center gap-2">
                    <span>💾</span> Enregistrer
                </button>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="mb-4">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: nameColor }}>
                        {username || "Utilisateur"}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-gray-300">
                        <div onClick={() => { setShowStatusSelector(!showStatusSelector); setShowBannerSelector(false); }} className="text-sm bg-slate-700/50 hover:bg-slate-700 cursor-pointer px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 transition">
                            <span>{statusEmoji}</span>
                            <span>{statusText || "Définir un statut..."}</span>
                        </div>
                    </div>
                    <UserBadge role={role} isPremium={isPremium} animeCount={animeCount} />
                </div>
                
                <hr className="border-white/10 my-4" />
                
                {/* 👇👇👇 C'EST ICI QU'ON CACHE LE GACHA 👇👇👇 */}
                {ENABLE_GACHA && (
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center justify-between">
                            Ma Collection
                            <span className="text-white bg-indigo-600 px-2 py-0.5 rounded text-[10px]">{collection.length} cartes</span>
                        </h3>
                        {collection.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {collection.map((item: any) => (
                                    <div key={item.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 group hover:scale-105 transition shadow-lg bg-slate-950">
                                        <div className="absolute inset-0">
                                            <Image src={item.characters.image_url} alt={item.characters.name} fill className="object-cover" unoptimized />
                                        </div>
                                        <div className={`absolute inset-0 border-2 pointer-events-none z-10 ${item.characters.rarity === 'legendary' ? 'border-yellow-500/50' : item.characters.rarity === 'rare' ? 'border-blue-500/50' : 'border-transparent'}`}></div>
                                        <div className="absolute bottom-0 w-full bg-black/90 text-white text-[10px] py-1 text-center opacity-0 group-hover:opacity-100 transition z-20 font-bold truncate px-1">
                                            {item.characters.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-slate-900/30">
                                <p className="text-gray-500 text-sm mb-2">Ta collection est vide...</p>
                                <Link href="/gacha" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold underline">
                                    Tenter une invocation
                                </Link>
                            </div>
                        )}
                    </div>
                )}
                {/* 👆👆👆 FIN DE LA SECTION CACHÉE 👆👆👆 */}

                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">À PROPOS DE MOI</h3>
                    <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{bio || "Cet utilisateur n'a pas encore écrit de bio."}</div>
                </div>
            </div>
        </div>
      </div>

      {/* --- REGLAGES --- */}
      <div className="grid md:grid-cols-2 gap-6 opacity-90 hover:opacity-100 transition">
        {/* Identité */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Identité</h3>
            <div>
                <label className="block text-gray-400 text-xs mb-1 font-bold uppercase">Pseudo</label>
                {!isEditingUsername ? (
                    <div className="flex gap-2">
                        <div className="flex-1 bg-slate-950 border border-slate-800 text-gray-400 p-3 rounded cursor-not-allowed">{username}</div>
                        <button onClick={() => setIsEditingUsername(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded font-bold text-sm transition">Modifier</button>
                    </div>
                ) : (
                    <div className="space-y-2 animate-in fade-in">
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nouveau pseudo..." />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setIsEditingUsername(false); setUsername(originalUsername); }} className="text-gray-400 hover:text-white text-xs px-3 py-2">Annuler</button>
                            <button onClick={saveUsername} disabled={isCheckingUsername || username.length < 3 || username === originalUsername} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-bold transition">Vérifier</button>
                        </div>
                    </div>
                )}
            </div>
            {/* Couleur */}
            <div>
                <div className="flex justify-between">
                    <label className="block text-gray-400 text-xs mb-1 font-bold uppercase">Couleur</label>
                    {!isPremium && <span className="text-[10px] text-yellow-500 font-bold">PREMIUM</span>}
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <input type="color" value={nameColor} onChange={(e) => isPremium && setNameColor(e.target.value)} className={`h-10 w-16 bg-transparent rounded overflow-hidden ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} disabled={!isPremium} />
                        {!isPremium && <div className="absolute inset-0 flex items-center justify-center text-lg pointer-events-none">🔒</div>}
                    </div>
                </div>
            </div>
        </div>

        {/* Bio */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-xl">
            <label className="block text-gray-400 text-xs mb-2 font-bold uppercase">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Racontez votre vie..." className="w-full h-40 bg-slate-950 border border-slate-700 text-white p-4 rounded resize-none focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
    </div>
  );
}