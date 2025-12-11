"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import UserBadge from "../components/UserBadge";

// --- 🚧 CONFIG PROD 🚧 ---
const ENABLE_GACHA = false; 

// --- CONFIG VISUELLE ---
const DEFAULT_BANNERS = [
  { id: 'basic_1', name: 'Bleu Nuit', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80', isPremium: false },
  { id: 'basic_2', name: 'Forêt Sombre', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80', isPremium: false },
  { id: 'basic_3', name: 'Gris Minimal', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', isPremium: false },
  { id: 'prem_1', name: 'Cyber City', url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=800&q=80', isPremium: true },
  { id: 'prem_2', name: 'Neon Vibes', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80', isPremium: true },
  { id: 'prem_3', name: 'Galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80', isPremium: true },
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

  // Profil
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
  
  // Listes & Filtres
  const [animeCount, setAnimeCount] = useState(0);
  const [library, setLibrary] = useState<any[]>([]); 
  const [collection, setCollection] = useState<any[]>([]); // Gacha
  const [filter, setFilter] = useState<'all' | 'anime' | 'manga'>('all'); // <--- NOUVEAU FILTRE

  // UI
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

      // 1. Récupérer la Liste d'Animes/Mangas
      const { data: libData, count: libCount } = await supabase
        .from('library')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setAnimeCount(libCount || 0);
      setLibrary(libData || []);

      // 2. Collection Gacha
      if (ENABLE_GACHA) {
          const { data: myCards } = await supabase.from('user_characters').select('*, characters(*)').eq('user_id', user.id);
          setCollection(myCards || []);
      }

      // 3. Profil
      const { data } = await supabase.from("profiles").select("*,is_admin").eq("id", user.id).maybeSingle();
      if (data) {
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
        setNameColor(data.name_color || "#ffffff");
        setIsPremium(data.is_premium || false);
        setRole(data.role || "member");
        setBio(data.bio || "");
        setStatusText(data.status_text || "");
        setStatusEmoji(data.status_emoji || "👋");
        setIsAdminUser(data.is_admin === true);

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

  // --- Helpers ---
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
      } catch (e) { toast.error("Erreur"); } finally { setIsCheckingUsername(false); }
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
      const fileName = `${user.id}-${Math.random()}.${file.name.split(".").pop()}`;
      await supabase.storage.from(bucket).upload(fileName, file);
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      if (bucket === 'avatars') {
          setAvatarUrl(data.publicUrl);
          await supabase.from('profiles').update({ avatar_url: fileName }).eq('id', user.id);
      } else setBannerUrl(data.publicUrl); 
      toast.success("Image chargée !");
    } catch { toast.error("Erreur upload"); } finally { setUploading(false); }
  }

  const selectDefaultBanner = (b: any) => {
    if (b.isPremium && !isPremium) return toast.error("Réservé aux VIP");
    setBannerUrl(b.url); setShowBannerSelector(false);
  };
  const selectPresetStatus = (p: any) => {
    if (p.isPremium && !isPremium) return toast.error("Réservé aux VIP");
    setStatusEmoji(p.emoji); setStatusText(p.text); setShowStatusSelector(false);
  };

  // --- FILTRAGE DE LA LISTE ---
  const filteredLibrary = library.filter(item => {
      if (filter === 'all') return true;
      // On suppose que ta DB stocke 'anime' ou 'manga' dans une colonne 'type'
      // Jikan renvoie parfois 'TV', 'Movie', 'OVA' pour anime.
      // Si tu as normalisé en base c'est top, sinon on fait un check large :
      const itemType = item.type?.toLowerCase() || 'anime';
      if (filter === 'anime') return itemType !== 'manga' && itemType !== 'novel';
      if (filter === 'manga') return itemType === 'manga' || itemType === 'novel';
      return true;
  });

  if (loading) return <div className="pt-24 text-center text-white">Chargement...</div>;

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* --- CARTE PROFIL (Même code d'affichage qu'avant) --- */}
      <div className="w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group">
        <div className="h-60 w-full bg-slate-800 relative group/banner">
            {bannerUrl ? <Image src={bannerUrl} alt="Bannière" fill className="object-cover" unoptimized priority /> : <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />}
            <button onClick={() => { setShowBannerSelector(!showBannerSelector); setShowStatusSelector(false); }} className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur border border-white/20 transition opacity-0 group-hover/banner:opacity-100 flex items-center gap-2 font-bold text-sm">📷 Modifier</button>
        </div>

        {/* TIROIRS (Banner / Status) - Identique au code précédent, je garde pour la lisibilité */}
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
                            {preset.isPremium && !isPremium && <span className="ml-auto text-xs">🔒</span>}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="px-6 pb-6 relative">
            <div className={`flex justify-between items-end mb-4 transition-all duration-300 ease-in-out ${(showBannerSelector || showStatusSelector) ? 'mt-4' : '-mt-16'}`}>
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
                    {/*---test---*/}
                    <UserBadge role={role} isPremium={isPremium} animeCount={animeCount} isAdmin={isAdminUser}/>
                </div>
                
                <hr className="border-white/10 my-4" />

                {/* --- 👇 MA BIBLIOTHÈQUE AVEC FILTRES 👇 --- */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase">Ma Bibliothèque ({library.length})</h3>
                        {/* ONGLETS FILTRES */}
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10">
                            {(['all', 'anime', 'manga'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {f === 'all' ? 'Tout' : f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {filteredLibrary.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {filteredLibrary.map((item: any) => {
                                // Détection du type pour le lien et l'icône
                                const isManga = item.type?.toLowerCase() === 'manga' || item.type?.toLowerCase() === 'novel';
                                const targetLink = isManga ? `/manga/${item.id}` : `/anime/${item.id}`;
                                const icon = isManga ? '📖' : '📺';

                                return (
                                    <Link href={targetLink} key={item.id} className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition shadow-lg bg-slate-900 block">
                                        {item.image_url ? (
                                            <Image src={item.image_url} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-500" unoptimized />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-gray-500">Pas d'image</div>
                                        )}
                                        {/* Overlay Titre */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                                            <p className="text-xs font-bold text-white leading-tight line-clamp-2">{item.title}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] text-gray-400 capitalize">{item.type || 'Anime'}</span>
                                                <span className="text-xs">{icon}</span>
                                            </div>
                                        </div>
                                        {/* Statut (Badge en haut) */}
                                        {item.status && (
                                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/60 text-white backdrop-blur">
                                                {item.status}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-slate-900/30">
                            <p className="text-gray-500 text-sm mb-3">Aucun {filter === 'all' ? 'titre' : filter} trouvé.</p>
                            <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 hover:bg-indigo-500/20 transition">
                                + Explorer
                            </Link>
                        </div>
                    )}
                </div>

                {/* --- SECTION GACHA (Cachée si ENABLE_GACHA = false) --- */}
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

      {/* --- FORMULAIRES EDITION --- */}
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