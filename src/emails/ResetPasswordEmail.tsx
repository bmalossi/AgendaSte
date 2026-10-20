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

export interface ResetPasswordEmailProps {
  name?: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function ResetPasswordEmail({
  name = "Usuário",
  resetUrl = "https://luvea.app/redefinir-senha",
  expiresInMinutes = 60,
}: ResetPasswordEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>Solicitação de redefinição de senha na Luvea</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>LUVEA</Text>
            <Text style={subtitleBadgeStyle}>SEGURANÇA &amp; AUTENTICAÇÃO</Text>
          </Section>

          {/* Content */}
          <Section style={contentSectionStyle}>
            <div style={statusBadgeContainerStyle}>
              <span style={indicatorDotStyle} />
              <span style={statusTextStyle}>Token de Segurança — Expira em {expiresInMinutes}min</span>
            </div>

            <Heading as="h1" style={headingStyle}>
              Redefinição de Senha
            </Heading>

            <Text style={paragraphStyle}>
              Olá, {name}. Recebemos uma solicitação para alterar a senha de acesso da sua
              conta na plataforma Luvea.
            </Text>

            <Text style={paragraphStyle}>
              Para criar uma nova credencial e recuperar seu acesso, toque no botão seguro
              abaixo:
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainerStyle}>
              <Button href={resetUrl} style={buttonStyle}>
                Redefinir minha senha
              </Button>
            </Section>

            {/* URL Fallback */}
            <Section style={urlFallbackCardStyle}>
              <Text style={urlFallbackLabelStyle}>OU UTILIZE O LINK DIRETO</Text>
              <Text style={urlFallbackTextStyle}>
                <Link href={resetUrl} style={urlFallbackLinkStyle}>
                  {resetUrl}
                </Link>
              </Text>
            </Section>

            <Text style={warningNoticeStyle}>
              Caso não tenha sido você a solicitar a redefinição de senha, desconsidere esta
              mensagem. Seu acesso permanece protegido e nenhuma alteração será realizada.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={dividerStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Luvea Technologies Inc. — Canal oficial de comunicação e segurança.
            </Text>
            <Text style={footerLinksStyle}>
              <Link href="https://luvea.app/ajuda" style={footerLinkItemStyle}>
                Central de Ajuda
              </Link>
              {" · "}
              <Link href="https://luvea.app/privacidade" style={footerLinkItemStyle}>
                Privacidade
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

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
  backgroundColor: "#71717A",
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
  margin: "0 0 14px 0",
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0 20px 0",
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

const urlFallbackCardStyle: React.CSSProperties = {
  backgroundColor: "#F5F5F7",
  border: "1px solid #E5E5EA",
  borderRadius: "12px",
  padding: "14px 16px",
  margin: "20px 0",
};

const urlFallbackLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  color: "#8E8E93",
  margin: "0 0 6px 0",
};

const urlFallbackTextStyle: React.CSSProperties = {
  margin: "0",
  wordBreak: "break-all",
};

const urlFallbackLinkStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#1C1C1E",
  fontFamily: 'ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace',
  textDecoration: "underline",
};

const warningNoticeStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#8E8E93",
  lineHeight: "1.5",
  margin: "16px 0 0 0",
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
