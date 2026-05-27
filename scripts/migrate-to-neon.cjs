const Database = require("better-sqlite3");
const postgres = require("postgres");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL env var is not set!");
  process.exit(1);
}

const sqlitePath = "./sqlite.db";
console.log(`Connecting to SQLite at: ${sqlitePath}`);
const sqlite = new Database(sqlitePath, { readonly: true });

console.log(`Connecting to Postgres (NeonDB)...`);
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
});

// Conversion helpers
function toDate(val) {
  if (val === null || val === undefined) return null;
  return new Date(val);
}

function toBoolean(val) {
  if (val === null || val === undefined) return null;
  return Boolean(val);
}

function toJson(val) {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
}

// Map SQLite row to Postgres row according to types
const mappers = {
  users: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
    lastSignedIn: toDate(row.lastSignedIn),
    lastLogin: toDate(row.lastLogin),
    isVerified: toBoolean(row.isVerified),
    resetTokenExpires: toDate(row.resetTokenExpires),
  }),
  categories: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  listings: (row) => ({
    ...row,
    images: toJson(row.images),
    isFeatured: toBoolean(row.isFeatured),
    featuredUntil: toDate(row.featuredUntil),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
    expiresAt: toDate(row.expiresAt),
  }),
  auctions: (row) => ({
    ...row,
    startTime: toDate(row.startTime),
    endTime: toDate(row.endTime),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  bids: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
  }),
  bookings: (row) => ({
    ...row,
    startDate: toDate(row.startDate),
    endDate: toDate(row.endDate),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  favorites: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
  }),
  messages: (row) => ({
    ...row,
    isRead: toBoolean(row.isRead),
    createdAt: toDate(row.createdAt),
  }),
  reviews: (row) => ({
    ...row,
    isVerifiedPurchase: toBoolean(row.isVerifiedPurchase),
    sellerResponseAt: toDate(row.sellerResponseAt),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  notifications: (row) => ({
    ...row,
    isRead: toBoolean(row.isRead),
    createdAt: toDate(row.createdAt),
  }),
  disputes: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    resolvedAt: toDate(row.resolvedAt),
    updatedAt: toDate(row.updatedAt),
  }),
  adminLogs: (row) => ({
    ...row,
    timestamp: toDate(row.timestamp),
  }),
  roles: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  permissions: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
  }),
  rolePermissions: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
  }),
  userRoles: (row) => ({
    ...row,
    assignedAt: toDate(row.assignedAt),
    expiresAt: toDate(row.expiresAt),
  }),
  roleAuditLogs: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
  }),
  advertisers: (row) => ({
    ...row,
    verificationDocuments: toJson(row.verificationDocuments),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  manualAds: (row) => ({
    ...row,
    startDate: toDate(row.startDate),
    endDate: toDate(row.endDate),
    targetAudience: toJson(row.targetAudience),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  adAnalytics: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
  }),
  adsensePlacements: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  adPayments: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  sponsoredAdPricing: (row) => ({
    ...row,
    isActive: toBoolean(row.isActive),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  promotionRequests: (row) => ({
    ...row,
    approvedAt: toDate(row.approvedAt),
    featuredUntil: toDate(row.featuredUntil),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  emailNotificationPreferences: (row) => ({
    ...row,
    newMessages: toBoolean(row.newMessages),
    newBids: toBoolean(row.newBids),
    bookingConfirmation: toBoolean(row.bookingConfirmation),
    listingApproval: toBoolean(row.listingApproval),
    listingRejection: toBoolean(row.listingRejection),
    weeklyDigest: toBoolean(row.weeklyDigest),
    promotionalEmails: toBoolean(row.promotionalEmails),
    securityAlerts: toBoolean(row.securityAlerts),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  emailQueue: (row) => ({
    ...row,
    templateData: toJson(row.templateData),
    lastAttemptAt: toDate(row.lastAttemptAt),
    sentAt: toDate(row.sentAt),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  emailLogs: (row) => ({
    ...row,
    openedAt: toDate(row.openedAt),
    clickedAt: toDate(row.clickedAt),
    createdAt: toDate(row.createdAt),
  }),
  reviewHelpfulVotes: (row) => ({
    ...row,
    isHelpful: toBoolean(row.isHelpful),
    createdAt: toDate(row.createdAt),
  }),
  reviewAnalytics: (row) => ({
    ...row,
    lastReviewDate: toDate(row.lastReviewDate),
    updatedAt: toDate(row.updatedAt),
  }),
  flaggedReviews: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    resolvedAt: toDate(row.resolvedAt),
  }),
  flaggedListings: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    resolvedAt: toDate(row.resolvedAt),
  }),
  verificationSubmissions: (row) => ({
    ...row,
    data: toJson(row.data),
    reviewedAt: toDate(row.reviewedAt),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  carts: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  cartItems: (row) => ({
    ...row,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  logisticsPartners: (row) => ({
    ...row,
    isActive: toBoolean(row.isActive),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  transactions: (row) => ({
    ...row,
    placedAt: toDate(row.placedAt),
    processedAt: toDate(row.processedAt),
    shippedAt: toDate(row.shippedAt),
    deliveredAt: toDate(row.deliveredAt),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
  returns: (row) => ({
    ...row,
    images: toJson(row.images),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }),
};

// Dependency order list of tables
const tableOrder = [
  "users",
  "categories",
  "listings",
  "auctions",
  "bids",
  "bookings",
  "favorites",
  "messages",
  "reviews",
  "notifications",
  "disputes",
  "adminLogs",
  "roles",
  "permissions",
  "rolePermissions",
  "userRoles",
  "roleAuditLogs",
  "advertisers",
  "manualAds",
  "adAnalytics",
  "adsensePlacements",
  "adPayments",
  "sponsoredAdPricing",
  "promotionRequests",
  "emailNotificationPreferences",
  "emailQueue",
  "emailLogs",
  "reviewHelpfulVotes",
  "reviewAnalytics",
  "flaggedReviews",
  "flaggedListings",
  "verificationSubmissions",
  "carts",
  "cartItems",
  "logisticsPartners",
  "transactions",
  "returns"
];

async function run() {
  try {
    // 1. Truncate all tables in Postgres to start clean
    console.log("Truncating existing tables in Postgres...");
    await sql.unsafe(`TRUNCATE TABLE ${tableOrder.join(", ")} CASCADE;`);
    console.log("Truncate successful.");

    // 2. Loop through table order and migrate rows
    for (const tableName of tableOrder) {
      console.log(`Migrating table: ${tableName}...`);
      
      // Get count from sqlite
      const countResult = sqlite.prepare(`SELECT count(*) as count FROM ${tableName}`).get();
      if (!countResult || countResult.count === 0) {
        console.log(`Table ${tableName} is empty in SQLite. Skipping.`);
        continue;
      }

      console.log(`Found ${countResult.count} rows in SQLite table ${tableName}.`);
      const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();

      const mappedRows = rows.map(row => {
        const mapper = mappers[tableName];
        return mapper ? mapper(row) : row;
      });

      // Insert in chunks of 50 to avoid Postgres placeholder limits
      const chunkSize = 50;
      for (let i = 0; i < mappedRows.length; i += chunkSize) {
        const chunk = mappedRows.slice(i, i + chunkSize);
        
        // Dynamically build insertion query
        const keys = Object.keys(chunk[0]);
        const columns = keys.map(k => `"${k}"`).join(", ");
        
        // Drizzle schema maps camelCase columns. If our tables are camelCased:
        // We write them as is. Let's execute using postgres-js helper format
        await sql`
          INSERT INTO ${sql(tableName)} ${sql(chunk, ...keys)}
        `;
      }
      console.log(`Migrated ${mappedRows.length} rows for table ${tableName}.`);
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
