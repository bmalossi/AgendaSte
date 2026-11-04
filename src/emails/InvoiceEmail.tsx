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

export interface InvoiceLineItemProp {
  id?: string;
  label: string;
  quantity?: number;
  amountCents: number;
}

export interface InvoiceEmailProps {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  studioName: string;
  studioAddress?: string;
  issuedDate: string;
  dueDate: string;
  items: InvoiceLineItemProp[];
  subtotalCents?: number;
  discountCents?: number;
  taxCents?: number;
  totalCents: number;
  paymentLinkUrl: string;
  pixCopyPasteCode?: string;
  memo?: string;
}

export function InvoiceEmail({
  invoiceNumber = "#1000949",
  clientName = "Cliente",
  clientEmail,
  studioName = "Luvea Studio",
  studioAddress = "Atendimento presencial no estúdio",
  issuedDate = "17/10/2026",
  dueDate = "30/10/2026",
  items = [
    { label: "Protocolo Facial Regenerador", quantity: 1, amountCents: 112500 },
  ],
  subtotalCents,
  discountCents = 0,
  taxCents = 0,
  totalCents = 112500,
  paymentLinkUrl = "https://luveastudio.luvea.app/pay/1000949",
  pixCopyPasteCode,
  memo,
}: InvoiceEmailProps) {
  const formatReais = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const calculatedSubtotal =
    subtotalCents ??
    items.reduce((acc, it) => acc + (it.amountCents || 0) * (it.quantity || 1), 0);

  const fallbackPix =
    pixCopyPasteCode ||
    `00020101021226840014br.gov.bcb.pix2562luvea.app/pay/${invoiceNumber.replace("#", "")}520400005303986540${(totalCents / 100).toFixed(2)}5802BR5920${studioName.slice(0, 20)}6009Sao Paulo62070503***6304`;

  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fatura {invoiceNumber} | {studioName}</title>
      </Head>
      <Preview>{`Fatura ${invoiceNumber} de ${studioName} · ${formatReais(totalCents)} com vencimento em ${dueDate}`}</Preview>
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

          {/* Título */}
          <Section style={titleSectionStyle}>
            <Heading as="h1" style={titleStyle}>
              Fatura {invoiceNumber}
            </Heading>
          </Section>

          {/* Conteúdo */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Olá, <strong style={boldHighlightStyle}>{clientName}</strong>. Segue o demonstrativo
              consolidado de serviços e produtos emitido por <strong style={boldHighlightStyle}>{studioName}</strong> com
              vencimento em <strong style={boldHighlightStyle}>{dueDate}</strong>.
            </Text>

            {/* Memo do estúdio */}
            {memo && (
              <Section style={memoCardStyle}>
                <Text style={memoTextStyle}>{memo}</Text>
              </Section>
            )}

            {/* Card com Itens da Fatura */}
            <Section style={cardStyle}>
              <Text style={cardSectionTitleStyle}>ITENS DA FATURA</Text>

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

              {taxCents > 0 && (
                <Row style={summaryRowStyle}>
                  <Column>
                    <Text style={summaryLabelStyle}>Encargos tributários</Text>
                  </Column>
                  <Column style={{ textAlign: "right" }}>
                    <Text style={summaryValueStyle}>+ {formatReais(taxCents)}</Text>
                  </Column>
                </Row>
              )}

              <Row style={summaryTotalRowStyle}>
                <Column>
                  <Text style={totalLabelStyle}>Total da Fatura</Text>
                  <Text style={totalSublabelStyle}>Vencimento em {dueDate}</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={totalValueStyle}>{formatReais(totalCents)}</Text>
                </Column>
              </Row>
            </Section>

            {/* Card Pix Copia e Cola */}
            <Section style={pixCardStyle}>
              <Text style={pixTitleStyle}>Pagamento Instantâneo via Pix</Text>
              <Text style={pixInstructionStyle}>
                Utilize o código Pix Copia e Cola abaixo no aplicativo do seu banco:
              </Text>
              <Text style={pixCodeBoxStyle}>{fallbackPix}</Text>
            </Section>
          </Section>

          {/* Botão CTA */}
          <Section style={buttonSectionStyle}>
            <Button href={paymentLinkUrl} style={buttonStyle}>
              Pagar Fatura Online
            </Button>
          </Section>

          {/* Link alternativo */}
          <Section style={altLinkSectionStyle}>
            <Text style={altLinkTextStyle}>
              Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
              <br />
              <Link href={paymentLinkUrl} style={altLinkAnchorStyle}>
                {paymentLinkUrl}
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
              Fatura emitida com liquidação segura e conciliação em tempo real via Luvea Studio.
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

export default InvoiceEmail;

const mainStyle: React.CSSProperties = {
  margin: 0,
  padding: "40px 20px",
  backgroundColor: "#09090b",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: "#f4f4f5",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "12px",
  maxWidth: "500px",
  margin: "0 auto",
  padding: "40px 32px",
  textAlign: "center",
};

const headerSectionStyle: React.CSSProperties = {
  paddingBottom: "24px",
  textAlign: "center",
};

const brandLogoStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "3px",
  color: "#ffffff",
  textTransform: "uppercase",
  margin: 0,
};

const brandSubtitleStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "500",
  letterSpacing: "1.5px",
  color: "#a1a1aa",
  display: "block",
  marginTop: "4px",
  textTransform: "uppercase",
  margin: "4px 0 0 0",
};

