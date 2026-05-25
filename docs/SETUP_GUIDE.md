# Sasto Marketplace - Setup Guide

## Quick Start

### 1. Clone and Install
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 2. Database Setup
```bash
# Push schema to database
pnpm db:push

# Generate migrations (if needed)
pnpm drizzle-kit generate
```

### 3. Start Development
```bash
# Start dev server (runs on http://localhost:3000)
pnpm dev

# In another terminal, run tests
pnpm test
```

## Project Architecture

### Frontend (React + Vite)
Located in `client/src/`

**Key Directories:**
- `pages/` - Full page components
  - `Home.tsx` - Landing page
  - `Marketplace.tsx` - Listings grid with filters
  - `ListingDetail.tsx` - Individual listing view
  - `SellerDashboard.tsx` - Seller analytics
  - `BuyerDashboard.tsx` - Buyer account
  - `AdminDashboard.tsx` - Admin panel

- `components/` - Reusable UI components
  - `PostAdModal.tsx` - Listing creation form
  - `SearchFilters.tsx` - Advanced search
  - `ReviewCard.tsx` - Review display
  - `RatingStars.tsx` - Rating input/display
  - `DashboardLayout.tsx` - Dashboard wrapper

- `lib/` - Utilities and configurations
  - `trpc.ts` - tRPC client setup
  - `csvExport.ts` - CSV export utilities

- `hooks/` - Custom React hooks
- `contexts/` - React contexts for state

### Backend (Express + tRPC)
Located in `server/`

**Key Files:**
- `_core/index.ts` - Server entry point
- `db.ts` - Database query helpers
- `routers.ts` - tRPC procedure definitions
- `websocket.ts` - Real-time WebSocket manager
- `email.ts` - Email service integration
- `rbac.ts` - Role-based access control

### Database (Drizzle ORM)
Located in `drizzle/`

- `schema.ts` - Table definitions
- `migrations/` - SQL migration files

## Common Development Tasks

### Adding a New Feature

#### 1. Database Schema
```typescript
// drizzle/schema.ts
export const myTable = mysqlTable("my_table", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MyTable = typeof myTable.$inferSelect;
export type InsertMyTable = typeof myTable.$inferInsert;
```

#### 2. Database Helpers
```typescript
// server/db.ts
export async function getMyData(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  return db.select().from(myTable)
    .where(eq(myTable.id, id))
    .limit(1);
}
```

#### 3. tRPC Procedures
```typescript
// server/routers.ts
export const appRouter = router({
  myFeature: {
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getMyData(input.id);
      }),
  },
});
```

#### 4. Frontend Component
```typescript
// client/src/pages/MyPage.tsx
import { trpc } from "@/lib/trpc";

export function MyPage() {
  const { data, isLoading } = trpc.myFeature.get.useQuery({ id: 1 });
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.name}</div>;
}
```

#### 5. Tests
```typescript
// server/routers.test.ts
describe("myFeature", () => {
  it("should get data", async () => {
    const result = await caller.myFeature.get({ id: 1 });
    expect(result).toBeDefined();
  });
});
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific file
pnpm test server/routers.test.ts

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Building for Production
```bash
# Build
pnpm build

# Preview build locally
pnpm preview

# Start production server
NODE_ENV=production pnpm start
```

## Key Concepts

### tRPC Procedures
- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires authenticated user
- `adminProcedure` - Requires admin role

### Database Queries
- Always use `await getDb()` to get database instance
- Check if db is available before querying
- Use Drizzle ORM for type-safe queries

### Real-Time Features
- WebSocket connections managed in `server/websocket.ts`
- Client-side hook: `useWebSocket()` in `client/src/hooks/`
- Events: bid updates, messages, user status

### Email Notifications
- Templates in `server/email.ts`
- Queue system for reliability
- User preferences in database
- Resend API for delivery

### Role-Based Access Control
- 7 roles with 25 permissions
- Checked via `ctx.user.role` in procedures
- Route protection in frontend
- Audit logging for changes

## File Naming Conventions

- **Components**: PascalCase (e.g., `MyComponent.tsx`)
- **Pages**: PascalCase (e.g., `HomePage.tsx`)
- **Utilities**: camelCase (e.g., `csvExport.ts`)
- **Types**: PascalCase (e.g., `User`, `Listing`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

## Code Style

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Use `type` for type definitions
- Use `interface` for object shapes

### React
- Functional components only
- Hooks for state management
- Props destructuring
- Memoization for performance

### Tailwind CSS
- Utility-first approach
- Custom theme in `client/src/index.css`
- Responsive design with breakpoints
- Dark mode support

## Debugging

### Frontend
- React DevTools browser extension
- Console logs with `console.log()`
- Network tab for API calls
- Local storage inspection

### Backend
- Console logs in server output
- Database query logging
- Error stack traces
- Request/response inspection

### Database
- Query execution time logging
- Connection pool monitoring
- Migration status checking

## Performance Tips

1. **Frontend**
   - Use React.memo for expensive components
   - Lazy load routes with React.lazy()
   - Optimize images with S3 storage
   - Minimize bundle size

2. **Backend**
   - Use database indexes
   - Implement query caching
   - Batch database operations
   - Connection pooling

3. **Database**
   - Proper indexing on frequently queried columns
   - Denormalization for read-heavy operations
   - Query optimization and analysis

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues
- Check DATABASE_URL format
- Verify database is running
- Check network connectivity
- Review database credentials

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .pnpm-store
pnpm install

# Rebuild
pnpm build
```

### Test Failures
- Check test file for syntax errors
- Verify mock data setup
- Review test assertions
- Check database state

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Express Documentation](https://expressjs.com)

## Next Steps

1. Review `DEPLOYMENT_GUIDE.md` for deployment information
2. Check `todo.md` for remaining features
3. Run `pnpm test` to verify setup
4. Start development with `pnpm dev`
