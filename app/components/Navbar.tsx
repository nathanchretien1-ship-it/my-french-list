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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  const supabase = createClient();
  const router = useRouter();

  // Fonction pour compter les messages (extraite pour être réutilisée)
  const fetchUnreadCount = async (userId: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    let channel: any;

    const init = async () => {
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

        // 2. Compteur initial
        await fetchUnreadCount(user.id);

        // 3. Temps Réel Intelligent
        channel = supabase
          .channel('navbar_global_notifications')
          .on(
            'postgres_changes',
            {
              event: '*', // On écoute TOUT (Insert et Update)
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${user.id}`, // On écoute seulement ce qu'on REÇOIT
            },
            (payload: any) => {
              // A. Mise à jour du compteur dans tous les cas
              fetchUnreadCount(user.id);

              // B. Notification Toast UNIQUEMENT si c'est un NOUVEAU message
              // ET que l'expéditeur n'est pas moi (sécurité doublon)
              if (payload.eventType === 'INSERT' && payload.new.sender_id !== user.id) {
                toast.info("💬 Nouveau message reçu !");
              }
            }
          )
          .subscribe();
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
      // On pourrait relancer init() ici si besoin
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAvatarUrl(null);
    setPseudo("");
    setUnreadCount(0);
    toast.info("À bientôt !");
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