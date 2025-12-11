import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server"; // 👇 On utilise le fichier qu'on vient de créer

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // On crée le client serveur
    const supabase = await createClient();
    
    // On échange le code temporaire contre une vraie session utilisateur
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Si tout est bon, on redirige vers l'accueil (ou la page demandée)
      const forwardedHost = request.headers.get('x-forwarded-host'); // Pour gérer le déploiement Vercel
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // En local
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // Sur Vercel (Production)
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Si erreur, retour à la case départ
  return NextResponse.redirect(`${origin}/auth?error=auth_code_error`);
}