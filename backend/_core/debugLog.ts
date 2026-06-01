import fs from "fs";
import path from "path";

const SESSION_ID = "90368c";
const INGEST_URL = "http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad";

// Write under the project root regardless of where the server is started from.
const LOG_PATH = path.resolve(import.meta.dirname, "../..", "debug-90368c.log");

type DebugLogPayload = {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

export function writeDebugLog(payload: DebugLogPayload) {
  // #region agent log
  const line = JSON.stringify(payload) + "\n";

  try {
    fs.appendFileSync(LOG_PATH, line, { encoding: "utf8" });
  } catch {
    // Never block server execution due to logging.
  }

  try {
    const f = globalThis.fetch as unknown as undefined | ((...args: any[]) => Promise<any>);
    if (typeof f === "function") {
      f(INGEST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": SESSION_ID,
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch {
    // ignore
  }
  // #endregion
}

