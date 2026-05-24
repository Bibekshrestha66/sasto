import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { requireSuperAdmin, requireAdmin, ROLE_LEVELS } from "../_core/rbac";
import { getDb } from "../db";
import { users, roles, permissions, rolePermissions, userRoles, roleAuditLogs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const rbacRouter = router({
  // Get all roles with their permissions
  getRoles: publicProcedure.query(async () => {
    const db = await getDb();
    const allRoles = await db.select().from(roles);
    
    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const perms = await db
          .select({ name: permissions.name, description: permissions.description, category: permissions.category })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, role.id));
        
        return {
          ...role,
          permissions: perms,
        };
      })
    );
    
    return rolesWithPermissions;
  }),

  // Get user's roles and permissions
  getUserRoles: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const targetUserId = input.userId || ctx.user.id;
      
      // Get user's primary role
      const user = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      if (!user.length) throw new Error("User not found");
      
      // Get additional roles assigned via user_roles table
      const assignedRoles = await db
        .select({ 
          roleId: userRoles.roleId,
          roleName: roles.name,
          roleDescription: roles.description,
          assignedAt: userRoles.assignedAt,
          expiresAt: userRoles.expiresAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, targetUserId));
      
      // Get permissions for primary role
      const primaryRolePerms = await db
        .select({ name: permissions.name, description: permissions.description, category: permissions.category })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
        .where(eq(roles.name, user[0].role));
      
      return {
        primaryRole: user[0].role,
        assignedRoles,
        permissions: primaryRolePerms,
      };
    }),

  // Assign role to user (Super Admin only)
  assignRole: protectedProcedure
    .input(z.object({ userId: z.number(), roleId: z.number(), expiresAt: z.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireSuperAdmin(ctx);
      const db = await getDb();
      
      // Verify role exists
      const role = await db.select().from(roles).where(eq(roles.id, input.roleId)).limit(1);
      if (!role.length) throw new Error("Role not found");
      
      // Assign role
      await db.insert(userRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: ctx.user.id,
        expiresAt: input.expiresAt,
      });
      
      // Log action
      await db.insert(roleAuditLogs).values({
        userId: ctx.user.id,
        action: "assign_role",
        targetUserId: input.userId,
        details: JSON.stringify({ roleId: input.roleId, roleName: role[0].name }),
      });
      
      return { success: true };
    }),

  // Remove role from user (Super Admin only)
  removeRole: protectedProcedure
    .input(z.object({ userId: z.number(), roleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireSuperAdmin(ctx);
      const db = await getDb();
      
      await db.delete(userRoles).where(
        and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId))
      );
      
      // Log action
      await db.insert(roleAuditLogs).values({
        userId: ctx.user.id,
        action: "remove_role",
        targetUserId: input.userId,
        details: JSON.stringify({ roleId: input.roleId }),
      });
      
      return { success: true };
    }),

  // Update user's primary role (Super Admin only)
  updateUserRole: protectedProcedure
    .input(z.object({ userId: z.number(), newRole: z.enum(["user", "seller", "csr", "sub_moderator", "moderator", "admin", "super_admin"]) }))
    .mutation(async ({ ctx, input }) => {
      requireSuperAdmin(ctx);
      const db = await getDb();
      
      const oldUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!oldUser.length) throw new Error("User not found");
      
      await db.update(users).set({ role: input.newRole }).where(eq(users.id, input.userId));
      
      // Log action
      await db.insert(roleAuditLogs).values({
        userId: ctx.user.id,
        action: "update_role",
        targetUserId: input.userId,
        details: JSON.stringify({ oldRole: oldUser[0].role, newRole: input.newRole }),
      });
      
      return { success: true };
    }),

  // Get all permissions
  getPermissions: publicProcedure.query(async () => {
    const db = await getDb();
    return await db.select().from(permissions);
  }),

  // Get audit logs (Admin only)
  getAuditLogs: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const db = await getDb();
      
      return await db
        .select({
          id: roleAuditLogs.id,
          userId: roleAuditLogs.userId,
          userName: users.name,
          action: roleAuditLogs.action,
          targetUserId: roleAuditLogs.targetUserId,
          details: roleAuditLogs.details,
          createdAt: roleAuditLogs.createdAt,
        })
        .from(roleAuditLogs)
        .leftJoin(users, eq(roleAuditLogs.userId, users.id))
        .orderBy(roleAuditLogs.createdAt)
        .limit(input.limit)
        .offset(input.offset);
    }),

  // Get role statistics (Admin only)
  getRoleStatistics: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const db = await getDb();
    
    const stats = await db
      .select({
        role: users.role,
        count: users.id,
      })
      .from(users)
      .groupBy(users.role);
    
    return stats;
  }),

  // Toggle permission for a role (Super Admin only)
  togglePermission: protectedProcedure
    .input(z.object({ roleId: z.number(), permissionId: z.number(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      requireSuperAdmin(ctx);
      const db = await getDb();
      
      if (input.active) {
        // Add permission
        await db.insert(rolePermissions).values({
          roleId: input.roleId,
          permissionId: input.permissionId,
        });
      } else {
        // Remove permission
        await db.delete(rolePermissions).where(
          and(
            eq(rolePermissions.roleId, input.roleId),
            eq(rolePermissions.permissionId, input.permissionId)
          )
        );
      }
      
      // Log action
      await db.insert(roleAuditLogs).values({
        userId: ctx.user.id,
        action: input.active ? "add_permission" : "remove_permission",
        details: JSON.stringify({ roleId: input.roleId, permissionId: input.permissionId }),
      });
      
      return { success: true };
    }),
});
