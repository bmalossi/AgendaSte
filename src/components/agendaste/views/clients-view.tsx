"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Upload,
  Calendar,
  FileText,
  Camera,
  CreditCard,
  Package,
  X,
  Sparkles,
  MessageSquare,
  Check,
  AlertCircle,
  MoreHorizontal,
  UserCheck,
  Loader2,
  Download,
  Trash2,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import {
  StudioState,
  ClientProfile,
  formatBRL,
  formatDateBR,
  createClientProfile,
  filterClientsByRetention,
  updateClientNotesAndForms,
  uploadAutoSortedClientPhoto,
  deleteClientPhoto,
  importStudioMigrationData,
} from "@/lib/agendaste-store";

interface ClientsViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  onNavigateToCalendarWithClient?: (clientId: string) => void;
  onOpenQuickSale?: () => void;
}

type ClientDrawerTab =
  | "appointments"
  | "notes"
  | "photos"
  | "memberships"
  | "packages";

export function ClientsView({
  state,
  onUpdateState,
  onNavigateToCalendarWithClient,
  onOpenQuickSale,
}: ClientsViewProps) {
  const [showEditorialHero, setShowEditorialHero] = useState(false);
  const [retentionFilter, setRetentionFilter] = useState<
    "all" | "absent_30_45" | "vip"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    state.clients[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState<ClientDrawerTab>("appointments");
  const [appointmentsSubTab, setAppointmentsSubTab] = useState<
    "upcoming" | "canceled" | "past"
  >("upcoming");

  // Add Client Modal (05-2-clients-add.png)
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBirthday, setNewBirthday] = useState("");
  const [newAnamnesis, setNewAnamnesis] = useState("");

  // Selected client object
  const selectedClient: ClientProfile | undefined = state.clients.find(
    (c) => c.id === selectedClientId
  );

  // Notes editing state synced with selected client
  const [anamnesisDraft, setAnamnesisDraft] = useState(
    selectedClient?.notesAndForms.anamnesis ?? ""
  );
  const [allergiesDraft, setAllergiesDraft] = useState(
    selectedClient?.notesAndForms.allergies ?? ""
  );
  const [formulasDraft, setFormulasDraft] = useState(
    selectedClient?.notesAndForms.formulasAndPreferences ?? ""
  );
  const [birthdayDraft, setBirthdayDraft] = useState(
    selectedClient?.notesAndForms.birthday ?? ""
  );

  // Photo gallery state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
    date?: string;
    notes?: string;
  } | null>(null);

  const handleSelectClient = (client: ClientProfile) => {
    setSelectedClientId(client.id);
    setAnamnesisDraft(client.notesAndForms.anamnesis);
    setAllergiesDraft(client.notesAndForms.allergies);
    setFormulasDraft(client.notesAndForms.formulasAndPreferences);
    setBirthdayDraft(client.notesAndForms.birthday);
  };

  const filteredClients = filterClientsByRetention(
    state,
    retentionFilter,
    searchQuery
  );

  const absentCount = filterClientsByRetention(
    state,
    "absent_30_45",
    ""
  ).length;

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;
    const newClientId = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    onUpdateState((prev) =>
      createClientProfile(prev, {
        id: newClientId,
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        birthday: newBirthday.trim(),
        anamnesis: newAnamnesis.trim(),
      })
    );
    setSelectedClientId(newClientId);
    setAddClientModalOpen(false);
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setNewBirthday("");
    setNewAnamnesis("");
  };

  const clientAppointments = state.calendarEvents.filter(
    (e) =>
      selectedClient &&
      (e.clientId === selectedClient.id ||
        e.clientName.toLowerCase() === selectedClient.fullName.toLowerCase())
  );

  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Top Header Bar (05-3-clients-added.png) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
            Clientes{" "}
            <span className="text-[#8E8E93] font-medium">
              ({state.clients.length})
            </span>
          </h1>
          <button
            onClick={() => setShowEditorialHero((v) => !v)}
            className="px-3.5 py-1.5 rounded-full border border-[#E5E5EA] bg-white text-[#1C1C1E] text-[12px] font-semibold hover:bg-[#F5F5F7] transition"
          >
            {showEditorialHero
              ? "Ocultar Apresentação Editorial"
              : "Ver Apresentação (05-1)"}
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                lastToastMessage: `Diretório de ${prev.clients.length} clientes exportado em CSV!`,
              }))
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[13px] font-semibold text-[#1C1C1E] transition"
          >
            <span>Exportar clientes</span>
          </button>
          <button
            onClick={() =>
              onUpdateState((prev) =>
                importStudioMigrationData(prev, {
                  sourceName: "Planilha CSV / Agenda Anterior",
                  clientsCount: 2,
                  servicesCount: 0,
                })
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[13px] font-semibold text-[#1C1C1E] transition"
          >
            <Upload className="w-4 h-4" />
            <span>Importar</span>
          </button>
          <button
            onClick={() => setAddClientModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar cliente</span>
          </button>
        </div>
      </div>

      {/* Optional Editorial Hero Card (05-1-clients.png) */}
      {showEditorialHero && (
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#DDD6FE] text-[12px] font-semibold text-[#1C1C1E]">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D8F]" />
              Apresentando Notas e Fichas
            </span>
            <h2 className="font-display text-[40px] leading-[1.08] text-[#1C1C1E]">
              Seus clientes no piloto automático
            </h2>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Construa relacionamentos duradouros com fichas de anamnese personalizadas, histórico completo, fotos Antes &amp; Depois auto-organizadas e alertas de retorno.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setAddClientModalOpen(true)}
                className="px-6 py-3 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold hover:bg-[#2C2C2E] transition"
              >
                Adicionar cliente
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) =>
                    importStudioMigrationData(prev, {
                      sourceName: "Contatos do Celular",
                      clientsCount: 1,
                      servicesCount: 0,
                    })
                  )
                }
                className="px-6 py-3 rounded-full bg-white border border-[#E5E5EA] text-[#1C1C1E] text-[14px] font-semibold hover:bg-[#F5F5F7] transition"
              >
                Importar clientes
              </button>
            </div>
          </div>

          {/* Right Mockup Card (Isolde Quinn + Forms from 05-1-clients.png) */}
          <div className="lg:col-span-5 bg-white rounded-[20px] p-5 border border-[#E5E5EA] shadow-gg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FBCFE8] flex items-center justify-center font-bold text-[#1C1C1E]">
                IQ
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#1C1C1E]">
                  Isolde Quinn
                </p>
                <p className="text-[12px] text-[#6E6E73]">
                  Cliente VIP · Ficha de Anamnese Capilar preenchida
                </p>
              </div>
            </div>
            <div className="p-3 rounded-[14px] bg-[#F5F5F7] text-[12px] text-[#1C1C1E]">
              <strong>Fórmula salva:</strong> Loiro Pérola 9.89 + Olaplex Passo 1 &amp; 2 · Prefere chá gelado na recepção.
            </div>
          </div>
        </div>
      )}

      {/* Search + Retention Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente por nome, telefone ou e-mail..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#E5E5EA] bg-white text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#6E56CF]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setRetentionFilter("all")}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold transition ${
              retentionFilter === "all"
                ? "bg-[#1C1C1E] text-white"
                : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1C1C1E]"
            }`}
          >
            Todos ({state.clients.length})
          </button>
          <button
            onClick={() => setRetentionFilter("absent_30_45")}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold transition flex items-center gap-1.5 ${
              retentionFilter === "absent_30_45"
                ? "bg-[#E11D8F] text-white shadow-sm"
                : "bg-white border border-[#E5E5EA] text-[#1C1C1E] hover:bg-[#F5F5F7]"
            }`}
          >
            <span>Ausentes 30/45+ dias ({absentCount})</span>
          </button>
          <button
            onClick={() => setRetentionFilter("vip")}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold transition ${
              retentionFilter === "vip"
                ? "bg-[#1C1C1E] text-white shadow-sm"
                : "bg-white border border-[#E5E5EA] text-[#1C1C1E] hover:bg-[#F5F5F7]"
            }`}
          >
            VIPs, Pacotes &amp; Assinaturas
          </button>
        </div>
      </div>

      {/* Main Split Content: Left Clients Table + Right Client Profile Drawer (05-3-clients-added.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Table */}
        <div
          className={`${
            selectedClient ? "lg:col-span-7" : "lg:col-span-12"
          } bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden`}
        >
          <div className="divide-y divide-[#EFEFF4]">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const initials = client.fullName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const isAbsentAlert = (client.daysSinceLastVisit ?? 0) >= 30;

              return (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className={`p-4 px-5 flex items-center justify-between gap-4 cursor-pointer transition ${
                    isSelected ? "bg-[#F5F3FF]" : "hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-[#1C1C1E] shrink-0"
                      style={{ backgroundColor: client.avatarColor }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-bold text-[#1C1C1E] truncate">
                          {client.fullName}
                        </p>
                        {isAbsentAlert && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#D97706] text-white text-[10px] font-bold shadow-sm">
                            Ausente há {client.daysSinceLastVisit}d · Reativar
                          </span>
                        )}
                        {client.memberships.length > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E11D8F] text-white text-[10px] font-bold shadow-sm">
                            Assinante VIP
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#6E6E73] truncate">
                        {client.phone} · {client.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      title="Adição rápida de foto Antes & Depois"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClient(client);
                        setActiveTab("photos");
                        onUpdateState((prev) =>
                          uploadAutoSortedClientPhoto(prev, client.id, {
                            photoUrl:
                              "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
                            beforeLabel: "Antes",
                            afterLabel: "Depois",
                          })
                        );
                      }}
                      className="w-8 h-8 rounded-full border border-[#E5E5EA] hover:bg-[#1C1C1E] hover:text-white flex items-center justify-center text-[#6E6E73] transition"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <p className="text-[14px] font-mono font-bold text-[#1C1C1E]">
                        {formatBRL(client.totalSpentCents)}
                      </p>
                      <p className="text-[11px] text-[#8E8E93]">
                        {client.visitsCount} visita(s)
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Client Profile Drawer (05-3-clients-added.png, 05-3-notes.png, 05-3-photos.png) */}
        {selectedClient && (
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
            {/* Profile Top Header */}
            <div className="p-6 border-b border-[#EFEFF4] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-bold text-[#1C1C1E]"
                    style={{ backgroundColor: selectedClient.avatarColor }}
                  >
                    {selectedClient.fullName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1C1C1E]">
                      {selectedClient.fullName}
                    </h2>
                    <p className="text-[12px] text-[#6E6E73]">
                      Cliente desde {formatDateBR(selectedClient.createdAtISO)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() =>
                      onNavigateToCalendarWithClient?.(selectedClient.id)
                    }
                    className="px-3.5 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[12px] font-semibold transition"
                  >
                    Agendar horário
                  </button>
                  <button
                    onClick={() => onOpenQuickSale?.()}
                    className="px-3.5 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1C1C1E] text-[12px] font-semibold transition"
                  >
                    Venda rápida
                  </button>
                  <button
                    onClick={() => setSelectedClientId(null)}
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info + Send Automatic Reminders Toggle */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[12px]">
                <div className="p-3 rounded-[14px] bg-[#F5F5F7]">
                  <span className="text-[#8E8E93] block">E-mail</span>
                  <span className="font-semibold text-[#1C1C1E] truncate block">
                    {selectedClient.email}
                  </span>
                </div>
                <div className="p-3 rounded-[14px] bg-[#F5F5F7]">
                  <span className="text-[#8E8E93] block">Telefone / WhatsApp</span>
                  <span className="font-semibold text-[#1C1C1E] block">
                    {selectedClient.phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[13px] font-medium text-[#1C1C1E]">
                  Enviar lembretes automáticos (WhatsApp 24h/2h e SMS)
                </span>
                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      clients: prev.clients.map((c) =>
                        c.id === selectedClient.id
                          ? {
                              ...c,
                              sendAutomaticReminders: !c.sendAutomaticReminders,
                            }
                          : c
                      ),
                    }))
                  }
                  className={`w-11 h-6 rounded-full transition p-0.5 ${
                    selectedClient.sendAutomaticReminders
                      ? "bg-[#6E56CF]"
                      : "bg-[#D1D1D6]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition transform ${
                      selectedClient.sendAutomaticReminders
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 5 Icon Sub-Tabs (05-3-clients-added.png) */}
              <div className="grid grid-cols-5 gap-1 pt-2 border-t border-[#EFEFF4]">
                {[
                  {
                    id: "appointments" as const,
                    label: "Agenda",
                    icon: Calendar,
                  },
                  {
                    id: "notes" as const,
                    label: "Notas",
                    icon: FileText,
                  },
                  {
                    id: "photos" as const,
                    label: "Fotos",
                    icon: Camera,
                  },
                  {
                    id: "memberships" as const,
                    label: "Assinaturas",
                    icon: CreditCard,
                  },
                  {
                    id: "packages" as const,
                    label: "Pacotes",
                    icon: Package,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2.5 px-1 rounded-[12px] flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                        active
                          ? "bg-[#1C1C1E] text-white shadow-sm"
                          : "text-[#6E6E73] hover:bg-[#F5F5F7]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto">
              {/* TAB 1: APPOINTMENTS with Próximos | Cancelados | Anteriores sub-tabs */}
              {activeTab === "appointments" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: "upcoming" as const, label: "Próximos" },
                        { id: "canceled" as const, label: "Cancelados" },
                        { id: "past" as const, label: "Anteriores" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setAppointmentsSubTab(st.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                            appointmentsSubTab === st.id
                              ? "bg-[#1C1C1E] text-white"
                              : "bg-[#F5F5F7] text-[#6E6E73]"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[12px] text-[#6E6E73]">
                      {clientAppointments.length} registro(s)
                    </span>
                  </div>

                  {clientAppointments.filter((ev) =>
                    appointmentsSubTab === "canceled"
                      ? ev.status === "canceled"
                      : appointmentsSubTab === "past"
                        ? ev.status === "completed"
                        : ev.status !== "canceled"
                  ).length === 0 ? (
                    <div className="p-8 rounded-[18px] bg-[#FAFAFC] border border-[#EFEFF4] text-center space-y-3">
                      <Calendar className="w-8 h-8 text-[#8E8E93] mx-auto" />
                      <p className="text-[14px] font-bold text-[#1C1C1E]">
                        Nenhum agendamento nesta aba
                      </p>
                      <p className="text-[12px] text-[#6E6E73]">
                        Agende o atendimento de {selectedClient.fullName} em 1 toque.
                      </p>
                      <button
                        onClick={() =>
                          onNavigateToCalendarWithClient?.(selectedClient.id)
                        }
                        className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold"
                      >
                        Criar agendamento
                      </button>
                    </div>
                  ) : (
                    clientAppointments
                      .filter((ev) =>
                        appointmentsSubTab === "canceled"
                          ? ev.status === "canceled"
                          : appointmentsSubTab === "past"
                            ? ev.status === "completed"
                            : ev.status !== "canceled"
                      )
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="p-4 rounded-[16px] border border-[#E5E5EA] flex items-center justify-between"
                        >
                          <div>
                            <p className="text-[13px] font-bold text-[#1C1C1E]">
                              {ev.serviceNames.join(" + ")}
                            </p>
                            <p className="text-[12px] text-[#6E6E73]">
                              {formatDateBR(ev.dateISO)} · {ev.startTime} – {ev.endTime}
                            </p>
                          </div>
                          <span className="font-mono text-[13px] font-bold text-[#1C1C1E]">
                            {formatBRL(ev.totalCents)}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* TAB 2: NOTES & FORMS (05-3-notes.png) */}
              {activeTab === "notes" && (
                <div className="space-y-3">
                  <h3 className="text-[14px] font-bold text-[#1C1C1E]">
                    Notas de Atendimento &amp; Ficha de Anamnese
                  </h3>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#8E8E93] mb-1">
                      Anamnese &amp; Histórico Clínico/Capilar
                    </label>
                    <textarea
                      rows={2}
                      value={anamnesisDraft}
                      onChange={(e) => setAnamnesisDraft(e.target.value)}
                      placeholder="Ex: Fios descoloridos há 4 meses, boa elasticidade..."
                      className="w-full p-3 rounded-[12px] border border-[#E5E5EA] text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#8E8E93] mb-1">
                      Alergias / Restrições
                    </label>
                    <input
                      type="text"
                      value={allergiesDraft}
                      onChange={(e) => setAllergiesDraft(e.target.value)}
                      placeholder="Ex: Sensibilidade a amônia..."
                      className="w-full p-3 rounded-[12px] border border-[#E5E5EA] text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#8E8E93] mb-1">
                      Fórmulas &amp; Preferências Pessoais
                    </label>
                    <textarea
                      rows={2}
                      value={formulasDraft}
                      onChange={(e) => setFormulasDraft(e.target.value)}
                      placeholder="Ex: Tonalizante 9.89 + OX 6 vol · Gosta de cappuccino..."
                      className="w-full p-3 rounded-[12px] border border-[#E5E5EA] text-[13px]"
                    />
                  </div>
                  <button
                    onClick={() =>
                      onUpdateState((prev) =>
                        updateClientNotesAndForms(prev, selectedClient.id, {
                          anamnesis: anamnesisDraft,
                          allergies: allergiesDraft,
                          formulasAndPreferences: formulasDraft,
                          birthday: birthdayDraft,
                        })
                      )
                    }
                    className="w-full py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold hover:bg-[#2C2C2E] transition"
                  >
                    Salvar Notas e Ficha
                  </button>
                </div>
              )}

              {/* TAB 3: AUTO-SORTED PHOTOS (05-3-photos.png) */}
              {activeTab === "photos" && (
                <div className="space-y-4">
                  {/* Editorial Card from 05-3-photos.png */}
                  <div className="p-5 rounded-[20px] bg-[#F5F3FF] border border-[#DDD6FE] space-y-2.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#6E56CF] text-white text-[10px] font-bold uppercase">
                      Galeria Inteligente
                    </span>
                    <h4 className="text-[16px] font-bold text-[#1C1C1E]">
                      Suas fotos de clientes, auto-organizadas
                    </h4>
                    <p className="text-[12px] text-[#6E6E73]">
                      Tire fotos na agenda ou importe da sua galeria. Nós organizamos e rotulamos por agendamento automaticamente.
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      <label
                        className={`w-full py-2.5 px-4 rounded-full text-[12px] font-semibold text-center cursor-pointer transition flex items-center justify-center gap-2 ${
                          isUploadingPhoto
                            ? "bg-[#2C2C2E] text-white opacity-85 cursor-wait pointer-events-none"
                            : "bg-[#1C1C1E] text-white hover:bg-[#2C2C2E] active:scale-95"
                        }`}
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Enviando foto...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-white" />
                            <span>+ Enviar foto do dispositivo</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingPhoto}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingPhoto(true);
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              formData.append("folder", "clientes");

                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              const data = await res.json();

                              if (res.ok && data.success && data.url) {
                                onUpdateState((prev) =>
                                  uploadAutoSortedClientPhoto(prev, selectedClient.id, {
                                    photoUrl: data.url,
                                    beforeLabel: "Antes",
                                    afterLabel: `Depois · ${file.name}`,
                                  })
                                );
                              } else {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === "string") {
                                    onUpdateState((prev) =>
                                      uploadAutoSortedClientPhoto(prev, selectedClient.id, {
                                        photoUrl: reader.result as string,
                                        beforeLabel: "Antes",
                                        afterLabel: `Depois · ${file.name}`,
                                      })
                                    );
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            } catch (err) {
                              console.warn("Erro no upload da foto do cliente:", err);
                            } finally {
                              setIsUploadingPhoto(false);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>

                      {isUploadingPhoto && (
                        <div className="p-2.5 rounded-[12px] bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center gap-2 text-[11.5px] text-[#6E56CF] animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Salvando imagem na nuvem com segurança...</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateState((prev) =>
                            uploadAutoSortedClientPhoto(prev, selectedClient.id, {
                              photoUrl:
                                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
                              beforeLabel: "Antes",
                              afterLabel: "Depois · Finalização Gloss",
                            })
                          )
                        }
                        className="w-full py-2 rounded-full border border-[#D1D1D6] bg-white text-[11.5px] font-semibold text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                      >
                        Exemplo de demonstração rápida
                      </button>
                    </div>
                  </div>

                  {/* Auto-sorted photo groups with Thumbnails, Lightbox & Actions */}
                  {selectedClient.autoSortedPhotos.length === 0 ? (
                    <div className="p-8 rounded-[16px] border border-[#E5E5EA] bg-[#FAFAFC] text-center space-y-2">
                      <Camera className="w-8 h-8 text-[#8E8E93] mx-auto" />
                      <p className="text-[13px] font-bold text-[#1C1C1E]">
                        Nenhuma foto salva para esta cliente
                      </p>
                      <p className="text-[11.5px] text-[#6E6E73]">
                        Envie fotos do antes e depois pelo botão acima para criar a galeria automática.
                      </p>
                    </div>
                  ) : (
                    selectedClient.autoSortedPhotos.map((grp) => (
                      <div
                        key={grp.id}
                        className="p-4 rounded-[16px] border border-[#E5E5EA] space-y-3 bg-white"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-[#1C1C1E]">
                            {grp.serviceName}
                          </span>
                          <span className="text-[11px] font-mono text-[#6E56CF] font-bold">
                            {formatDateBR(grp.appointmentDateISO)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6E6E73]">{grp.notes}</p>

                        {/* Photos Grid Thumbnails */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                          {grp.photoUrls.map((url, idx) => (
                            <div
                              key={`${url}-${idx}`}
                              className="group relative aspect-square rounded-[12px] overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7] shadow-sm hover:shadow-md transition cursor-pointer"
                              onClick={() =>
                                setPreviewPhoto({
                                  url,
                                  title: `${grp.serviceName} · ${selectedClient.fullName}`,
                                  date: formatDateBR(grp.appointmentDateISO),
                                  notes: grp.notes,
                                })
                              }
                            >
                              <img
                                src={url}
                                alt={grp.serviceName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />

                              {/* Hover Overlay with Quick Action Buttons */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Excluir esta foto da cliente?")) {
                                        onUpdateState((prev) =>
                                          deleteClientPhoto(prev, selectedClient.id, url)
                                        );
                                      }
                                    }}
                                    className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow-sm"
                                    title="Excluir foto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center justify-center">
                                  <span className="px-2.5 py-1 rounded-full bg-white/95 text-[#1C1C1E] text-[10.5px] font-bold shadow-sm flex items-center gap-1">
                                    <Maximize2 className="w-3 h-3" />
                                    <span>Abrir foto</span>
                                  </span>
                                </div>

                                <span className="text-[10px] text-white font-semibold truncate bg-black/60 px-1.5 py-0.5 rounded">
                                  {grp.beforeLabel || grp.afterLabel || `Foto ${idx + 1}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: MEMBERSHIPS */}
              {activeTab === "memberships" && (
                <div className="space-y-3">
                  <h3 className="text-[14px] font-bold text-[#1C1C1E]">
                    Assinaturas Recorrentes do Cliente
                  </h3>
                  {selectedClient.memberships.length === 0 ? (
                    <p className="text-[12px] text-[#6E6E73]">
                      Nenhuma assinatura ativa para este cliente.
                    </p>
                  ) : (
                    selectedClient.memberships.map((m) => (
                      <div
                        key={m.membershipId}
                        className="p-4 rounded-[16px] border border-[#DDD6FE] bg-[#F5F3FF] space-y-1"
                      >
                        <p className="text-[14px] font-bold text-[#1C1C1E]">
                          {m.membershipName}
                        </p>
                        <p className="text-[12px] text-[#6E56CF] font-semibold">
                          {m.remainingMonthlyCredits} crédito(s) disponíveis neste mês · Renova em {formatDateBR(m.renewsAtISO)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: PACKAGES */}
              {activeTab === "packages" && (
                <div className="space-y-3">
                  <h3 className="text-[14px] font-bold text-[#1C1C1E]">
                    Pacotes de Sessões Ativos
                  </h3>
                  {selectedClient.packages.length === 0 ? (
                    <p className="text-[12px] text-[#6E6E73]">
                      Nenhum pacote adquirido por este cliente.
                    </p>
                  ) : (
                    selectedClient.packages.map((pkg) => (
                      <div
                        key={pkg.packageId}
                        className="p-4 rounded-[16px] border border-[#E5E5EA] space-y-1"
                      >
                        <p className="text-[14px] font-bold text-[#1C1C1E]">
                          {pkg.packageName}
                        </p>
                        <p className="text-[12px] text-[#16A34A] font-semibold">
                          Restam {pkg.remainingSessions} de {pkg.totalSessions}{" "}
                          sessões · Válido até {formatDateBR(pkg.expiresAtISO)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal (05-2-clients-add.png) */}
      {addClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 border border-[#E5E5EA] shadow-gg-modal space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#1C1C1E]">
                Adicionar cliente
              </h2>
              <button
                onClick={() => setAddClientModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center text-[#6E6E73]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ex: Stefany Costa"
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(11) 99888-7766"
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Data de aniversário
                  </label>
                  <input
                    type="text"
                    value={newBirthday}
                    onChange={(e) => setNewBirthday(e.target.value)}
                    placeholder="DD/MM"
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="cliente@email.com.br"
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  Notas iniciais / Anamnese
                </label>
                <textarea
                  rows={2}
                  value={newAnamnesis}
                  onChange={(e) => setNewAnamnesis(e.target.value)}
                  placeholder="Preferências, histórico ou alergias..."
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddClientModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-[#E5E5EA] text-[13px] font-semibold text-[#1C1C1E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold hover:bg-[#2C2C2E]"
                >
                  Salvar cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Full-screen Photo Modal */}
      {previewPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          {/* Lightbox Header */}
          <div
            className="flex items-center justify-between text-white max-w-4xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 pr-4">
              <h3 className="text-[15px] sm:text-[17px] font-bold truncate">
                {previewPhoto.title}
              </h3>
              {previewPhoto.date && (
                <p className="text-[12px] text-white/70">
                  Data: {previewPhoto.date}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition shrink-0"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Image Container */}
          <div
            className="flex-1 flex items-center justify-center py-4 max-w-4xl w-full mx-auto min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewPhoto.url}
              alt={previewPhoto.title}
              className="max-h-[70vh] max-w-full rounded-[14px] object-contain shadow-2xl border border-white/10"
            />
          </div>

          {/* Lightbox Actions */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 max-w-4xl w-full mx-auto pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={previewPhoto.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir original</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(previewPhoto.url);
                    const blob = await res.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = `foto-${Date.now()}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                  } catch {
                    window.open(previewPhoto.url, "_blank");
                  }
                }}
                className="px-4 py-2 rounded-full bg-white text-[#1C1C1E] text-[12.5px] font-bold hover:bg-[#F5F5F7] flex items-center gap-1.5 transition active:scale-95 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Baixar foto</span>
              </button>

              {selectedClient && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir esta foto permanentemente?")) {
                      onUpdateState((prev) =>
                        deleteClientPhoto(prev, selectedClient.id, previewPhoto.url)
                      );
                      setPreviewPhoto(null);
                    }
                  }}
                  className="px-4 py-2 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-[12.5px] font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir foto</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
