import { getTopContent } from "./lib/api";
import HomeGrid from "./components/HomeGrid";
import ActivityFeed from "./components/ActivityFeed"; // Import
import { createClient } from "./lib/supabase/server";

export default async function Home() {
  const data = await getTopContent('anime', 1, 'airing');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête + Feed Communautaire (Layout en colonnes sur Desktop) */}
        <div className="grid lg:grid-cols-4 gap-8 mb-10">
            
            {/* Colonne Principale : Titre & Intro */}
            <div className="lg:col-span-3 text-center lg:text-left space-y-4 flex flex-col justify-center">
                <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                    My French List
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl">
                    La communauté française de l'anime et du manga.
                    <br/>Suivez vos amis, notez vos séries et découvrez de nouvelles pépites.
                </p>
            </div>

            {/* Colonne Droite : Fil d'Activité (Visible uniquement sur Desktop pour pas encombrer le mobile ?) */}
            <div className="hidden lg:block lg:col-span-1">
                 <ActivityFeed />
            </div>
        </div>

        {/* Fil d'actu Mobile (optionnel, en dessous du titre) */}
        <div className="lg:hidden mb-8">
            <ActivityFeed />
        </div>
        
        <HomeGrid initialData={data} user={user} />
      </div>
    </main>
  );
}