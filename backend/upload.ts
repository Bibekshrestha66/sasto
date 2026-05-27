import { Router } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Cloudflare R2 Credentials
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "sasto";
const publicCustomDomain = process.env.R2_PUBLIC_CUSTOM_DOMAIN; // e.g. https://pub-xxx.r2.dev or https://images.sasto.com.np

// Initialize R2 client using standard S3 compatibility
const r2Client = new S3Client({
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
  region: "auto",
});

const uploadRouter = Router();

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

uploadRouter.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Generate unique safe name for the file
    const fileExtension = req.file.originalname.split(".").pop() || "jpg";
    const randomHash = crypto.randomBytes(16).toString("hex");
    const key = `uploads/${Date.now()}-${randomHash}.${fileExtension}`;

    // Upload object to Cloudflare R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    // Compute public URL
    // If publicCustomDomain is configured, use it, otherwise fall back to a public r2 endpoint
    const baseUrl = publicCustomDomain 
      ? publicCustomDomain.replace(/\/$/, "")
      : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;

    const publicUrl = `${baseUrl}/${key}`;

    res.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

export { uploadRouter };
