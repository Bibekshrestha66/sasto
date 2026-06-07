import { MongoClient, GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";

let mongoClient: MongoClient | null = null;
let gridFSBucket: GridFSBucket | null = null;

export async function initMongoStorage() {
  if (gridFSBucket) return gridFSBucket;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  const db = mongoClient.db(); // Uses the database from the URI
  gridFSBucket = new GridFSBucket(db, {
    bucketName: "uploads",
  });
  
  return gridFSBucket;
}

export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (!gridFSBucket) {
    return await initMongoStorage();
  }
  return gridFSBucket;
}

/**
 * Upload a file to GridFS
 * @returns The hex string ID of the uploaded file in GridFS
 */
export async function uploadToGridFS(
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = await getGridFSBucket();
  
  return new Promise((resolve, reject) => {
    // Create a readable stream from the buffer
    const readableTrackStream = new Readable();
    readableTrackStream.push(buffer);
    readableTrackStream.push(null);

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { contentType: contentType },
    });

    readableTrackStream
      .pipe(uploadStream)
      .on("error", (error) => {
        reject(error);
      })
      .on("finish", () => {
        resolve(uploadStream.id.toString());
      });
  });
}
