import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { authenticateClerkUser } from "./clerk";
import { ForbiddenError } from "@shared/_core/errors";

class AuthService {
  /**
   * Authenticate a request using Clerk and return the user object from the local DB.
   */
  async authenticateRequest(req: Request): Promise<User> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ForbiddenError("Missing or invalid Authorization header");
    }

    const token = authHeader.substring(7); // Extract the JWT token
    const user = await authenticateClerkUser(token);
    return user;
  }
}

export const authService = new AuthService();
