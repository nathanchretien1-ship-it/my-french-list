"use client";
import { useState } from "react";
import HomeGrid from "./HomeGrid";
import ActivityFeed from "./ActivityFeed";
import { User } from "@supabase/supabase-js";

interface HomeContainerProps {
  initialData: any[];
  user: User | null;
}

export default function HomeContainer({ initialData, user }: HomeContainerProps) {
  // ✅ Fermé par défaut
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Desktop (Cachée si fermée) */}
        <aside 
            className={`hidden lg:block flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${
                isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
            }`}
        >
             <div className="w-64">
                <ActivityFeed onClose={() => setIsSidebarOpen(false)} />
             </div>
        </aside>

        {/* Contenu Principal */}
        <div className="flex-1 min-w-0 flex flex-col">
            
            {/* Bouton d'ouverture (Centré sur mobile, à gauche sur desktop) */}
            {!isSidebarOpen && (
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="self-center lg:self-start mb-6 flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/20 transition animate-in fade-in"
                >
                    <span>📡</span> Afficher l'activité en direct
                </button>
            )}

            {/* Feed Mobile (Apparaît seulement si ouvert via le bouton) */}
            {isSidebarOpen && (
                <div className="lg:hidden mb-8 animate-in slide-in-from-top duration-300">
                    <ActivityFeed onClose={() => setIsSidebarOpen(false)} />
                </div>
            )}

            <HomeGrid initialData={initialData} user={user} />
        </div>
    </div>
  );
}