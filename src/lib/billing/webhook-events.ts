import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Módulo de Gestão de Idempotência de Webhooks de Billing
 * Garante que eventos repetidos da Stripe ou Mercado Pago sejam registrados
 * e não provoquem efeitos duplicados ou transições repetidas no ciclo de faturamento.
 */

const inMemoryWebhookEvents = new Set<string>();

export interface RecordWebhookEventInput {
  gateway: "stripe" | "mercadopago";
  eventId: string;
  eventType: string;
  payload?: any;
}

export interface RecordWebhookEventResult {
  isDuplicate: boolean;
  recorded: boolean;
}

/**
 * Registra o evento de webhook se ainda não tiver sido processado.
 * Retorna `{ isDuplicate: true }` se o par (gateway, event_id) já existir.
 */
export async function recordWebhookEventIfNotProcessed(
  input: RecordWebhookEventInput
): Promise<RecordWebhookEventResult> {
  const { gateway, eventId, eventType, payload = {} } = input;
  const key = `${gateway}:${eventId}`;

  // Se o Supabase estiver configurado, grava no banco com constraint UNIQUE
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabaseAdmin
        .from("billing_webhook_events")
        .insert({
          gateway,
          event_id: eventId,
          event_type: eventType,
          payload,
        });

      if (error) {
        // Código Postgres 23505 indica violação de unique_violation
        if (
          error.code === "23505" ||
          error.message?.includes("unique") ||
          error.message?.includes("duplicate") ||
          error.details?.includes("already exists")
        ) {
          return { isDuplicate: true, recorded: false };
        }
        console.warn("[Billing Webhook Idempotency DB Error]:", error);
      } else {
        inMemoryWebhookEvents.add(key);
        return { isDuplicate: false, recorded: true };
      }
    } catch (dbErr) {
      console.warn("[Billing Webhook Idempotency DB Exception]:", dbErr);
    }
  }

  // Fallback em memória (para testes unitários ou ambientes locais sem banco conectado)
  if (inMemoryWebhookEvents.has(key)) {
    return { isDuplicate: true, recorded: false };
  }

  inMemoryWebhookEvents.add(key);
  return { isDuplicate: false, recorded: true };
}

/**
 * Reseta os eventos em memória (utilizado em testes unitários)
 */
export function resetInMemoryWebhookEventsForTesting(): void {
  inMemoryWebhookEvents.clear();
}
