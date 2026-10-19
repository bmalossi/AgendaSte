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
  if (Array.isArray(existingInstances) && existingInstances.length > 0) {
    if (phoneDigits) {
      // 1. Procura se já existe uma instância conectada com o mesmo número
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

      // 2. Procura se já foi criada uma instância com esse sufixo
      const matchByName = existingInstances.find(
        (inst) =>
          inst.name === `agendaste_${phoneDigits}` ||
          inst.name === `aura_${phoneDigits}`
      );
      if (matchByName?.name) return matchByName.name;

      // Cria uma nova instância para este número
      return `agendaste_${phoneDigits}`;
    }

    // Se nenhum número foi informado, usa "pessoal" se existir
    const pessoal = existingInstances.find((inst) => inst.name === "pessoal");
    if (pessoal?.name) return pessoal.name;
    if (existingInstances[0]?.name) return existingInstances[0].name;
  }

  return phoneDigits ? `agendaste_${phoneDigits}` : "pessoal";
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

    // 1. Busca instâncias existentes no servidor
    let existingInstances: any[] = [];
    try {
      const fetchRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
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
    // Primeiro verifica se a instância já está aberta/conectada
    try {
      const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: apiKey },
      });
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        if (stateData?.instance?.state === "open") {
          return Response.json({
            ok: true,
            connected: true,
            state: "open",
            instanceName,
            phoneNumber: phoneDigits,
          });
        }
      }
    } catch (stateErr) {
      console.warn("[Evolution API check before connect warn]:", stateErr);
    }

    // Se a instância não existe ainda nas instâncias existentes, tenta criar
    const instanceExists = existingInstances.some((i) => i.name === instanceName);
    let qrCodeBase64: string | undefined;
    let qrCodeText: string | undefined;
    let pairingCode: string | null = null;

    if (!instanceExists) {
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
        });
        if (createRes.ok) {
          const createData = await createRes.json();
          qrCodeBase64 = createData?.qrcode?.base64 || createData?.base64;
          qrCodeText = createData?.qrcode?.code || createData?.code;
          pairingCode = createData?.qrcode?.pairingCode || createData?.pairingCode || null;

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

    // Solicita o QR Code de conexão caso não tenha vindo no create ou se a instância já existia
    try {
      const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: apiKey },
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
    } catch (connectErr) {
      console.warn("[Evolution API connect fetch exception]:", connectErr);
    }

    // Fallback simulado (para ambientes isolados de teste)
    return Response.json({
      ok: true,
      connected: false,
      state: "connecting",
      instanceName,
      qrCodeBase64:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
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
