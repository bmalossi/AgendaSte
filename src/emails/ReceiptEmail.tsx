import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Button,
  Hr,
  Row,
  Column,
} from "@react-email/components";

export interface ReceiptLineItemProp {
  id?: string;
  label: string;
  quantity?: number;
  amountCents: number;
}

export interface ReceiptEmailProps {
  receiptNumber: string;
  clientName: string;
  clientEmail?: string;
  studioName: string;
  studioAddress?: string;
  paymentDate: string;
  paymentMethod: string;
  professionalName?: string;
  items: ReceiptLineItemProp[];
  subtotalCents?: number;
  discountCents?: number;
  tipCents?: number;
  totalCents: number;
  receiptUrl: string;
  memo?: string;
}

export function ReceiptEmail({
  receiptNumber = "#REC-1",
  clientName = "Cliente",
  clientEmail,
  studioName = "Luvea Studio",
  studioAddress = "Atendimento presencial no estúdio",
  paymentDate = "17/10/2026, 09:00",
  paymentMethod = "Pix",
  professionalName,
  items = [
    { label: "Atendimento Personalizado", quantity: 1, amountCents: 11400 },
  ],
  subtotalCents,
  discountCents = 0,
  tipCents = 0,
  totalCents = 11400,
  receiptUrl = "https://luvea.app",
  memo,
}: ReceiptEmailProps) {
  const formatReais = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const calculatedSubtotal =
    subtotalCents ??
    items.reduce((acc, it) => acc + (it.amountCents || 0) * (it.quantity || 1), 0);

  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Comprovante {receiptNumber} | {studioName}</title>
      </Head>
      <Preview>{`Comprovante de Pagamento ${receiptNumber} · ${formatReais(totalCents)} confirmado por ${studioName}`}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header / Brand */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>LUVEA</Text>
            <Text style={brandSubtitleStyle}>{studioName}</Text>
          </Section>

          {/* Divisor */}
          <Section style={dividerSectionStyle}>
            <Hr style={dividerStyle} />
          </Section>

          {/* Micro-badge de Status Confirmado (Zero AI Slop) */}
          <Section style={badgeSectionStyle}>
            <div style={badgeContainerStyle}>
              <span style={greenDotStyle} />
              <span style={badgeTextStyle}>PAGAMENTO CONFIRMADO</span>
            </div>
          </Section>

          {/* Título */}
          <Section style={titleSectionStyle}>
            <Heading as="h1" style={titleStyle}>
              Comprovante de Pagamento
            </Heading>
            <Text style={receiptNumberSubStyle}>{receiptNumber}</Text>
          </Section>

          {/* Conteúdo */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Olá, <strong style={boldHighlightStyle}>{clientName}</strong>. Confirmamos o recebimento e
              a liquidação do seu pagamento no valor de <strong style={boldHighlightStyle}>{formatReais(totalCents)}</strong> referente
              ao atendimento prestado por <strong style={boldHighlightStyle}>{studioName}</strong>.
            </Text>

            {/* Memo / Observação */}
            {memo && (
              <Section style={memoCardStyle}>
                <Text style={memoTextStyle}>{memo}</Text>
              </Section>
            )}

            {/* Card com Metadados da Transação */}
            <Section style={metadataCardStyle}>
              <Row style={metaRowStyle}>
                <Column style={{ width: "50%" }}>
                  <Text style={metaLabelStyle}>FORMA DE PAGAMENTO</Text>
                  <Text style={metaValueStyle}>{paymentMethod}</Text>
                </Column>
                <Column style={{ width: "50%", textAlign: "right" }}>
                  <Text style={metaLabelStyle}>DATA DO PAGAMENTO</Text>
                  <Text style={metaValueStyle}>{paymentDate}</Text>
                </Column>
              </Row>

              {professionalName && (
                <Row style={metaRowLastStyle}>
                  <Column style={{ width: "100%" }}>
                    <Text style={metaLabelStyle}>PROFISSIONAL RESPONSÁVEL</Text>
                    <Text style={metaValueStyle}>{professionalName}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* Card com Itens do Atendimento */}
            <Section style={cardStyle}>
              <Text style={cardSectionTitleStyle}>ITENS DO ATENDIMENTO</Text>

              {items.map((item, index) => {
                const itemTotal = (item.amountCents || 0) * (item.quantity || 1);
                return (
                  <Row key={index} style={index === items.length - 1 ? itemRowLastStyle : itemRowStyle}>
                    <Column style={{ width: "70%" }}>
                      <Text style={itemNameStyle}>{item.label}</Text>
                      {(item.quantity || 1) > 1 && (
                        <Text style={itemQtyStyle}>{item.quantity} unidades</Text>
                      )}
                    </Column>
                    <Column style={{ width: "30%", textAlign: "right" }}>
                      <Text style={itemValueStyle}>{formatReais(itemTotal)}</Text>
                    </Column>
                  </Row>
                );
              })}

              <Hr style={innerDividerStyle} />

              <Row style={summaryRowStyle}>
                <Column>
                  <Text style={summaryLabelStyle}>Subtotal</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={summaryValueStyle}>{formatReais(calculatedSubtotal)}</Text>
                </Column>
              </Row>

              {discountCents > 0 && (
                <Row style={summaryRowStyle}>
                  <Column>
                    <Text style={summaryLabelStyle}>Desconto aplicado</Text>
                  </Column>
                  <Column style={{ textAlign: "right" }}>
                    <Text style={summaryDiscountValueStyle}>- {formatReais(discountCents)}</Text>
                  </Column>
                </Row>
              )}

              {tipCents > 0 && (
                <Row style={summaryRowStyle}>
                  <Column>
                    <Text style={summaryLabelStyle}>Gorjeta inclusa</Text>
                  </Column>
                  <Column style={{ textAlign: "right" }}>
                    <Text style={summaryValueStyle}>+ {formatReais(tipCents)}</Text>
                  </Column>
                </Row>
              )}

              <Row style={summaryTotalRowStyle}>
                <Column>
                  <Text style={totalLabelStyle}>Total Pago</Text>
                  <Text style={totalSublabelStyle}>Liquidado via {paymentMethod}</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={totalValueStyle}>{formatReais(totalCents)}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Botão CTA para visualizar o comprovante online */}
          <Section style={buttonSectionStyle}>
            <Button href={receiptUrl} style={buttonStyle}>
              Visualizar Comprovante Online
            </Button>
          </Section>

          {/* Link alternativo */}
          <Section style={altLinkSectionStyle}>
            <Text style={altLinkTextStyle}>
              Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
              <br />
              <Link href={receiptUrl} style={altLinkAnchorStyle}>
                {receiptUrl}
              </Link>
            </Text>
          </Section>

          {/* Divisor Footer */}
          <Section style={footerDividerSectionStyle}>
            <Hr style={dividerStyle} />
          </Section>

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              Comprovante oficial emitido eletronicamente por {studioName}.
              <br />
              Este documento atesta a liquidação da transação realizada no estúdio.
              <br />
              <br />
              &copy; {studioName} &bull;{" "}
              <Link href="https://luvea.app" style={footerLinkStyle}>
                luvea.app
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// =============================================================================
// ESTILOS VISUAIS EDITORIAL DARK (PADRÃO LUXO DA LUVEA)
// =============================================================================

const mainStyle: React.CSSProperties = {
  margin: "0",
  padding: "40px 20px",
  backgroundColor: "#09090b",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: "#f4f4f5",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "500px",
  margin: "0 auto",
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "12px",
  padding: "40px 32px",
  textAlign: "center",
};

const headerSectionStyle: React.CSSProperties = {
  paddingBottom: "24px",
  textAlign: "center",
};

const brandLogoStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "3px",
  color: "#ffffff",
  textTransform: "uppercase",
};

const brandSubtitleStyle: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "11px",
  fontWeight: "500",
  letterSpacing: "1.5px",
  color: "#a1a1aa",
  textTransform: "uppercase",
};

