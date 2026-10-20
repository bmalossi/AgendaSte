import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo-luvea.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "demo-service-role-key-luvea";

/**
 * Cliente Supabase com permissões de Service Role (Admin).
 * UTILIZAÇÃO EXCLUSIVA EM ROTAS DE API DO SERVIDOR (ex: Webhooks Stripe / Mercado Pago).
 * NUNCA EXPOR ESTE CLIENTE NO CLIENT-SIDE.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
