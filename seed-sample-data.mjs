import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'sqlite.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🌱 Starting database seeding...\n');

try {
  // Clear existing data
  console.log('🧹 Cleaning database...');
  db.prepare('DELETE FROM review_helpful_votes').run();
  db.prepare('DELETE FROM review_analytics').run();
  db.prepare('DELETE FROM flagged_reviews').run();
  db.prepare('DELETE FROM reviews').run();
  db.prepare('DELETE FROM bids').run();
  db.prepare('DELETE FROM auctions').run();
  db.prepare('DELETE FROM bookings').run();
  db.prepare('DELETE FROM favorites').run();
  db.prepare('DELETE FROM messages').run();
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM listings').run();
  db.prepare('DELETE FROM categories').run();
  db.prepare('DELETE FROM users').run();
  console.log('✅ Database cleaned\n');

  // 1. Seed Users (Sellers and Buyers)
  console.log('📝 Seeding users...');
  const users = [
    {
      openId: 'dummy_owner_id',
      name: 'Admin',
      email: 'admin@sasto.com',
      phone: '+977-1-4111111',
      location: 'Kathmandu',
      bio: 'Marketplace Super Administrator',
      avatar: 'https://picsum.photos/seed/Admin/150/150',
      loginMethod: 'local',
      role: 'super_admin',
      status: 'active',
      verificationStatus: 'verified',
    },
    {
      openId: 'seller_001',
      name: 'TechHub Store',
      email: 'techhub@sasto.com',
      phone: '+977-1-4123456',
      location: 'Kathmandu',
      bio: 'Premium electronics and gadgets seller',
      avatar: 'https://picsum.photos/seed/TechHub/150/150',
      loginMethod: 'oauth',
      role: 'user',
      status: 'active',
      verificationStatus: 'verified',
    },
    {
      openId: 'seller_002',
      name: 'Fashion Forward',
      email: 'fashion@sasto.com',
      phone: '+977-1-4234567',
      location: 'Pokhara',
      bio: 'Latest fashion and clothing trends',
      avatar: 'https://picsum.photos/seed/Fashion/150/150',
      loginMethod: 'oauth',
      role: 'user',
      status: 'active',
      verificationStatus: 'verified',
    },
    {
      openId: 'seller_003',
      name: 'Home Essentials',
      email: 'home@sasto.com',
      phone: '+977-1-4345678',
      location: 'Lalitpur',
      bio: 'Quality furniture and home decor',
      avatar: 'https://picsum.photos/seed/Home/150/150',
      loginMethod: 'oauth',
      role: 'user',
      status: 'active',
      verificationStatus: 'verified',
    },
    {
      openId: 'buyer_001',
      name: 'Ramesh Kumar',
      email: 'ramesh@email.com',
      phone: '+977-9841234567',
      location: 'Kathmandu',
      bio: 'Looking for great deals',
      avatar: 'https://picsum.photos/seed/Ramesh/150/150',
      loginMethod: 'oauth',
      role: 'user',
      status: 'active',
      verificationStatus: 'unverified',
    },
    {
      openId: 'buyer_002',
      name: 'Priya Sharma',
      email: 'priya@email.com',
      phone: '+977-9842345678',
      location: 'Pokhara',
      bio: 'Fashion enthusiast',
      avatar: 'https://picsum.photos/seed/Priya/150/150',
      loginMethod: 'oauth',
      role: 'user',
      status: 'active',
      verificationStatus: 'unverified',
    },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (openId, name, email, phone, location, bio, avatar, loginMethod, password, role, status, verificationStatus, createdAt, updatedAt, lastSignedIn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hashedPassword = await bcrypt.hash('password123', 10);

  const userIds = {};
  users.forEach((user, idx) => {
    const now = Date.now();
    const result = insertUser.run(
      user.openId,
      user.name,
      user.email,
      user.phone,
      user.location,
      user.bio,
      user.avatar,
      user.loginMethod,
      hashedPassword,
      user.role,
      user.status,
      user.verificationStatus,
      now,
      now,
      now
    );
    userIds[user.openId] = result.lastInsertRowid;
  });
  console.log(`✅ Created ${users.length} users\n`);

  // 2. Seed Categories
  console.log('📝 Seeding categories...');
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Phones, laptops, and gadgets', icon: '📱', parentId: null },
    { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories', icon: '👗', parentId: null },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Furniture and home decor', icon: '🏠', parentId: null },
    { name: 'Vehicles', slug: 'vehicles', description: 'Cars, bikes, and scooters', icon: '🚗', parentId: null },
    { name: 'Property', slug: 'property', description: 'Rent and buy properties', icon: '🏢', parentId: null },
    { name: 'Groceries', slug: 'groceries', description: 'Daily essentials and food items', icon: '🛒', parentId: null },
    { name: 'Medical', slug: 'medical', description: 'Medicines, herbal products, and medical accessories', icon: '💊', parentId: null },
    { name: 'Digital & Tech', slug: 'digital-tech', description: 'Software, projects, and digital services', icon: '💻', parentId: null },
    { name: 'Agriculture', slug: 'agriculture', description: 'Farming tools, seeds, and livestock', icon: '🌾', parentId: null },
    { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Gym equipment and sports gear', icon: '⚽', parentId: null },
    { name: 'Books & Education', slug: 'books-education', description: 'Educational materials and books', icon: '📚', parentId: null },
    { name: 'Services', slug: 'services', description: 'Plumbing, electrical, and other services', icon: '🔧', parentId: null },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, icon, parentId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const categoryIds = {};
  const catNow = Date.now();
  categories.forEach((cat) => {
    insertCategory.run(cat.name, cat.slug, cat.description, cat.icon, cat.parentId, catNow, catNow);
    categoryIds[cat.slug] = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug).id;
  });
  console.log(`✅ Created ${categories.length} categories\n`);

  // 3. Seed Listings
  console.log('📝 Seeding listings...');
  const listings = [
    {
      title: 'iPhone 14 Pro Max - Excellent Condition',
      description: 'Barely used iPhone 14 Pro Max with original box and accessories',
      category: 'electronics',
      seller: 'seller_001',
      price: 85000,
      condition: 'excellent',
      location: 'Kathmandu',
      type: 'marketplace',
      images: '["https://picsum.photos/seed/iPhone14Pro/800/600"]',
      status: 'active',
    },
    {
      title: 'MacBook Air M1 - Like New',
      description: 'MacBook Air M1 2021, 8GB RAM, 256GB SSD, minimal usage',
      category: 'electronics',
      seller: 'seller_001',
      price: 95000,
      condition: 'like-new',
      location: 'Kathmandu',
      type: 'marketplace',
      images: '["https://picsum.photos/seed/MacBook/800/600"]',
      status: 'active',
    },
    {
      title: 'Designer Handbag - Authentic',
      description: 'Authentic designer handbag, original receipt included',
      category: 'fashion',
      seller: 'seller_002',
      price: 15000,
      condition: 'good',
      location: 'Pokhara',
      type: 'marketplace',
      images: '["https://picsum.photos/seed/Handbag/800/600"]',
      status: 'active',
    },
    {
      title: 'Wooden Dining Table Set',
      description: 'Beautiful wooden dining table with 6 chairs, solid wood construction',
      category: 'home-garden',
      seller: 'seller_003',
      price: 35000,
      condition: 'excellent',
      location: 'Lalitpur',
      type: 'marketplace',
      images: '["https://picsum.photos/seed/DiningTable/800/600"]',
      status: 'active',
    },
    {
      title: 'Honda City 2018 - Well Maintained',
      description: 'Honda City 2018 model, 45000 km, single owner, all documents ready',
      category: 'vehicles',
      seller: 'seller_001',
      price: 1200000,
      condition: 'good',
      location: 'Kathmandu',
      type: 'marketplace',
      images: '["https://picsum.photos/seed/HondaCity/800/600"]',
      status: 'active',
    },
  ];

  console.log('📝 Seeding listings...');
  const insertListing = db.prepare(`
    INSERT INTO listings (userId, categoryId, title, description, type, price, images, location, district, brand, model, color, condition, status, views, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listingData = [
    {
      userId: 1,
      categorySlug: 'electronics',
      title: 'iPhone 15 Pro Max - 256GB',
      description: 'Brand new iPhone 15 Pro Max, Titanium Blue, sealed box.',
      type: 'sell',
      price: 185000,
      location: 'New Road, Kathmandu',
      district: 'Kathmandu',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      color: 'Titanium Blue',
      condition: 'excellent',
    },
    {
      userId: 2,
      categorySlug: 'vehicles',
      title: 'Hyundai Creta 2023 - Low Mileage',
      description: 'Excellent condition Hyundai Creta, silver color, single owner.',
      type: 'sell',
      price: 4500000,
      location: 'Pokhara',
      district: 'Kaski',
      brand: 'Hyundai',
      model: 'Creta',
      color: 'Silver',
      condition: 'good',
    },
    {
      userId: 1,
      categorySlug: 'home-garden',
      title: 'L-Shaped Modern Sofa Set',
      description: 'Premium quality grey velvet sofa set for living room.',
      type: 'sell',
      price: 85000,
      location: 'Lalitpur',
      district: 'Lalitpur',
      brand: 'Furniture Land',
      model: 'Modern-L',
      color: 'Grey',
      condition: 'good',
    },
    {
      userId: 3,
      categorySlug: 'electronics',
      title: 'Sony PlayStation 5 (PS5) Disc Edition',
      description: 'Gently used PS5 with 2 controllers and 3 games.',
      type: 'sell',
      price: 65000,
      location: 'Butwal',
      district: 'Rupandehi',
      brand: 'Sony',
      model: 'PS5',
      color: 'White',
      condition: 'good',
    },
    {
      userId: 2,
      categorySlug: 'fashion',
      title: 'Nike Air Jordan 1 Retro',
      description: 'Authentic Nike AJ1, Red/White, Size 10.',
      type: 'sell',
      price: 18000,
      location: 'Dharan',
      district: 'Sunsari',
      brand: 'Nike',
      model: 'Air Jordan 1',
      color: 'Red',
      condition: 'excellent',
    }
  ];

  const listingIds = [];
  const listNow = Date.now();
  listingData.forEach((l) => {
    const result = insertListing.run(
      l.userId,
      categoryIds[l.categorySlug],
      l.title,
      l.description,
      l.type,
      l.price,
      JSON.stringify(['https://picsum.photos/seed/' + l.title + '/800/600']),
      l.location,
      l.district,
      l.brand,
      l.model,
      l.color,
      l.condition,
      'active',
      Math.floor(Math.random() * 500),
      listNow,
      listNow
    );
    listingIds.push(result.lastInsertRowid);
  });
  console.log(`✅ Created ${listingData.length} listings\n`);

  // 4. Seed Auctions
  console.log('📝 Seeding auctions...');
  const auctions = [
    {
      title: 'Vintage Rolex Watch - Auction',
      description: 'Authentic vintage Rolex watch, starting bid Rs. 50,000',
      seller: 'seller_001',
      startingPrice: 50000,
      currentBid: 65000,
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime(),
      images: '["https://picsum.photos/seed/RolexWatch/800/600"]',
    },
    {
      title: 'Antique Furniture Collection',
      description: 'Beautiful antique furniture collection, starting bid Rs. 30,000',
      seller: 'seller_003',
      startingPrice: 30000,
      currentBid: 42000,
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).getTime(),
      images: '["https://picsum.photos/seed/AntiqueFurniture/800/600"]',
    },
  ];

  const insertAuction = db.prepare(`
    INSERT INTO auctions (listingId, startingPrice, currentBid, startTime, endTime, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const nowAuction = Date.now();
  auctions.forEach((auction) => {
    // First create a listing for the auction
    const now = Date.now();
    insertListing.run(
      userIds[auction.seller],
      categoryIds['electronics'],
      auction.title,
      auction.description,
      'auction',
      auction.startingPrice,
      auction.images,
      'Kathmandu',
      'Kathmandu',
      'Generic',
      'Auction Model',
      'Default',
      'good',
      'active',
      0,
      now,
      now
    );
    const listingId = db.prepare('SELECT id FROM listings WHERE title = ?').get(auction.title).id;

    // Then create the auction
    insertAuction.run(
      listingId,
      auction.startingPrice,
      auction.currentBid,
      nowAuction,
      auction.endTime,
      nowAuction,
      nowAuction
    );
  });
  console.log(`✅ Created ${auctions.length} auctions\n`);

  // 5. Seed Reviews
  console.log('📝 Seeding reviews...');
    const reviewsData = [
    {
      listing: listingIds[0],
      reviewer: 'buyer_001',
      seller: 'seller_001',
      rating: 5,
      title: 'Excellent product and fast delivery!',
      comment: 'The iPhone arrived in perfect condition. Seller was very responsive and professional.',
      isVerifiedPurchase: true,
    },
    {
      listing: listingIds[1],
      reviewer: 'buyer_002',
      seller: 'seller_001',
      rating: 4,
      title: 'Great laptop, minor scratches',
      comment: 'MacBook works perfectly. Has minor cosmetic scratches but nothing functional.',
      isVerifiedPurchase: true,
    },
    {
      listing: listingIds[2],
      reviewer: 'buyer_001',
      seller: 'seller_002',
      rating: 5,
      title: 'Authentic and beautiful!',
      comment: 'Exactly as described. Authentic designer bag with all certificates.',
      isVerifiedPurchase: true,
    },
  ];

  const insertReview = db.prepare(`
    INSERT INTO reviews (listingId, fromUserId, toUserId, rating, title, comment, isVerifiedPurchase, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const nowReview = Date.now();
  reviewsData.forEach((review) => {
    insertReview.run(
      review.listing,
      userIds[review.reviewer],
      userIds[review.seller],
      review.rating,
      review.title,
      review.comment,
      review.isVerifiedPurchase ? 1 : 0,
      nowReview,
      nowReview
    );
  });
  console.log(`✅ Created ${reviewsData.length} reviews\n`);

  // 6. Seed Favorites
  console.log('📝 Seeding favorites...');
  const favorites = [
    { userId: userIds['buyer_001'], listingId: listingIds[0] },
    { userId: userIds['buyer_001'], listingId: listingIds[1] },
    { userId: userIds['buyer_002'], listingId: listingIds[2] },
  ];

  const insertFavorite = db.prepare(`
    INSERT INTO favorites (userId, listingId, createdAt)
    VALUES (?, ?, ?)
  `);

  const nowFav = Date.now();
  favorites.forEach((fav) => {
    insertFavorite.run(fav.userId, fav.listingId, nowFav);
  });
  console.log(`✅ Created ${favorites.length} favorites\n`);

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${users.length} users created`);
  console.log(`   - ${categories.length} categories created`);
  console.log(`   - ${listings.length} listings created`);
  console.log(`   - ${auctions.length} auctions created`);
  console.log(`   - ${reviewsData.length} reviews created`);
  console.log(`   - ${favorites.length} favorites created`);
  console.log('\n✨ Your marketplace is ready with sample data!\n');

} catch (error) {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
} finally {
  db.close();
}
