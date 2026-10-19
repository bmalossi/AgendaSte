import { NextRequest, NextResponse } from "next/server";

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

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Limpa porta de desenvolvimento (ex: localhost:3000 -> localhost)
  const currentHost = hostname.replace(/:\d+$/, "").toLowerCase();

  let subdomain: string | null = null;

  if (currentHost.endsWith(".agendaste.com.br")) {
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

  // Se a requisição veio de um subdomínio de cliente (ex: bruno.agendaste.com.br)
  if (subdomain) {
    // Não reescreve se já estiver na rota /site
    if (url.pathname.startsWith("/site")) {
      return NextResponse.next();
    }
    // Reescreve internamente para /site/[subdomain] mantendo a URL original no navegador
    return NextResponse.rewrite(
      new URL(`/site/${subdomain}${url.pathname === "/" ? "" : url.pathname}`, req.url)
    );
  }

  // Se acessar diretamente pelo subdomínio de app (ex: app.agendaste.com.br)
  if (currentHost === "app.agendaste.com.br" && url.pathname === "/") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
}
