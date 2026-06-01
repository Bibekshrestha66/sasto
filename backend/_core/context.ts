import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authService } from "./authService";
import { writeDebugLog } from "./debugLog";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const authHeader = opts.req.headers.authorization;
  const authHeaderLen = typeof authHeader === "string" ? authHeader.length : 0;
  let authErrorName: string | null = null;
  let authOk = false;

  try {
    user = await authService.authenticateRequest(opts.req);
    authOk = true;
  } catch (error) {
    // Authentication is optional for public procedures.
    authOk = false;
    authErrorName = error instanceof Error ? error.name : "Error";
    user = null;
  }

  // #region agent log
  writeDebugLog({
    sessionId: "90368c",
    runId: "debug_pre",
    hypothesisId: "H2_auth",
    location: "backend/_core/context.ts:createContext",
    message: "TRPC context auth result",
    data: {
      hasBearerHeader: typeof authHeader === "string" && authHeader.startsWith("Bearer "),
      authHeaderLen,
      authOk,
      authErrorName,
    },
    timestamp: Date.now(),
  });
  // #endregion

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
