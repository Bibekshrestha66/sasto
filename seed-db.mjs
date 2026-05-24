import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

const listings = [
  { title: 'iPhone 13 Pro - Excellent Condition', description: 'Barely used iPhone 13 Pro, 256GB, with original box and accessories', price: 95000, categoryId: 1, condition: 'like-new', location: 'Kathmandu', userId: 1, type: 'marketplace' },
  { title: 'Samsung Galaxy S21 Ultra', description: 'Used Samsung Galaxy S21 Ultra, works perfectly', price: 75000, categoryId: 1, condition: 'good', location: 'Lalitpur', userId: 1, type: 'marketplace' },
  { title: 'MacBook Pro 2021 M1', description: '14-inch MacBook Pro with M1 chip, 8GB RAM, 256GB SSD', price: 180000, categoryId: 2, condition: 'like-new', location: 'Kathmandu', userId: 2, type: 'marketplace' },
  { title: 'Honda City 2018', description: 'Well maintained Honda City, automatic transmission', price: 1200000, categoryId: 3, condition: 'good', location: 'Bhaktapur', userId: 3, type: 'marketplace' },
  { title: 'Toyota Fortuner 2015', description: 'Diesel, 7-seater SUV, excellent condition', price: 1800000, categoryId: 3, condition: 'good', location: 'Kathmandu', userId: 3, type: 'marketplace' },
  { title: '2BHK Apartment in Thamel', description: 'Furnished 2-bedroom apartment with parking', price: 45000000, categoryId: 4, condition: 'good', location: 'Kathmandu', userId: 4, type: 'marketplace' },
  { title: 'LG 55 inch 4K Smart TV', description: 'Brand new LG 55 inch 4K Smart TV with warranty', price: 65000, categoryId: 2, condition: 'new', location: 'Kathmandu', userId: 5, type: 'marketplace' },
  { title: 'Office Chair - Ergonomic', description: 'High-quality ergonomic office chair, black color', price: 12000, categoryId: 5, condition: 'good', location: 'Lalitpur', userId: 6, type: 'marketplace' },
  { title: 'Wooden Dining Table Set', description: '6-seater wooden dining table with chairs', price: 35000, categoryId: 5, condition: 'good', location: 'Kathmandu', userId: 6, type: 'marketplace' },
  { title: 'Nike Air Jordan 1 Retro', description: 'Original Nike Air Jordan 1 Retro High, size 10', price: 18000, categoryId: 6, condition: 'like-new', location: 'Kathmandu', userId: 7, type: 'marketplace' },
  { title: 'Branded Winter Jacket', description: 'Columbia brand winter jacket, waterproof', price: 8000, categoryId: 6, condition: 'good', location: 'Kathmandu', userId: 7, type: 'marketplace' },
  { title: 'Web Development Services', description: 'Professional web development and design services', price: 50000, categoryId: 7, condition: 'good', location: 'Kathmandu', userId: 8, type: 'marketplace' },
  { title: 'Home Cleaning Service', description: 'Professional home cleaning and maintenance', price: 2000, categoryId: 7, condition: 'good', location: 'Kathmandu', userId: 9, type: 'marketplace' },
  { title: 'Python Programming Course', description: 'Complete Python programming course with certification', price: 15000, categoryId: 7, condition: 'good', location: 'Kathmandu', userId: 10, type: 'marketplace' },
  { title: 'German Shepherd Puppy', description: 'Pure breed German Shepherd puppy, 2 months old', price: 25000, categoryId: 8, condition: 'good', location: 'Kathmandu', userId: 11, type: 'marketplace' },
  { title: 'Cat - Persian Breed', description: 'Beautiful Persian cat, 1 year old, vaccinated', price: 12000, categoryId: 8, condition: 'good', location: 'Lalitpur', userId: 11, type: 'marketplace' },
  { title: 'Sony PlayStation 5', description: 'PS5 console with 2 controllers and games', price: 85000, categoryId: 2, condition: 'like-new', location: 'Kathmandu', userId: 12, type: 'marketplace' },
  { title: 'Gaming Laptop - ASUS ROG', description: 'ASUS ROG gaming laptop, RTX 3070, i7 processor', price: 150000, categoryId: 2, condition: 'good', location: 'Kathmandu', userId: 13, type: 'marketplace' },
  { title: 'Canon DSLR Camera EOS 5D', description: 'Professional Canon EOS 5D Mark IV with lenses', price: 120000, categoryId: 2, condition: 'good', location: 'Kathmandu', userId: 14, type: 'marketplace' },
  { title: 'Mountain Bicycle - Trek', description: 'Trek mountain bike, 21-speed, excellent condition', price: 28000, categoryId: 3, condition: 'good', location: 'Kathmandu', userId: 15, type: 'marketplace' },
];

const categories = [
  { id: 1, name: 'Mobile Phones', slug: 'mobile-phones' },
  { id: 2, name: 'Electronics', slug: 'electronics' },
  { id: 3, name: 'Vehicles', slug: 'vehicles' },
  { id: 4, name: 'Property', slug: 'property' },
  { id: 5, name: 'Furniture', slug: 'furniture' },
  { id: 6, name: 'Fashion', slug: 'fashion' },
  { id: 7, name: 'Services', slug: 'services' },
  { id: 8, name: 'Pets', slug: 'pets' },
];

try {
  // Seed categories first
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name, slug, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
  const now = new Date().getTime();
  for (const cat of categories) {
    insertCategory.run(cat.id, cat.name, cat.slug, now, now);
  }
  console.log(`✅ Successfully seeded ${categories.length} categories!`);

  // Seed listings
  const insertListing = db.prepare('INSERT INTO listings (title, description, price, categoryId, condition, location, userId, type, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const listing of listings) {
    insertListing.run(
      listing.title,
      listing.description,
      listing.price,
      listing.categoryId,
      listing.condition,
      listing.location,
      listing.userId,
      listing.type,
      'active',
      now,
      now
    );
  }
  console.log(`✅ Successfully seeded ${listings.length} listings!`);
} catch (error) {
  console.error('❌ Error seeding database:', error);
} finally {
  db.close();
}
