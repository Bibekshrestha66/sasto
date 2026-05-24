import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";

/**
 * Role hierarchy levels
 * Higher level = more permissions
 */
export const ROLE_LEVELS = {
  user: 0,
  seller: 1,
  csr: 2,
  sub_moderator: 3,
  moderator: 4,
  admin: 5,
  super_admin: 6,
} as const;

export type RoleType = keyof typeof ROLE_LEVELS;

/**
 * Check if user has a specific role
 */
export function hasRole(ctx: TrpcContext, role: RoleType): boolean {
  if (!ctx.user) return false;
  const userRole = ctx.user.role as string;
  return userRole === role || (ROLE_LEVELS[userRole as RoleType] ?? -1) >= ROLE_LEVELS[role];
}

/**
 * Check if user has minimum role level
 */
export function hasMinimumRole(ctx: TrpcContext, minRole: RoleType): boolean {
  if (!ctx.user) return false;
  const userRole = ctx.user.role as string;
  return (ROLE_LEVELS[userRole as RoleType] ?? -1) >= ROLE_LEVELS[minRole];
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(ctx: TrpcContext): boolean {
  return hasRole(ctx, "super_admin");
}

/**
 * Check if user is Admin or higher
 */
export function isAdmin(ctx: TrpcContext): boolean {
  return hasMinimumRole(ctx, "admin");
}

/**
 * Check if user is Moderator or higher
 */
export function isModerator(ctx: TrpcContext): boolean {
  return hasMinimumRole(ctx, "moderator");
}

/**
 * Check if user is Sub-Moderator or higher
 */
export function isSubModerator(ctx: TrpcContext): boolean {
  return hasMinimumRole(ctx, "sub_moderator");
}

/**
 * Check if user is CSR or higher
 */
export function isCSR(ctx: TrpcContext): boolean {
  return hasMinimumRole(ctx, "csr");
}

/**
 * Check if user is Seller or higher
 */
export function isSeller(ctx: TrpcContext): boolean {
  return hasMinimumRole(ctx, "seller");
}

/**
 * Throw error if user doesn't have required role
 */
export function requireRole(ctx: TrpcContext, role: RoleType): void {
  if (!hasRole(ctx, role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires ${role} role or higher`,
    });
  }
}

/**
 * Throw error if user doesn't have minimum role
 */
export function requireMinimumRole(ctx: TrpcContext, minRole: RoleType): void {
  if (!hasMinimumRole(ctx, minRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires ${minRole} role or higher`,
    });
  }
}

/**
 * Throw error if user is not Super Admin
 */
export function requireSuperAdmin(ctx: TrpcContext): void {
  if (!isSuperAdmin(ctx)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires Super Admin role",
    });
  }
}

/**
 * Throw error if user is not Admin
 */
export function requireAdmin(ctx: TrpcContext): void {
  if (!isAdmin(ctx)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires Admin role or higher",
    });
  }
}

/**
 * Throw error if user is not Moderator
 */
export function requireModerator(ctx: TrpcContext): void {
  if (!isModerator(ctx)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires Moderator role or higher",
    });
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: RoleType): string {
  const descriptions: Record<RoleType, string> = {
    user: "Regular marketplace user",
    seller: "Seller account",
    csr: "Customer Service Representative",
    sub_moderator: "Sub Moderator with limited moderation rights",
    moderator: "Moderator with full moderation rights",
    admin: "Administrator with most system access",
    super_admin: "Super Administrator with full system access",
  };
  return descriptions[role];
}

/**
 * Get all roles with their levels
 */
export function getAllRoles(): Array<{ role: RoleType; level: number; description: string }> {
  return Object.entries(ROLE_LEVELS).map(([role, level]) => ({
    role: role as RoleType,
    level,
    description: getRoleDescription(role as RoleType),
  }));
}
