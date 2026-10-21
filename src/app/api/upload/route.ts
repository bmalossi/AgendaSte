import { isR2Configured, uploadBufferToR2 } from "@/lib/cloudflare-r2";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export async function POST(req: Request) {
  try {
    if (isSupabaseConfigured() && process.env.NODE_ENV === "production") {
      try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
            },
          }
        );
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return Response.json(
            { error: "Acesso não autorizado para upload de arquivos." },
            { status: 401 }
          );
        }
      } catch (authErr) {
        console.warn("[Upload Auth Check]", authErr);
      }
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "geral";

    if (!file || !(file instanceof Blob)) {
      return Response.json(
        { error: "Nenhum arquivo enviado no campo 'file'." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: "O tamanho do arquivo excede o limite máximo permitido de 10MB." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return Response.json(
        {
          error:
            "Formato não suportado. Por favor, envie imagens JPG, PNG, WEBP, GIF ou HEIC.",
        },
        { status: 400 }
      );
    }

    // Se a Cloudflare R2 ainda não estiver configurada no .env.local, avisa o cliente
    if (!isR2Configured()) {
      return Response.json(
        {
          success: false,
          configured: false,
          message:
            "Cloudflare R2 não está configurada no .env.local. Adicione as chaves de acesso R2 para ativar o armazenamento permanente na nuvem.",
        },
        { status: 200 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gera um nome de arquivo limpo e único
    const originalName = file instanceof File ? file.name : "upload.jpg";
    const sanitizedName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sanitizedFolder = folder.replace(/[^a-z0-9_-]/gi, "");
    const key = `${sanitizedFolder}/${uniquePrefix}-${sanitizedName}`;

    const uploadResult = await uploadBufferToR2({
      buffer,
      key,
      contentType: mimeType,
    });

    return Response.json({
      success: true,
      configured: true,
      url: uploadResult.url,
      key: uploadResult.key,
      filename: originalName,
      size: file.size,
      mimeType,
    });
  } catch (error: unknown) {
    console.error("Erro no upload para Cloudflare R2:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido ao processar upload";

    return Response.json(
      {
        error: "Falha ao enviar arquivo para o armazenamento Cloudflare R2.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
