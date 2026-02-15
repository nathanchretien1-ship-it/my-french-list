"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import SearchBar from "../components/SearchBar";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user: initialUser }: NavbarProps) {
  // On utilise initialUser comme état initial, mais on garde la possibilité de le mettre à jour
  const [user, setUser] = useState<User | null>(initialUser);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Client Supabase unique pour le composant client
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const pathname = usePathname();

  // Mise à jour de l'état local si la prop change (ex: après une server action)
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
    const currentUser = user; // On utilise l'état courant

    if (!currentUser) {
        setAvatarUrl(null);
        setPseudo("");
        setUnreadCount(0);
        return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", currentUser.id)
        .single();

      // 1. Pseudo
      const username = profile?.username 
        || currentUser.user_metadata?.full_name 
        || currentUser.email?.split('@')[0] 
        || "Mon Profil";
      setPseudo(username);

      // 2. Avatar
      if (profile?.avatar_url) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
        setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`); // Cache busting
      } else if (currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture) {
        setAvatarUrl(currentUser.user_metadata.avatar_url || currentUser.user_metadata.picture);
      } else {
        setAvatarUrl(null);
      }

      await fetchUnreadCount(currentUser.id);

    } catch (error) {
      console.error("Erreur init navbar:", error);
    }
  }, [user, supabase, fetchUnreadCount]); // Dépend de `user`

  // Effet principal : Initialisation + Auth Listener + Realtime
  useEffect(() => {
    // 1. Charger les infos initiales
    init();

    // 2. Écouter les changements d'auth (connexion/déconnexion dynamique)
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

    // 3. Realtime Messages
    let channel: any;
    if (user) {
        channel = supabase
          .channel('navbar_notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT', // On écoute juste les inserts pour les notifs
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${user.id}`,
            },
            (payload: any) => {
              fetchUnreadCount(user.id);
              if (payload.new.sender_id !== user.id) {
                toast.info("💬 Nouveau message !");
              }
            }
          )
          .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [user, supabase, router, init, fetchUnreadCount]);

  const handleLogout = async () => {
    await supabase.auth.signOut(); // Déconnexion côté client d'abord
    await fetch("/auth/signout", { method: "POST" }); // Nettoyage cookies serveur
    setUser(null);
    toast.info("À bientôt !");
    router.refresh();
    router.push('/')
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text hover:opacity-80 transition flex-shrink-0">
            MyFrenchList
          </Link>

          <div className="hidden md:block mx-4">
             <SearchBar />
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition hidden sm:block">
              Accueil
            </Link>
            <Link href="/season" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition hidden sm:block">
              Saisons
            </Link>
            <Link href="/friends" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition hidden sm:block">
              Communauté
            </Link>

            {user && (
              <Link href="/messages" className="relative text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition hidden sm:block">
                Messages
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-0 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white justify-center items-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4 ml-2">
                <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 pr-4 pl-2 py-1 rounded-full transition group">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-500 group-hover:border-purple-400 transition">
                    {avatarUrl ? (
                      <Image 
                        src={avatarUrl} 
                        alt="Avatar" 
                        fill 
                        referrerPolicy="no-referrer"
                        className="object-cover" 
                        sizes="32px"
                        priority
                      />
                    ) : (
                      <div className="h-full w-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {pseudo.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white max-w-[100px] truncate hidden sm:block">
                    {pseudo}
                  </span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-gray-400 hover:text-red-400 p-2 rounded-full transition"
                  title="Déconnexion"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link href="/auth">
                <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition transform hover:scale-105">
                  Connexion
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}