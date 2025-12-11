export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="bg-slate-900 rounded-xl h-[380px] w-full border border-slate-800 overflow-hidden relative">
          {/* Effet de brillance qui bouge (Shimmer effect) */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
          
          <div className="h-[80%] w-full bg-slate-800" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 bg-slate-800 rounded" />
            <div className="h-3 w-1/2 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}