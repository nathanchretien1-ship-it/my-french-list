import MediaTypeToggle from "./components/MediaTypeToggle";
import HomeGrid from "./components/HomeGrid";
import { GridSkeleton } from "./components/Skeletons";
import { Suspense } from "react";

export default async function Home({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const filter = params.filter === "manga" ? "manga" : "anime";

  return (
    <main className="min-h-screen bg-[#0f111a] text-white pt-24 pb-20">
      
      {/* Tout ce qui est ici s'affiche INSTANTANÉMENT car c'est statique */}
      <section className="text-center px-4 mb-10">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          MyFrenchList
        </h1>
        <p className="text-gray-400 text-lg">
          Le meilleur de la culture japonaise, en français.
        </p>
      </section>

      {/* Le bouton switch s'affiche aussi tout de suite */}
      <MediaTypeToggle current={filter} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
          Top {filter === "manga" ? "Mangas" : "Animes"} Populaires
        </h2>

        {/* 👇 LA MAGIE EST ICI 👇 */}
        {/* La clé (key) force React à re-déclencher le suspense quand le filtre change */}
        <Suspense key={filter} fallback={<GridSkeleton />}>
          <HomeGrid filter={filter} />
        </Suspense>

      </section>
    </main>
  );
}