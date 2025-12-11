import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner"; // 👈 IMPORT

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyFrenchList",
  description: "Ton site d'animes préféré",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Navbar />
        {/* 👇 AJOUTE ÇA ICI */}
        <Toaster position="bottom-right" richColors theme="dark" />
        
        <main className="pt-16 min-h-screen bg-slate-950 text-white">
          {children}
        </main>
      </body>
    </html>
  );
}