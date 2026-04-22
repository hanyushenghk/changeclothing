import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

function optionalEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function endpointFromAccountId(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

function accountIdFromEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    const host = url.hostname;
    const suffix = ".r2.cloudflarestorage.com";

    if (host.endsWith(suffix)) {
      return host.slice(0, host.length - suffix.length);
    }
  } catch {
    // ignore parse error and throw below
  }

  throw new Error(
    "Invalid R2 endpoint. Please use https://<account-id>.r2.cloudflarestorage.com",
  );
}

function getR2Env() {
  const endpoint = optionalEnv("R2_ENDPOINT");
  const accountIdRaw = optionalEnv("R2_ACCOUNT_ID");
  const accountId = accountIdRaw || (endpoint ? accountIdFromEndpoint(endpoint) : "");
  if (!accountId) {
    throw new Error("Missing required env: R2_ACCOUNT_ID (or R2_ENDPOINT).");
  }

  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const bucket = optionalEnv("R2_BUCKET", "R2_BUCKET_NAME");
  if (!bucket) {
    throw new Error("Missing required env: R2_BUCKET (or R2_BUCKET_NAME).");
  }
  const publicBaseUrl = optionalEnv("R2_PUBLIC_BASE_URL", "R2_PUBLIC_URL");
  const resolvedEndpoint = endpoint || endpointFromAccountId(accountId);

  return {
    accountId,
    endpoint: resolvedEndpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
  };
}

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: getR2Env().endpoint,
    credentials: {
      accessKeyId: getR2Env().accessKeyId,
      secretAccessKey: getR2Env().secretAccessKey,
    },
    forcePathStyle: false,
  });

  return cachedClient;
}

export const r2Client = {
  send: <T>(command: T) => getR2Client().send(command as never),
};

export type UploadToR2Input = {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  cacheControl?: string;
};

export function getR2PublicUrl(key: string): string {
  const { publicBaseUrl, bucket, accountId } = getR2Env();

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
  }

  return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key.replace(/^\//, "")}`;
}

/**
 * Uploads an object to Cloudflare R2 via S3-compatible API.
 */
export async function uploadToR2(input: UploadToR2Input): Promise<{ key: string; bucket: string; url: string }> {
  const { bucket } = getR2Env();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }),
  );

  return {
    key: input.key,
    bucket,
    url: getR2PublicUrl(input.key),
  };
}
