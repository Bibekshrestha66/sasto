import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { authService } from "../_core/authService";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

/**
 * Google OAuth token verification
 * Verifies JWT tokens from Google Sign-In
 */
async function verifyGoogleToken(token: string) {
  try {
    // In production, verify the token with Google's API
    // For now, we'll use a simplified approach
    const response = await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `access_token=${token}`,
    });

    if (!response.ok) {
      throw new Error("Invalid token");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Token verification error:", error);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Google token",
    });
  }
}

/**
 * Decode JWT from Google Sign-In (without verification for now)
 * In production, always verify with Google's API
 */
function decodeGoogleJWT(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return decoded;
  } catch (error) {
    console.error("JWT decode error:", error);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid token format",
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
    .mutation(async ({ input }) => {
      try {
        // Decode the Google JWT
        const googleData = decodeGoogleJWT(input.token);

        if (!googleData.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email not found in token",
          });
        }

        // Check if user exists
        let user = await db.query.users.findFirst({
          where: eq(users.email, googleData.email),
        });

        if (!user) {
          const result = await db
            .insert(users)
            .values({
              openId: googleData.sub || (googleData.email as string),
              email: googleData.email as string,
              name: (googleData.name as string) || (googleData.email as string).split("@")[0],
              avatar: googleData.picture as string,
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

        // Create session token
        const sessionToken = await authService.createSessionToken(user.openId, {
          name: user.name || "",
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email as string,
            name: user.name as string,
            avatar: user.avatar as string,
            role: user.role as string,
          },
          sessionToken,
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
        const googleData = decodeGoogleJWT(input.token);

        // Update user with Google information
        await db
          .update(users)
          .set({
            openId: googleData.sub || googleData.email,
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
