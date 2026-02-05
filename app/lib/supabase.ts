
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL); // Vérifiez que ce n'est pas undefined
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}