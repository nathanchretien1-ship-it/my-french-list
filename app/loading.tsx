export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0f111a] pt-24 px-8">
      {/* Simulation du Titre */}
      <div className="flex flex-col items-center mb-10 space-y-4">
        <div className="h-12 w-64 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-slate-800 rounded-lg animate-pulse" />
      </div>

      {/* Simulation des Boutons */}
      <div className="flex justify-center mb-8">
        <div className="h-10 w-48 bg-slate-800 rounded-full animate-pulse" />
      </div>

      {/* Simulation de la Grille */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-slate-900 rounded-xl h-[380px] w-full animate-pulse border border-slate-800">
            {/* Image placeholder */}
            <div className="h-[80%] w-full bg-slate-800/50" />
            {/* Text placeholder */}
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}