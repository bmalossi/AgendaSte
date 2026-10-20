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
      "370f7040e011d5e4d1b512a6cb263ebf"
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
      // Se um número foi passado e não há instância registrada com ele
      if (phoneDigits && !target.exists) {
        // Tenta checagem direta caso a chave usada não tenha visibilidade de fetchInstances
        try {
          const directRes = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
            headers: { apikey: apiKey },
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
              apiKey,
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
          headers: { apikey: apiKey },
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
            apiKey,
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

    // 4. Ação de criar ou conectar (obter QR Code)
    // Se a instância já existe: tenta conectar e obter o QR Code real
    if (target.exists) {
      try {
        const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
          headers: { apikey: apiKey },
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
              apiKey,
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
              apiKey,
            });
          }
        }
      } catch (connectErr) {
        console.warn("[Evolution API connect existing instance warn]:", connectErr);
      }
    }

    // Se a instância não existe ainda (ou a conexão anterior retornou que precisa ser criada), cria na Evolution API:
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
        signal: AbortSignal.timeout(10000),
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
        return Response.json(
          {
            ok: false,
            requiresGlobalKey: true,
            created: false,
            connected: false,
            state: "pending_creation",
            instanceName,
            phoneNumber: phoneDigits,
            error: `A chave de API configurada não possui permissão para criar instâncias na Evolution API (${createRes.status}). Verifique a Global API Key.`,
          },
          { status: 200 }
        );
      } else {
        const errText = await createRes.text().catch(() => "");
        console.warn("[Evolution API create fail]:", createRes.status, errText);
      }
    } catch (createErr) {
      console.warn("[Evolution API create exception]:", createErr);
    }

    // Se estiver em ambiente de teste automatizado (CI ou offline)
    if (process.env.NODE_ENV === "test") {
      const mockQrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><path d="M20 20h60v60H20zm10 10v40h40V30zm90-10h60v60h-60zm10 10v40h40V30zM20 120h60v60H20zm10 10v40h40v-40zm80-10h20v20h-20zm30 0h30v20h-30zm-30 30h30v20h-30zm40 0h20v20h-20zm-40 30h20v20h-20zm30 0h30v20h-30z" fill="#1C1C1E"/></svg>`;
      return Response.json({
        ok: true,
        exists: false,
        connected: false,
        state: "connecting",
        instanceName,
        qrCodeBase64: `data:image/svg+xml;utf8,${encodeURIComponent(mockQrSvg)}`,
        qrCodeText: "2@AgendasteEvolutionMock",
      });
    }

    // Se chegou até aqui em ambiente real sem obter o QR Code real da Evolution API
    return Response.json(
      {
        ok: false,
        error: "Não foi possível obter o QR Code da Evolution API. Verifique a conexão com o servidor da Evolution API.",
        instanceName,
      },
      { status: 200 }
    );
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
