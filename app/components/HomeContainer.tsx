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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
        
        {/* --- SIDEBAR GAUCHE (Desktop uniquement) --- */}
        {/* Transition fluide sur la largeur (w-64 -> w-0) */}
        <aside 
            className={`hidden lg:block flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${
                isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
            }`}
        >
             {/* Wrapper de largeur fixe pour éviter que le contenu s'écrase pendant l'animation */}
             <div className="w-64">
                <ActivityFeed onClose={() => setIsSidebarOpen(false)} />
             </div>
        </aside>

        {/* --- CONTENU PRINCIPAL --- */}
        <div className="flex-1 min-w-0 flex flex-col">
            
            {/* Bouton pour ré-afficher la sidebar si elle est cachée */}
            {!isSidebarOpen && (
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="self-start mb-6 flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/20 transition animate-in fade-in"
                >
                    <span>📡</span> Afficher l'activité en direct
                </button>
            )}

            {/* Mobile : Le feed s'affiche ici (toujours visible sur mobile pour l'instant) */}
            <div className="lg:hidden mb-8">
                <ActivityFeed />
            </div>

            <HomeGrid initialData={initialData} user={user} />
        </div>

    </div>
  );
}