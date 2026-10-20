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
  studioName = "Studio de Beleza",
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
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>
        Agendamento confirmado no {studioName} para {formattedDate} às {formattedTime}
      </Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>LUVEA</Text>
            <Text style={subtitleBadgeStyle}>RECIBO &amp; CONFIRMAÇÃO</Text>
          </Section>

          {/* Content */}
          <Section style={contentSectionStyle}>
            <div style={statusBadgeContainerStyle}>
              <span style={indicatorDotStyle} />
              <span style={statusTextStyle}>Agendamento Confirmado</span>
            </div>

            <Heading as="h1" style={headingStyle}>
              Tudo pronto, {clientName}.
            </Heading>

            <Text style={paragraphStyle}>
              Seu horário no <strong>{studioName}</strong> foi agendado e garantido na agenda oficial.
            </Text>

            {/* Appointment Details Grid */}
            <Section style={detailsCardStyle}>
              <Row style={detailRowStyle}>
                <Column style={detailLabelColStyle}>
                  <Text style={detailLabelStyle}>SERVIÇO</Text>
                  <Text style={detailValueStyle}>{serviceName}</Text>
                </Column>
                <Column style={detailValueColStyle}>
                  <Text style={detailLabelStyle}>PROFISSIONAL</Text>
                  <Text style={detailValueStyle}>{professionalName}</Text>
                </Column>
              </Row>

              <Row style={detailRowStyle}>
                <Column style={detailLabelColStyle}>
                  <Text style={detailLabelStyle}>DATA</Text>
                  <Text style={detailValueStyle}>{formattedDate}</Text>
                </Column>
                <Column style={detailValueColStyle}>
                  <Text style={detailLabelStyle}>HORÁRIO</Text>
                  <Text style={detailValueStyle}>{formattedTime}</Text>
                </Column>
              </Row>

              <Row style={detailRowLastStyle}>
                <Column style={detailFullColStyle}>
                  <Text style={detailLabelStyle}>LOCAL</Text>
                  <Text style={detailValueMutedStyle}>{studioAddress}</Text>
                </Column>
              </Row>
            </Section>

            {/* Financial Summary */}
            <Section style={financialCardStyle}>
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
                    <Text style={financialItemSubStyle}>Garantia anti-no-show paga</Text>
                  </Column>
                  <Column style={{ textAlign: "right" }}>
                    <Text style={financialItemPaidStyle}>- {formatReais(depositCents)}</Text>
                  </Column>
                </Row>
              )}

              <Hr style={innerDividerStyle} />

              <Row style={financialRowStyle}>
                <Column>
                  <Text style={financialTotalLabelStyle}>Restante a pagar no local</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={financialTotalValueStyle}>{formatReais(remainingCents)}</Text>
                </Column>
              </Row>
            </Section>

            {/* CTA */}
            <Section style={buttonContainerStyle}>
              <Button href={manageBookingUrl} style={buttonStyle}>
                Gerenciar meu agendamento
              </Button>
            </Section>

            <Text style={footerNoticeStyle}>
              Caso precise reagendar ou cancelar, solicitamos a gentileza de avisar com pelo
              menos 2 horas de antecedência através do link acima ou pelo WhatsApp do estúdio.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={dividerStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              {studioName} · Agendamento gerenciado via Luvea Studio.
            </Text>
            <Text style={footerLinksStyle}>
              <Link href="https://luvea.app" style={footerLinkItemStyle}>
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
  backgroundColor: "#FAFAFC",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0 auto",
  padding: "36px 16px",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "16px",
  border: "1px solid #E5E5EA",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 36px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  paddingBottom: "24px",
  borderBottom: "1px solid #F0F0F2",
};

const logoStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "0.18em",
  color: "#1C1C1E",
  margin: "0 0 4px 0",
};

const subtitleBadgeStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "0.12em",
  color: "#8E8E93",
  margin: "0",
};

const contentSectionStyle: React.CSSProperties = {
  paddingTop: "28px",
};

const statusBadgeContainerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "#F5F5F7",
  border: "1px solid #E5E5EA",
  borderRadius: "9999px",
  padding: "5px 12px",
  marginBottom: "16px",
};

const indicatorDotStyle: React.CSSProperties = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  backgroundColor: "#10B981",
  display: "inline-block",
};

const statusTextStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#1C1C1E",
  margin: "0",
};

const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "600",
  letterSpacing: "-0.02em",
  color: "#1C1C1E",
  lineHeight: "1.3",
  margin: "0 0 14px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "13.5px",
  color: "#48484A",
  lineHeight: "1.6",
  margin: "0 0 20px 0",
};

const detailsCardStyle: React.CSSProperties = {
  backgroundColor: "#F5F5F7",
  border: "1px solid #E5E5EA",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "20px 0 16px 0",
};

const detailRowStyle: React.CSSProperties = {
  borderBottom: "1px solid #EBEBF0",
  paddingBottom: "12px",
  marginBottom: "12px",
};

const detailRowLastStyle: React.CSSProperties = {
  margin: "0",
};

const detailLabelColStyle: React.CSSProperties = {
  width: "50%",
};

const detailValueColStyle: React.CSSProperties = {
  width: "50%",
};

const detailFullColStyle: React.CSSProperties = {
  width: "100%",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  color: "#8E8E93",
  margin: "0 0 4px 0",
};

const detailValueStyle: React.CSSProperties = {
  fontSize: "13.5px",
  fontWeight: "600",
  color: "#1C1C1E",
  margin: "0",
};

const detailValueMutedStyle: React.CSSProperties = {
  fontSize: "12.5px",
  color: "#48484A",
  margin: "0",
};

const financialCardStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E5EA",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "0 0 24px 0",
};

const financialRowStyle: React.CSSProperties = {
  marginBottom: "8px",
};

const financialItemTitleStyle: React.CSSProperties = {
  fontSize: "12.5px",
  color: "#48484A",
  margin: "0",
};

const financialItemSubStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#10B981",
  fontWeight: "500",
  margin: "2px 0 0 0",
};

const financialItemValueStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#1C1C1E",
  fontFamily: 'ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace',
  margin: "0",
};

const financialItemPaidStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#10B981",
  fontWeight: "600",
  fontFamily: 'ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace',
  margin: "0",
};

const innerDividerStyle: React.CSSProperties = {
  borderTop: "1px solid #F0F0F2",
  borderBottom: "none",
  margin: "10px 0",
};

const financialTotalLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#1C1C1E",
  margin: "0",
};

const financialTotalValueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#1C1C1E",
  fontFamily: 'ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace',
  margin: "0",
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0 16px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#1C1C1E",
  color: "#FFFFFF",
  borderRadius: "9999px",
  fontSize: "13px",
  fontWeight: "600",
  letterSpacing: "0.02em",
  padding: "13px 32px",
  textDecoration: "none",
  display: "inline-block",
};

const footerNoticeStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#8E8E93",
  textAlign: "center",
  lineHeight: "1.5",
  margin: "0",
};

const dividerStyle: React.CSSProperties = {
  borderTop: "1px solid #E5E5EA",
  borderBottom: "none",
  margin: "32px 0 20px 0",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#8E8E93",
  margin: "0 0 6px 0",
};

const footerLinksStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#8E8E93",
  margin: "0",
};

const footerLinkItemStyle: React.CSSProperties = {
  color: "#6E6E73",
  textDecoration: "underline",
};
