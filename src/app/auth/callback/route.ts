import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawRedirect =
    requestUrl.searchParams.get("redirect") ||
    requestUrl.searchParams.get("next") ||
    "/app";

  // Previne Open Redirect: deve começar com / e NÃO começar com //
  const safeRedirect =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/app";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin));
      }
      console.error("[Auth Callback] Erro ao trocar código por sessão:", error);
    } catch (exchangeErr) {
      console.error("[Auth Callback] Exceção ao processar callback:", exchangeErr);
    }
  }

  // Se houve erro ou código ausente, redireciona para login
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(loginUrl);
}
