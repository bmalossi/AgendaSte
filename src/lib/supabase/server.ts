import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo-luvea.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key-luvea-studio";

/**
 * Cria o cliente Supabase SSR para uso em Server Components, Server Actions
 * e Route Handlers (App Router).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // O método `setAll` foi chamado em um Server Component.
          // Isto pode ser ignorado se houver middleware atualizando a sessão.
        }
      },
    },
  });
}
