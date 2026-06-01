import { Router } from "express";
import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { getR2Client, getR2PublicBaseUrl, R2_BUCKET_NAME, R2_ACCOUNT_ID } from "./r2";

// r2Client is initialized lazily per-request so TypeScript narrowing works correctly
const uploadRouter = Router();

// Configure Multer for memory storage with a 50MB max limit to accommodate videos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

uploadRouter.post("/image", upload.single("image"), async (req, res) => {
  try {
    const r2 = getR2Client();
    if (!r2) {
      return res.status(500).json({ error: "R2 is not configured" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    
    const isVideo = req.file.mimetype.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: `File too large. Max size for ${isVideo ? 'videos is 50MB' : 'images is 5MB'}` });
    }

    // Generate unique safe name for the file
    const fileExtension = req.file.originalname.split(".").pop() || "jpg";
    const randomHash = crypto.randomBytes(16).toString("hex");
    const key = `uploads/${Date.now()}-${randomHash}.${fileExtension}`;

    // Upload object to Cloudflare R2
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    // Compute public URL
    const baseUrl = getR2PublicBaseUrl() || `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const publicUrl = `${baseUrl}/${key}`;

    res.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

export { uploadRouter };
