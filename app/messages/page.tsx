'use client'
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import ChatWindow from '../components/ChatWindow';
import Image from 'next/image';
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  lastMessageTime?: number;
  unreadCount?: number;
}

export default function MessagesPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setCurrentUserId(prev => prev || user.id);

      // 1. Récupérer TOUS les messages me concernant (Envoyés ou Reçus)
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at, is_read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error || !allMessages) {
          console.error("Erreur chargement messages", error);
          return;
      }

      // 2. Identifier les IDs uniques des interlocuteurs
      const interlocutorIds = new Set<string>();
      allMessages.forEach(msg => {
          if (msg.sender_id !== user.id) interlocutorIds.add(msg.sender_id);
          if (msg.receiver_id !== user.id) interlocutorIds.add(msg.receiver_id);
      });

      if (interlocutorIds.size === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
      }

      // 3. Récupérer UNIQUEMENT les profils de ces personnes (Optimisation majeure)
      const { data: profiles } = await supabase
        .from('profiles') 
        .select('id, username, avatar_url')
        .in('id', Array.from(interlocutorIds));

      if (profiles) {
        const usersWithStats = profiles.map((p: any) => {
          // Gestion Avatar
          let publicUrl = null;
          if (p.avatar_url) {
            // Si c'est une URL absolue (Google) ou relative (Storage)
            if (p.avatar_url.startsWith('http')) {
                publicUrl = p.avatar_url;
            } else {
                const { data } = supabase.storage.from('avatars').getPublicUrl(p.avatar_url);
                publicUrl = data.publicUrl;
            }
          }

          // Filtrer les messages pour cette conversation spécifique
          const conversation = allMessages.filter(m => 
            (m.sender_id === p.id && m.receiver_id === user.id) || 
            (m.sender_id === user.id && m.receiver_id === p.id)
          );

          // Trouver le dernier message
          let lastTime = 0;
          if (conversation.length > 0) {
            // Comme allMessages est déjà trié par date DESC, le premier est le plus récent
            lastTime = new Date(conversation[0].created_at).getTime();
          }

          // Compter les non lus (envoyés par l'ami vers moi)
          const unread = conversation.filter(m => m.sender_id === p.id && m.receiver_id === user.id && !m.is_read).length;

          return {
            ...p,
            avatar_url: publicUrl,
            lastMessageTime: lastTime,
            unreadCount: unread
          };
        });

        // Trier les contacts par date du dernier message
        usersWithStats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        setUsers(usersWithStats as UserProfile[]);
      }
    } catch (err) {
        console.error("Crash loadConversations", err);
    } finally {
        setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadConversations();

    const channel = supabase.channel('msg_list_updates')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        () => {
            // On recharge quand il y a du mouvement
            loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadConversations]); 

 const handleSelectFriend = async (friendId: string) => {
    setSelectedFriendId(friendId);
    
    // Optimistic UI update pour le compteur
    setUsers(prev => prev.map(u => u.id === friendId ? { ...u, unreadCount: 0 } : u));

    // Si pas de user courant chargé, on arrête (sécurité)
    if (!currentUserId) return;

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);

    if (error) console.error("Erreur mark as read:", error);
    else router.refresh();
  };

  if (isLoading) return <div className="pt-24 text-center text-gray-500 animate-pulse">Chargement des discussions...</div>;

  return (
    <div className="flex h-[calc(100vh-80px)] max-w-6xl mx-auto p-4 gap-6 mt-20"> 
      
      {/* COLONNE GAUCHE */}
      <div className={`${selectedFriendId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden shadow-xl flex-col`}>
        <h2 className="p-4 font-bold text-xl border-b border-white/10 text-white bg-slate-900/95">
          Discussions
        </h2>
        <div className="overflow-y-auto flex-1">
            {users.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                    Aucune conversation.<br/>Allez dans "Communauté" pour trouver des amis !
                </div>
            ) : (
                <ul className="divide-y divide-white/5">
                {users.map((friend) => (
                    <li 
                    key={friend.id}
                    onClick={() => handleSelectFriend(friend.id)}
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
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-slate-700">
                            {friend.username ? friend.username[0].toUpperCase() : '?'}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <span className={`font-semibold truncate ${friend.unreadCount && friend.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                                {friend.username || 'Utilisateur'}
                            </span>
                            {friend.unreadCount !== undefined && friend.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                    {friend.unreadCount}
                                </span>
                            )}
                        </div>
                        <span className={`text-xs truncate ${friend.unreadCount && friend.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                            {friend.unreadCount && friend.unreadCount > 0 ? 'Nouveau message' : 'Voir la discussion'}
                        </span>
                    </div>
                    </li>
                ))}
                </ul>
            )}
        </div>
      </div>

      {/* COLONNE DROITE */}
      <div className={`${!selectedFriendId ? 'hidden md:block' : 'block'} w-full md:w-2/3 h-full`}>
        {selectedFriendId ? (
          <div className="h-full flex flex-col">
              {/* Bouton retour mobile */}
              <button 
                onClick={() => setSelectedFriendId(null)}
                className="md:hidden mb-2 text-sm text-gray-400 flex items-center gap-2"
              >
                  ⬅ Retour
              </button>
              <div className="flex-1 overflow-hidden rounded-xl border border-white/10">
                <ChatWindow 
                    friendId={selectedFriendId} 
                    currentUserId={currentUserId!} 
                />
              </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-slate-900/50 rounded-xl border border-white/10 border-dashed">
            <span className="text-4xl mb-4">💬</span>
            <p className="text-lg font-medium">Sélectionne un ami pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}