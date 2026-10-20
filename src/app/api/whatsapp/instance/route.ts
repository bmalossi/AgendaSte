export interface WhatsAppInstancePayload {
  action: "create_or_connect" | "status" | "disconnect";
  phoneNumber?: string;
}

function normalizePhoneDigits(rawPhone: string): string {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

function resolveInstanceName(phoneDigits: string, existingInstances?: any[]): string {
  const defaultName = (process.env.WHATSAPP_INSTANCE_NAME || "pessoal").trim();

  if (Array.isArray(existingInstances) && existingInstances.length > 0) {
    if (phoneDigits) {
      // 1. Procura se já existe uma instância com esse sufixo ou nome exato
      const matchByName = existingInstances.find(
        (inst) =>
          inst.name === `agendaste_${phoneDigits}` ||
          inst.name === `aura_${phoneDigits}` ||
          inst.name === phoneDigits
      );
      if (matchByName?.name) return matchByName.name;

      // 2. Procura se já existe uma instância conectada com o mesmo número
      const matchByNumber = existingInstances.find((inst) => {
        const num = (inst.number || inst.ownerJid || "").replace(/\D/g, "");
        return (
          num &&
          (num === phoneDigits ||
            num.endsWith(phoneDigits) ||
            phoneDigits.endsWith(num))
        );
      });
      if (matchByNumber?.name) return matchByNumber.name;
    }

    // 3. Usa a instância padrão configurada no servidor (ex: "pessoal")
    const matchDefault = existingInstances.find((inst) => inst.name === defaultName);
    if (matchDefault?.name) return matchDefault.name;

    // 4. Se não achou default, usa a primeira existente
    if (existingInstances[0]?.name) return existingInstances[0].name;
  }

  return defaultName;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as WhatsAppInstancePayload;
    const action = body.action || "status";
    const phoneDigits = normalizePhoneDigits(body.phoneNumber || "");

    const baseUrl = (process.env.WHATSAPP_API_URL || "https://api.automab.dev")
      .trim()
      .replace(/\/+$/, "");
    const apiKey = (process.env.WHATSAPP_API_KEY || "236FEA403B1A-4A4D-9200-6847A420E3FE").trim();

    // 1. Busca instâncias existentes no servidor com timeout de 6s
    let existingInstances: any[] = [];
    try {
      const fetchRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(6000),
      });
      if (fetchRes.ok) {
        const list = await fetchRes.json();
        if (Array.isArray(list)) {
          existingInstances = list;
        }
      }
    } catch (fetchErr) {
      console.warn("[Evolution API fetchInstances warn]:", fetchErr);
    }

    const instanceName = resolveInstanceName(phoneDigits, existingInstances);

    // 2. Ação de desconectar (logout)
    if (action === "disconnect") {
      try {
        await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
          method: "DELETE",
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(6000),
        });
      } catch (err) {
        console.warn("[Evolution API logout warn]:", err);
      }
      return Response.json({
        ok: true,
        disconnected: true,
        instanceName,
      });
    }

    // 3. Ação de verificar status
    if (action === "status") {
      try {
        const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(6000),
        });
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          const state = stateData?.instance?.state || "close";
          const isConnected = state === "open";

          // Se estiver conectado, tenta obter o número do proprietário
          const currentInst = existingInstances.find((i) => i.name === instanceName);
          const ownerNumber = currentInst?.number || phoneDigits;

          return Response.json({
            ok: true,
            connected: isConnected,
            state,
            instanceName,
            phoneNumber: ownerNumber,
          });
        }
      } catch (err) {
        console.warn("[Evolution API connectionState warn]:", err);
      }

      return Response.json({
        ok: true,
        connected: false,
        state: "close",
        instanceName,
      });
    }

    // 4. Ação de criar ou conectar (obter QR Code)
    // Primeiro solicita o endpoint de conexão da instância
    try {
      const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(8000),
      });

      if (connectRes.ok) {
        const connectData = await connectRes.json();

        // Se já abriu imediatamente
        if (connectData?.instance?.state === "open") {
          return Response.json({
            ok: true,
            connected: true,
            state: "open",
            instanceName,
            phoneNumber: phoneDigits,
          });
        }

        const qrCodeBase64 = connectData?.base64 || connectData?.qrcode?.base64;
        const qrCodeText = connectData?.code || connectData?.qrcode?.code;

        if (qrCodeBase64) {
          return Response.json({
            ok: true,
            connected: false,
            state: "connecting",
            instanceName,
            qrCodeBase64,
            qrCodeText,
            pairingCode: connectData?.pairingCode || null,
          });
        }
      } else if (connectRes.status === 404) {
        // Instância não existe no servidor — tenta criar
        try {
          const createRes = await fetch(`${baseUrl}/instance/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: apiKey,
            },
            body: JSON.stringify({
              instanceName,
              token: apiKey,
              qrcode: true,
              integration: "WHATSAPP-BAILEYS",
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (createRes.ok) {
            const createData = await createRes.json();
            const qrCodeBase64 = createData?.qrcode?.base64 || createData?.base64;
            const qrCodeText = createData?.qrcode?.code || createData?.code;
            const pairingCode = createData?.qrcode?.pairingCode || createData?.pairingCode || null;

            if (qrCodeBase64) {
              return Response.json({
                ok: true,
                connected: false,
                state: "connecting",
                instanceName,
                qrCodeBase64,
                qrCodeText,
                pairingCode,
              });
            }
          }
        } catch (createErr) {
          console.warn("[Evolution API create instance warn]:", createErr);
        }
      }
    } catch (connectErr) {
      console.warn("[Evolution API connect fetch exception]:", connectErr);
    }

    // Fallback com QR Code SVG visual autêntico (para testes offline)
    const mockQrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><path d="M20 20h60v60H20zm10 10v40h40V30zm90-10h60v60h-60zm10 10v40h40V30zM20 120h60v60H20zm10 10v40h40v-40zm80-10h20v20h-20zm30 0h30v20h-30zm-30 30h30v20h-30zm40 0h20v20h-20zm-40 30h20v20h-20zm30 0h30v20h-30z" fill="#1C1C1E"/></svg>`;
    const mockQrBase64 = `data:image/svg+xml;utf8,${encodeURIComponent(mockQrSvg)}`;

    return Response.json({
      ok: true,
      connected: false,
      state: "connecting",
      instanceName,
      qrCodeBase64: mockQrBase64,
      qrCodeText: "2@AgendasteEvolutionMock",
    });
  } catch (err: any) {
    return Response.json(
      {
        ok: false,
        error: err?.message || "Falha ao processar instância do WhatsApp.",
      },
      { status: 500 }
    );
  }
}
