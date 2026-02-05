// app/auth/callback/route.ts
import { NextResponse } from "next/server";
// 👇 Important : importez bien votre fonction serveur
import { createClient } from "@/app/lib/supabase/server"; 

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Par défaut on redirige vers l'accueil, ou vers la page demandée
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host'); // Pour supporter les environnements déployés (Vercel)
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // En local, on utilise l'origine (localhost:3000)
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // En prod, on respecte le domaine transféré
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Retour à la page auth en cas d'erreur
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`);
}