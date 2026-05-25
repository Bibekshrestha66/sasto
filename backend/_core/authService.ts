import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { createSecretKey } from "crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  openId: string;
  name: string;
};

class AuthService {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    const value = secret || (process.env.NODE_ENV === "production" ? null : "fallback-secret-for-dev-only");
    if (!value) {
      throw new Error("COOKIE_SECRET or JWT_SECRET environment variable is required for session signing");
    }
    return createSecretKey(Buffer.from(value));
  }

  /**
   * Create a session token for a user
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId,
      name: options.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a session token from cookie
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; name: string } | null> {
    if (!cookieValue) return null;

    try {
      // DEV-DEBUG: log cookie and secret fingerprint to help local debugging
      if (process.env.NODE_ENV === 'development') {
        try {
          console.debug('[Auth][DEBUG] cookie snippet:', cookieValue.slice(0, 40));
        } catch (e) {}
      }

      const secretKey = this.getSessionSecret();
      if (process.env.NODE_ENV === 'development') {
        try {
          const skStr = typeof secretKey === 'string' ? secretKey : Buffer.from(secretKey as Uint8Array).toString('hex');
          console.debug('[Auth][DEBUG] secret fingerprint (hex, first 24):', skStr.slice(0, 24));
        } catch (e) {}
      }

      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, name } = payload as Record<string, unknown>;

      if (typeof openId !== "string" || typeof name !== "string") {
        return null;
      }

      return { openId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate a request and return the user object
   */
  async authenticateRequest(req: Request): Promise<User> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) throw ForbiddenError("Missing cookie header");

    const parsed = parseCookieHeader(cookieHeader);
    const sessionCookie = parsed[COOKIE_NAME];
    
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found in database");
    }

    // Update last signed in time
    await upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

export const authService = new AuthService();
