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

  // On extrait la logique de chargement pour pouvoir l'appeler depuis le Realtime
  const loadConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Si c'est le premier chargement, on set l'ID
    setCurrentUserId(prev => prev || user.id);

    // 1. Récupérer les profils
    const { data: rawUsers } = await supabase
      .from('profiles') 
      .select('id, username, avatar_url')
      .neq('id', user.id); 

    // 2. Récupérer TOUS les messages me concernant
    const { data: allMessages } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at, is_read')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (rawUsers && allMessages) {
      const usersWithStats = rawUsers.map((u: any) => {
        let publicUrl = null;
        if (u.avatar_url) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(u.avatar_url);
          publicUrl = data.publicUrl;
        }

        const conversation = allMessages.filter(m => 
          (m.sender_id === u.id && m.receiver_id === user.id) || 
          (m.sender_id === user.id && m.receiver_id === u.id)
        );

        let lastTime = 0;
        if (conversation.length > 0) {
          lastTime = Math.max(...conversation.map(m => new Date(m.created_at).getTime()));
        }

        // Compter les non lus venant de LUI vers MOI
        const unread = conversation.filter(m => m.sender_id === u.id && m.receiver_id === user.id && !m.is_read).length;

        return {
          ...u,
          avatar_url: publicUrl,
          lastMessageTime: lastTime,
          unreadCount: unread
        };
      });

      // On garde ceux qui ont au moins un message OU les amis (si tu as un système d'amis)
      // Ici on trie simplement par date
      usersWithStats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      setUsers(usersWithStats as UserProfile[]);
    }
  }, [supabase]);

  useEffect(() => {
    // 1. Chargement initial
    loadConversations();

    // 2. Realtime : On recharge la liste si un message arrive ou change d'état (lu)
    const channel = supabase.channel('msg_list_updates')
      .on(
        'postgres_changes', 
        { 
            event: '*', 
            schema: 'public', 
            table: 'messages' 
            // Pas de filtre strict ici car on veut aussi savoir quand MON message est envoyé pour remonter la conversation
        }, 
        (payload) => {
            // Optimisation : on ne recharge que si ça me concerne
            const newItem = payload.new as any;
            const oldItem = payload.old as any;
            const myId = currentUserId; // Attention, dans useEffect vérifier la closure, mais ici on appelle la fonction

            // On recharge tout pour être sûr d'avoir le bon tri et les bons badges
            loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };

  }, [supabase, loadConversations, currentUserId]); // Dépendances importantes

 const handleSelectFriend = async (friendId: string) => {
    console.log("Tentative de lecture des messages de :", friendId);
    
    // 1. Mise à jour visuelle immédiate (Optimistic UI)
    setSelectedFriendId(friendId);
    setUsers(prev => prev.map(u => u.id === friendId ? { ...u, unreadCount: 0 } : u));

    // 2. Mise à jour en Base de Données
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)     // Messages envoyés par l'ami
      .eq('receiver_id', currentUserId) // Reçus par moi
      .eq('is_read', false);         // Seulement ceux non lus (optimisation)

    if (error) {
      console.error("Erreur lors de la mise à jour :", error);
      toast.error("Impossible de marquer comme lu");
      // Optionnel : On pourrait remettre le compteur si ça échoue
    } else {
        console.log("Messages marqués comme lus avec succès !");
        // On force le rafraichissement pour la Navbar
        router.refresh();
    }
  };

  if (!currentUserId) return <div className="pt-24 text-center text-gray-500">Chargement...</div>;

  return (
    <div className="flex h-[calc(100vh-80px)] max-w-6xl mx-auto p-4 gap-6 mt-20"> 
      
      {/* COLONNE GAUCHE */}
      <div className="w-1/3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col">
        <h2 className="p-4 font-bold text-xl border-b border-white/10 text-white bg-slate-900/95">
          Discussions
        </h2>
        <div className="overflow-y-auto flex-1">
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
                        {/* BADGE ROUGE */}
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
        </div>
      </div>

      {/* COLONNE DROITE */}
      <div className="w-2/3 h-full">
        {selectedFriendId ? (
          <ChatWindow 
            friendId={selectedFriendId} 
            currentUserId={currentUserId} 
          />
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