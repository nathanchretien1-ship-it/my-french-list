"use client";
import Link from "next/link";

export default function GachaPage() {
  return (
    <div className="min-h-screen pt-24 px-4 flex flex-col items-center justify-center bg-slate-950 text-center">
      
      {/* Icône de chantier stylisée */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
        <span className="relative text-8xl">🚧</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 mb-6">
        Gacha en Construction
      </h1>

      <p className="text-gray-400 max-w-lg text-lg mb-8 leading-relaxed">
        Nous sommes en train de négocier avec les divinités de l'anime pour vous apporter une collection légendaire.
        <br />
        <span className="text-indigo-400 font-bold">Revenez bientôt !</span>
      </p>

      {/* Barre de progression Fake pour le style */}
      <div className="w-full max-w-md bg-slate-900 rounded-full h-4 mb-8 border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full w-[70%] animate-pulse"></div>
      </div>

      <div className="flex gap-4">
        <Link 
          href="/profile" 
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-bold transition border border-white/10"
        >
          Retour au profil
        </Link>
        <Link 
          href="/" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold transition shadow-lg shadow-indigo-900/20"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}