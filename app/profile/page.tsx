"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import UserBadge from "../components/UserBadge";

// --- CONFIG ---
const ENABLE_GACHA = false; // Mettre à true si tu réactives le Gacha

// Styles de bannières par défaut
const DEFAULT_BANNERS = [
  { id: 'basic_1', name: 'Bleu Nuit', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80', isPremium: false },
  { id: 'basic_2', name: 'Forêt Sombre', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80', isPremium: false },
  { id: 'basic_3', name: 'Gris Minimal', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', isPremium: false },
  { id: 'prem_1', name: 'Cyber City', url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=800&q=80', isPremium: true },
  { id: 'prem_2', name: 'Neon Vibes', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80', isPremium: true },
];

const PRESET_STATUSES = [
    { emoji: '👋', text: 'Nouveau ici', isPremium: false },
    { emoji: '😴', text: 'Absent', isPremium: false },
    { emoji: '💻', text: 'En train de coder', isPremium: false },
    { emoji: '🎮', text: 'En jeu', isPremium: false },
    { emoji: '🚀', text: 'En mission', isPremium: true },
    { emoji: '🔥', text: 'On fire', isPremium: true },
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
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  // Bibliothèque & Collections
  const [animeCount, setAnimeCount] = useState(0);
  const [library, setLibrary] = useState<any[]>([]); 
  const [collection, setCollection] = useState<any[]>([]); 
  
  // FILTRES
  const [typeFilter, setTypeFilter] = useState<'all' | 'anime' | 'manga'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'plan_to_watch' | 'completed'>('all');

  // UI States
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
          router.push('/auth');
          return;
      }
      setUser(user);

      // 1. Récupérer la bibliothèque
      const { data: libData, count: libCount } = await supabase
        .from('library')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setAnimeCount(libCount || 0);
      setLibrary(libData || []);

      // 2. Récupérer le Gacha (si activé)
      if (ENABLE_GACHA) {
          const { data: myCards } = await supabase.from('user_characters').select('*, characters(*)').eq('user_id', user.id);
          setCollection(myCards || []);
      }

      // 3. Récupérer le profil public
      const { data: fetchedData } = await supabase.from("profiles").select("*,is_admin").eq("id", user.id).maybeSingle();
      
      if (fetchedData) {
        setUsername(fetchedData.username || "");
        setOriginalUsername(fetchedData.username || "");
        setNameColor(fetchedData.name_color || "#ffffff");
        setIsPremium(fetchedData.is_premium || false);
        setRole(fetchedData.role || "member");
        setBio(fetchedData.bio || "");
        setStatusText(fetchedData.status_text || "");
        setStatusEmoji(fetchedData.status_emoji || "👋");
        setIsAdminUser(fetchedData.is_admin === true);

        if (fetchedData.avatar_url) {
            if (fetchedData.avatar_url.startsWith('http')) setAvatarUrl(fetchedData.avatar_url);
            else {
                const { data: img } = supabase.storage.from('avatars').getPublicUrl(fetchedData.avatar_url);
                setAvatarUrl(`${img.publicUrl}?t=${new Date().getTime()}`);
            }
        }
        if (fetchedData.banner_url) {
            if (fetchedData.banner_url.startsWith('http')) setBannerUrl(fetchedData.banner_url);
            else {
                const { data: img } = supabase.storage.from('banners').getPublicUrl(fetchedData.banner_url);
                setBannerUrl(`${img.publicUrl}?t=${new Date().getTime()}`);
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
      if (username.length < 3) return toast.error("Pseudo trop court");
      if (username === originalUsername) { setIsEditingUsername(false); return; }
      try {
          setIsCheckingUsername(true);
          const { data } = await supabase.from('profiles').select('id').eq('username', username).neq('id', user.id).maybeSingle();
          if (data) return toast.error("Pseudo déjà pris !");
          
          if (!window.confirm(`Confirmer le changement vers "${username}" ?`)) return;
          
          const { error } = await supabase.from('profiles').update({ username }).eq('id', user.id);
          if (error) throw error;
          
          toast.success("Pseudo mis à jour !");
          setOriginalUsername(username);
          setIsEditingUsername(false);
          router.refresh();
      } catch (e) { toast.error("Erreur lors de la mise à jour"); } finally { setIsCheckingUsername(false); }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const colorToSave = isPremium ? nameColor : '#ffffff';
      await supabase.from("profiles").upsert({
        id: user?.id as string,
        name_color: colorToSave,
        bio, status_text: statusText, status_emoji: statusEmoji, banner_url: bannerUrl,
        updated_at: new Date().toISOString(),
      });
      toast.success("Sauvegardé !");
      router.refresh(); 
    } catch { toast.error("Erreur"); } finally { setLoading(false); }
  }

  async function uploadCustomImage(event: any, bucket: 'avatars' | 'banners') {
    if (bucket === 'banners' && !isPremium) return toast.error("Réservé aux membres Premium !");
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${bucket === 'avatars' ? 'avatar' : 'banner'}_${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      if (bucket === 'avatars') {
          setAvatarUrl(publicUrl);
          await supabase.from('profiles').update({ avatar_url: fileName }).eq('id', user.id);
      } else {
          setBannerUrl(publicUrl); 
           await supabase.from('profiles').update({ banner_url: fileName }).eq('id', user.id);
      }
      toast.success("Image chargée !");
    } catch (e) { console.error(e); toast.error("Erreur upload"); } finally { setUploading(false); }
  }

  const selectDefaultBanner = (b: any) => {
    if (b.isPremium && !isPremium) return toast.error("Réservé aux VIP");
    setBannerUrl(b.url); setShowBannerSelector(false);
  };
  const selectPresetStatus = (p: any) => {
    if (p.isPremium && !isPremium) return toast.error("Réservé aux VIP");
    setStatusEmoji(p.emoji); setStatusText(p.text); setShowStatusSelector(false);
  };

  // --- LOGIQUE DE FILTRAGE ---
  const filteredLibrary = library.filter(item => {
      // 1. Filtre TYPE
      const itemType = item.type?.toLowerCase() || 'anime';
      if (typeFilter === 'anime' && (itemType === 'manga' || itemType === 'novel')) return false;
      if (typeFilter === 'manga' && itemType !== 'manga' && itemType !== 'novel') return false;

      // 2. Filtre STATUT
      if (statusFilter === 'plan_to_watch' && item.status !== 'plan_to_watch') return false;
      if (statusFilter === 'completed' && item.status !== 'completed') return false;

      return true;
  });

  if (loading) return <div className="pt-24 text-center text-white animate-pulse">Chargement du profil...</div>;

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* --- CARTE PROFIL PRINCIPALE --- */}
      <div className="w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group">
        
        {/* BANNIÈRE */}
        <div className="h-60 w-full bg-slate-800 relative group/banner">
            {bannerUrl ? <Image src={bannerUrl} alt="Bannière" fill className="object-cover" unoptimized priority /> : <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />}
            <button onClick={() => { setShowBannerSelector(!showBannerSelector); setShowStatusSelector(false); }} className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur border border-white/20 transition opacity-0 group-hover/banner:opacity-100 flex items-center gap-2 font-bold text-sm">📷 Modifier</button>
        </div>

        {/* SELECTEURS (Banner / Status) */}
        {showBannerSelector && (
            <div className="relative z-50 bg-slate-950 border-y border-white/10 p-6 animate-in slide-in-from-top-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className={`relative h-24 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer ${!isPremium && 'opacity-70'}`}>
                        <span className="text-xl">📤 Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadCustomImage(e, 'banners')} disabled={!isPremium || uploading} />
                    </label>
                    {DEFAULT_BANNERS.map((banner) => (
                        <div key={banner.id} onClick={() => selectDefaultBanner(banner)} className="relative h-24 rounded-lg overflow-hidden cursor-pointer border-2 hover:border-white transition">
                            <Image src={banner.url} alt={banner.name} fill className="object-cover" unoptimized />
                            {banner.isPremium && !isPremium && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-xl">🔒</span></div>}
                        </div>
                    ))}
                </div>
            </div>
        )}
        {showStatusSelector && (
            <div className="relative z-50 bg-slate-950 border-y border-white/10 p-6 animate-in slide-in-from-top-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PRESET_STATUSES.map((preset, idx) => (
                        <button key={idx} onClick={() => selectPresetStatus(preset)} className="group flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-slate-800 text-left">
                            <span className="text-2xl">{preset.emoji}</span>
                            <span className="text-sm font-medium text-gray-300">{preset.text}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="px-6 pb-6 relative">
            <div className={`flex justify-between items-end mb-4 transition-all duration-300 ease-in-out ${(showBannerSelector || showStatusSelector) ? 'mt-4' : '-mt-16'}`}>
                {/* AVATAR */}
                <div className="relative w-32 h-32 rounded-full border-[6px] border-slate-900 bg-slate-800 shadow-lg group/avatar">
                    {avatarUrl ? <Image src={avatarUrl} alt="Avatar" fill className="object-cover rounded-full" unoptimized priority /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-slate-600 rounded-full">{username?.[0]?.toUpperCase()}</div>}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 cursor-pointer rounded-full transition z-10"><span className="text-xs font-bold">EDIT</span><input type="file" className="hidden" accept="image/*" onChange={(e) => uploadCustomImage(e, 'avatars')} disabled={uploading} /></label>
                </div>
                <button onClick={updateProfile} className="mb-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition shadow-lg flex items-center gap-2"><span>💾</span> Enregistrer</button>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="mb-4">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: nameColor }}>{username || "Utilisateur"}</h1>
                    <div className="flex items-center gap-2 mt-2 text-gray-300">
                        <div onClick={() => { setShowStatusSelector(!showStatusSelector); setShowBannerSelector(false); }} className="text-sm bg-slate-700/50 hover:bg-slate-700 cursor-pointer px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 transition">
                            <span>{statusEmoji}</span><span>{statusText || "Définir un statut..."}</span>
                        </div>
                    </div>
                    <UserBadge role={role} isPremium={isPremium} animeCount={animeCount} isAdmin={isAdminUser}/>
                </div>
                
                <hr className="border-white/10 my-4" />

                {/* --- MA BIBLIOTHÈQUE --- */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase">
                            Ma Bibliothèque <span className="text-white">({filteredLibrary.length})</span>
                        </h3>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            {/* Filtre TYPE */}
                            <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10">
                                {(['all', 'anime', 'manga'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setTypeFilter(f)}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${typeFilter === f ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {f === 'all' ? 'Tout' : f}
                                    </button>
                                ))}
                            </div>

                            {/* Filtre STATUT */}
                            <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10">
                                <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${statusFilter === 'all' ? 'bg-slate-600 text-white' : 'text-gray-400 hover:text-white'}`}>Tout</button>
                                <button onClick={() => setStatusFilter('plan_to_watch')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${statusFilter === 'plan_to_watch' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>À voir</button>
                                <button onClick={() => setStatusFilter('completed')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>Terminé</button>
                            </div>
                        </div>
                    </div>
                    
                    {filteredLibrary.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {filteredLibrary.map((item: any) => {
                                const isManga = item.type?.toLowerCase() === 'manga' || item.type?.toLowerCase() === 'novel';
                                const targetLink = isManga ? `/manga/${item.jikan_id}` : `/anime/${item.jikan_id}`;
                                const icon = isManga ? '📖' : '📺';
                                const statusBadge = item.status === 'completed' ? '✓ Terminé' : '⏰ À voir';
                                const statusColor = item.status === 'completed' ? 'bg-green-600' : 'bg-indigo-600';

                                return (
                                    <Link href={targetLink} key={`${item.jikan_id}-${item.type}`} className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition shadow-lg bg-slate-900 block">
                                        {item.image_url ? (
                                            <Image src={item.image_url} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-500" unoptimized />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-gray-500">Pas d'image</div>
                                        )}
                                        
                                        {/* Badge Statut */}
                                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-bold text-white shadow-md ${statusColor}`}>
                                            {statusBadge}
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                                            <p className="text-xs font-bold text-white leading-tight line-clamp-2">{item.title}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] text-gray-400 capitalize">{item.type || 'Anime'}</span>
                                                <span className="text-xs">{icon}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-slate-900/30 flex flex-col items-center">
                            <p className="text-gray-500 text-sm mb-4">Aucun titre ne correspond à ces filtres.</p>
                            <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold transition text-sm">
                                + Explorer le catalogue
                            </Link>
                        </div>
                    )}
                </div>

                {ENABLE_GACHA && collection.length > 0 && (
                    <>
                        <hr className="border-white/10 my-4" />
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Collection Gacha</h3>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                {collection.map((item: any) => (
                                    <div key={item.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                        <Image src={item.characters.image_url} alt={item.characters.name} fill className="object-cover" unoptimized />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <hr className="border-white/10 my-4" />

                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">À PROPOS DE MOI</h3>
                    <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{bio || "Cet utilisateur n'a pas encore écrit de bio."}</div>
                </div>
            </div>
        </div>
      </div>

      {/* --- FORMULAIRES D'ÉDITION --- */}
      <div className="grid md:grid-cols-2 gap-6 opacity-90 hover:opacity-100 transition">
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
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded focus:outline-none focus:border-indigo-500" placeholder="Nouveau pseudo..." />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setIsEditingUsername(false); setUsername(originalUsername); }} className="text-gray-400 hover:text-white text-xs px-3 py-2">Annuler</button>
                            <button onClick={saveUsername} disabled={isCheckingUsername || username.length < 3 || username === originalUsername} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-bold transition">Vérifier</button>
                        </div>
                    </div>
                )}
            </div>
            <div>
                <div className="flex justify-between"><label className="block text-gray-400 text-xs mb-1 font-bold uppercase">Couleur</label>{!isPremium && <span className="text-[10px] text-yellow-500 font-bold">PREMIUM</span>}</div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <input type="color" value={nameColor} onChange={(e) => isPremium && setNameColor(e.target.value)} className={`h-10 w-16 bg-transparent rounded overflow-hidden ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} disabled={!isPremium} />
                        {!isPremium && <div className="absolute inset-0 flex items-center justify-center text-lg pointer-events-none">🔒</div>}
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-slate-900 border border-white/10 p-6 rounded-xl">
            <label className="block text-gray-400 text-xs mb-2 font-bold uppercase">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Racontez votre vie..." className="w-full h-40 bg-slate-950 border border-slate-700 text-white p-4 rounded resize-none focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
    </div>
  );
}