const dividerSectionStyle: React.CSSProperties = {
  paddingBottom: "24px",
};

const dividerStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #27272a",
  margin: "0",
  width: "100%",
};

const badgeSectionStyle: React.CSSProperties = {
  paddingBottom: "16px",
  textAlign: "center",
};

const badgeContainerStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "9999px",
  textAlign: "center",
};

const greenDotStyle: React.CSSProperties = {
  display: "inline-block",
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  backgroundColor: "#10b981",
  marginRight: "6px",
  verticalAlign: "middle",
};

const badgeTextStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1px",
  color: "#f4f4f5",
  verticalAlign: "middle",
};

const titleSectionStyle: React.CSSProperties = {
  paddingBottom: "16px",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "20px",
  fontWeight: "600",
  color: "#ffffff",
  letterSpacing: "-0.5px",
};

const receiptNumberSubStyle: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "12px",
  fontWeight: "500",
  color: "#71717a",
  letterSpacing: "0.5px",
};

const contentSectionStyle: React.CSSProperties = {
  paddingBottom: "32px",
  textAlign: "center",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#a1a1aa",
  textAlign: "center",
};

const boldHighlightStyle: React.CSSProperties = {
  color: "#ffffff",
  fontWeight: "600",
};

const memoCardStyle: React.CSSProperties = {
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "16px",
  textAlign: "left",
};

const memoTextStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "12.5px",
  lineHeight: "1.5",
  color: "#a1a1aa",
};

const metadataCardStyle: React.CSSProperties = {
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
  textAlign: "left",
};

const metaRowStyle: React.CSSProperties = {
  paddingBottom: "8px",
};

const metaRowLastStyle: React.CSSProperties = {
  paddingTop: "8px",
  borderTop: "1px solid #1f1f23",
};

const metaLabelStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "1px",
  color: "#71717a",
  textTransform: "uppercase",
};

const metaValueStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: "12.5px",
  fontWeight: "500",
  color: "#ffffff",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "20px 18px",
  textAlign: "left",
};

const cardSectionTitleStyle: React.CSSProperties = {
  margin: "0 0 14px 0",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1.5px",
  color: "#71717a",
  textTransform: "uppercase",
};

const itemRowStyle: React.CSSProperties = {
  paddingBottom: "10px",
  borderBottom: "1px solid #1f1f23",
  marginBottom: "10px",
};

const itemRowLastStyle: React.CSSProperties = {
  paddingBottom: "4px",
};

const itemNameStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "13px",
  fontWeight: "500",
  color: "#f4f4f5",
};

const itemQtyStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: "11px",
  color: "#71717a",
};

const itemValueStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "13px",
  fontWeight: "500",
  color: "#ffffff",
  fontVariantNumeric: "tabular-nums",
};

const innerDividerStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #27272a",
  margin: "12px 0",
  width: "100%",
};

const summaryRowStyle: React.CSSProperties = {
  paddingBottom: "6px",
};

const summaryLabelStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "12px",
  color: "#a1a1aa",
};

const summaryValueStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "12px",
  color: "#f4f4f5",
  fontVariantNumeric: "tabular-nums",
};

const summaryDiscountValueStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "12px",
  color: "#34d399",
  fontVariantNumeric: "tabular-nums",
};

const summaryTotalRowStyle: React.CSSProperties = {
  paddingTop: "10px",
  marginTop: "6px",
  borderTop: "1px solid #27272a",
};

const totalLabelStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "13px",
  fontWeight: "600",
  color: "#ffffff",
};

const totalSublabelStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: "11px",
  color: "#10b981",
  fontWeight: "500",
};

const totalValueStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "16px",
  fontWeight: "700",
  color: "#ffffff",
  fontVariantNumeric: "tabular-nums",
};

const buttonSectionStyle: React.CSSProperties = {
  paddingBottom: "32px",
  textAlign: "center",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#09090b",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "14px 28px",
  borderRadius: "8px",
  display: "inline-block",
  letterSpacing: "0.5px",
};

const altLinkSectionStyle: React.CSSProperties = {
  textAlign: "center",
};

const altLinkTextStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "12px",
  color: "#71717a",
  lineHeight: "1.5",
};

const altLinkAnchorStyle: React.CSSProperties = {
  color: "#a1a1aa",
  wordBreak: "break-all",
  textDecoration: "underline",
};

const footerDividerSectionStyle: React.CSSProperties = {
  paddingTop: "32px",
  paddingBottom: "24px",
};

const footerSectionStyle: React.CSSProperties = {
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "12px",
  color: "#52525b",
  lineHeight: "1.5",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#71717a",
  textDecoration: "none",
};
