import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Fallback key for development if MESSAGE_ENCRYPTION_KEY is not in .env (32 bytes)
const DEFAULT_KEY = Buffer.from("f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9", "utf8");

function getEncryptionKey(): Buffer {
  const envKey = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!envKey) {
    return DEFAULT_KEY;
  }
  // Standardize key size to 32 bytes (256 bits) using SHA-256 hash
  return crypto.createHash("sha256").update(envKey).digest();
}

/**
 * Encrypt a text string securely
 */
export function encryptMessage(text: string): string {
  if (!text) return "";
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    // Format: "ENC:iv_in_hex:encrypted_in_base64"
    return `ENC:${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("[Encryption] Failed to encrypt message:", error);
    return text; // Fallback to plain text on error
  }
}

/**
 * Decrypt a text string safely.
 * Supports backward compatibility for plain text messages.
 */
export function decryptMessage(encryptedText: string): string {
  if (!encryptedText || !encryptedText.startsWith("ENC:")) {
    return encryptedText; // Return plain text as-is (backward compatible)
  }

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return encryptedText; // Fallback to raw text if format is invalid
    }

    const ivHex = parts[1];
    const encryptedData = parts[2];
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt message:", error);
    return encryptedText; // Fallback to raw string if decryption fails
  }
}
