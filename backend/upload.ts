import { Router } from "express";
import multer from "multer";
import { ObjectId } from "mongodb";
// import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
// import { getR2Client, getR2PublicBaseUrl, R2_BUCKET_NAME, R2_ACCOUNT_ID } from "./r2";
import { uploadToGridFS, getGridFSBucket } from "./mongoStorage";

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
    // const r2 = getR2Client();
    // if (!r2) {
    //   return res.status(500).json({ error: "R2 is not configured" });
    // }
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
    // await r2.send(
    //   new PutObjectCommand({
    //     Bucket: R2_BUCKET_NAME,
    //     Key: key,
    //     Body: req.file.buffer,
    //     ContentType: req.file.mimetype,
    //   })
    // );

    // // Compute public URL
    // const baseUrl = getR2PublicBaseUrl() || `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    // const publicUrl = `${baseUrl}/${key}`;

    // Upload to MongoDB GridFS instead
    const fileId = await uploadToGridFS(key, req.file.buffer, req.file.mimetype);

    // Provide a local URL that will stream the image from MongoDB
    const publicUrl = `/api/upload/image/${fileId}`;

    res.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

uploadRouter.get("/image/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    const bucket = await getGridFSBucket();
    const _id = new ObjectId(fileId);

    // Find the file to get its content type
    const files = await bucket.find({ _id }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = files[0];
    const contentType = file.metadata?.contentType || "application/octet-stream";
    res.set("Content-Type", contentType as string);
    
    // Cache the image for 1 year since it's immutable
    res.set("Cache-Control", "public, max-age=31536000, immutable");

    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end();
    });

    downloadStream.pipe(res);
  } catch (error: any) {
    console.error("Download error:", error);
    res.status(500).json({ error: error.message || "Failed to download image" });
  }
});

export { uploadRouter };
