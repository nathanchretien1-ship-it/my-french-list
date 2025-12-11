'use client'
import { useEffect, useState, useRef } from 'react';
import { createClient } from '../lib/supabase';

interface Message {
  content: string;
  sender_id: string;
  created_at: string;
}

interface ChatWindowProps {
  friendId: string;
  currentUserId: string;
}

export default function ChatWindow({ friendId, currentUserId }: ChatWindowProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!friendId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`, 
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === friendId) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [friendId, currentUserId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const optimisticMsg: Message = {
      content: newMessage,
      sender_id: currentUserId,
      created_at: new Date().toISOString() 
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    await supabase.from('messages').insert({
      content: optimisticMsg.content,
      sender_id: currentUserId,
      receiver_id: friendId,
    });
  };

  return (
    // CONTENEUR PRINCIPAL : Fond sombre et bordure subtile
    <div className="flex flex-col h-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      
      {/* ZONE DES MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-md transition-all
                  ${isMe 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' // MOI : Dégradé style site
                    : 'bg-slate-700 text-gray-100 rounded-bl-none' // AMI : Gris foncé lisible
                  }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ZONE DE SAISIE */}
      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-slate-900 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          placeholder="Écrivez votre message..."
        />
        <button 
          type="submit" 
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition shadow-lg shadow-purple-900/20"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}