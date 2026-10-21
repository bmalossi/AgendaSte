import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo-luvea.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key-luvea-studio";

/**
 * Cliente Supabase de navegador com suporte a SSR e cookies.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("seu-projeto") &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("demo-")
  );
}

/**
 * Realiza o encerramento seguro da sessão do usuário no Supabase e redireciona para o login.
 */
export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[Luvea Auth] Erro ao encerrar sessão no Supabase:", err);
    }
  }

  // Redireciona o usuário para a página de autenticação
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
