// Comprehensive subcategory structure for all categories
export const SUBCATEGORIES = {
  "Mobile Phones": [
    { id: "smartphones", name: "Smartphones", icon: "📱" },
    { id: "feature-phones", name: "Feature Phones", icon: "☎️" },
    { id: "phone-accessories", name: "Accessories", icon: "🔌" },
    { id: "phone-repairs", name: "Repairs & Services", icon: "🔧" },
  ],
  "Electronics": [
    { id: "laptops", name: "Laptops & Computers", icon: "💻" },
    { id: "tablets", name: "Tablets", icon: "📱" },
    { id: "cameras", name: "Cameras", icon: "📷" },
    { id: "audio", name: "Audio & Speakers", icon: "🔊" },
    { id: "gaming", name: "Gaming Consoles", icon: "🎮" },
    { id: "home-appliances", name: "Home Appliances", icon: "🏠" },
  ],
  "Vehicles": [
    { id: "cars", name: "Cars", icon: "🚗" },
    { id: "motorcycles", name: "Motorcycles", icon: "🏍️" },
    { id: "bicycles", name: "Bicycles", icon: "🚲" },
    { id: "scooters", name: "Scooters", icon: "🛴" },
    { id: "commercial", name: "Commercial Vehicles", icon: "🚚" },
    { id: "spare-parts", name: "Spare Parts", icon: "⚙️" },
  ],
  "Property": [
    { id: "apartments", name: "Apartments", icon: "🏢" },
    { id: "houses", name: "Houses", icon: "🏠" },
    { id: "land", name: "Land", icon: "🏞️" },
    { id: "commercial-space", name: "Commercial Space", icon: "🏪" },
    { id: "rooms", name: "Rooms", icon: "🛏️" },
  ],
  "Fashion": [
    { id: "mens-clothing", name: "Men's Clothing", icon: "👔" },
    { id: "womens-clothing", name: "Women's Clothing", icon: "👗" },
    { id: "footwear", name: "Footwear", icon: "👟" },
    { id: "accessories", name: "Accessories", icon: "👜" },
    { id: "jewelry", name: "Jewelry", icon: "💎" },
  ],
  "Furniture": [
    { id: "bedroom", name: "Bedroom Furniture", icon: "🛏️" },
    { id: "living-room", name: "Living Room", icon: "🛋️" },
    { id: "kitchen", name: "Kitchen Furniture", icon: "🍽️" },
    { id: "office", name: "Office Furniture", icon: "🪑" },
    { id: "outdoor", name: "Outdoor Furniture", icon: "🪴" },
  ],
  "Services": [
    { id: "home-repair", name: "Home Repair", icon: "🔨" },
    { id: "cleaning", name: "Cleaning Services", icon: "🧹" },
    { id: "tutoring", name: "Tutoring", icon: "📚" },
    { id: "fitness", name: "Fitness & Coaching", icon: "💪" },
    { id: "beauty", name: "Beauty Services", icon: "💅" },
  ],
  "Jobs": [
    { id: "full-time", name: "Full-Time", icon: "💼" },
    { id: "part-time", name: "Part-Time", icon: "⏰" },
    { id: "freelance", name: "Freelance", icon: "💻" },
    { id: "internship", name: "Internship", icon: "🎓" },
  ],
};

export type CategoryKey = keyof typeof SUBCATEGORIES;

export function getSubcategoriesForCategory(category: string): typeof SUBCATEGORIES[CategoryKey] {
  return SUBCATEGORIES[category as CategoryKey] || [];
}

export function getSubcategoryName(category: string, subcategoryId: string): string {
  const subcategories = getSubcategoriesForCategory(category);
  const found = subcategories.find(sub => sub.id === subcategoryId);
  return found?.name || subcategoryId;
}
