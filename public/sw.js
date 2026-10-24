// ============================================================================
// LUVEA Progressive Web App (PWA) Service Worker
// Version: 1.1.0 — High-Performance & Resilient Multi-Platform Caching
// ============================================================================

const CACHE_VERSION = "luvea-v1.1.0";
const STATIC_CACHE = `luvea-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `luvea-runtime-${CACHE_VERSION}`;

// Assets essenciais precacheados na instalação
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

// Domínios externos e caminhos que NUNCA devem ser interceptados
const BYPASS_PATHS = ["/api/", "/auth/"];
const BYPASS_HOSTS = [
  "supabase.co",
  "mercadopago.com",
  "stripe.com",
  "cloudflare.com",
  "challenges.cloudflare.com",
];

// 1. Instalação: Cacheia assets estáticos fundamentais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[PWA SW] Falha ao pré-cachear assets:", err))
  );
});

// 2. Ativação: Limpeza imediata de versões antigas e assume controle dos clientes
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Listener de mensagens para atualização sem bloqueio
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 4. Interceptação de requisições
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // A. Ignora métodos que não sejam GET ou protocolos não HTTP(S)
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // B. Ignora Next.js Server Actions, chamadas RSC e WebSockets
  if (
    request.headers.get("Next-Action") ||
    request.headers.get("RSC") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  // C. Ignora estritamente APIs, autenticação SSR, webhooks e provedores externos
  if (
    BYPASS_PATHS.some((path) => url.pathname.startsWith(path)) ||
    BYPASS_HOSTS.some((host) => url.hostname.includes(host))
  ) {
    return;
  }

  // D. Assets estáticos do Next.js e ícones pré-cacheados (Cache-First com revalidação)
  const isStaticChunk = url.pathname.startsWith("/_next/static/");
  const isPrecachedAsset = PRECACHE_ASSETS.includes(url.pathname);

  if (isStaticChunk || isPrecachedAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalida em background para manter fresco se não for hash imutável
          if (!isStaticChunk) {
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(STATIC_CACHE).then((cache) => {
                    cache.put(request, networkResponse);
                  });
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }

        // Se não estava no cache, busca na rede e guarda no runtime cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(isPrecachedAsset ? STATIC_CACHE : RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // E. Navegação de páginas HTML: Network First (garante sempre dados em tempo real da agenda)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Se estiver completamente offline, tenta retornar o shell salvo
        const fallback = await caches.match("/app");
        if (fallback) return fallback;

        return new Response(
          `<!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>LUVEA · Modo Offline</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #141416; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
                .card { max-width: 360px; background: #1c1c20; border: 1px solid #2e2e32; border-radius: 24px; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #fff; color: #141416; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 13.5px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 12px;">LUVEA</div>
                <h2 style="font-size: 18px; margin: 0 0 8px 0;">Sem conexão no momento</h2>
                <p style="font-size: 13px; color: #8e8e93; line-height: 1.5; margin: 0;">
                  Seu estúdio precisa de conexão à internet para sincronizar agendamentos em tempo real.
                </p>
                <a href="/app" class="btn" onclick="window.location.reload(); return false;">Tentar reconectar</a>
              </div>
            </body>
          </html>`,
          {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      })
    );
    return;
  }
});
