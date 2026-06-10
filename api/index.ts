import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";

let app: Express | null = null;
let ready: Promise<void> | null = null;

async function getApp(): Promise<Express> {
  if (!app) {
    const { createApp } = await import("../backend/_core/createApp.js");
    const created = await createApp({ mode: "serverless" });
    app = created.app;
    ready = created.ready;
    await ready;
  } else if (ready) {
    await ready;
  }
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const application = await getApp();
  application(req as any, res as any);
}
