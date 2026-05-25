import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { authService } from "../_core/authService";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Google OAuth token verification
 * Verifies JWT tokens from Google Sign-In
 */
type GoogleTokenPayload = JWTPayload & {
  email?: string;
  sub?: string;
  email_verified?: boolean | string;
  picture?: string;
  name?: string;
};

const googleJWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

async function verifyGoogleToken(token: string) {
  const clientId = ENV.googleClientId || process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  
  console.log("[Google Auth] Token verification started");
  console.log("[Google Auth] Client ID from ENV:", ENV.googleClientId ? "SET" : "NOT SET");
  console.log("[Google Auth] Using client ID:", clientId ? clientId.substring(0, 20) + "..." : "NOT SET");
  
  if (!clientId) {
    console.error("[Google Auth] ERROR: No Google client ID configured");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Google client ID is not configured on the server",
    });
  }

  try {
    const { payload } = await jwtVerify(token, googleJWKS, {
      issuer: ["accounts.google.com", "https://accounts.google.com"],
      audience: clientId,
    });
    const data = payload as GoogleTokenPayload;
    console.log("[Google Auth] Token verified successfully for:", data.email);

    if (!data.email) {
      console.warn("[Google Auth] Token missing email");
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Google token does not contain an email",
      });
    }

    const emailVerified =
      data.email_verified === true || data.email_verified === "true";
    if (!emailVerified) {
      console.warn("[Google Auth] Email not verified:", data.email);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Google account email is not verified",
      });
    }

    return data;
  } catch (error) {
    console.error("[Google Auth] Token verification failed:", error);
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Google token",
    });
  }
}

export const googleAuthRouter = {
  /**
   * Google Sign-In callback handler
   * Handles the JWT token from Google and creates/updates user
   */
  signIn: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("[Google Auth] signIn mutation called");
        // Verify Google ID token and validate issuer/audience/email
        const googleData = await verifyGoogleToken(input.token);

        const email = googleData.email;
        if (!email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email not found in Google token",
          });
        }

        const openId = googleData.sub || email;

        // Check if user exists
        let user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          const result = await db
            .insert(users)
            .values({
              openId,
              email,
              name: googleData.name || email.split("@")[0],
              avatar: googleData.picture,
              loginMethod: "google",
              role: "user",
              verificationStatus: "verified", // Google email is verified
            })
            .returning();

          user = result[0];
          if (!user) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create user",
            });
          }
        } else {
          await db
            .update(users)
            .set({
              name: googleData.name || user.name,
              avatar: googleData.picture || user.avatar,
              loginMethod: "google",
              lastSignedIn: new Date(),
            })
            .where(eq(users.id, user.id));

          user = {
            ...user,
            name: googleData.name || user.name,
            avatar: googleData.picture || user.avatar,
            lastSignedIn: new Date(),
          };
        }

        // Create session token and store it in a cookie
        const sessionToken = await authService.createSessionToken(user.openId, {
          name: user.name || "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email as string,
            name: user.name as string,
            avatar: user.avatar as string,
            role: user.role as string,
          },
        };
      } catch (error) {
        console.error("Google Sign-In error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }),

  /**
   * Link Google account to existing user
   */
  linkAccount: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        userId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const googleData = await verifyGoogleToken(input.token);

        // Update user with Google information
        const openId = googleData.sub || googleData.email;
        if (!openId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Google token did not contain a valid subject or email",
          });
        }

        await db
          .update(users)
          .set({
            openId,
            loginMethod: "google",
            avatar: googleData.picture,
          })
          .where(eq(users.id, input.userId));

        return {
          success: true,
          message: "Google account linked successfully",
        };
      } catch (error) {
        console.error("Account linking error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }),

  /**
   * Get Google Sign-In configuration
   */
  getConfig: publicProcedure.query(() => {
    return {
      clientId: process.env.VITE_GOOGLE_CLIENT_ID || "",
      redirectUri: `${process.env.VITE_APP_URL || "http://localhost:3000"}/auth/google/callback`,
    };
  }),
};
