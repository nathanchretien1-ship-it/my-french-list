import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createClient();

  // On demande au serveur de détruire la session
  await supabase.auth.signOut();

  // On redirige vers l'accueil
  return NextResponse.redirect(`${requestUrl.origin}/`, {
    status: 301,
  });
}