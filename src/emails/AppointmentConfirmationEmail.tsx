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

export interface AppointmentConfirmationEmailProps {
  clientName: string;
  studioName: string;
  serviceName: string;
  professionalName?: string;
  formattedDate: string;
  formattedTime: string;
  depositCents?: number;
  totalCents?: number;
  studioAddress?: string;
  manageBookingUrl?: string;
}

export function AppointmentConfirmationEmail({
  clientName = "Cliente",
  studioName = "Luvea Studio",
  serviceName = "Corte & Finalização Editorial",
  professionalName = "Especialista Luvea",
  formattedDate = "24/10/2026",
  formattedTime = "15:00",
  depositCents = 0,
  totalCents = 18000,
  studioAddress = "Atendimento presencial no estúdio",
  manageBookingUrl = "https://luvea.app",
}: AppointmentConfirmationEmailProps) {
  const formatReais = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const remainingCents = Math.max(0, (totalCents || 0) - (depositCents || 0));

  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Agendamento Confirmado | {studioName}</title>
      </Head>
      <Preview>{`Agendamento confirmado no ${studioName} para ${formattedDate} às ${formattedTime}`}</Preview>
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
              Tudo pronto, {clientName}.
            </Heading>
          </Section>

          {/* Conteúdo */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Seu horário no <strong style={boldHighlightStyle}>{studioName}</strong> foi
              agendado e confirmado com sucesso na agenda oficial.
            </Text>

            {/* Card com Detalhes do Agendamento */}
            <Section style={cardStyle}>
              <Row style={cardRowStyle}>
                <Column style={cardColStyle}>
                  <Text style={cardFieldLabelStyle}>SERVIÇO</Text>
                  <Text style={cardFieldValueStyle}>{serviceName}</Text>
                </Column>
                <Column style={cardColStyle}>
                  <Text style={cardFieldLabelStyle}>PROFISSIONAL</Text>
                  <Text style={cardFieldValueStyle}>{professionalName}</Text>
                </Column>
              </Row>

              <Row style={cardRowStyle}>
                <Column style={cardColStyle}>
                  <Text style={cardFieldLabelStyle}>DATA</Text>
                  <Text style={cardFieldValueStyle}>{formattedDate}</Text>
                </Column>
                <Column style={cardColStyle}>
                  <Text style={cardFieldLabelStyle}>HORÁRIO</Text>
                  <Text style={cardFieldValueStyle}>{formattedTime}</Text>
                </Column>
              </Row>

              <Row style={cardRowLastStyle}>
                <Column style={{ width: "100%" }}>
                  <Text style={cardFieldLabelStyle}>LOCAL</Text>
                  <Text style={cardFieldAddressStyle}>{studioAddress}</Text>
                </Column>
              </Row>

              <Hr style={innerDividerStyle} />

              <Row style={financialRowStyle}>
                <Column>
                  <Text style={financialItemTitleStyle}>Valor do serviço</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={financialItemValueStyle}>{formatReais(totalCents)}</Text>
                </Column>
              </Row>

              {depositCents > 0 && (
                <Row style={financialRowStyle}>
                  <Column>
                    <Text style={financialItemTitleStyle}>Sinal Pix antecipado</Text>
                  </Column>
                  <Column style={{ textAlign: "right" }}>
                    <Text style={financialItemPaidStyle}>- {formatReais(depositCents)}</Text>
                  </Column>
                </Row>
              )}

              <Row style={financialRowLastStyle}>
                <Column>
                  <Text style={financialTotalLabelStyle}>Restante no atendimento</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={financialTotalValueStyle}>{formatReais(remainingCents)}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Botão CTA */}
          <Section style={buttonSectionStyle}>
            <Button href={manageBookingUrl} style={buttonStyle}>
              Gerenciar meu agendamento
            </Button>
          </Section>

          {/* Link alternativo */}
          <Section style={altLinkSectionStyle}>
            <Text style={altLinkTextStyle}>
              Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
              <br />
              <Link href={manageBookingUrl} style={altLinkAnchorStyle}>
                {manageBookingUrl}
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
              Caso precise reagendar ou cancelar, solicitamos avisar com antecedência pelo link acima
              ou pelo WhatsApp oficial do estúdio.
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

export default AppointmentConfirmationEmail;

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

const cardStyle: React.CSSProperties = {
  backgroundColor: "#121214",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "18px 20px",
  textAlign: "left",
  margin: "16px 0",
};

const cardRowStyle: React.CSSProperties = {
  paddingBottom: "12px",
};

const cardRowLastStyle: React.CSSProperties = {
  paddingBottom: "14px",
};

const cardColStyle: React.CSSProperties = {
  width: "50%",
};

const cardFieldLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "1px",
  color: "#71717a",
  textTransform: "uppercase",
  margin: "0 0 4px 0",
};

const cardFieldValueStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#ffffff",
  margin: 0,
};

const cardFieldAddressStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#a1a1aa",
  margin: 0,
  lineHeight: "1.4",
};

const innerDividerStyle: React.CSSProperties = {
  height: "1px",
  backgroundColor: "#27272a",
  border: "none",
  margin: "4px 0 12px 0",
  width: "100%",
};

const financialRowStyle: React.CSSProperties = {
  paddingBottom: "8px",
};

const financialRowLastStyle: React.CSSProperties = {
  paddingTop: "6px",
  borderTop: "1px solid #27272a",
};

const financialItemTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#a1a1aa",
  margin: 0,
};

const financialItemValueStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#ffffff",
  margin: 0,
  fontFamily: "monospace",
};

const financialItemPaidStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#34d399",
  margin: 0,
  fontFamily: "monospace",
};

const financialTotalLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#ffffff",
  margin: 0,
};

const financialTotalValueStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#ffffff",
  margin: 0,
  fontFamily: "monospace",
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
