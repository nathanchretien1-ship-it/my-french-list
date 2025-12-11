"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase"; // Vérifie ton chemin d'import
import Link from "next/link";
import Image from "next/image";
import FriendButton from "../components/FriendButton";
import UserBadge from "../components/UserBadge"; // <--- ON UTILISE LE BON COMPOSANT

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "self";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"all" | "friends">("all");
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [myFriendships, setMyFriendships] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"count" | "name" | "recent">("count");

  const supabase = createClient();

  // --- 1. CALCUL DU STATUT ---
  const getStatusForUser = (targetUserId: string): FriendStatus => {
    if (!currentUserId) return "none";
    if (targetUserId === currentUserId) return "self";

    const relation = myFriendships.find(f => 
      (f.user_id === currentUserId && f.friend_id === targetUserId) || 
      (f.user_id === targetUserId && f.friend_id === currentUserId)
    );

    if (!relation) return "none";
    if (relation.status === "accepted") return "accepted";
    if (relation.status === "pending") {
      return relation.user_id === currentUserId ? "pending_sent" : "pending_received";
    }
    return "none";
  };

  // --- 2. CHARGEMENT DES DONNÉES ---
  const fetchAllData = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setCurrentUserId(currentUser?.id || null);

    let allMyRelations: any[] = [];

    // A. Données privées (Amitiés)
    if (currentUser) {
      const { data } = await supabase
        .from("friends")
        .select("*")
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);
      
      allMyRelations = data || [];
      setMyFriendships(allMyRelations);

      // Demandes reçues
      const receivedRequestIds = allMyRelations
        .filter((r: any) => r.friend_id === currentUser.id && r.status === "pending")
        .map((r: any) => r.user_id);
        
      if (receivedRequestIds.length > 0) {
        // On récupère les profils complets pour les demandes
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, role, is_premium, is_admin, items_count") // Colonnes importantes
            .in("id", receivedRequestIds);
        setRequests(profiles || []);
      } else {
        setRequests([]);
      }
    } else {
      setMyFriendships([]);
      setRequests([]);
    }

    if (activeTab === "friends" && !currentUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    // C. LISTE PUBLIQUE
    // On sélectionne TOUTES les colonnes nécessaires pour les badges
    let query = supabase
        .from("profiles")
        .select("id, username, avatar_url, role, is_premium, is_admin, items_count");

    // Filtre Amis
    if (activeTab === "friends" && currentUser) {
      const friendIds = allMyRelations
        .filter((r: any) => r.status === "accepted")
        .map((r: any) => r.user_id === currentUser.id ? r.friend_id : r.user_id);
      
      if (friendIds.length > 0) query = query.in("id", friendIds);
      else {
        setUsers([]);
        setLoading(false);
        return;
      }
    }

    // Tri (si items_count existe, sinon trier par created_at ou username)
    if (sortBy === "count") query = query.order("items_count", { ascending: false }); 
    else if (sortBy === "name") query = query.order("username", { ascending: true });
    // else if (sortBy === "recent") ... (si tu as created_at)

    if (searchQuery.length >= 1) query = query.ilike("username", `%${searchQuery}%`);

    const { data } = await query.limit(50);
    setUsers(data || []);
    setLoading(false);
  }, [activeTab, searchQuery, sortBy, supabase]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchAllData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAllData]);

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pt-24 px-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">La Communauté</h1>
          <p className="text-gray-400">Trouve des amis et compare tes stats.</p>
        </div>

        {/* --- DEMANDES REÇUES --- */}
        {requests.length > 0 && (
          <div className="mb-10 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 rounded-2xl border border-purple-500/30 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-300">🔔 Demandes reçues ({requests.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-slate-900 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full bg-slate-700 overflow-hidden border border-gray-500">
                        {req.avatar_url ? (
                            // Utilise l'URL complète si besoin ou juste le chemin
                          <Image src={req.avatar_url.startsWith('http') ? req.avatar_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${req.avatar_url}`} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-bold">{req.username?.charAt(0)}</div>
                        )}
                      </div>
                      <span className="font-bold truncate max-w-[100px]">{req.username}</span>
                  </div>
                  <FriendButton 
                    friendId={req.id} 
                    initialStatus={getStatusForUser(req.id)} 
                    onUpdate={fetchAllData} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- BARRE D'OUTILS --- */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-xl backdrop-blur-sm sticky top-20 z-30">
          <div className="flex bg-slate-800 p-1 rounded-lg flex-shrink-0">
            <button onClick={() => setActiveTab("all")} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === "all" ? "bg-purple-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>Tout le monde</button>
            <button onClick={() => setActiveTab("friends")} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === "friends" ? "bg-purple-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>Mes Amis</button>
          </div>
          <div className="relative w-full lg:w-96">
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-purple-500 outline-none" />
            <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2.5 cursor-pointer outline-none">
            <option value="count">🏆 Top Rangs</option>
            <option value="name">🔤 Alphabétique</option>
            <option value="recent">🌱 Débutants</option>
          </select>
        </div>

        {/* --- GRILLE UTILISATEURS --- */}
        {loading ? (
          <div className="text-center py-20 animate-pulse text-gray-500">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-xl"><h2 className="text-xl font-bold text-gray-300">Aucun utilisateur trouvé.</h2></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div key={user.id} className="bg-slate-900 hover:bg-slate-800 transition duration-300 p-4 rounded-xl border border-white/5 flex items-center gap-4 group shadow-md hover:shadow-purple-500/10 hover:border-purple-500/30">
                <Link href={`/user/${user.username}`} className="relative h-16 w-16 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-600 group-hover:border-purple-500 transition flex-shrink-0">
                  {user.avatar_url ? (
                    <Image src={user.avatar_url.startsWith('http') ? user.avatar_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.avatar_url}`} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-bold text-xl bg-gradient-to-br from-slate-600 to-slate-800">{user.username?.charAt(0).toUpperCase()}</div>
                  )}
                </Link>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col mb-1">
                    <Link href={`/user/${user.username}`} className="font-bold text-lg hover:text-purple-400 truncate transition mb-1">{user.username}</Link>
                    
                    {/* 👇 C'EST ICI QU'ON UTILISE LE NOUVEAU BADGE 👇 */}
                    <div className="flex flex-wrap gap-1">
                         <UserBadge 
                            role={user.role} 
                            isAdmin={user.is_admin} 
                            isPremium={user.is_premium} 
                            animeCount={user.items_count || 0} // On passe 0 par défaut
                         />
                    </div>

                  </div>
                </div>

                <div className="flex-shrink-0">
                   <FriendButton 
                     friendId={user.id} 
                     initialStatus={getStatusForUser(user.id)} 
                     onUpdate={fetchAllData} 
                   />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}