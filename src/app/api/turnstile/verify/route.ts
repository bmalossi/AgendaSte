import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body.token || body["cf-turnstile-response"];
    const action = body.action;

    const remoteip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined;

    const result = await verifyTurnstileToken(token, {
      remoteip,
      expectedAction: action,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Falha na verificação de segurança.",
          errorCodes: result.errorCodes,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verificação de segurança aprovada.",
      hostname: result.hostname,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Erro interno de validação." },
      { status: 500 }
    );
  }
}
