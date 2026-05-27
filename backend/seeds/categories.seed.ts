import { categories } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

export const CATEGORIES_DATA = [
  {
    name: "Electronics",
    slug: "electronics-appliances",
    icon: "📱",
    description: "Mobiles, computers, TVs, and home appliances",
    sector: "marketplace",
    subcategories: [
      { name: "Accessories", slug: "accessories" },
      { name: "Audio Devices", slug: "audio-devices" },
      { name: "Cameras", slug: "cameras" },
      { name: "Gaming", slug: "gaming" },
      { name: "Laptops", slug: "laptops" },
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Tablets", slug: "tablets" },
      { name: "TV & Video", slug: "tv-video" },
    ],
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: "🚗",
    description: "Cars, motorcycles, bicycles, and auto parts",
    subcategories: [
      { name: "Bicycles", slug: "bicycles" },
      { name: "Cars", slug: "cars" },
      { name: "Electric Vehicles", slug: "electric-vehicles" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Scooters", slug: "scooters" },
      { name: "Spare Parts", slug: "spare-parts" },
      { name: "SUVs", slug: "suvs" },
      { name: "Trucks", slug: "trucks" },
    ],
  },
  {
    name: "Property",
    slug: "property",
    icon: "🏠",
    description: "Apartments, houses, land, and commercial space",
    subcategories: [
      { name: "Apartment", slug: "apartment" },
      { name: "Commercial", slug: "commercial" },
      { name: "House", slug: "house" },
      { name: "Land", slug: "land" },
      { name: "Office Space", slug: "office-space" },
      { name: "Others", slug: "others" },
      { name: "Shop", slug: "shop" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion-beauty",
    icon: "👗",
    description: "Clothing, shoes, jewelry, and beauty products",
    subcategories: [
      { name: "Accessories", slug: "accessories" },
      { name: "Bags", slug: "bags" },
      { name: "Jewelry", slug: "jewelry" },
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Watches", slug: "watches" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Footwear", slug: "footwear" },
    ],
  },
  {
    name: "Furniture",
    slug: "furniture-household",
    icon: "🛋️",
    description: "Furniture, bedding, kitchenware, and home decor",
    subcategories: [
      { name: "Beds", slug: "beds" },
      { name: "Chairs", slug: "chairs" },
      { name: "Decor", slug: "decor" },
      { name: "Garden Furniture", slug: "garden-furniture" },
      { name: "Office Furniture", slug: "office-furniture" },
      { name: "Sofas", slug: "sofas" },
      { name: "Tables", slug: "tables" },
      { name: "Wardrobes", slug: "wardrobes" },
    ],
  },
  {
    name: "Sports",
    slug: "sports-leisure",
    icon: "⚽",
    description: "Sports equipment, outdoor gear, and hobbies",
    subcategories: [
      { name: "Camping", slug: "camping" },
      { name: "Cycling", slug: "cycling" },
      { name: "Fitness", slug: "fitness" },
      { name: "Gym Equipment", slug: "gym-equipment" },
      { name: "Outdoor Gear", slug: "outdoor-gear" },
      { name: "Swimming", slug: "swimming" },
      { name: "Team Sports", slug: "team-sports" },
      { name: "Yoga", slug: "yoga" },
    ],
  },
  {
    name: "Books",
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
    name: "Agriculture",
    slug: "agriculture",
    icon: "🌾",
    description: "Farming supplies, seeds, livestock, and agricultural tools",
    sector: "marketplace",
    subcategories: [
      { name: "Fertilizer", slug: "fertilizer" },
      { name: "Livestock", slug: "livestock" },
      { name: "Poultry", slug: "poultry" },
      { name: "Seeds", slug: "seeds" },
      { name: "Tools", slug: "tools" },
    ],
  },
  {
    name: "Digital",
    slug: "digital",
    icon: "💻",
    description: "Software, digital services, and online goods",
    sector: "marketplace",
    subcategories: [
      { name: "Digital Art", slug: "digital-art" },
      { name: "Games", slug: "games" },
      { name: "Projects", slug: "projects" },
      { name: "Software", slug: "software" },
      { name: "Web Services", slug: "web-services" },
    ],
  },
  {
    name: "Groceries",
    slug: "groceries",
    icon: "🛒",
    description: "Food, beverages, and everyday essentials",
    sector: "marketplace",
    subcategories: [
      { name: "Fresh Produce", slug: "fresh-produce" },
      { name: "Packaged Foods", slug: "packaged-foods" },
      { name: "Beverages", slug: "beverages" },
      { name: "Snacks & Sweets", slug: "snacks-sweets" },
      { name: "Household Essentials", slug: "household-essentials" },
    ],
  },
  {
    name: "Medical",
    slug: "medical",
    icon: "🩺",
    description: "Medical supplies, equipment, and healthcare services",
    sector: "marketplace",
    subcategories: [
      { name: "First Aid", slug: "first-aid" },
      { name: "Herbal", slug: "herbal" },
      { name: "Medical Accessories", slug: "medical-accessories" },
      { name: "Medicines", slug: "medicines" },
      { name: "Wellness", slug: "wellness" },
    ],
  },
  {
    name: "Rooms",
    slug: "rooms",
    icon: "🛏️",
    description: "Individual rooms, shared accommodations, and flats",
    sector: "marketplace",
    subcategories: [
      { name: "Bachelor Pad", slug: "bachelor-pad" },
      { name: "Entire Apartment", slug: "entire-apartment" },
      { name: "PG / Hostel", slug: "pg-hostel" },
      { name: "Private Room", slug: "private-room" },
      { name: "Shared Room", slug: "shared-room" },
      { name: "Studio", slug: "studio" },
    ],
  },
  {
    name: "Kids",
    slug: "kids-babies",
    icon: "👶",
    description: "Clothing, toys, and products for children and infants",
    sector: "marketplace",
    subcategories: [
      { name: "Baby Clothing", slug: "baby-clothing" },
      { name: "Diapering", slug: "diapering" },
      { name: "Feeding", slug: "feeding" },
      { name: "Maternity", slug: "maternity" },
      { name: "Nursery Furniture", slug: "nursery-furniture" },
      { name: "Strollers", slug: "strollers" },
      { name: "Toys", slug: "toys" },
    ],
  },
  {
    name: "Pets",
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
      { name: "Carpentry", slug: "carpentry" },
      { name: "Cleaning", slug: "cleaning" },
      { name: "Consulting", slug: "consulting" },
      { name: "Design", slug: "design" },
      { name: "Electrical", slug: "electrical" },
      { name: "Painting", slug: "painting" },
      { name: "Plumbing", slug: "plumbing" },
      { name: "Web Development", slug: "web-development" },
    ],
  },
  {
    name: "Commercial",
    slug: "business-industrial",
    icon: "🏭",
    description: "Commercial spaces and industrial property listings",
    subcategories: [
      { name: "Building", slug: "building" },
      { name: "Co-working", slug: "co-working" },
      { name: "Industrial", slug: "industrial" },
      { name: "Land", slug: "land-commercial" },
      { name: "Office Space", slug: "office-space" },
      { name: "Restaurant Space", slug: "restaurant-space" },
      { name: "Retail Shop", slug: "retail-shop" },
      { name: "Warehouse", slug: "warehouse" },
    ],
  },
  {
    name: "Jobs",
    slug: "jobs",
    icon: "💼",
    description: "Full-time, part-time, and freelance jobs",
    subcategories: [
      { name: "Accounting & Finance", slug: "accounting-finance" },
      { name: "Blue Collar/Labor", slug: "blue-collar-labor" },
      { name: "Customer Service", slug: "customer-service" },
      { name: "Education", slug: "education" },
      { name: "Engineering", slug: "engineering" },
      { name: "Healthcare", slug: "healthcare" },
      { name: "IT & Software", slug: "it-software" },
      { name: "Sales & Marketing", slug: "sales-marketing" },
    ],
  },
  {
    name: "Property",
    slug: "property-auctions",
    icon: "🏠",
    description: "Auction listings for homes, land, and commercial property",
    sector: "auction",
    subcategories: [
      { name: "Residential Auctions", slug: "residential-auctions" },
      { name: "Commercial Auctions", slug: "commercial-auctions" },
      { name: "Land Auctions", slug: "land-auctions" },
      { name: "Industrial Auctions", slug: "industrial-auctions" },
    ],
  },
  {
    name: "Vehicle",
    slug: "vehicle-auctions",
    icon: "🚗",
    description: "Cars, motorcycles, trucks and parts sold by auction",
    sector: "auction",
    subcategories: [
      { name: "Cars & SUVs", slug: "cars-suvs" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Buses & Trucks", slug: "buses-trucks" },
      { name: "Spare Parts", slug: "spare-parts" },
    ],
  },
  {
    name: "Collectibles & Luxury",
    slug: "collectibles-luxury-auctions",
    icon: "💎",
    description: "Art, jewelry, antiques and high-value auction items",
    sector: "auction",
    subcategories: [
      { name: "Art & Antiques", slug: "art-antiques" },
      { name: "Jewelry & Watches", slug: "jewelry-watches" },
      { name: "Fashion & Accessories", slug: "fashion-accessories" },
      { name: "Rare Collectibles", slug: "rare-collectibles" },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics-auctions",
    icon: "💻",
    description: "Electronics, gadgets, and devices sold through auction",
    sector: "auction",
    subcategories: [
      { name: "Mobile Phones", slug: "auction-mobile-phones" },
      { name: "Laptops & Computers", slug: "auction-laptops-computers" },
      { name: "Cameras & Photography", slug: "auction-cameras-photography" },
      { name: "TVs & Audio", slug: "auction-tvs-audio" },
      { name: "Gaming & Gadgets", slug: "auction-gaming-gadgets" },
    ],
  },
  {
    name: "Property",
    slug: "property-rentals",
    icon: "🏘️",
    description: "Homes, apartments and rooms available for rent",
    sector: "rental",
    subcategories: [
      { name: "Apartments", slug: "apartments-flats" },
      { name: "Houses", slug: "houses" },
      { name: "Rooms", slug: "rooms" },
    ],
  },
  {
    name: "Commercial",
    slug: "commercial-rentals",
    icon: "🏢",
    description: "Commercial spaces and business rentals for offices, retail, and warehousing",
    sector: "rental",
    subcategories: [
      { name: "Office Space", slug: "office-space" },
      { name: "Retail Shop", slug: "retail-shop" },
      { name: "Warehouse", slug: "warehouse" },
    ],
  },
  {
    name: "Vehicles",
    slug: "vehicle-rentals",
    icon: "🚘",
    description: "Cars, bikes and heavy vehicles rented by the day or week",
    sector: "rental",
    subcategories: [
      { name: "Cars", slug: "rent-cars-suvs" },
      { name: "Bikes", slug: "rent-motorcycles-scooters" },
      { name: "Heavy Vehicles", slug: "rent-vans-trucks" },
    ],
  },
  {
    name: "Equipment",
    slug: "equipment-rentals",
    icon: "🛠️",
    description: "Tools, machinery and event gear for short-term rental",
    sector: "rental",
    subcategories: [
      { name: "Camera Gear", slug: "party-event-gear" },
      { name: "Construction", slug: "construction-equipment" },
      { name: "Medical", slug: "furniture-rentals" },
      { name: "Tools", slug: "audio-visual" },
      { name: "Gears", slug: "rent-gaming-gear" },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics-rentals",
    icon: "💻",
    description: "Laptops, cameras, audio, and smart devices available for rent",
    sector: "rental",
    subcategories: [
      { name: "Laptops", slug: "rent-laptops-computers" },
      { name: "Cameras", slug: "rent-cameras-photography" },
      { name: "Audio", slug: "rent-audio-visual" },
    ],
  },
  {
    name: "Skills",
    slug: "skills-rentals",
    icon: "🧑‍🏫",
    description: "Skilled professionals and service providers available for hire",
    sector: "rental",
    subcategories: [
      { name: "Auto Mechanic", slug: "auto-mechanic" },
      { name: "Carpenter", slug: "carpenter" },
      { name: "Demolition", slug: "demolition" },
      { name: "Design", slug: "design" },
      { name: "Drywaller/Sheetrocking", slug: "drywaller" },
      { name: "Electrician", slug: "electrician" },
      { name: "Flooring Installer", slug: "flooring" },
      { name: "General Labor", slug: "labor" },
      { name: "Housekeeping/Janitorial", slug: "housekeeping" },
      { name: "HVAC Technician", slug: "hvac" },
      { name: "Landscaper/Gardener", slug: "landscaper" },
      { name: "Mason", slug: "mason" },
      { name: "Painter", slug: "painter" },
      { name: "Plumber", slug: "plumber" },
      { name: "Programming", slug: "programming" },
      { name: "Repair & Maintenance", slug: "repair" },
      { name: "Roofer", slug: "roofer" },
      { name: "Tutoring", slug: "tutoring" },
      { name: "Warehouse/Forklift Operator", slug: "warehouse" },
      { name: "Welder", slug: "welder" },
      { name: "AI Skills", slug: "ai-skills" },
      { name: "Others", slug: "others" },
    ],
  },
];

export async function seedCategories() {
  try {
    console.log("Seeding categories...");
    const db = await getDb();
    
    if (!db) {
      throw new Error("Database not available");
    }

    for (const category of CATEGORIES_DATA) {
      const sector = category.sector ?? "marketplace";
      const existingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, category.slug))
        .limit(1);

      let mainCatId: number | undefined;

      if (existingCategory.length === 0) {
        await db.insert(categories).values({
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          description: category.description,
          sector,
          parentId: null,
        });

        const inserted = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, category.slug))
          .limit(1);

        mainCatId = inserted[0]?.id;
        console.log(`✓ Created category: ${category.name}`);
      } else {
        mainCatId = existingCategory[0].id;
        const updates: any = {};

        if (existingCategory[0].sector !== sector) {
          updates.sector = sector;
        }
        if (existingCategory[0].name !== category.name) {
          updates.name = category.name;
        }
        if (existingCategory[0].description !== category.description) {
          updates.description = category.description;
        }
        if (existingCategory[0].icon !== category.icon) {
          updates.icon = category.icon;
        }

        if (Object.keys(updates).length > 0) {
          await db.update(categories).set(updates).where(eq(categories.id, mainCatId as number));
          console.log(`↺ Updated category metadata for: ${category.name}`);
        }
      }

      if (!mainCatId) {
        continue;
      }

      if (category.subcategories && category.subcategories.length > 0) {
        let addedCount = 0;
        for (const subcategory of (category.subcategories as any[])) {
          const existingSubcategory = await db
            .select()
            .from(categories)
            .where(eq(categories.slug, subcategory.slug))
            .limit(1);

          if (existingSubcategory.length === 0) {
            await db.insert(categories).values({
              name: subcategory.name,
              slug: subcategory.slug,
              icon: subcategory.icon ?? "📌",
              description: subcategory.description ?? `${subcategory.name} in ${category.name}`,
              sector,
              parentId: mainCatId,
            });
            addedCount += 1;
          } else {
            const existing = existingSubcategory[0];
            const subUpdates: any = {};

            if (existing.parentId !== mainCatId) {
              subUpdates.parentId = mainCatId;
            }
            if (existing.sector !== sector) {
              subUpdates.sector = sector;
            }
            if (existing.name !== subcategory.name) {
              subUpdates.name = subcategory.name;
            }
            const expectedDescription = (subcategory as any).description ?? `${subcategory.name} in ${category.name}`;
            if (existing.description !== expectedDescription) {
              subUpdates.description = expectedDescription;
            }
            const expectedIcon = (subcategory as any).icon ?? "📌";
            if (existing.icon !== expectedIcon) {
              subUpdates.icon = expectedIcon;
            }

            if (Object.keys(subUpdates).length > 0) {
              await db.update(categories)
                .set(subUpdates)
                .where(eq(categories.id, existing.id));
              console.log(`↺ Updated subcategory metadata for: ${subcategory.name}`);
            }
          }
        }

        if (addedCount > 0) {
          console.log(`  ✓ Added ${addedCount} subcategories to ${category.name}`);
        }
      }
    }

    console.log("✓ Categories seeding completed!");
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}
