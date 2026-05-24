import { getDb } from "../server/db";
import { categories, listings } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function seed() {
  const db = await getDb();
  console.log("SYNC SEED: Merging Rental-specific subcategories into taxonomy...");

  // Delete all categories and listings
  await db.delete(categories);
  await db.delete(listings);
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='categories'`);
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='listings'`);

  // Main categories (Marketplace, Auction, and now fully enabled Rental)
  const mainCategories = [
    { id: 66, name: "Electronics", slug: "electronics", sector: "marketplace,auction,rental" },
    { id: 67, name: "Fashion", slug: "fashion", sector: "marketplace" },
    { id: 68, name: "Furniture", slug: "furniture", sector: "marketplace,rental" },
    { id: 69, name: "Vehicles", slug: "vehicles", sector: "marketplace,auction,rental" },
    { id: 70, name: "Property", slug: "property", sector: "marketplace,auction,rental" },
    { id: 71, name: "Groceries", slug: "groceries", sector: "marketplace" },
    { id: 72, name: "Medical", slug: "medical", sector: "marketplace" },
    { id: 73, name: "Digital", slug: "digital", sector: "marketplace" },
    { id: 74, name: "Agriculture", slug: "agriculture", sector: "marketplace" },
    { id: 75, name: "Sports", slug: "sports", sector: "marketplace" },
    { id: 76, name: "Books", slug: "books", sector: "marketplace" },
    { id: 77, name: "Services", slug: "services", sector: "marketplace,rental" },
    { id: 78, name: "Antiques", slug: "antiques", sector: "auction" },
    { id: 79, name: "Equipment", slug: "equipment", sector: "rental" }, // RENTAL SPECIFIC
    { id: 80, name: "Jobs", slug: "jobs", sector: "marketplace" },
    { id: 81, name: "Kids & Babies", slug: "kids", sector: "marketplace" },
    { id: 82, name: "Pets", slug: "pets", sector: "marketplace" },
    { id: 83, name: "Rooms", slug: "rooms", sector: "marketplace,rental" },
    { id: 84, name: "Commercial", slug: "commercial", sector: "marketplace,rental" },
    { id: 85, name: "Skills", slug: "skills", sector: "rental" }, // RENTAL SPECIFIC
  ];

  for (const cat of mainCategories) {
    await db.insert(categories).values(cat);
  }

  // Marketplace subcategories (Sell section)
  const marketplaceSubData = {
    agriculture: ["Fertilizer", "Livestock", "Poultry", "Seeds", "Tools"],
    books: ["Academic", "Children's Books", "Comics", "Fiction", "Magazines", "Non-Fiction", "Religious", "Textbooks"],
    commercial: ["Building", "Co-working", "Industrial", "Land", "Office Space", "Restaurant Space", "Retail Shop", "Warehouse"],
    digital: ["Digital Art", "Games", "Projects", "Software", "Web Services"],
    electronics: ["Accessories", "Audio Devices", "Cameras", "Gaming", "Laptops", "Mobile Phones", "Tablets", "TV & Video"],
    fashion: ["Accessories", "Bags", "Jewelry", "Kids' Clothing", "Men's Clothing", "Watches", "Women's Clothing", "Footwear"],
    furniture: ["Beds", "Chairs", "Decor", "Garden Furniture", "Office Furniture", "Sofas", "Tables", "Wardrobes"],
    groceries: ["Beverages", "Dairy", "Fruits & Veg", "Meat", "Pantry", "Snacks"],
    jobs: ["Accounting & Finance", "Blue Collar/Labor", "Customer Service", "Education", "Engineering", "Healthcare", "IT & Software", "Sales & Marketing"],
    kids: ["Baby Clothing", "Diapering", "Feeding", "Kids Clothing", "Maternity", "Nursery Furniture", "Strollers", "Toys"],
    medical: ["First Aid", "Herbal", "Medical Accessories", "Medicines", "Wellness"],
    pets: ["Birds", "Cats", "Dogs", "Fish", "Pet Accessories", "Pet Food", "Pet Services", "Small Pets"],
    property: ["Apartment", "Commercial", "House", "Land", "Office Space", "Others", "Shop"],
    rooms: ["Bachelor Pad", "Entire Apartment", "PG/Hostel", "Private Room", "Shared Room", "Studio"],
    services: ["Carpentry", "Cleaning", "Consulting", "Design", "Electrical", "Painting", "Plumbing", "Web Development"],
    sports: ["Camping", "Cycling", "Fitness", "Gym Equipment", "Outdoor Gear", "Swimming", "Team Sports", "Yoga"],
    vehicles: ["Bicycles", "Cars", "Electric Vehicles", "Motorcycles", "Scooters", "Spare Parts", "SUVs", "Trucks"],
  };

  // Auction specific subcategories
  const auctionSubData = {
    property: ["Land", "Apartment", "House"],
    vehicles: ["Bike", "Car", "Heavy"],
    electronics: ["Mobile", "Laptop", "Camera"],
    antiques: ["Statue", "Jewelry", "Art & Paintings", "Coins"],
  };

  // Rental specific subcategories (From RentalResponsive.tsx)
  const rentalSubData = {
    property: ["Apartments", "Houses", "Rooms"],
    vehicles: ["Cars", "Bikes", "Heavy Vehicles"],
    electronics: ["Laptops", "Cameras", "Audio"],
    equipment: ["Camera Gear", "Construction", "Medical", "Tools", "Gears"],
    commercial: ["Office Space", "Retail Shop", "Warehouse"],
    skills: ["Auto Mechanic", "Carpenter", "Demolition", "Design", "Drywaller/Sheetrocking", "Electrician", "Flooring Installer", "General Labor", "Housekeeping/Janitorial", "HVAC Technician", "Landscaper/Gardener", "Mason", "Painter", "Plumber", "Programming"],
  };

  const subcatsToInsert = [];
  
  // Marketplace entries
  for (const [slug, names] of Object.entries(marketplaceSubData)) {
    const parent = mainCategories.find(c => c.slug === slug);
    if (parent) {
      for (const name of names) {
        subcatsToInsert.push({
          name: name,
          parentId: parent.id,
          slug: `mp-${slug}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          sector: "marketplace"
        });
      }
    }
  }

  // Auction entries
  for (const [slug, names] of Object.entries(auctionSubData)) {
    const parent = mainCategories.find(c => c.slug === slug);
    if (parent) {
      for (const name of names) {
        subcatsToInsert.push({
          name: name,
          parentId: parent.id,
          slug: `auc-${slug}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          sector: "auction"
        });
      }
    }
  }

  // Rental entries
  for (const [slug, names] of Object.entries(rentalSubData)) {
    const parent = mainCategories.find(c => c.slug === slug);
    if (parent) {
      for (const name of names) {
        subcatsToInsert.push({
          name: name,
          parentId: parent.id,
          slug: `rent-${slug}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          sector: "rental"
        });
      }
    }
  }

  for (const sub of subcatsToInsert) {
    await db.insert(categories).values(sub);
  }

  console.log("Full Platform Taxonomy Merged: Marketplace, Auction, and Rental are now fully synced!");
}

seed().catch(console.error);
