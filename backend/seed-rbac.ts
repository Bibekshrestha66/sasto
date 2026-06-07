import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { roles, permissions, rolePermissions } from "../drizzle/schema";

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL environment variable.");
    process.exit(1);
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log("Seeding RBAC roles and permissions...");

  const defaultRoles = [
    { name: "user", description: "Standard user account", level: 10 },
    { name: "seller", description: "Verified seller account", level: 20 },
    { name: "csr", description: "Customer Support Representative", level: 30 },
    { name: "sub_moderator", description: "Junior moderator for basic tasks", level: 40 },
    { name: "moderator", description: "Standard moderator for content", level: 50 },
    { name: "admin", description: "Administrator with high privileges", level: 80 },
    { name: "super_admin", description: "System owner with full access", level: 100 }
  ];

  const defaultPermissions = [
    { name: "view_dashboard", description: "Can view the admin dashboard", category: "System" },
    { name: "manage_users", description: "Can view and edit users", category: "Users" },
    { name: "ban_users", description: "Can ban and unban users", category: "Users" },
    { name: "review_verifications", description: "Can approve/reject profile verifications", category: "Verifications" },
    { name: "manage_listings", description: "Can view, edit, or delete listings", category: "Content" },
    { name: "approve_listings", description: "Can approve flagged listings", category: "Content" },
    { name: "reject_listings", description: "Can reject flagged listings", category: "Content" },
    { name: "feature_listings", description: "Can set listings as featured", category: "Content" },
    { name: "view_financials", description: "Can view financial reports and revenue", category: "Finance" },
    { name: "manage_rbac", description: "Can modify roles and permissions", category: "System" }
  ];

  try {
    for (const role of defaultRoles) {
      await db.insert(roles).values(role).onConflictDoNothing();
    }
    for (const perm of defaultPermissions) {
      await db.insert(permissions).values(perm).onConflictDoNothing();
    }
    
    // Auto-assign permissions to basic roles just to show them working
    const allRoles = await db.select().from(roles);
    const allPerms = await db.select().from(permissions);
    
    const adminRole = allRoles.find(r => r.name === "admin");
    const modRole = allRoles.find(r => r.name === "moderator");
    const csrRole = allRoles.find(r => r.name === "csr");

    // Assign admin all except manage_rbac
    if (adminRole) {
      for (const p of allPerms) {
        if (p.name !== "manage_rbac") {
          await db.insert(rolePermissions).values({ roleId: adminRole.id, permissionId: p.id }).onConflictDoNothing();
        }
      }
    }
    // Mod role
    if (modRole) {
      const modPermNames = ["view_dashboard", "manage_listings", "approve_listings", "reject_listings"];
      for (const p of allPerms.filter(p => modPermNames.includes(p.name))) {
        await db.insert(rolePermissions).values({ roleId: modRole.id, permissionId: p.id }).onConflictDoNothing();
      }
    }
    // CSR role
    if (csrRole) {
      const csrPermNames = ["view_dashboard", "review_verifications"];
      for (const p of allPerms.filter(p => csrPermNames.includes(p.name))) {
        await db.insert(rolePermissions).values({ roleId: csrRole.id, permissionId: p.id }).onConflictDoNothing();
      }
    }

    console.log("RBAC seeding complete!");
  } catch (err) {
    console.error("Seeding failed", err);
  } finally {
    await sql.end();
  }
}

run();
