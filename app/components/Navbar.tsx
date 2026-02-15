"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SearchBar from "../components/SearchBar";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user: initialUser }: NavbarProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const fetchUnreadCount = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error("Erreur messages:", err);
    }
  }, [supabase]);

  const init = useCallback(async () => {
    if (!user) {
        setAvatarUrl(null);
        setPseudo("");
        setUnreadCount(0);
        return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      const username = profile?.username 
        || user.user_metadata?.full_name 
        || user.email?.split('@')[0] 
        || "Mon Profil";
      setPseudo(username);

      if (profile?.avatar_url) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
        setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`);
      } else if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
        setAvatarUrl(user.user_metadata.avatar_url || user.user_metadata.picture);
      } else {
        setAvatarUrl(null);
      }

      await fetchUnreadCount(user.id);
    } catch (error) {
      console.error("Erreur init navbar:", error);
    }
  }, [user, supabase, fetchUnreadCount]);

  useEffect(() => {
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        router.refresh();
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [user, supabase, router, init]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch("/auth/signout", { method: "POST" });
    setUser(null);
    setIsMenuOpen(false);
    toast.info("À bientôt !");
    router.refresh();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text hover:opacity-80 transition flex-shrink-0">
            MyFrenchList
          </Link>

          {/* Recherche Desktop (Input rapide) */}
          <div className="hidden md:block flex-1 max-w-sm mx-6">
             <SearchBar />
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center gap-1 lg:gap-4">
            <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition">Accueil</Link>
            
            {/* Nouveau : Lien Recherche Avancée */}
            <Link href="/search" className="text-indigo-400 hover:text-indigo-300 px-3 py-2 text-sm font-bold transition flex items-center gap-1">
                <span>🔍</span> Rechercher
            </Link>

            <Link href="/season" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition">Saisons</Link>
            <Link href="/friends" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition">Communauté</Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-full transition">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-500">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="32px" priority />
                    ) : (
                      <div className="h-full w-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {pseudo.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-2 transition">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            ) : (
              <Link href="/auth">
                <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition">Connexion</button>
              </Link>
            )}
          </div>

          {/* Menu Button Mobile */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16m-7 6h7" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/10 p-4 space-y-4 animate-in slide-in-from-top duration-300">
          <SearchBar />
          <div className="flex flex-col gap-2">
            <Link href="/" className="p-3 text-gray-300 border-b border-white/5" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            
            {/* Nouveau : Lien Recherche Mobile */}
            <Link href="/search" className="p-3 text-indigo-400 font-bold border-b border-white/5 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <span>🔍</span> Recherche Avancée
            </Link>
            
            <Link href="/season" className="p-3 text-gray-300 border-b border-white/5" onClick={() => setIsMenuOpen(false)}>Saisons</Link>
            <Link href="/friends" className="p-3 text-gray-300 border-b border-white/5" onClick={() => setIsMenuOpen(false)}>Communauté</Link>
            {user ? (
              <>
                <Link href="/profile" className="p-3 text-gray-300" onClick={() => setIsMenuOpen(false)}>Mon Profil</Link>
                <button onClick={handleLogout} className="p-3 text-left text-red-400">Déconnexion</button>
              </>
            ) : (
              <Link href="/auth" className="p-3 text-white font-bold bg-indigo-600 rounded-xl text-center" onClick={() => setIsMenuOpen(false)}>Connexion</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}