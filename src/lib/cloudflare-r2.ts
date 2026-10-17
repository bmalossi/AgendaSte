import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Utilitário de conexão e upload para Cloudflare R2 (S3-Compatible Object Storage)
 * Zero taxas de transferência (egress zero) com alta performance e confiabilidade.
 */

export function isR2Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET_NAME
  );
}

export function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Credenciais da Cloudflare R2 ausentes. Configure CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID e CLOUDFLARE_R2_SECRET_ACCESS_KEY no arquivo .env.local."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export interface UploadToR2Params {
  buffer: Buffer;
  key: string;
  contentType: string;
}

export interface UploadToR2Result {
  url: string;
  key: string;
  bucket: string;
}

export async function uploadBufferToR2({
  buffer,
  key,
  contentType,
}: UploadToR2Params): Promise<UploadToR2Result> {
  const client = getR2Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error(
      "CLOUDFLARE_R2_BUCKET_NAME não definido no arquivo .env.local."
    );
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // Formata a URL pública do arquivo (via domínio público R2 dev ou domínio personalizado)
  const publicBaseUrl = (
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");

  const url = publicBaseUrl ? `${publicBaseUrl}/${key}` : `/${key}`;

  return {
    url,
    key,
    bucket,
  };
}
