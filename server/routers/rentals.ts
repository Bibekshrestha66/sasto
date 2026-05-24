import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getListings } from "../db";

export const rentalsRouter = router({
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      searchQuery: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      // Get all listings and filter for rental type
      const listings = await getListings(100, 0);
      
      // Filter for rental listings
      let rentals = listings.filter((l: any) => l.type === "rental");
      
      // Apply category filter
      if (input.category && input.category !== "all") {
        rentals = rentals.filter((r: any) => r.category === input.category);
      }
      
      // Apply search filter
      if (input.searchQuery) {
        const query = input.searchQuery.toLowerCase();
        rentals = rentals.filter((r: any) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query)
        );
      }
      
      // Apply pagination
      return rentals.slice(input.offset, input.offset + input.limit);
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const listings = await getListings(100, 0);
      return listings.find((l: any) => l.id === input && l.type === "rental");
    }),
});
