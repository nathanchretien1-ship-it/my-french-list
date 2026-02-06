import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  
  // Utilise l'origine de la requête pour la redirection (plus sûr que les env vars mal configurées)
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const googleUsername = user.user_metadata?.full_name || user.email?.split('@')[0] || "Nouveau";
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        const updates: any = {
          id: user.id,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        };

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

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("❌ Erreur échange code Supabase :", error.message);
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`);
}