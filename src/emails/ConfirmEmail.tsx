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

export interface ConfirmEmailProps {
  confirmationUrl: string;
  clientName?: string;
  studioName?: string;
}

export function ConfirmEmail({
  confirmationUrl = "https://luvea.app/auth/confirm?token=sample",
  clientName = "Cliente",
  studioName = "Luvea Studio",
}: ConfirmEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirme seu e-mail | {studioName}</title>
      </Head>
      <Preview>Confirme seu endereço de e-mail na Luvea para ativar sua conta</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header / Brand */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>LUVEA</Text>
            <Text style={brandSubtitleStyle}>{studioName || "Studio"}</Text>
          </Section>

          {/* Divisor */}
          <Section style={dividerSectionStyle}>
            <Hr style={dividerStyle} />
          </Section>

          {/* Título */}
          <Section style={titleSectionStyle}>
            <Heading as="h1" style={titleStyle}>
              Confirme seu endereço de e-mail
            </Heading>
          </Section>

          {/* Conteúdo */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              {clientName && clientName !== "Cliente" ? `Olá, ${clientName}. ` : ""}
              Sua conta no <strong style={boldHighlightStyle}>{studioName || "LUVEA"}</strong> está quase pronta.
              Clique no botão abaixo para confirmar este e-mail e desbloquear o seu portal exclusivo
              de gestão e reservas.
            </Text>
          </Section>

          {/* Botão CTA */}
          <Section style={buttonSectionStyle}>
            <Button href={confirmationUrl} style={buttonStyle}>
              Confirmar E-mail
            </Button>
          </Section>

          {/* Link alternativo */}
          <Section style={altLinkSectionStyle}>
            <Text style={altLinkTextStyle}>
              Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
              <br />
              <Link href={confirmationUrl} style={altLinkAnchorStyle}>
                {confirmationUrl}
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
              Se você não solicitou este cadastro, pode ignorar esta mensagem com segurança.
              <br />
              <br />
              &copy; Luvea Studio &bull;{" "}
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

export default ConfirmEmail;

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
  margin: 0,
  textAlign: "center",
};

const boldHighlightStyle: React.CSSProperties = {
  color: "#ffffff",
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
