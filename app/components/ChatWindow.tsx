"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "../lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string; // <--- IL MANQUAIT CETTE LIGNE
  created_at: string;
  is_read: boolean;
}

export default function ChatWindow({ friendId, currentUserId }: { friendId: string, currentUserId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 👇 FONCTION POUR MARQUER COMME LU 👇 ---
  const markAsRead = async () => {
    // On ne lance la requête que s'il y a des messages
    if (messages.length === 0) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)      // Venant de l'ami
      .eq('receiver_id', currentUserId) // Reçus par moi
      .eq('is_read', false);          // Seulement les non lus

    // Force la mise à jour de la Navbar (le petit badge rouge)
    router.refresh(); 
  };

  // 1. Charger les messages initiaux + Marquer comme lu
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      
      // On marque comme lu dès l'ouverture
      markAsRead();
    };

    fetchMessages();

    // 2. Temps Réel (Nouveau message)
    const channel = supabase
      .channel(`chat_${currentUserId}_${friendId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          // Si le message concerne cette conversation
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === friendId) ||
            (newMsg.sender_id === friendId && newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            
            // Si c'est un message qu'on REÇOIT et qu'on est sur la fenêtre, on le marque comme lu direct
            if (newMsg.sender_id === friendId) {
                markAsRead();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [friendId, currentUserId, supabase]);

  // Scroll automatique en bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("messages").insert({
      content: newMessage,
      sender_id: currentUserId,
      receiver_id: friendId,
    });

    if (!error) setNewMessage("");
  };

  return (
    <div 
        // 👇 C'EST ICI : QUAND ON CLIQUE DANS LE CHAT, ON VALIDE LA LECTURE 👇
        onClick={markAsRead}
        onFocus={markAsRead} // Marche aussi si on tabule dans l'input
        className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden"
    >
      
      {/* ZONE DES MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-slate-700 text-gray-200 rounded-bl-none"
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
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-slate-800 text-white text-sm rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full transition transform hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  );
}