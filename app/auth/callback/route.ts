import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // 1. Échange du code contre une session (Cookies)
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 2. ✅ CORRECTION : Création automatique du profil si inexistant
      // On récupère l'utilisateur qu'on vient de loguer
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // On prépare les données de base venant de Google
        const username = user.user_metadata?.full_name || user.email?.split('@')[0] || "Nouveau";
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        // On insère le profil s'il n'existe pas encore
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: username,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id', ignoreDuplicates: true }); // ignoreDuplicates évite d'écraser un profil existant

        if (profileError) {
            console.error("⚠️ Erreur création profil auto:", profileError);
        }
      }

      // 3. Redirection finale
      const forwardedHost = request.headers.get('x-forwarded-host'); 
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error("❌ Erreur échange code Supabase :", error.message);
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`);
}