const dividerSectionStyle: React.CSSProperties = {
  paddingBottom: "24px",
};

const dividerStyle: React.CSSProperties = {
  height: "1px",
  backgroundColor: "#27272a",
  border: "none",
  margin: 0,
  width: "100%",
};

const titleSectionStyle: React.CSSProperties = {
  paddingBottom: "16px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#ffffff",
  margin: 0,
  textAlign: "center",
};

const contentSectionStyle: React.CSSProperties = {
  paddingBottom: "32px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#a1a1aa",
  margin: "0 0 20px 0",
  textAlign: "center",
};

const boldHighlightStyle: React.CSSProperties = {
  color: "#ffffff",
};

const memoCardStyle: React.CSSProperties = {
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 16px 0",
  textAlign: "center",
};

const memoTextStyle: React.CSSProperties = {
  fontSize: "12.5px",
  color: "#a1a1aa",
  fontStyle: "italic",
  margin: 0,
  lineHeight: "1.4",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "18px 20px",
  textAlign: "left",
  margin: "16px 0",
};

const cardSectionTitleStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "1.5px",
  color: "#71717a",
  textTransform: "uppercase",
  margin: "0 0 14px 0",
};

const itemRowStyle: React.CSSProperties = {
  paddingBottom: "10px",
  borderBottom: "1px solid #1f1f23",
  marginBottom: "10px",
};

const itemRowLastStyle: React.CSSProperties = {
  paddingBottom: "4px",
  marginBottom: "4px",
};

const itemNameStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#ffffff",
  margin: 0,
};

const itemQtyStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#71717a",
  margin: "2px 0 0 0",
};

const itemValueStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#ffffff",
  fontFamily: "monospace",
  margin: 0,
};

const innerDividerStyle: React.CSSProperties = {
  height: "1px",
  backgroundColor: "#27272a",
  border: "none",
  margin: "12px 0",
  width: "100%",
};

const summaryRowStyle: React.CSSProperties = {
  paddingBottom: "6px",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#71717a",
  margin: 0,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#ffffff",
  fontFamily: "monospace",
  margin: 0,
};

const summaryDiscountValueStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#34d399",
  fontFamily: "monospace",
  margin: 0,
};

const summaryTotalRowStyle: React.CSSProperties = {
  paddingTop: "10px",
  marginTop: "6px",
  borderTop: "1px solid #27272a",
};

const totalLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#ffffff",
  margin: 0,
};

const totalSublabelStyle: React.CSSProperties = {
  fontSize: "10.5px",
  color: "#71717a",
  margin: "2px 0 0 0",
};

const totalValueStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#ffffff",
  fontFamily: "monospace",
  margin: 0,
};

const pixCardStyle: React.CSSProperties = {
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "16px 20px",
  textAlign: "center",
  margin: "16px 0 0 0",
};

const pixTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  color: "#34d399",
  textTransform: "uppercase",
  margin: "0 0 4px 0",
};

const pixInstructionStyle: React.CSSProperties = {
  fontSize: "11.5px",
  color: "#a1a1aa",
  margin: "0 0 10px 0",
  lineHeight: "1.4",
};

const pixCodeBoxStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontFamily: "monospace",
  color: "#e4e4e7",
  backgroundColor: "#09090b",
  border: "1px solid #27272a",
  borderRadius: "6px",
  padding: "10px",
  wordBreak: "break-all",
  margin: 0,
  lineHeight: "1.4",
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
  fontSize: "12px",
  color: "#71717a",
  lineHeight: "1.5",
  margin: 0,
  textAlign: "center",
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
  fontSize: "12px",
  color: "#52525b",
  lineHeight: "1.5",
  margin: 0,
  textAlign: "center",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#71717a",
  textDecoration: "none",
};
