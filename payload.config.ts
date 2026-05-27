import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  // Payload v3 uses Next.js for admin UI, no bundler config needed
  editor: lexicalEditor({}),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    // Disable automatic drizzle-kit push on startup — avoids TTY prompt errors
    // when running via `tsx watch`. Run `payload migrate` manually if schema changes.
    push: false,
    migrationDir: "./drizzle/payload-migrations",
  }),

  collections: [
    {
      slug: "cms-users",
      auth: true,
      fields: [
        {
          name: "role",
          type: "select",
          options: ["admin", "super_admin"],
          defaultValue: "admin",
          required: true,
        },
      ],
    },
    {
      slug: "categories",
      admin: {
        useAsTitle: "name",
      },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "description", type: "textarea" },
        { name: "icon", type: "text" },
        {
          name: "sector",
          type: "select",
          options: ["marketplace", "auction", "rental", "all"],
          defaultValue: "marketplace",
        },
      ],
    },
    {
      slug: "careers",
      admin: {
        useAsTitle: "title",
      },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "department", type: "text", required: true },
        { name: "location", type: "text", required: true },
        { name: "salaryRange", type: "text", required: true },
        { name: "type", type: "text", required: true },
        { name: "description", type: "textarea", required: true },
        { name: "requirements", type: "textarea" },
        {
          name: "status",
          type: "select",
          options: ["active", "closed"],
          defaultValue: "active",
          required: true,
        },
      ],
    },
    {
      slug: "manual-ads",
      admin: {
        useAsTitle: "title",
      },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "imageUrl", type: "text", required: true },
        { name: "landingUrl", type: "text", required: true },
        { name: "adType", type: "text", required: true },
        { name: "placement", type: "text", required: true },
        {
          name: "status",
          type: "select",
          options: ["draft", "active", "completed"],
          defaultValue: "draft",
          required: true,
        },
        { name: "dailyBudget", type: "number", required: true },
        { name: "totalBudget", type: "number", required: true },
      ],
    },
  ],

  globals: [
    {
      slug: "company-config",
      fields: [
        { name: "email", type: "text", required: true },
        { name: "phone", type: "text", required: true },
        { name: "location", type: "text", required: true },
        {
          name: "commissionRate",
          type: "number",
          defaultValue: 0,
          required: true,
        },
      ],
    },
  ],

  secret: process.env.PAYLOAD_SECRET || "payload-default-secret-development-only",

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
