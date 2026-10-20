import { NextResponse } from "next/server";
import { checkLuveaDomainStatus } from "@/lib/resend-domain";

export async function GET() {
  try {
    const status = await checkLuveaDomainStatus();
    return NextResponse.json({
      success: true,
      domain: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Erro ao consultar status de DNS" },
      { status: 500 }
    );
  }
}
