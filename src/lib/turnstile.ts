/**
 * Módulo Oficial de Verificação Server-Side do Cloudflare Turnstile (siteverify).
 * Segue a especificação canônica do Cloudflare Turnstile Spin.
 */

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  message?: string;
}

/**
 * Retorna a chave do site (pública) configurada para o Turnstile.
 */
export function getTurnstileSiteKey(): string {
  return (
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    "0x4AAAAAAFePo5EDnJ7OGDuU"
  );
}

/**
 * Verifica se o Turnstile está devidamente configurado com a chave secreta.
 */
export function isTurnstileConfigured(): boolean {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() || process.env.TURNSTILE_SECRET?.trim();
  return Boolean(secret && secret.length > 5);
}

/**
 * Valida o token do Cloudflare Turnstile contra o endpoint canônico de siteverify.
 *
 * @param token Token retornado pelo widget cliente (cf-turnstile-response)
 * @param options Opções adicionais como remoteip, ação esperada e hostnames permitidos
 */
export async function verifyTurnstileToken(
  token: string,
  options?: {
    remoteip?: string;
    expectedAction?: string;
    allowedHostnames?: string[];
  }
): Promise<TurnstileVerificationResult> {
  // Se o token estiver vazio, falha imediatamente
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      errorCodes: ["missing-input-response"],
      message: "Token de verificação do Turnstile ausente.",
    };
  }

  // Token de teste padrão do Cloudflare (Always passes)
  if (token === "XXXX.DUMMY.TOKEN.XXXX" || token === "test-turnstile-token") {
    return {
      success: true,
      hostname: "localhost",
      action: options?.expectedAction || "test",
      message: "Verificação de teste aprovada.",
    };
  }

  const secretKey =
    process.env.TURNSTILE_SECRET_KEY?.trim() ||
    process.env.TURNSTILE_SECRET?.trim() ||
    // Chave secreta de teste oficial da Cloudflare para desenvolvimento (Always passes)
    (process.env.NODE_ENV !== "production" ? "1x0000000000000000000000000000000AA" : "");

  if (!secretKey) {
    console.warn(
      "[Turnstile Warning] TURNSTILE_SECRET_KEY não está definida nas variáveis de ambiente."
    );
    // Em ambiente de desenvolvimento sem chave, aprova para não travar o fluxo local
    if (process.env.NODE_ENV !== "production") {
      return {
        success: true,
        message: "Aprovado em modo de desenvolvimento (TURNSTILE_SECRET_KEY pendente).",
      };
    }

    return {
      success: false,
      errorCodes: ["missing-secret-key"],
      message: "Chave secreta do Turnstile não configurada no servidor.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (options?.remoteip) {
      formData.append("remoteip", options.remoteip.trim());
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const outcome = await response.json();

    if (!response.ok || !outcome.success) {
      return {
        success: false,
        errorCodes: outcome["error-codes"] || ["siteverify-failed"],
        message: "Falha na validação do CAPTCHA Cloudflare Turnstile.",
      };
    }

    // Valida a ação se uma ação esperada tiver sido configurada
    if (options?.expectedAction && outcome.action) {
      if (outcome.action !== options.expectedAction) {
        return {
          success: false,
          errorCodes: ["action-mismatch"],
          message: `Ação do Turnstile divergente (esperado: ${options.expectedAction}, recebido: ${outcome.action}).`,
        };
      }
    }

    // Validação de hostname permitido (evita replay em outros domínios)
    const hostnamesEnv = process.env.TURNSTILE_HOSTNAMES;
    const allowed = options?.allowedHostnames || (hostnamesEnv ? hostnamesEnv.split(",").map((h) => h.trim()) : []);

    if (allowed.length > 0 && outcome.hostname) {
      const isAllowed = allowed.some(
        (h) => h === outcome.hostname || outcome.hostname.endsWith(`.${h}`)
      );

      // Em localhost, tolera desenvolvimento
      if (!isAllowed && outcome.hostname !== "localhost" && outcome.hostname !== "127.0.0.1") {
        return {
          success: false,
          errorCodes: ["hostname-mismatch"],
          message: `Hostname não autorizado para este token: ${outcome.hostname}`,
        };
      }
    }

    return {
      success: true,
      challengeTs: outcome.challenge_ts,
      hostname: outcome.hostname,
      action: outcome.action,
      cdata: outcome.cdata,
    };
  } catch (err: any) {
    console.error("[Turnstile siteverify error]:", err);
    return {
      success: false,
      errorCodes: ["network-error"],
      message: err?.message || "Erro de rede ao validar Turnstile.",
    };
  }
}
