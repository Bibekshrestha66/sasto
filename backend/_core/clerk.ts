import { createClerkClient, verifyToken } from "@clerk/backend";
import { getUserByOpenId, upsertUser } from "../db";

const secretKey = process.env.CLERK_SECRET_KEY || "";
if (!secretKey && process.env.NODE_ENV === "production") {
  console.warn("CLERK_SECRET_KEY is not configured! Authentication will fail.");
}

export const clerkClient = createClerkClient({ secretKey });

/**
 * Verify a Clerk token, fetch/sync user information, and return the local user object.
 */
export async function authenticateClerkUser(token: string) {
  try {
    // 1. Verify token signature and claims using JWT verification
    console.log("[Clerk Auth] Verifying incoming Clerk token...");
    const claims = await verifyToken(token, { secretKey });
    const clerkId = claims.sub;
    if (!clerkId) {
      throw new Error("Clerk token missing subject claim (sub)");
    }
    console.log(`[Clerk Auth] Token verified successfully. subject (clerkId): ${clerkId}`);

    // 2. Check if user already exists locally
    let user = await getUserByOpenId(clerkId);
    console.log(`[Clerk Auth] Local user lookup: ${user ? 'Found (' + user.email + ')' : 'Not Found'}`);

    // 3. Sync profile from Clerk if user does not exist or periodically
    if (!user) {
      console.log(`[Clerk Auth] Syncing new user profile for clerkId: ${clerkId}`);
      const clerkUser = await clerkClient.users.getUser(clerkId);
      
      const email = clerkUser.emailAddresses[0]?.emailAddress || null;
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email?.split("@")[0] || "User";
      const avatar = clerkUser.imageUrl || null;
      let role = (clerkUser.privateMetadata?.role as string) || "user";
      if (email === "bibekshrestha66@gmail.com" || email === process.env.OWNER_OPEN_ID) {
        role = "super_admin";
      }

      // Upsert into local database
      await upsertUser({
        openId: clerkId,
        name,
        email,
        avatar,
        role,
        loginMethod: "clerk",
        isVerified: role !== "user", // verify automatically if role has changed
        lastSignedIn: new Date(),
      });

      user = await getUserByOpenId(clerkId);
    } else {
      // Lazily update lastSignedIn and check if role changed in Clerk privateMetadata
      const clerkUser = await clerkClient.users.getUser(clerkId);
      let newRole = (clerkUser.privateMetadata?.role as string) || "user";
      if (user.email === "bibekshrestha66@gmail.com" || user.email === process.env.OWNER_OPEN_ID) {
        newRole = "super_admin";
      }
      
      if (user.role !== newRole || user.name !== `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()) {
        console.log(`[Clerk Auth] Updating role/metadata locally to: ${newRole} for ${clerkId}`);
        await upsertUser({
          openId: clerkId,
          role: newRole,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          avatar: clerkUser.imageUrl,
          lastSignedIn: new Date(),
        });
        user = await getUserByOpenId(clerkId);
      }
    }

    if (!user) {
      throw new Error("Failed to resolve user locally after Clerk sync");
    }

    return user;
  } catch (error) {
    console.error("[Clerk Auth] Failed to authenticate user:", error);
    throw error;
  }
}
