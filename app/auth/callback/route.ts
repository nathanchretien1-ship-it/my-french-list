import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Sécurisation de l'origine pour la redirection (fixe les soucis http/https sur Vercel)
  // On privilégie l'origine réelle ou l'URL configurée
  const origin = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;

  if (code) {
    // 1. Échange du code contre une session (Cookies)
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 2. Création ou Mise à jour du profil
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Données venant de Google
        const googleUsername = user.user_metadata?.full_name || user.email?.split('@')[0] || "Nouveau";
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        // On vérifie si le profil existe déjà pour ne pas écraser un username personnalisé
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        const updates: any = {
          id: user.id,
          avatar_url: avatarUrl, // On met à jour l'avatar au cas où il a changé sur Google
          updated_at: new Date().toISOString(),
        };

        // On n'assigne le username que si le profil n'existait pas
        if (!existingProfile) {
          updates.username = googleUsername;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(updates, { onConflict: 'id' });

        if (profileError) {
            console.error("⚠️ Erreur mise à jour profil:", profileError);
        }
      }

      // 3. Redirection finale propre
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("❌ Erreur échange code Supabase :", error.message);
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`);
}