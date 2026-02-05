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
    
   // app/auth/callback/route.ts
if (!error) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  
  // URL de redirection finale
  const redirectUrl = isLocalEnv 
    ? `${origin}${next}` 
    : (forwardedHost ? `https://${forwardedHost}${next}` : `${origin}${next}`);

  // On ajoute un paramètre de cache-busting pour forcer Next.js à rafraîchir la session
  const finalUrl = new URL(redirectUrl);
  // finalUrl.searchParams.set('t', Date.now().toString()); // Optionnel

  return NextResponse.redirect(finalUrl.toString());
}
  }

  // Si erreur, retour à la case départ
  return NextResponse.redirect(`${origin}/auth?error=auth_code_error`);
}