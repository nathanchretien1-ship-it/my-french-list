import { getTopAnime, getTopManga } from "../lib/api";
import AnimeCard from "../components/AnimeCard";

export default async function HomeGrid({ filter }: { filter: string }) {
  // On récupère les données
  const items = filter === "manga" ? await getTopManga() : await getTopAnime();
  
  // On détermine le type à envoyer à la carte
  const type = filter === "manga" ? "manga" : "anime";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {items.map((item: any) => (
        // 👇 On passe la prop 'type' ici !
        // Plus besoin de mettre le Link autour, car il est DANS la carte maintenant
        <AnimeCard key={item.mal_id} anime={item} type={type} />
      ))}
    </div>
  );
}