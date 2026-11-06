export interface CheckoutIdentityInput {
  slug: string;
  businessName: string;
  cpfCnpj: string;
  whatsapp: string;
}

export interface OwnOrganizationIdentity {
  slug?: string | null;
  name?: string | null;
  cpf_cnpj?: string | null;
  whatsapp_number?: string | null;
  phone?: string | null;
}

/**
 * Resolve os dados cadastrais usados no checkout.
 *
 * Usuário logado com estúdio vinculado: a organização salva é a fonte da verdade e os
 * valores enviados pelo navegador para nome e slug são ignorados, evitando que um fallback
 * de cache local renomeie o estúdio ou troque o subdomínio publicado.
 * CPF/CNPJ e WhatsApp só são aceitos do corpo quando a organização ainda não os possui.
 *
 * Sem organização própria (cadastro novo), os valores informados são mantidos.
 */
export function resolveCheckoutIdentity(
  submitted: CheckoutIdentityInput,
  ownOrg: OwnOrganizationIdentity | null | undefined
): CheckoutIdentityInput {
  if (!ownOrg) return submitted;

  return {
    slug: ownOrg.slug || submitted.slug,
    businessName: ownOrg.name || submitted.businessName,
    cpfCnpj: ownOrg.cpf_cnpj || submitted.cpfCnpj,
    whatsapp: ownOrg.whatsapp_number || ownOrg.phone || submitted.whatsapp,
  };
}
