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
 * Realiza o encerramento seguro da sessão do usuário no Supabase e limpa todos os caches locais.
 */
export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[Luvea Auth] Erro ao encerrar sessão no Supabase:", err);
    }
  }

  // Limpa o cache local de estado e cookies para evitar vazamento entre contas no mesmo dispositivo/navegador
  if (typeof window !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("luvea_") ||
            key.startsWith("agendaste_"))
        ) {
          // Preserva preferências puras de tema se existirem
          if (key !== "luvea_theme" && key !== "theme") {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
      // Remove cookie de preview local se houver
      document.cookie =
        "luvea_local_preview=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    } catch (err) {
      console.warn("[Luvea Auth] Erro ao limpar cache local no logout:", err);
    }
    window.location.href = "/login";
  }
}
