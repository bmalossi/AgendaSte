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
} from "@react-email/components";

export interface WelcomeEmailProps {
  name: string;
  subdomain: string;
  portalUrl?: string;
  businessName?: string;
  planTier?: "essencial" | "gold" | "platinum" | string;
}

export function WelcomeEmail({
  name = "Profissional",
  subdomain = "meuestudio",
  portalUrl,
  businessName = "Seu Estúdio",
  planTier = "gold",
}: WelcomeEmailProps) {
  const destinationUrl = portalUrl || `https://${subdomain}.luvea.app`;
  const planDisplay =
    planTier.toLowerCase() === "gold"
      ? "Plano Gold"
      : planTier.toLowerCase() === "platinum"
      ? "Plano Platinum"
      : "Plano Essencial";

  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>Seu espaço de gestão no Luvea está ativo: {destinationUrl}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header & Logo */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>LUVEA</Text>
            <Text style={subtitleBadgeStyle}>SISTEMA OPERACIONAL DE BELEZA</Text>
          </Section>

          {/* Greeting & Headline */}
          <Section style={contentSectionStyle}>
            <div style={statusBadgeContainerStyle}>
              <span style={indicatorDotStyle} />
              <span style={statusTextStyle}>Assinatura Ativada — {planDisplay}</span>
            </div>

            <Heading as="h1" style={headingStyle}>
              Boas-vindas à Luvea, {name}.
            </Heading>

            <Text style={paragraphStyle}>
              Seu estúdio <strong>{businessName}</strong> foi provisionado com sucesso.
              A partir de agora, você conta com uma infraestrutura completa de agendamentos,
              financeiro, recepção com inteligência artificial e proteção anti-no-show.
            </Text>

            {/* Portal Card */}
            <Section style={cardStyle}>
              <Text style={cardLabelStyle}>SEU PORTAL EXCLUSIVO DE GESTÃO</Text>
              <Text style={cardDomainStyle}>{destinationUrl}</Text>
              <Text style={cardDescriptionStyle}>
                Canal exclusivo para sua equipe gerenciar agenda, clientes e comandas.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainerStyle}>
              <Button href={destinationUrl} style={buttonStyle}>
                Acessar meu estúdio
              </Button>
            </Section>

            <Text style={instructionStyle}>
              Para uma experiência ideal, adicione o link do seu portal aos favoritos do
              navegador ou instale-o na tela de início do seu celular ou tablet.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={dividerStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Luvea Technologies Inc. — Gestão editorial de alta performance.
            </Text>
            <Text style={footerLinksStyle}>
              <Link href="https://luvea.app/termos" style={footerLinkItemStyle}>
                Termos de Uso
              </Link>
              {" · "}
              <Link href="https://luvea.app/privacidade" style={footerLinkItemStyle}>
                Privacidade
              </Link>
              {" · "}
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

export default WelcomeEmail;

// Estilos em linha compatíveis com clientes de e-mail (Apple Mail, Gmail, Outlook)
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

const cardStyle: React.CSSProperties = {
  backgroundColor: "#F5F5F7",
  border: "1px solid #E5E5EA",
  borderRadius: "12px",
  padding: "18px 20px",
  margin: "20px 0",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  color: "#8E8E93",
  margin: "0 0 6px 0",
};

const cardDomainStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#1C1C1E",
  fontFamily: 'ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace',
  margin: "0 0 4px 0",
};

const cardDescriptionStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6E6E73",
  margin: "0",
  lineHeight: "1.4",
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

const instructionStyle: React.CSSProperties = {
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
