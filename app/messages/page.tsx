'use client'
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import ChatWindow from '../components/ChatWindow';
import Image from 'next/image';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  lastMessageTime?: number; // Pour le tri
  unreadCount?: number;     // Pour la notif
}

export default function MessagesPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }
      setCurrentUserId(user.id);

      // 1. Récupérer les profils
      const { data: rawUsers } = await supabase
        .from('profiles') 
        .select('id, username, avatar_url')
        .neq('id', user.id); 

      // 2. Récupérer TOUS les messages qui me concernent (pour calculer les notifs et le tri)
      const { data: allMessages } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at, is_read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (rawUsers && allMessages) {
        
        // On traite les données pour ajouter les infos de tri et de notif
        const usersWithStats = rawUsers.map((u: any) => {
          let publicUrl = null;
          if (u.avatar_url) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(u.avatar_url);
            publicUrl = data.publicUrl;
          }

          // Filtrer les messages échangés avec CET utilisateur
          const conversation = allMessages.filter(m => 
            (m.sender_id === u.id && m.receiver_id === user.id) || 
            (m.sender_id === user.id && m.receiver_id === u.id)
          );

          // Trouver la date du dernier message (pour le tri)
          let lastTime = 0;
          if (conversation.length > 0) {
            // On prend le max des dates
            lastTime = Math.max(...conversation.map(m => new Date(m.created_at).getTime()));
          }

          // Compter les non lus venant de LUI
          const unread = conversation.filter(m => m.sender_id === u.id && m.receiver_id === user.id && !m.is_read).length;

          return {
            ...u,
            avatar_url: publicUrl,
            lastMessageTime: lastTime,
            unreadCount: unread
          };
        });

        // TRIER : Les plus récents en premier (descendant)
        usersWithStats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        setUsers(usersWithStats as UserProfile[]);
      }
    };

    getData();
    
    // Pour que les notifs se mettent à jour en temps réel, on écoute les messages
    const channel = supabase.channel('msg_list_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
         getData(); // On recharge tout si un message arrive
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };

  }, [supabase, router]);

  // Fonction pour gérer le clic : on marque comme lu !
  const handleSelectFriend = async (friendId: string) => {
    setSelectedFriendId(friendId);
    
    // Mettre à jour localement pour effacer la notif instantanément
    setUsers(prev => prev.map(u => u.id === friendId ? { ...u, unreadCount: 0 } : u));

    // Mettre à jour en base de données
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', currentUserId);
      
    // Refresh router pour mettre à jour la navbar
    router.refresh(); 
  };

  if (!currentUserId) return null; 

  return (
    <div className="flex h-[calc(100vh-120px)] max-w-6xl mx-auto p-4 gap-6 mt-24"> 
      
      {/* COLONNE GAUCHE */}
      <div className="w-1/3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl overflow-y-auto shadow-xl">
        <h2 className="p-4 font-bold text-xl border-b border-white/10 text-white sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          Discussions
        </h2>
        <ul className="divide-y divide-white/5">
          {users.map((friend) => (
            <li 
              key={friend.id}
              onClick={() => handleSelectFriend(friend.id)} // On utilise la nouvelle fonction
              className={`p-4 cursor-pointer flex items-center gap-4 transition-all duration-200
                ${selectedFriendId === friend.id 
                  ? 'bg-purple-500/10 border-l-4 border-purple-500' 
                  : 'hover:bg-white/5 border-l-4 border-transparent' 
                }`}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-600 bg-slate-800 flex-shrink-0">
                 {friend.avatar_url ? (
                    <Image src={friend.avatar_url} alt={friend.username} fill className="object-cover" unoptimized />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                      {friend.username ? friend.username[0].toUpperCase() : '?'}
                    </div>
                 )}
              </div>
              
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center">
                    <span className={`font-semibold ${friend.unreadCount && friend.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                        {friend.username || 'Utilisateur'}
                    </span>
                    {/* LE BADGE DE NOTIFICATION INDIVIDUEL */}
                    {friend.unreadCount !== undefined && friend.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                            {friend.unreadCount}
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-500">
                    {friend.unreadCount && friend.unreadCount > 0 ? 'Nouveau message !' : 'Cliquez pour discuter'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* COLONNE DROITE */}
      <div className="w-2/3">
        {selectedFriendId ? (
          <ChatWindow 
            friendId={selectedFriendId} 
            currentUserId={currentUserId} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-slate-900/50 rounded-xl border border-white/10 border-dashed">
            <p className="text-lg font-medium">Sélectionne un ami pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}