import MediaTypeToggle from "./components/MediaTypeToggle";
import HomeGrid from "./components/HomeGrid";
import { GridSkeleton } from "./components/Skeletons";
import { Suspense } from "react";
import AdSidebar from "./components/AdSidebar";

export default async function Home({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const filter = params.filter === "manga" ? "manga" : "anime";

  return (
    <main className="min-h-screen bg-[#0f111a] text-white pt-24 pb-20">
      
      <section className="text-center px-4 mb-10">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          MyFrenchList
        </h1>
        <p className="text-gray-400 text-lg">
          Le meilleur de la culture japonaise, en français.
        </p>
      </section>

      <MediaTypeToggle current={filter} />

      {/* Container très large (1920px) pour faire tenir 3 colonnes */}
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6">
        
        {/* LAYOUT 3 COLONNES */}
        <div className="flex gap-6 justify-center items-start">
          
          {/* 👈 PUB GAUCHE (Apparaît seulement sur écrans géants 2XL) */}
          <AdSidebar side="left" />

          {/* 📺 CONTENU CENTRAL (S'adapte) */}
          <div className="flex-1 min-w-0 max-w-6xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
              Top {filter === "manga" ? "Mangas" : "Animes"} Populaires
            </h2>

            <Suspense key={filter} fallback={<GridSkeleton />}>
              <HomeGrid filter={filter} />
            </Suspense>
          </div>

          {/* 👉 PUB DROITE (Apparaît sur écrans larges XL) */}
          <AdSidebar side="right" />

        </div>
      </section>
    </main>
  );
}