import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface LookupProduct {
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  size?: string;
  imageUrl?: string;
  intendedUse?: "retail" | "service" | "both";
  source: string;
}

/**
 * Normaliza categoria bruta para os padrões editoriais do Luvea Studio
 */
function normalizeCategory(rawCategory: string | undefined): string {
  if (!rawCategory) return "Cosméticos";
  const lower = rawCategory.toLowerCase();

  if (
    lower.includes("cabelo") ||
    lower.includes("hair") ||
    lower.includes("shampoo") ||
    lower.includes("condicionador") ||
    lower.includes("cheveux") ||
    lower.includes("colora")
  ) {
    return "Cabelo";
  }
  if (
    lower.includes("facial") ||
    lower.includes("rosto") ||
    lower.includes("skin") ||
    lower.includes("peau") ||
    lower.includes("sérum") ||
    lower.includes("serum")
  ) {
    return "Facial";
  }
  if (
    lower.includes("corpo") ||
    lower.includes("body") ||
    lower.includes("banho") ||
    lower.includes("hidratante")
  ) {
    return "Corpo & Banho";
  }
  if (
    lower.includes("unha") ||
    lower.includes("nail") ||
    lower.includes("esmalte")
  ) {
    return "Unhas";
  }
  if (
    lower.includes("maquiagem") ||
    lower.includes("makeup") ||
    lower.includes("make-up")
  ) {
    return "Maquiagem";
  }
  if (
    lower.includes("barba") ||
    lower.includes("beard") ||
    lower.includes("masculino") ||
    lower.includes("men")
  ) {
    return "Barba & Masculino";
  }
  if (
    lower.includes("livro") ||
    lower.includes("book") ||
    lower.includes("literatura") ||
    lower.includes("isbn")
  ) {
    return "Livros & Materiais";
  }

  return "Cosméticos";
}

/**
 * Extrai volume/tamanho a partir do nome ou quantidade bruta
 */
function extractSize(rawName: string, rawQuantity?: string): string {
  if (rawQuantity && rawQuantity.trim()) {
    return rawQuantity.trim();
  }
  const match = rawName.match(
    /\b(\d+(?:[.,]\d+)?\s*(?:ml|l|litros?|g|mg|kg|unidades?|un|cps|cpd|caps|comprimidos|doses))\b/i
  );
  return match ? match[1].trim() : "";
}

/**
 * Consulta a federação Open Facts (Open Beauty Facts, Open Products Facts, Open Food Facts)
 */
