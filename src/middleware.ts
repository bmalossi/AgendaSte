import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, robots.txt, sitemap.xml
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icon-.*|apple-touch-icon.*).*)",
  ],
};

export async function middleware(req: NextRequest) {
  // 1. Atualiza e sincroniza a sessão do Supabase SSR (cookies de auth)
  const { supabaseResponse, user } = await updateSession(req);

  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // 2. Extrai subdomínio e limpa porta local (ex: bruno.localhost:3000 -> bruno)
  const currentHost = hostname.replace(/:\d+$/, "").toLowerCase();
  let subdomain: string | null = null;

  if (currentHost.endsWith(".luvea.app")) {
    const candidate = currentHost.replace(".luvea.app", "");
    if (candidate && candidate !== "www" && candidate !== "app") {
      subdomain = candidate;
    }
  } else if (currentHost.endsWith(".luvea.com.br")) {
    const candidate = currentHost.replace(".luvea.com.br", "");
    if (candidate && candidate !== "www" && candidate !== "app") {
      subdomain = candidate;
    }
  } else if (currentHost.endsWith(".agendaste.com.br")) {
    const candidate = currentHost.replace(".agendaste.com.br", "");
    if (candidate && candidate !== "www" && candidate !== "app") {
      subdomain = candidate;
    }
  } else if (currentHost.endsWith(".localhost")) {
    const candidate = currentHost.replace(".localhost", "");
    if (candidate && candidate !== "www" && candidate !== "app") {
      subdomain = candidate;
    }
  }

  // 3. Roteamento dinâmico Multi-Tenant por subdomínio de estúdio (ex: bruno.luvea.app)
  if (subdomain) {
    if (url.pathname.startsWith("/site")) {
      return supabaseResponse;
    }
    // Reescreve internamente para /site/[subdomain] preservando cookies
    const rewriteUrl = new URL(
      `/site/${subdomain}${url.pathname === "/" ? "" : url.pathname}`,
      req.url
    );
    const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
      request: req,
    });
    // Copia os cookies atualizados do Supabase para a resposta de rewrite
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value);
    });
    return rewriteResponse;
  }

  // 4. Subdomínio operacional dedicado (app.luvea.app -> /app)
  if (
    (currentHost === "app.luvea.app" ||
      currentHost === "app.luvea.com.br" ||
      currentHost === "app.agendaste.com.br") &&
    url.pathname === "/"
  ) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  // 5. Proteção de Rotas Privadas (/app/*)
  const isAppRoute = url.pathname.startsWith("/app");
  const isAuthRoute =
    url.pathname === "/login" ||
    url.pathname === "/cadastro" ||
    url.pathname === "/esqueci-senha" ||
    url.pathname === "/redefinir-senha";

  // Se o Supabase estiver configurado em produção e o usuário não estiver autenticado
  if (isAppRoute && !user && isSupabaseConfigured()) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Se o usuário já estiver autenticado e tentar acessar telas de login/cadastro
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return supabaseResponse;
}
