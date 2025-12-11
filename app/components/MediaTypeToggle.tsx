import Link from "next/link";

export default function MediaTypeToggle({ current }: { current: "anime" | "manga" }) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-slate-900 p-1 rounded-full border border-white/10 flex">
        <Link
          href="/?filter=anime"
          scroll={false} // 👈 Ajoute ça pour ne pas sauter en haut de page
          className={`px-6 py-2 rounded-full font-bold transition ${
            current === "anime"
              ? "bg-purple-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Animes
        </Link>
        <Link
          href="/?filter=manga"
          scroll={false} // 👈 Ici aussi
          className={`px-6 py-2 rounded-full font-bold transition ${
            current === "manga"
              ? "bg-purple-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Mangas
        </Link>
      </div>
    </div>
  );
}