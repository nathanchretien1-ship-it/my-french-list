import { getTopContent } from "./lib/api";
import HomeContainer from "./components/HomeContainer"; // On importe le container
import { createClient } from "./lib/supabase/server";

export default async function Home() {
  const data = await getTopContent('anime', 1, 'airing');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-10 text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                My French List
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                La communauté française de l'anime et du manga.
            </p>
        </div>

        {/* Le Container Client qui gère l'interactivité */}
        <HomeContainer initialData={data} user={user} />
        
      </div>
    </main>
  );
}