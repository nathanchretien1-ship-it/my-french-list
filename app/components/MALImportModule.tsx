"use client";
import { useState } from "react";
import { importFromMAL } from "../importActions";
import { toast } from "sonner";

export default function MALImportModule() {
  const [malUsername, setMalUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!malUsername.trim()) return toast.error("Veuillez entrer un pseudo");

    setLoading(true);
    const toastId = toast.loading("Importation de la liste MyAnimeList en cours...");

    const res = await importFromMAL(malUsername);

    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success(`${res.count} animes importés avec succès !`, { id: toastId });
      setMalUsername("");
      // Recharge la page pour afficher la nouvelle liste
      setTimeout(() => window.location.reload(), 2000); 
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          MAL
        </div>
        <div>
            <h3 className="font-bold text-white">Importer depuis MyAnimeList</h3>
            <p className="text-xs text-blue-300">Synchronise ta liste en un clic. Ta liste MAL doit être publique.</p>
        </div>
      </div>

      <form onSubmit={handleImport} className="flex gap-2">
        <input 
          type="text" 
          placeholder="Pseudo MyAnimeList..."
          value={malUsername}
          onChange={(e) => setMalUsername(e.target.value)}
          className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
             <><span className="animate-spin text-lg">⏳</span> Import...</>
          ) : (
             "Importer"
          )}
        </button>
      </form>
    </div>
  );
}