async function queryOpenFacts(cleanBarcode: string): Promise<LookupProduct | null> {
  const endpoints = [
    {
      id: "open_beauty_facts",
      url: `https://world.openbeautyfacts.org/api/v2/product/${cleanBarcode}.json`,
    },
    {
      id: "open_products_facts",
      url: `https://world.openproductsfacts.org/api/v2/product/${cleanBarcode}.json`,
    },
    {
      id: "open_food_facts",
      url: `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    },
  ];

  // Dispara consultas em paralelo com timeout de 3.5 segundos
  const promises = endpoints.map(async ({ id, url }) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "LuveaStudio-Catalog/1.0 (contato@luvea.app; +https://luvea.app)",
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) return null;
      const data = await res.json().catch(() => null);

      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const name = (
          p.product_name_pt ||
          p.product_name ||
          p.generic_name_pt ||
          p.generic_name ||
          ""
        ).trim();

        if (name) {
          const brand = (p.brands || p.brand_owner || "")
            .split(",")[0]
            .trim();
          const imageUrl =
            p.image_url ||
            p.image_front_url ||
            p.image_front_small_url ||
            "";
          const rawQuantity = p.quantity || "";
          const size = extractSize(name, rawQuantity);
          const category = normalizeCategory(p.categories || "");

          return {
            name,
            brand,
            category,
            size,
            imageUrl,
            description: p.generic_name || p.ingredients_text_pt || "",
            intendedUse: "both" as const,
            source: id,
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  // Prioriza Open Beauty Facts > Open Products Facts > Open Food Facts
  return results.find((r) => r !== null) || null;
}

/**
 * Consulta BrasilAPI (CBL - Câmara Brasileira do Livro / Mercado Editorial) para ISBNs brasileiros
 */
async function queryBrasilApiIsbn(cleanBarcode: string): Promise<LookupProduct | null> {
  if (!cleanBarcode.startsWith("978") && !cleanBarcode.startsWith("979")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const url = `https://brasilapi.com.br/api/isbn/v1/${cleanBarcode}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LuveaStudio-Catalog/1.0 (contato@luvea.app)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const book = await res.json().catch(() => null);

    if (book && book.title) {
      const publisher = book.publisher || "";
      const author = Array.isArray(book.authors)
        ? book.authors.join(", ")
        : typeof book.authors === "string"
        ? book.authors
        : "";
      const brand = publisher || author || "Editora";
      const size = book.page_count ? `${book.page_count} págs` : book.format || "";
      const description =
        book.synopsis ||
        [
          author ? `Autoria: ${author}` : "",
          book.year ? `Ano: ${book.year}` : "",
          book.location ? `Local: ${book.location}` : "",
        ]
          .filter(Boolean)
          .join(" • ");

      return {
        name: book.title + (book.subtitle ? ` - ${book.subtitle}` : ""),
        brand,
        category: "Livros & Materiais",
        size,
        imageUrl: book.cover_url || "",
        description,
        intendedUse: "retail" as const,
        source: `brasilapi_${book.provider || "cbl"}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Consulta Open Library para ISBNs (livros iniciados por 978 ou 979)
 */
async function queryOpenLibrary(cleanBarcode: string): Promise<LookupProduct | null> {
  if (!cleanBarcode.startsWith("978") && !cleanBarcode.startsWith("979")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanBarcode}&format=json&jscmd=data`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LuveaStudio-Catalog/1.0 (contato@luvea.app)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const key = `ISBN:${cleanBarcode}`;
    const book = data?.[key];

    if (book && book.title) {
      const publisher = book.publishers?.[0]?.name || "";
      const author = book.authors?.[0]?.name || "";
      const brand = publisher || author;
      const imageUrl = book.cover?.large || book.cover?.medium || "";
      const size = book.number_of_pages ? `${book.number_of_pages} págs` : "";

      return {
        name: book.title,
        brand,
        category: "Livros & Materiais",
        size,
        imageUrl,
        description: book.notes || (author ? `Autor: ${author}` : ""),
        intendedUse: "retail" as const,
        source: "open_library",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Consulta Bluesoft Cosmos caso o estúdio ou operador configure COSMOS_TOKEN no .env
 */
async function queryCosmosToken(cleanBarcode: string): Promise<LookupProduct | null> {
  const token = process.env.COSMOS_TOKEN || process.env.BLUESOFT_TOKEN;
  if (!token) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const url = `https://api.cosmos.bluesoft.com.br/gtins/${cleanBarcode}`;
    const res = await fetch(url, {
      headers: {
        "X-Cosmos-Token": token,
        "User-Agent": "LuveaStudio-App",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const p = await res.json().catch(() => null);

    if (p && p.description) {
      const name = p.description.trim();
      const brand = p.brand?.name || "";
      const imageUrl = p.thumbnail || "";
      const size = extractSize(name, p.net_weight);
      const category = normalizeCategory(p.gpc?.description || p.ncm?.full_description || "");

      return {
        name,
        brand,
        category,
        size,
        imageUrl,
        description: p.ncm?.full_description || "",
        intendedUse: "both" as const,
        source: "cosmos",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawBarcode = searchParams.get("barcode");

  if (!rawBarcode || typeof rawBarcode !== "string") {
    return NextResponse.json(
      { found: false, error: "Parâmetro barcode ausente ou inválido." },
      { status: 400 }
    );
  }

  const clean = rawBarcode.trim().replace(/[\s\-_.]/g, "");
  const digits = clean.replace(/\D/g, "");

  if (!digits || digits.length < 6) {
    return NextResponse.json(
      { found: false, barcode: rawBarcode, error: "Código de barras inválido." },
      { status: 400 }
    );
  }

  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  };

  // 1. Tenta Bluesoft Cosmos se token estiver configurado
  const cosmosResult = await queryCosmosToken(digits);
  if (cosmosResult) {
    return NextResponse.json(
      {
        found: true,
        barcode: rawBarcode,
        product: cosmosResult,
      },
      { headers: cacheHeaders }
    );
  }

  // 2. Se for formato de livro (ISBN 978/979), tenta primeiro BrasilAPI (CBL) e depois Open Library
  if (digits.startsWith("978") || digits.startsWith("979")) {
    const brasilApiResult = await queryBrasilApiIsbn(digits);
    if (brasilApiResult) {
      return NextResponse.json(
        {
          found: true,
          barcode: rawBarcode,
          product: brasilApiResult,
        },
        { headers: cacheHeaders }
      );
    }

    const bookResult = await queryOpenLibrary(digits);
    if (bookResult) {
      return NextResponse.json(
        {
          found: true,
          barcode: rawBarcode,
          product: bookResult,
        },
        { headers: cacheHeaders }
      );
    }
  }

  // 3. Consulta federação pública Open Facts (Open Beauty Facts, Open Products Facts, Open Food Facts)
  const openFactsResult = await queryOpenFacts(digits);
  if (openFactsResult) {
    return NextResponse.json(
      {
        found: true,
        barcode: rawBarcode,
        product: openFactsResult,
      },
      { headers: cacheHeaders }
    );
  }

  // Se não foi encontrado em nenhuma base pública gratuita
  return NextResponse.json({
    found: false,
    barcode: rawBarcode,
    message: "Código de barras não localizado nas bases públicas.",
  });
}
