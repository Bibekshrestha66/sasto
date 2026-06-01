import { S3Client } from "@aws-sdk/client-s3";

export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sasto";
export const R2_PUBLIC_CUSTOM_DOMAIN = process.env.R2_PUBLIC_CUSTOM_DOMAIN; // e.g. https://images.sasto.com.np

export function getR2PublicBaseUrl() {
  if (R2_PUBLIC_CUSTOM_DOMAIN) return R2_PUBLIC_CUSTOM_DOMAIN.replace(/\/$/, "");
  if (!R2_ACCOUNT_ID) return null;
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

export function getR2Client() {
  if (!R2_ACCOUNT_ID) return null;
  return new S3Client({
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID || "",
      secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
    region: "auto",
  });
}

