"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SearchBar from "../components/SearchBar";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState<number>(0); // Nouveau state pour les notifs
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 1. Profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          setPseudo(profile.username || user.email?.split('@')[0] || "Mon Profil");
          if (profile.avatar_url) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
            setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`);
          }
        }

        // 2. Compter les messages non lus initiaux
        const fetchUnread = async () => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);
          setUnreadCount(count || 0);
        };
        fetchUnread();

        // 3. Écouter les nouveaux messages en temps réel (pour incrémenter le badge)
        const channel = supabase
          .channel('navbar_notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${user.id}`,
            },
            () => {
              // Si on reçoit un message, on met à jour le compteur
              fetchUnread();
              toast.info("Nouveau message reçu !");
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE', // Si on lit un message ailleurs, on met à jour le compteur
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${user.id}`,
            },
            () => fetchUnread()
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    getData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
      getData();
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAvatarUrl(null);
    setPseudo("");
    setUnreadCount(0);
    toast.info("Déconnexion réussie");
    router.push("/"); 
    router.refresh(); 
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

            {/* --- LIEN MESSAGES AVEC BADGE --- */}
            {user && (
              <Link href="/messages" className="relative text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition hidden sm:block">
                Messages 💬
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4 ml-2">
                <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 pr-4 pl-2 py-1 rounded-full transition group">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-500 group-hover:border-purple-400 transition">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized priority/>
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
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-2 rounded-full transition">
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