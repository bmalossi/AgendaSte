import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  maskNameLGPD,
  deriveAppointmentStatus,
  deriveClientPresenceStatus,
  generatePairingCode,
  filterTVAppointments,
  buildTVPollingResponse,
  paginateProfessionals,
  type RawTVAppointment,
  type RawTVProfessional,
  type RawTVOrganization,
} from "../tv-kiosk.ts";

describe("Ticket 01 — Módulo de Domínio Puro LUVEA TV Kiosk", () => {
  describe("1. maskNameLGPD", () => {
    it("mascara nomes brasileiros completos pulando preposições comuns", () => {
      assert.equal(maskNameLGPD("Mariana da Silva Oliveira"), "Mariana O.");
      assert.equal(maskNameLGPD("Ana de Souza"), "Ana S.");
      assert.equal(maskNameLGPD("Carlos dos Santos"), "Carlos S.");
      assert.equal(maskNameLGPD("Beatriz e Silva"), "Beatriz S.");
      assert.equal(maskNameLGPD("Lucas do Carmo"), "Lucas C.");
      assert.equal(maskNameLGPD("Juliana das Neves"), "Juliana N.");
    });

    it("lida com nomes de palavra única ou vazios", () => {
      assert.equal(maskNameLGPD("Mariana"), "Mariana");
      assert.equal(maskNameLGPD(""), "Cliente");
      assert.equal(maskNameLGPD("   "), "Cliente");
    });

    it("lida com nomes simples de duas palavras", () => {
      assert.equal(maskNameLGPD("Bruno Souza"), "Bruno S.");
      assert.equal(maskNameLGPD("Fernanda Lima"), "Fernanda L.");
    });

    it("lida com preposições no último sobrenome se o nome terminar nelas", () => {
      // Caso incomum: "João da" -> "João" ou inicial da primeira válida
      assert.equal(maskNameLGPD("João Silva da"), "João S.");
    });
  });

  describe("2. generatePairingCode", () => {
    it("gera código numérico de 6 dígitos", () => {
      const code = generatePairingCode();
      assert.equal(typeof code, "string");
      assert.equal(code.length, 6);
      assert.match(code, /^\d{6}$/);
    });

    it("gera códigos aleatórios e diferentes em chamadas consecutivas", () => {
      const set = new Set<string>();
      for (let i = 0; i < 50; i++) {
        set.add(generatePairingCode());
      }
      assert.ok(set.size > 40);
    });
  });

  describe("3. deriveAppointmentStatus", () => {
    const baseAppointment = {
      id: "apt-1",
      starts_at: "2026-10-22T14:00:00Z",
      ends_at: "2026-10-22T15:00:00Z",
      status: "confirmed",
    };

    it("retorna 'completed' para agendamentos já marcados como completed", () => {
      const res = deriveAppointmentStatus(
        { ...baseAppointment, status: "completed" },
        new Date("2026-10-22T14:30:00Z")
      );
      assert.equal(res, "completed");
    });

    it("retorna 'waiting' para agendamentos pendentes de confirmação", () => {
      const res = deriveAppointmentStatus(
        { ...baseAppointment, status: "pending" },
        new Date("2026-10-22T13:30:00Z")
      );
      assert.equal(res, "waiting");
    });

    it("retorna 'next' para agendamentos confirmados antes do início", () => {
      const res = deriveAppointmentStatus(
        baseAppointment,
        new Date("2026-10-22T13:59:59Z")
      );
      assert.equal(res, "next");
    });

    it("retorna 'in_progress' exatamente no início e durante a execução", () => {
      // Exatamente no início
      assert.equal(
        deriveAppointmentStatus(baseAppointment, new Date("2026-10-22T14:00:00Z")),
        "in_progress"
      );
      // No meio
      assert.equal(
        deriveAppointmentStatus(baseAppointment, new Date("2026-10-22T14:30:00Z")),
        "in_progress"
      );
      // 1 segundo antes do fim
      assert.equal(
        deriveAppointmentStatus(baseAppointment, new Date("2026-10-22T14:59:59Z")),
        "in_progress"
      );
    });

    it("retorna 'delayed' quando o horário previsto já terminou mas status ainda é confirmed", () => {
      // Exatamente no fim
      assert.equal(
        deriveAppointmentStatus(baseAppointment, new Date("2026-10-22T15:00:00Z")),
        "delayed"
      );
      // Após o fim
      assert.equal(
        deriveAppointmentStatus(baseAppointment, new Date("2026-10-22T15:15:00Z")),
        "delayed"
      );
    });
  });

  describe("4. filterTVAppointments", () => {
    it("remove agendamentos cancelados e no-show, preservando confirmed, completed e pending", () => {
      const list: Array<{ id: string; status: string }> = [
        { id: "1", status: "confirmed" },
        { id: "2", status: "canceled" },
        { id: "3", status: "completed" },
        { id: "4", status: "no_show" },
        { id: "5", status: "pending" },
      ];
      const filtered = filterTVAppointments(list);
      assert.equal(filtered.length, 3);
      assert.deepEqual(
        filtered.map((a) => a.id),
        ["1", "3", "5"]
      );
    });
  });

  describe("5. paginateProfessionals", () => {
    const profs = Array.from({ length: 12 }, (_, i) => ({
      id: `prof-${i + 1}`,
      name: `Profissional ${i + 1}`,
      appointments: [],
    }));

    it("retorna array vazio quando não há profissionais", () => {
      const pages = paginateProfessionals([], 5);
      assert.equal(pages.length, 0);
    });

    it("retorna página única quando número de profissionais <= maxPerPage", () => {
      const pages = paginateProfessionals(profs.slice(0, 4), 5);
      assert.equal(pages.length, 1);
      assert.equal(pages[0].length, 4);
    });

    it("divide corretamente em múltiplas páginas quando > maxPerPage", () => {
      const pages = paginateProfessionals(profs, 5);
      assert.equal(pages.length, 3); // 5 + 5 + 2
      assert.equal(pages[0].length, 5);
      assert.equal(pages[1].length, 5);
      assert.equal(pages[2].length, 2);
    });
  });

  describe("6. buildTVPollingResponse", () => {
    const org: RawTVOrganization = {
      id: "org-1",
      name: "Studio Luvea Jardins",
      settings: {
        logo_url: "https://example.com/logo.png",
        timezone: "America/Sao_Paulo",
      },
    };

    const professionals: RawTVProfessional[] = [
      { id: "prof-1", name: "Helena Rostova" },
      { id: "prof-2", name: "Gabriel Menezes" },
    ];

    const rawAppointments: RawTVAppointment[] = [
      {
        id: "apt-1",
        professional_id: "prof-1",
        client_name: "Mariana da Silva Oliveira",
        service_name: "Corte + Escova Premium",
        starts_at: "2026-10-22T17:00:00Z", // 14:00 em America/Sao_Paulo (UTC-3)
        ends_at: "2026-10-22T18:00:00Z",   // 15:00 em America/Sao_Paulo (UTC-3)
        status: "confirmed",
      },
      {
        id: "apt-2",
        professional_id: "prof-1",
        client_name: "Juliana Santos",
        service_name: "Coloração Global",
        starts_at: "2026-10-22T19:00:00Z", // 16:00 em America/Sao_Paulo
        ends_at: "2026-10-22T20:30:00Z",   // 17:30 em America/Sao_Paulo
        status: "pending",
      },
      {
        id: "apt-3",
        professional_id: "prof-2",
        client_name: "Carlos Eduardo de Lima",
        service_name: "Barba Terapia",
        starts_at: "2026-10-22T16:00:00Z", // 13:00 em America/Sao_Paulo
        ends_at: "2026-10-22T16:45:00Z",   // 13:45 em America/Sao_Paulo
        status: "completed",
      },
      {
        id: "apt-4",
        professional_id: "prof-2",
        client_name: "Roberto Canceled",
        service_name: "Corte Masculino",
        starts_at: "2026-10-22T18:00:00Z",
        ends_at: "2026-10-22T18:30:00Z",
        status: "canceled",
      },
    ];

    it("monta a resposta estruturada para o Kiosk com timezone correto e LGPD sanitizado", () => {
      const now = new Date("2026-10-22T17:30:00Z"); // 14:30 em SP -> apt-1 está in_progress
      const response = buildTVPollingResponse(rawAppointments, professionals, org, now, { filterPast: false });

      assert.equal(response.organizationName, "Studio Luvea Jardins");
      assert.equal(response.logoUrl, "https://example.com/logo.png");
      assert.equal(response.timezone, "America/Sao_Paulo");
      assert.ok(response.serverTime);

      assert.equal(response.professionals.length, 2);

      // Helena Rostova
      const helena = response.professionals.find((p) => p.id === "prof-1");
      assert.ok(helena);
      assert.equal(helena.appointments.length, 2); // apt-1 e apt-2 (apt-4 cancelado ignorado)

      const apt1 = helena.appointments[0];
      assert.equal(apt1.clientName, "Mariana O.");
      assert.equal(apt1.serviceName, "Corte + Escova Premium");
      assert.equal(apt1.startTime, "14:00");
      assert.equal(apt1.endTime, "15:00");
      assert.equal(apt1.status, "in_progress");

      const apt2 = helena.appointments[1];
      assert.equal(apt2.clientName, "Juliana S.");
      assert.equal(apt2.startTime, "16:00");
      assert.equal(apt2.endTime, "17:30");
      assert.equal(apt2.status, "waiting");

      // Gabriel Menezes
      const gabriel = response.professionals.find((p) => p.id === "prof-2");
      assert.ok(gabriel);
      assert.equal(gabriel.appointments.length, 1);

      const apt3 = gabriel.appointments[0];
      assert.equal(apt3.clientName, "Carlos L.");
      assert.equal(apt3.startTime, "13:00");
      assert.equal(apt3.endTime, "13:45");
      assert.equal(apt3.status, "completed");
    });

    it("remove agendamentos anteriores e concluídos por padrão no Kiosk (mantém apenas em andamento e próximos)", () => {
      const now = new Date("2026-10-22T17:30:00Z"); // 14:30 em SP -> apt-1 está in_progress
      const response = buildTVPollingResponse(rawAppointments, professionals, org, now);

      // Helena Rostova
      const helena = response.professionals.find((p) => p.id === "prof-1");
      assert.ok(helena);
      assert.equal(helena.appointments.length, 2); // apt-1 (em andamento) e apt-2 (a seguir)
      assert.equal(helena.appointments[0].status, "in_progress");

      // Gabriel Menezes: apt-3 terminou às 13:45 (anterior a 14:30) e status é completed -> deve ser removido!
      const gabriel = response.professionals.find((p) => p.id === "prof-2");
      assert.ok(gabriel);
      assert.equal(gabriel.appointments.length, 0); // Gabriel está livre no momento
    });

    it("calcula limites de início e fim do dia com offset UTC exato para o timezone do estúdio", () => {
      const { getDayBoundsInTimezone } = require("../tv-kiosk.ts");
      const refDate = new Date("2026-10-23T15:00:00Z");
      const bounds = getDayBoundsInTimezone(refDate, "America/Sao_Paulo");

      assert.equal(bounds.todayYMD, "2026-10-23");
      assert.equal(bounds.startOfDayIso, "2026-10-23T03:00:00.000Z");
      assert.equal(bounds.endOfDayIso, "2026-10-24T02:59:59.999Z");
    });

    it("deduplica profissionais com o mesmo nome e unifica seus agendamentos sob uma única coluna", () => {
      const dupProfessionals: RawTVProfessional[] = [
        { id: "prof-joao-1", name: "João" },
        { id: "prof-joao-2", name: "João" },
        { id: "prof-bruno", name: "Bruno" },
      ];
      const dupAppointments: RawTVAppointment[] = [
        {
          id: "apt-j1",
          professional_id: "prof-joao-1",
          client_name: "Cliente A",
          service_name: "Corte",
          starts_at: "2026-10-24T18:00:00Z",
          ends_at: "2026-10-24T19:00:00Z",
          status: "confirmed",
        },
        {
          id: "apt-j2",
          professional_id: "prof-joao-2",
          client_name: "Cliente B",
          service_name: "Escova",
          starts_at: "2026-10-24T19:15:00Z",
          ends_at: "2026-10-24T20:00:00Z",
          status: "confirmed",
        },
      ];

      const now = new Date("2026-10-24T17:00:00Z");
      const response = buildTVPollingResponse(dupAppointments, dupProfessionals, org, now);

      // Deve ter exatamente 2 profissionais (João e Bruno), sem duplicar João
      assert.equal(response.professionals.length, 2);

      const joaoCol = response.professionals.find((p) => p.name === "João");
      assert.ok(joaoCol);
      // Os agendamentos de ambos os IDs duplicados devem estar sob a coluna de João
      assert.equal(joaoCol.appointments.length, 2);

      const brunoCol = response.professionals.find((p) => p.name === "Bruno");
      assert.ok(brunoCol);
      assert.equal(brunoCol.appointments.length, 0);
    });

    it("filtra colunas de profissionais respeitando tv_visible_professional_ids", () => {
      const allProfs: RawTVProfessional[] = [
        { id: "prof-bruno", name: "Bruno" },
        { id: "prof-joao", name: "João" },
        { id: "prof-kleber", name: "Kleber" },
      ];
      const orgWithFilter: RawTVOrganization = {
        id: "org-filter-test",
        name: "Studio Luvea",
        settings: {
          tv_visible_professional_ids: ["prof-bruno", "prof-kleber"],
        },
      };

      const response = buildTVPollingResponse([], allProfs, orgWithFilter);
      assert.equal(response.professionals.length, 2);
      assert.ok(response.professionals.find((p) => p.id === "prof-bruno"));
      assert.ok(response.professionals.find((p) => p.id === "prof-kleber"));
      assert.equal(response.professionals.find((p) => p.id === "prof-joao"), undefined);
    });
  });

  describe("7. Rate Limiting e Gestão de Pareamento em Memória", () => {
    it("permite até 10 requisições por minuto por IP e bloqueia a 11ª", () => {
      const { checkPairRateLimit } = require("../tv-kiosk.ts");
      const testIp = "192.168.1.100";
      for (let i = 0; i < 10; i++) {
        assert.equal(checkPairRateLimit(testIp, 10, 60000), true);
      }
      assert.equal(checkPairRateLimit(testIp, 10, 60000), false);
    });
  });

  describe("8. Fluxo Integrado de API Routes de Pareamento (Ticket 03)", () => {
    it("executa o ciclo completo: gerar código -> verificar PENDING -> autorizar -> verificar AUTHORIZED com token", async () => {
      const pairRoute = await import("../../app/api/tv/pair/route");
      const authRoute = await import("../../app/api/tv/authorize/route");

      // 1. Gera código anônimo na TV
      const reqPair = new Request("http://localhost:3000/api/tv/pair", {
        method: "POST",
      });
      const resPair = await pairRoute.POST(reqPair);
      assert.equal(resPair.status, 200);
      const pairData = await resPair.json();
      assert.ok(pairData.code);
      assert.match(pairData.code, /^\d{6}$/);
      assert.equal(pairData.status, "PENDING");

      // 2. TV faz polling inicial esperando autorização
      const reqStatus1 = new Request(
        `http://localhost:3000/api/tv/pair?code=${pairData.code}`,
        { method: "GET" }
      );
      const resStatus1 = await pairRoute.GET(reqStatus1);
      assert.equal(resStatus1.status, 200);
      const statusData1 = await resStatus1.json();
      assert.equal(statusData1.status, "PENDING");

      // 3. Rejeita código inexistente no authorize
      const reqAuthInvalid = new Request("http://localhost:3000/api/tv/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "000000" }),
      });
      const resAuthInvalid = await authRoute.POST(reqAuthInvalid);
      assert.equal(resAuthInvalid.status, 404);

      // 4. Gestora autoriza o código válido no painel
      const reqAuth = new Request("http://localhost:3000/api/tv/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pairData.code, deviceName: "TV Recepção Principal" }),
      });
      const resAuth = await authRoute.POST(reqAuth);
      assert.equal(resAuth.status, 200);
      const authData = await resAuth.json();
      assert.equal(authData.success, true);
      assert.equal(authData.deviceName, "TV Recepção Principal");

      // 5. TV faz polling subsequente e recebe AUTHORIZED com token
      const reqStatus2 = new Request(
        `http://localhost:3000/api/tv/pair?code=${pairData.code}`,
        { method: "GET" }
      );
      const resStatus2 = await pairRoute.GET(reqStatus2);
      assert.equal(resStatus2.status, 200);
      const statusData2 = await resStatus2.json();
      assert.equal(statusData2.status, "AUTHORIZED");
      assert.ok(statusData2.token);
      assert.equal(statusData2.deviceName, "TV Recepção Principal");

      // 6. Tentativa duplicada de autorização retorna 409 Conflict
      const reqAuthDuplicate = new Request("http://localhost:3000/api/tv/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pairData.code }),
      });
      const resAuthDuplicate = await authRoute.POST(reqAuthDuplicate);
      assert.equal(resAuthDuplicate.status, 409);
    });
  });

  describe("9. API Route de Agendamentos /api/tv/appointments (Ticket 04)", () => {
    it("rejeita requisições sem token ou com token inválido com 401", async () => {
      const appointmentsRoute = await import("../../app/api/tv/appointments/route");

      // Sem header
      const reqNoToken = new Request("http://localhost:3000/api/tv/appointments", {
        method: "GET",
      });
      const resNoToken = await appointmentsRoute.GET(reqNoToken);
      assert.equal(resNoToken.status, 401);

      // Com token aleatório inexistente
      const reqInvalidToken = new Request("http://localhost:3000/api/tv/appointments", {
        method: "GET",
        headers: {
          Authorization: "Bearer 00000000-0000-0000-0000-000000000000",
        },
      });
      const resInvalidToken = await appointmentsRoute.GET(reqInvalidToken);
      assert.equal(resInvalidToken.status, 401);
    });

    it("retorna TVPollingResponse completo com dados LGPD anonimizados para token válido", async () => {
      const pairRoute = await import("../../app/api/tv/pair/route");
      const authRoute = await import("../../app/api/tv/authorize/route");
      const appointmentsRoute = await import("../../app/api/tv/appointments/route");

      // 1. Gera e autoriza token
      const resPair = await pairRoute.POST(new Request("http://localhost:3000/api/tv/pair", { method: "POST" }));
      const pairData = await resPair.json();

      await authRoute.POST(
        new Request("http://localhost:3000/api/tv/authorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: pairData.code, deviceName: "TV Recepção Polling Test" }),
        })
      );

      const resStatus = await pairRoute.GET(
        new Request(`http://localhost:3000/api/tv/pair?code=${pairData.code}`)
      );
      const { token } = await resStatus.json();
      assert.ok(token);

      // 2. Faz polling de agendamentos com o token autorizado
      const reqApts = new Request("http://localhost:3000/api/tv/appointments", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resApts = await appointmentsRoute.GET(reqApts);
      assert.equal(resApts.status, 200);

      const data = await resApts.json();
      assert.ok(data.organizationName);
      assert.ok(data.serverTime);
      assert.ok(data.timezone);
      assert.ok(Array.isArray(data.professionals));
      assert.ok(data.professionals.length > 0);

      // Verifica dados mascarados em conformidade com a LGPD
      const allAppointments = data.professionals.flatMap((p: any) => p.appointments);
      for (const apt of allAppointments) {
        assert.ok(apt.startTime);
        assert.ok(apt.endTime);
        assert.ok(apt.serviceName);
        assert.ok(apt.status);
        assert.ok(apt.clientName);
        // O nome do cliente deve ser apenas Primeiro Nome + Inicial (ou Cliente)
        assert.match(apt.clientName, /^([A-ZÀ-Úa-zà-ú]+(\s+[A-ZÀ-Ú]\.)?|Cliente)$/);
      }
    });
  });

  describe("10. API Route de Dispositivos /api/tv/devices (Ticket 05)", () => {
    it("permite listar dispositivos, renomear e revogar acesso", async () => {
      const pairRoute = await import("../../app/api/tv/pair/route");
      const authRoute = await import("../../app/api/tv/authorize/route");
      const devicesRoute = await import("../../app/api/tv/devices/route");
      const appointmentsRoute = await import("../../app/api/tv/appointments/route");

      // 1. Cria e autoriza um dispositivo
      const resPair = await pairRoute.POST(new Request("http://localhost:3000/api/tv/pair", { method: "POST" }));
      const { code } = await resPair.json();

      await authRoute.POST(
        new Request("http://localhost:3000/api/tv/authorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, deviceName: "TV Sala de Espera" }),
        })
      );

      const resStatus = await pairRoute.GET(
        new Request(`http://localhost:3000/api/tv/pair?code=${code}`)
      );
      const { token } = await resStatus.json();
      assert.ok(token);

      // 2. GET /api/tv/devices lista o dispositivo
      const resList = await devicesRoute.GET(new Request("http://localhost:3000/api/tv/devices", { method: "GET" }));
      assert.equal(resList.status, 200);
      const listData = await resList.json();
      assert.ok(Array.isArray(listData.devices));
      const targetDevice = listData.devices.find((d: any) => d.code === code);
      assert.ok(targetDevice);
      assert.equal(targetDevice.device_name, "TV Sala de Espera");
      assert.equal(targetDevice.status, "AUTHORIZED");

      // 3. PATCH /api/tv/devices renomeia o dispositivo
      const resPatch = await devicesRoute.PATCH(
        new Request("http://localhost:3000/api/tv/devices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetDevice.id, device_name: "TV Recepção VIP" }),
        })
      );
      assert.equal(resPatch.status, 200);
      const patchData = await resPatch.json();
      assert.equal(patchData.device_name, "TV Recepção VIP");

      // 4. DELETE /api/tv/devices revoga o dispositivo
      const resDelete = await devicesRoute.DELETE(
        new Request("http://localhost:3000/api/tv/devices", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetDevice.id }),
        })
      );
      assert.equal(resDelete.status, 200);

      // 5. Após revogação, o polling com aquele token deve retornar 401
      const resAptsRevoked = await appointmentsRoute.GET(
        new Request("http://localhost:3000/api/tv/appointments", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      assert.equal(resAptsRevoked.status, 401);
    });
  });

  describe("11. Status de Confirmação do Próximo Cliente na TV (Ticket 01)", () => {
    it("deriveClientPresenceStatus retorna 'waiting' para agendamentos pending e 'confirmed' para confirmados ou 1_confirmed", () => {
      assert.equal(
        deriveClientPresenceStatus({ status: "pending" }),
        "waiting"
      );
      assert.equal(
        deriveClientPresenceStatus({ status: "confirmed" }),
        "confirmed"
      );
      assert.equal(
        deriveClientPresenceStatus({
          status: "pending",
          whatsapp_client_reply: "1_confirmed",
        }),
        "confirmed"
      );
    });

    it("buildTVPollingResponse inclui presenceStatus em cada TVAppointmentDTO preservando mascaramento LGPD", () => {
      const org: RawTVOrganization = {
        id: "org-presence",
        name: "Studio Luvea Jardins",
        settings: { timezone: "America/Sao_Paulo" },
      };
      const professionals: RawTVProfessional[] = [
        { id: "prof-1", name: "Helena Rostova" },
      ];
      const rawAppointments: RawTVAppointment[] = [
        {
          id: "apt-confirmed",
          professional_id: "prof-1",
          client_name: "Fernanda da Costa",
          service_name: "Escova Modelada",
          starts_at: "2026-10-22T18:00:00Z",
          ends_at: "2026-10-22T19:00:00Z",
          status: "confirmed",
        },
        {
          id: "apt-waiting",
          professional_id: "prof-1",
          client_name: "Beatriz dos Santos",
          service_name: "Hidratação",
          starts_at: "2026-10-22T19:30:00Z",
          ends_at: "2026-10-22T20:30:00Z",
          status: "pending",
        },
      ];

      const now = new Date("2026-10-22T17:00:00Z");
      const response = buildTVPollingResponse(rawAppointments, professionals, org, now);
      const apts = response.professionals[0].appointments;

      assert.equal(apts.length, 2);
      assert.equal(apts[0].clientName, "Fernanda C.");
      assert.equal(apts[0].presenceStatus, "confirmed");
      assert.equal(apts[1].clientName, "Beatriz S.");
      assert.equal(apts[1].presenceStatus, "waiting");
    });

    it("prioriza arrived_at_reception retornando 'arrived' ('Na recepção') acima de waiting e confirmed (Ticket 02)", () => {
      assert.equal(
        deriveClientPresenceStatus({
          status: "pending",
          arrived_at_reception: true,
        }),
        "arrived"
      );
      assert.equal(
        deriveClientPresenceStatus({
          status: "confirmed",
          arrived_at_reception: true,
        }),
        "arrived"
      );

      const org: RawTVOrganization = {
        id: "org-arrived",
        name: "Studio Luvea Jardins",
        settings: { timezone: "America/Sao_Paulo" },
      };
      const professionals: RawTVProfessional[] = [
        { id: "prof-1", name: "Helena Rostova" },
      ];
      const rawAppointments: RawTVAppointment[] = [
        {
          id: "apt-arrived",
          professional_id: "prof-1",
          client_name: "Camila de Andrade",
          service_name: "Coloração",
          starts_at: "2026-10-22T18:00:00Z",
          ends_at: "2026-10-22T19:00:00Z",
          status: "confirmed",
          arrived_at_reception: true,
        },
      ];

      const response = buildTVPollingResponse(
        rawAppointments,
        professionals,
        org,
        new Date("2026-10-22T17:00:00Z")
      );
      assert.equal(response.professionals[0].appointments[0].presenceStatus, "arrived");
    });

    it("mantém agendamento não concluído por até 10 min pós-término com status 'delayed' para alerta de atraso no Card Hero", () => {
      const org: RawTVOrganization = {
        id: "org-overtime",
        name: "Studio Luvea Jardins",
        settings: { timezone: "America/Sao_Paulo" },
      };
      const professionals: RawTVProfessional[] = [
        { id: "prof-1", name: "Bruno" },
      ];
      const rawAppointments: RawTVAppointment[] = [
        {
          id: "apt-overtime",
          professional_id: "prof-1",
          client_name: "Teste Cliente",
          service_name: "Corte Masculino",
          starts_at: "2026-10-22T14:00:00Z",
          ends_at: "2026-10-22T14:45:00Z",
          status: "confirmed",
        },
      ];

      // 4 minutos após ends_at (dentro da tolerância de 10 min) -> permanece com status 'delayed'
      const resWithinGrace = buildTVPollingResponse(
        rawAppointments,
        professionals,
        org,
        new Date("2026-10-22T14:49:00Z")
      );
      assert.equal(resWithinGrace.professionals[0].appointments.length, 1);
      assert.equal(resWithinGrace.professionals[0].appointments[0].status, "delayed");

      // 11 minutos após ends_at (fora da tolerância de 10 min) -> removido automaticamente
      const resAfterGrace = buildTVPollingResponse(
        rawAppointments,
        professionals,
        org,
        new Date("2026-10-22T14:56:00Z")
      );
      assert.equal(resAfterGrace.professionals[0].appointments.length, 0);
    });
  });
});
