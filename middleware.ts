import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Création d'une réponse initiale qui permettra de modifier les cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Configuration du client Supabase pour le Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Synchronise les cookies entre la requête (pour le serveur) et la réponse (pour le navigateur)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. IMPORTANT : On appelle getUser pour rafraîchir le token si nécessaire
  // Cela valide la session côté serveur
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * ✅ CORRECTION MAJEURE :
     * J'ai retiré 'auth/callback' de cette liste.
     * Le middleware DOIT s'exécuter sur le callback pour valider la session immédiatement.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}