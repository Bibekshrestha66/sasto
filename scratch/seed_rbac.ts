import { getDb } from "../server/db";
import { roles, permissions, rolePermissions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seed() {
  const db = await getDb();
  console.log("Seeding Roles and Permissions...");

  const defaultRoles = [
    { name: "user", level: 1, description: "Regular buyer" },
    { name: "seller", level: 2, description: "Individual seller" },
    { name: "dealer", level: 2, description: "Professional dealer" },
    { name: "wholesaler", level: 2, description: "Wholesale business" },
    { name: "distributor", level: 2, description: "Distributor business" },
    { name: "csr", level: 3, description: "Customer Support" },
    { name: "sub_moderator", level: 4, description: "Content reviewer" },
    { name: "moderator", level: 5, description: "Platform moderator" },
    { name: "admin", level: 9, description: "System administrator" },
    { name: "super_admin", level: 10, description: "Full system owner" },
  ];

  const defaultPermissions = [
    { name: "post_listing", category: "Marketplace", description: "Allow creating new listings" },
    { name: "place_bid", category: "Auction", description: "Allow bidding on auctions" },
    { name: "create_booking", category: "Rental", description: "Allow booking rentals" },
    { name: "view_analytics", category: "Analytics", description: "Access business reports" },
    { name: "manage_users", category: "Admin", description: "Suspend or ban users" },
    { name: "approve_content", category: "Moderation", description: "Approve pending listings" },
    { name: "manage_rbac", category: "Admin", description: "Change roles and permissions" },
    { name: "review_ads", category: "Moderation", description: "Review and moderate user listings" },
    { name: "edit_ads", category: "Moderation", description: "Edit existing user listings" },
    { name: "delete_ads", category: "Moderation", description: "Delete inappropriate listings" },
    { name: "manage_ad_campaigns", category: "Ads", description: "Manage paid advertisement campaigns" },
  ];

  // Insert Roles
  for (const role of defaultRoles) {
    const existing = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(roles).values(role);
      console.log(`Inserted role: ${role.name}`);
    }
  }

  // Insert Permissions
  for (const perm of defaultPermissions) {
    const existing = await db.select().from(permissions).where(eq(permissions.name, perm.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(permissions).values(perm);
      console.log(`Inserted permission: ${perm.name}`);
    }
  }

  // Map ALL permissions to super_admin
  const superAdminRole = await db.select().from(roles).where(eq(roles.name, "super_admin")).limit(1);
  const allPerms = await db.select().from(permissions);

  if (superAdminRole.length > 0) {
    console.log("Mapping all permissions to super_admin...");
    for (const perm of allPerms) {
      const existingMapping = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, superAdminRole[0].id),
            eq(rolePermissions.permissionId, perm.id)
          )
        )
        .limit(1);

      if (existingMapping.length === 0) {
        await db.insert(rolePermissions).values({
          roleId: superAdminRole[0].id,
          permissionId: perm.id,
        });
      }
    }
  }

  console.log("Seed complete!");
}

import { and } from "drizzle-orm";
seed().catch(console.error);
