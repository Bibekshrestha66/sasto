import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

export const searchRouter = router({
  // Search autocomplete for listings and categories
  autocomplete: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().int().positive().max(20).default(10),
    }))
    .query(async ({ input }) => {
      const { query, limit } = input;
      const searchTerm = `%${query}%`;

      try {
        const db = await getDb();
        // Search in listings
        const listings = await db.query.listings.findMany({
          where: (listings, { like, and, eq }) =>
            and(
              like(listings.title, searchTerm),
              eq(listings.status, 'active')
            ),
          columns: {
            id: true,
            title: true,
            price: true,
            location: true,
            images: true,
          },
          limit: Math.floor(limit * 0.6),
        });

        // Search in categories
        const categories = await db.query.categories.findMany({
          where: (categories, { like }) => like(categories.name, searchTerm),
          columns: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
          limit: Math.floor(limit * 0.4),
        });

        return {
          listings: listings.map(l => ({
            type: 'listing',
            id: l.id,
            title: l.title,
            price: l.price,
            location: l.location,
            image: typeof l.images === 'string' ? JSON.parse(l.images)[0] : (l.images as any)?.[0],
          })),
          categories: categories.map(c => ({
            type: 'category',
            id: c.id,
            name: c.name,
            slug: c.slug,
            icon: c.icon,
          })),
        };
      } catch (error) {
        console.error('Search autocomplete error:', error);
        return { listings: [], categories: [] };
      }
    }),

  // Advanced search with filters
  advanced: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      category: z.number().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      location: z.string().optional(),
      district: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
      condition: z.enum(['new', 'like-new', 'good', 'fair']).optional(),
      sortBy: z.enum(['newest', 'price-low', 'price-high', 'popular']).default('newest'),
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(50).default(20),
    }))
    .query(async ({ input }) => {
      const { query, category, minPrice, maxPrice, location, district, brand, model, color, condition, sortBy, page, limit } = input;
      const offset = (page - 1) * limit;

      try {
        const db = await getDb();
        const listings = await db.query.listings.findMany({
          where: (listings, { like, and, eq, gte, lte }) => {
            const conditions = [eq(listings.status, 'active')];

            if (query) {
              conditions.push(like(listings.title, `%${query}%`));
            }
            if (category) {
              conditions.push(eq(listings.categoryId, category));
            }
            if (minPrice !== undefined) {
              conditions.push(gte(listings.price, minPrice));
            }
            if (maxPrice !== undefined) {
              conditions.push(lte(listings.price, maxPrice));
            }
            if (location) {
              conditions.push(like(listings.location, `%${location}%`));
            }
            if (district) {
              conditions.push(eq(listings.district, district));
            }
            if (brand) {
              conditions.push(like(listings.brand, `%${brand}%`));
            }
            if (model) {
              conditions.push(like(listings.model, `%${model}%`));
            }
            if (color) {
              conditions.push(eq(listings.color, color));
            }
            if (condition) {
              conditions.push(eq(listings.condition, condition));
            }

            return and(...conditions);
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          limit,
          offset,
          orderBy: (listings, { desc, asc }) => {
            switch (sortBy) {
              case 'price-low':
                return asc(listings.price);
              case 'price-high':
                return desc(listings.price);
              case 'popular':
                return desc(listings.views);
              case 'newest':
              default:
                return desc(listings.createdAt);
            }
          },
        });

        return {
          results: listings,
          page,
          limit,
          total: listings.length,
        };
      } catch (error) {
        console.error('Advanced search error:', error);
        return { results: [], page, limit, total: 0 };
      }
    }),

  // Get trending searches
  trending: publicProcedure
    .query(async () => {
      try {
        const trendingSearches = [
          'iPhone',
          'MacBook',
          'Apartment',
          'Honda',
          'Designer Handbag',
          'Furniture',
          'Electronics',
        ];

        return trendingSearches;
      } catch (error) {
        console.error('Trending searches error:', error);
        return [];
      }
    }),

  // Get trending locations from real listings — single GROUP BY query, no full-table scan in JS
  trendingLocations: publicProcedure
    .query(async () => {
      try {
        const db = await getDb();
        const rows = await db.execute(sql`
          SELECT location, COUNT(*) AS cnt
          FROM listings
          WHERE status = 'active' AND location IS NOT NULL AND location <> ''
          GROUP BY location
          ORDER BY cnt DESC
          LIMIT 5
        `);

        return (rows as any[]).map((r) => ({
          name: r.location as string,
          count: Number(r.cnt),
          rating: 4.5,
        }));
      } catch (error) {
        console.error('Trending locations error:', error);
        return [];
      }
    }),

  // Get top sellers — single JOIN+GROUP BY query instead of N+1 per seller
  topSellers: publicProcedure
    .query(async () => {
      try {
        const db = await getDb();
        const rows = await db.execute(sql`
          SELECT u.id, u.name, u.is_verified,
                 COUNT(l.id) AS total_listings
          FROM users u
          LEFT JOIN listings l ON l."userId" = u.id
          WHERE u.role IN ('seller', 'dealer', 'wholesaler', 'distributor')
          GROUP BY u.id, u.name, u.is_verified
          HAVING COUNT(l.id) > 0
          ORDER BY total_listings DESC
          LIMIT 5
        `);

        return (rows as any[]).map((r) => ({
          id: String(r.id),
          name: r.name || 'Anonymous Seller',
          totalListings: Number(r.total_listings),
          verificationStatus: r.is_verified ? 'verified' as const : 'unverified' as const,
        }));
      } catch (error) {
        console.error('Top sellers error:', error);
        return [];
      }
    }),
});
