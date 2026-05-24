import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const CATEGORIES_DATA = [
  {
    name: "Electronics & Appliances",
    slug: "electronics-appliances",
    icon: "📱",
    description: "Mobiles, computers, TVs, and home appliances",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Tablets & iPad", slug: "tablets-ipad" },
      { name: "Laptops & Computers", slug: "laptops-computers" },
      { name: "Desktops", slug: "desktops" },
      { name: "TVs & Audio", slug: "tvs-audio" },
      { name: "Cameras & Photography", slug: "cameras-photography" },
      { name: "Gaming Consoles", slug: "gaming-consoles" },
      { name: "Smart Watches", slug: "smart-watches" },
      { name: "Headphones & Earbuds", slug: "headphones-earbuds" },
      { name: "Home Appliances", slug: "home-appliances" },
      { name: "Refrigerators", slug: "refrigerators" },
      { name: "Washing Machines", slug: "washing-machines" },
      { name: "Microwave & Ovens", slug: "microwave-ovens" },
      { name: "Air Conditioners", slug: "air-conditioners" },
    ],
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: "🚗",
    description: "Cars, motorcycles, bicycles, and auto parts",
    subcategories: [
      { name: "Cars", slug: "cars" },
      { name: "SUVs & Jeeps", slug: "suvs-jeeps" },
      { name: "Vans & Buses", slug: "vans-buses" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Scooters & Mopeds", slug: "scooters-mopeds" },
      { name: "Bicycles", slug: "bicycles" },
      { name: "Auto Parts & Accessories", slug: "auto-parts-accessories" },
      { name: "Tires & Wheels", slug: "tires-wheels" },
      { name: "Car Accessories", slug: "car-accessories" },
      { name: "Bike Accessories", slug: "bike-accessories" },
    ],
  },
  {
    name: "Property",
    slug: "property",
    icon: "🏠",
    description: "Apartments, houses, land, and commercial space",
    subcategories: [
      { name: "Apartments & Flats", slug: "apartments-flats" },
      { name: "Houses", slug: "houses" },
      { name: "Land & Plots", slug: "land-plots" },
      { name: "Commercial Space", slug: "commercial-space" },
      { name: "Offices", slug: "offices" },
      { name: "Shops & Stores", slug: "shops-stores" },
      { name: "Rooms & Shared Spaces", slug: "rooms-shared-spaces" },
      { name: "Warehouses", slug: "warehouses" },
      { name: "Industrial Property", slug: "industrial-property" },
    ],
  },
  {
    name: "Fashion & Beauty",
    slug: "fashion-beauty",
    icon: "👗",
    description: "Clothing, shoes, jewelry, and beauty products",
    subcategories: [
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Kids Clothing", slug: "kids-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Jewelry & Watches", slug: "jewelry-watches" },
      { name: "Bags & Wallets", slug: "bags-wallets" },
      { name: "Sunglasses & Frames", slug: "sunglasses-frames" },
      { name: "Cosmetics & Makeup", slug: "cosmetics-makeup" },
      { name: "Skincare Products", slug: "skincare-products" },
      { name: "Hair Care", slug: "hair-care" },
      { name: "Perfumes & Fragrances", slug: "perfumes-fragrances" },
    ],
  },
  {
    name: "Furniture & Household",
    slug: "furniture-household",
    icon: "🛋️",
    description: "Furniture, bedding, kitchenware, and home decor",
    subcategories: [
      { name: "Sofas & Couches", slug: "sofas-couches" },
      { name: "Beds & Mattresses", slug: "beds-mattresses" },
      { name: "Dining Tables & Chairs", slug: "dining-tables-chairs" },
      { name: "Wardrobes & Cabinets", slug: "wardrobes-cabinets" },
      { name: "Office Furniture", slug: "office-furniture" },
      { name: "Shelves & Storage", slug: "shelves-storage" },
      { name: "Bedding & Linens", slug: "bedding-linens" },
      { name: "Kitchen & Dining", slug: "kitchen-dining" },
      { name: "Kitchenware", slug: "kitchenware" },
      { name: "Home Decor", slug: "home-decor" },
      { name: "Lighting", slug: "lighting" },
      { name: "Curtains & Blinds", slug: "curtains-blinds" },
    ],
  },
  {
    name: "Sports & Leisure",
    slug: "sports-leisure",
    icon: "⚽",
    description: "Sports equipment, outdoor gear, and hobbies",
    subcategories: [
      { name: "Sports Equipment", slug: "sports-equipment" },
      { name: "Fitness & Gym", slug: "fitness-gym" },
      { name: "Outdoor & Camping", slug: "outdoor-camping" },
      { name: "Yoga & Meditation", slug: "yoga-meditation" },
      { name: "Hobbies & Collectibles", slug: "hobbies-collectibles" },
      { name: "Gaming & Board Games", slug: "gaming-board-games" },
      { name: "Musical Instruments", slug: "musical-instruments" },
      { name: "Art & Craft Supplies", slug: "art-craft-supplies" },
      { name: "Toys & Games", slug: "toys-games" },
    ],
  },
  {
    name: "Books & Education",
    slug: "books-education",
    icon: "📚",
    description: "Books, educational materials, and courses",
    subcategories: [
      { name: "Books", slug: "books" },
      { name: "Textbooks", slug: "textbooks" },
      { name: "E-Books", slug: "e-books" },
      { name: "Educational Materials", slug: "educational-materials" },
      { name: "Courses & Training", slug: "courses-training" },
      { name: "Online Courses", slug: "online-courses" },
      { name: "Tutoring Services", slug: "tutoring-services" },
    ],
  },
  {
    name: "Pets & Animals",
    slug: "pets-animals",
    icon: "🐾",
    description: "Dogs, cats, pets, and pet accessories",
    subcategories: [
      { name: "Dogs & Puppies", slug: "dogs-puppies" },
      { name: "Cats & Kittens", slug: "cats-kittens" },
      { name: "Birds", slug: "birds" },
      { name: "Fish & Aquarium", slug: "fish-aquarium" },
      { name: "Rabbits & Rodents", slug: "rabbits-rodents" },
      { name: "Pet Accessories", slug: "pet-accessories" },
      { name: "Pet Food & Supplies", slug: "pet-food-supplies" },
      { name: "Pet Grooming", slug: "pet-grooming" },
      { name: "Veterinary Services", slug: "veterinary-services" },
    ],
  },
  {
    name: "Services",
    slug: "services",
    icon: "🔧",
    description: "Home services, professional services, and repairs",
    subcategories: [
      { name: "Home Services", slug: "home-services" },
      { name: "Cleaning Services", slug: "cleaning-services" },
      { name: "Plumbing", slug: "plumbing" },
      { name: "Electrical Services", slug: "electrical-services" },
      { name: "Carpentry", slug: "carpentry" },
      { name: "Painting", slug: "painting" },
      { name: "Professional Services", slug: "professional-services" },
      { name: "Tutoring & Training", slug: "tutoring-training" },
      { name: "Health & Wellness", slug: "health-wellness" },
      { name: "Beauty Services", slug: "beauty-services" },
      { name: "Moving & Transportation", slug: "moving-transportation" },
    ],
  },
  {
    name: "Business & Industrial",
    slug: "business-industrial",
    icon: "🏭",
    description: "Office equipment, machinery, and industrial supplies",
    subcategories: [
      { name: "Office Equipment", slug: "office-equipment" },
      { name: "Printers & Copiers", slug: "printers-copiers" },
      { name: "Industrial Machinery", slug: "industrial-machinery" },
      { name: "Tools & Equipment", slug: "tools-equipment" },
      { name: "Raw Materials", slug: "raw-materials" },
      { name: "Business Services", slug: "business-services" },
      { name: "Wholesale & Bulk", slug: "wholesale-bulk" },
    ],
  },
  {
    name: "Jobs",
    slug: "jobs",
    icon: "💼",
    description: "Full-time, part-time, and freelance jobs",
    subcategories: [
      { name: "Full-time Jobs", slug: "full-time-jobs" },
      { name: "Part-time Jobs", slug: "part-time-jobs" },
      { name: "Freelance Work", slug: "freelance-work" },
      { name: "Internships", slug: "internships" },
      { name: "Temporary Jobs", slug: "temporary-jobs" },
      { name: "Remote Jobs", slug: "remote-jobs" },
    ],
  },
  {
    name: "Want to Buy",
    slug: "want-to-buy",
    icon: "🛍️",
    description: "Post what you're looking for, sellers respond",
    subcategories: [
      { name: "Electronics Wanted", slug: "electronics-wanted" },
      { name: "Vehicles Wanted", slug: "vehicles-wanted" },
      { name: "Property Wanted", slug: "property-wanted" },
      { name: "Furniture Wanted", slug: "furniture-wanted" },
      { name: "Fashion Wanted", slug: "fashion-wanted" },
      { name: "Other Items Wanted", slug: "other-items-wanted" },
    ],
  },
];

async function seedCategories() {
  try {
    console.log("Connecting to database...");
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log("Seeding categories...");

    for (const category of CATEGORIES_DATA) {
      // Insert main category
      const result = await db
        .insert(schema.categories)
        .values({
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          description: category.description,
          parentId: null,
        });

      console.log(`✓ Created category: ${category.name}`);

      // Get the inserted category ID
      const [inserted] = await db
        .select()
        .from(schema.categories)
        .where(schema.categories.slug === category.slug)
        .limit(1);

      const mainCatId = inserted?.id;

      // Insert subcategories
      if (category.subcategories && category.subcategories.length > 0) {
        for (const subcategory of category.subcategories) {
          await db.insert(schema.categories).values({
            name: subcategory.name,
            slug: subcategory.slug,
            icon: "📌",
            description: `${subcategory.name} in ${category.name}`,
            parentId: mainCatId,
          });
        }
        console.log(
          `  ✓ Added ${category.subcategories.length} subcategories`
        );
      }
    }

    console.log("✓ Categories seeding completed!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();
