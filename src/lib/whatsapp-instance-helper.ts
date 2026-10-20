export interface TargetInstanceResolution {
  name: string;
  exists: boolean;
  isNumberMatch: boolean;
  instanceData?: any;
}

export function normalizePhoneDigits(rawPhone: string): string {
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

export function resolveTargetInstance(
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

    // B. Procura por nome específico para este número (luvea_{num}, agendaste_{num} ou {num})
    const matchByName = existingInstances.find(
      (inst) =>
        inst.name === `luvea_${phoneDigits}` ||
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
    name: `luvea_${phoneDigits}`,
    exists: false,
    isNumberMatch: false,
    instanceData: null,
  };
}
