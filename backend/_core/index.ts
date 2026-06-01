import "dotenv/config";
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
console.log("[Startup] NODE_ENV:", process.env.NODE_ENV);
console.log("[Startup] CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET");
console.log("[Startup] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("[Startup] INNGEST_EVENT_KEY:", process.env.INNGEST_EVENT_KEY ? "SET" : "NOT SET");

import { createServer } from "http";
import os from "os";
import { createApp } from "./createApp";

async function startServer() {
  const httpServer = createServer();
  const mode = process.env.NODE_ENV === "development" ? "development" : "production";
  const { app, ready } = await createApp({ mode, httpServer });
  await ready;

  httpServer.on("request", app);
  const preferredPort = parseInt(process.env.PORT || "3000");

  const interfaces = os.networkInterfaces();
  let localIp = "localhost";
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
  }

  const listen = (port: number, attemptsLeft: number) => {
    httpServer.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
        console.log(`Port ${port} is busy, trying ${port + 1} instead`);
        listen(port + 1, attemptsLeft - 1);
        return;
      }
      throw error;
    });

    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Server running on:`);
      console.log(`  - Local:   http://localhost:${port}/`);
      console.log(`  - Network: http://${localIp}:${port}/`);
      console.log(`[WebSocket] Available at ws://${localIp}:${port}`);
    });
  };

  listen(preferredPort, 20);
}

startServer().catch(console.error);
