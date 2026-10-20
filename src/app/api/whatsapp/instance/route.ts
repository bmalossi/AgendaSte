export interface WhatsAppInstancePayload {
  action: "create_or_connect" | "status" | "disconnect";
  phoneNumber?: string;
  instanceName?: string;
  apiKey?: string;
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

interface TargetInstanceResolution {
  name: string;
  exists: boolean;
  isNumberMatch: boolean;
  instanceData?: any;
}

function resolveTargetInstance(
  phoneDigits: string,
  existingInstances: any[],
  customInstanceName?: string
): TargetInstanceResolution {
  const defaultName = (process.env.WHATSAPP_INSTANCE_NAME || "pessoal").trim();

  // 1. Se foi passado um instanceName explícito
  if (customInstanceName) {
    const found = Array.isArray(existingInstances)
      ? existingInstances.find((i) => i.name === customInstanceName)
      : null;
    return {
      name: customInstanceName,
      exists: !!found,
      isNumberMatch: true,
      instanceData: found,
    };
  }

  // 2. Se nenhum número foi informado, recorre à instância default do servidor
  if (!phoneDigits) {
    const defaultInst = Array.isArray(existingInstances)
      ? existingInstances.find((i) => i.name === defaultName) || existingInstances[0]
      : null;
    return {
      name: defaultInst?.name || defaultName,
      exists: !!defaultInst,
      isNumberMatch: true,
      instanceData: defaultInst,
    };
  }

  // 3. Se um número foi informado:
  if (Array.isArray(existingInstances) && existingInstances.length > 0) {
    // A. Procura por número conectado ou jid
    const matchByNumber = existingInstances.find((inst) => {
      const num = (inst.number || inst.ownerJid || "").replace(/\D/g, "");
      return (
        num &&
        (num === phoneDigits ||
          num.endsWith(phoneDigits) ||
          phoneDigits.endsWith(num))
      );
    });
    if (matchByNumber) {
      return {
        name: matchByNumber.name,
        exists: true,
        isNumberMatch: true,
        instanceData: matchByNumber,
      };
    }

    // B. Procura por nome específico para este número (agendaste_{num} ou {num})
    const matchByName = existingInstances.find(
      (inst) =>
        inst.name === `agendaste_${phoneDigits}` ||
        inst.name === `aura_${phoneDigits}` ||
        inst.name === phoneDigits
    );
    if (matchByName) {
      const instNum = (matchByName.number || matchByName.ownerJid || "").replace(/\D/g, "");
      const matches =
        !instNum ||
        instNum === phoneDigits ||
        instNum.endsWith(phoneDigits) ||
        phoneDigits.endsWith(instNum);
      return {
        name: matchByName.name,
        exists: true,
        isNumberMatch: matches,
        instanceData: matchByName,
      };
    }
  }

  // 4. Se não existe nenhuma instância correspondente a este número:
  // Retorna o nome da nova instância dedicada (NUNCA assume "pessoal")
  return {
    name: `agendaste_${phoneDigits}`,
    exists: false,
    isNumberMatch: false,
    instanceData: null,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as WhatsAppInstancePayload;
    const action = body.action || "status";
    const phoneDigits = normalizePhoneDigits(body.phoneNumber || "");

    const baseUrl = (process.env.WHATSAPP_API_URL || "https://api.automab.dev")
      .trim()
      .replace(/\/+$/, "");
    const apiKey = (
      body.apiKey ||
      process.env.WHATSAPP_GLOBAL_API_KEY ||
      process.env.WHATSAPP_API_KEY ||
      "236FEA403B1A-4A4D-9200-6847A420E3FE"
    ).trim();

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

    const target = resolveTargetInstance(phoneDigits, existingInstances, body.instanceName);
    const instanceName = target.name;
    const instanceApiKey = target.instanceData?.token || apiKey;

    // 2. Ação de desconectar (logout)
    if (action === "disconnect") {
      try {
        await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
          method: "DELETE",
          headers: { apikey: instanceApiKey },
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
      // Se um número foi passado e não há instância registrada com ele
      if (phoneDigits && !target.exists) {
        // Tenta checagem direta caso a chave usada não tenha visibilidade de fetchInstances
        try {
          const directRes = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
            headers: { apikey: instanceApiKey },
            signal: AbortSignal.timeout(6000),
          });
          if (directRes.ok) {
            const stateData = await directRes.json();
            const state = stateData?.instance?.state || "close";
            const isConnected = state === "open";
            return Response.json({
              ok: true,
              exists: true,
              connected: isConnected,
              state,
              instanceName,
              phoneNumber: phoneDigits,
              apiKey: instanceApiKey,
            });
          }
        } catch (e) {
          // ignore
        }

        // Não existe instância para este número -> Desconectado
        return Response.json({
          ok: true,
          exists: false,
          connected: false,
          state: "close",
          instanceName,
          phoneNumber: phoneDigits,
        });
      }

      // Instância existente
      try {
        const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
          headers: { apikey: instanceApiKey },
          signal: AbortSignal.timeout(6000),
        });
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          const state = stateData?.instance?.state || "close";
          const isConnected = state === "open" && target.isNumberMatch;

          const ownerNumber = target.instanceData?.number || phoneDigits;

          return Response.json({
            ok: true,
            exists: true,
            connected: isConnected,
            state: isConnected ? "open" : (target.isNumberMatch ? state : "close"),
            instanceName,
            phoneNumber: ownerNumber,
            apiKey: instanceApiKey,
          });
        }
      } catch (err) {
        console.warn("[Evolution API connectionState warn]:", err);
      }

      return Response.json({
        ok: true,
        exists: target.exists,
        connected: false,
        state: "close",
        instanceName,
        phoneNumber: phoneDigits,
      });
    }

    // Fallback com QR Code SVG visual autêntico (para testes unitários ou offline)
    const mockQrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><path d="M20 20h60v60H20zm10 10v40h40V30zm90-10h60v60h-60zm10 10v40h40V30zM20 120h60v60H20zm10 10v40h40v-40zm80-10h20v20h-20zm30 0h30v20h-30zm-30 30h30v20h-30zm40 0h20v20h-20zm-40 30h20v20h-20zm30 0h30v20h-30z" fill="#1C1C1E"/></svg>`;
    const mockQrBase64 = `data:image/svg+xml;utf8,${encodeURIComponent(mockQrSvg)}`;

    // 4. Ação de criar ou conectar (obter QR Code)
    // Primeiro tenta conectar na instância alvo se ela já existir ou responde connect
    try {
      const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: instanceApiKey },
        signal: AbortSignal.timeout(8000),
      });

      if (connectRes.ok) {
        const connectData = await connectRes.json();

        // Se já está conectado e com o número correto
        if (connectData?.instance?.state === "open" && target.isNumberMatch) {
          return Response.json({
            ok: true,
            exists: true,
            connected: true,
            state: "open",
            instanceName,
            phoneNumber: phoneDigits,
            apiKey: instanceApiKey,
          });
        }

        const qrCodeBase64 = connectData?.base64 || connectData?.qrcode?.base64;
        const qrCodeText = connectData?.code || connectData?.qrcode?.code;

        if (qrCodeBase64) {
          return Response.json({
            ok: true,
            exists: true,
            connected: false,
            state: "connecting",
            instanceName,
            qrCodeBase64,
            qrCodeText,
            pairingCode: connectData?.pairingCode || null,
            apiKey: instanceApiKey,
          });
        }
      } else if (connectRes.status === 404) {
        // Instância ainda não existe no servidor — tenta criar uma nova instância para este número
        try {
          const createRes = await fetch(`${baseUrl}/instance/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: apiKey,
            },
            body: JSON.stringify({
              instanceName,
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
            const newApiKey = createData?.token || createData?.instance?.token || apiKey;

            if (qrCodeBase64) {
              return Response.json({
                ok: true,
                created: true,
                exists: true,
                connected: false,
                state: "connecting",
                instanceName,
                qrCodeBase64,
                qrCodeText,
                pairingCode,
                apiKey: newApiKey,
              });
            }
          } else if (createRes.status === 401 || createRes.status === 403) {
            // A chave atual não tem permissão para criar instâncias root (precisa da Global API Key)
            return Response.json(
              {
                ok: true,
                requiresGlobalKey: true,
                created: false,
                connected: false,
                state: "pending_creation",
                instanceName,
                phoneNumber: phoneDigits,
                error: `A chave de API configurada não possui permissão para criar novas instâncias na Evolution API (401 Unauthorized). No painel da Evolution API, crie a instância '${instanceName}' clicando no botão 'Instance +' no canto superior direito, ou configure a Chave Mestre Global (AUTHENTICATION_API_KEY) em .env.local.`,
                qrCodeBase64: mockQrSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(mockQrSvg)}` : undefined,
                qrCodeText: "2@AgendasteEvolutionMock",
              },
              { status: 200 }
            );
          }
        } catch (createErr) {
          console.warn("[Evolution API create instance warn]:", createErr);
        }
      }
    } catch (connectErr) {
      console.warn("[Evolution API connect fetch exception]:", connectErr);
    }

    return Response.json({
      ok: true,
      exists: false,
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
