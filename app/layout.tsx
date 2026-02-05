import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner"; // 👈 IMPORT
import Script from "next/script";
import { createClient } from "./lib/supabase/server";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyFrenchList",
  description: "Ton site d'animes préféré",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="fr">
      <head>
        <Script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8276754611976179"
    crossOrigin="anonymous"
    strategy="afterInteractive"
  />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8276754611976179"
      crossOrigin="anonymous"></script>
      </head>
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