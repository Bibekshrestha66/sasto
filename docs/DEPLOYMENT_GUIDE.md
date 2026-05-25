# Sasto Marketplace - Deployment Guide

## Project Overview

**Sasto Marketplace** is a comprehensive e-commerce platform built with modern web technologies. It supports marketplace listings, auctions, rentals, real-time bidding, messaging, role-based access control, and advanced monetization features.

## Technology Stack

### Frontend
- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Reusable UI components
- **tRPC** - End-to-end type-safe APIs
- **Socket.IO Client** - Real-time WebSocket communication

### Backend
- **Express 4** - Web framework
- **tRPC 11** - API framework
- **Node.js 22** - Runtime
- **Socket.IO** - Real-time server
- **Drizzle ORM** - Database ORM

### Database
- **MySQL/TiDB** - Primary database
- **Drizzle Kit** - Schema management and migrations

### External Services
- **Manus OAuth** - Authentication
- **Resend API** - Email notifications
- **Google AdSense** - Ad monetization
- **S3 Storage** - File storage (via Manus Forge API)

## Project Structure

```
sasto_marketplace/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Marketplace.tsx
│   │   │   ├── ListingDetail.tsx
│   │   │   ├── SellerDashboard.tsx
│   │   │   ├── BuyerDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ...
│   │   ├── components/             # Reusable components
│   │   │   ├── PostAdModal.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── ...
│   │   ├── contexts/               # React contexts
│   │   ├── hooks/                  # Custom hooks
│   │   ├── lib/
│   │   │   ├── trpc.ts            # tRPC client setup
│   │   │   └── utils.ts           # Utility functions
│   │   ├── App.tsx                # Main app component
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── public/                     # Static assets
│   └── index.html                 # HTML template
│
├── server/                         # Express backend
│   ├── _core/                      # Framework core
│   │   ├── index.ts               # Server entry point
│   │   ├── context.ts             # tRPC context
│   │   ├── env.ts                 # Environment variables
│   │   ├── oauth.ts               # OAuth integration
│   │   ├── vite.ts                # Vite integration
│   │   └── ...
│   ├── db.ts                       # Database queries
│   ├── routers.ts                  # tRPC procedures
│   ├── websocket.ts                # WebSocket manager
│   ├── email.ts                    # Email service
│   ├── rbac.ts                     # Role-based access control
│   └── *.test.ts                   # Unit tests
│
├── drizzle/                        # Database schema
│   ├── schema.ts                   # Drizzle ORM schema
│   └── migrations/                 # SQL migrations
│
├── shared/                         # Shared types and constants
│   └── constants.ts
│
├── storage/                        # S3 storage helpers
│   └── index.ts
│
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite config
├── vitest.config.ts                # Test config
└── drizzle.config.ts               # Drizzle config
```

## Database Schema

The project includes 28 tables:

**Core Tables:**
- `users` - User accounts with roles and verification status
- `categories` - Product categories with subcategories
- `listings` - Marketplace, auction, and rental listings

**Transaction Tables:**
- `auctions` - Auction listings with bidding
- `bids` - Individual bids on auctions
- `bookings` - Rental bookings
- `messages` - User-to-user messaging

**Review System:**
- `reviews` - User reviews and ratings
- `review_helpful_votes` - Helpful/unhelpful votes
- `review_analytics` - Aggregated rating statistics
- `flagged_reviews` - Moderation system

**Access Control:**
- `roles` - User roles (7 total)
- `permissions` - Granular permissions (25 total)
- `role_permissions` - Role-permission mapping
- `user_roles` - User role assignments
- `role_audit_logs` - Audit trail

**Monetization:**
- `advertisers` - Advertiser accounts
- `manual_ads` - Manual ad campaigns
- `ad_analytics` - Ad performance metrics
- `adsense_placements` - Google AdSense slots
- `ad_payments` - Payment tracking

**Notifications:**
- `notifications` - In-app notifications
- `email_notification_preferences` - Email preferences
- `email_queue` - Email delivery queue
- `email_logs` - Email delivery logs

**Other:**
- `favorites` - Saved/favorited listings
- `disputes` - Buyer-seller disputes
- `adminLogs` - Admin action logging

## Key Features

### 1. Marketplace & Listings
- Create marketplace, auction, and rental listings
- Advanced search with filters (price, condition, location, category, date)
- Image upload to S3
- Real-time listing updates

### 2. Auctions
- Live auction bidding with real-time updates
- WebSocket-based bid notifications
- Automatic auction closure
- Bid history tracking

### 3. Rentals
- Date-based booking system
- Availability calendar
- Booking confirmation

### 4. User Reviews & Ratings
- 5-star rating system
- Verified purchase badges
- Helpful/unhelpful voting
- Seller responses to reviews
- Review moderation and flagging
- Rating analytics per user

### 5. Real-Time Features
- WebSocket-based live auctions
- Instant messaging with delivery confirmation
- Real-time bid counter
- User online/offline status

### 6. Role-Based Access Control (RBAC)
- 7 roles: User, Seller, CSR, Sub-Moderator, Moderator, Admin, Super Admin
- 25 granular permissions
- Role-based route protection
- Audit logging for all role changes

### 7. Dashboards
- **Seller Dashboard**: Listings, sales analytics, bid tracking, performance metrics
- **Buyer Dashboard**: Purchase history, saved items, active bids, shopping cart
- **Admin Dashboard**: User management, dispute resolution, listing moderation
- **Super Admin Dashboard**: Role management, system settings, audit logs

### 8. Email Notifications
- 8 email templates
- Resend API integration
- User preference management
- Email queue with retry logic
- Unsubscribe functionality

### 9. Ad Monetization
- Google AdSense integration
- Manual ad management
- Ad analytics and performance tracking
- Advertiser dashboard
- Ad approval workflow

### 10. Search & Filtering
- Full-text search
- Price range filtering
- Condition filtering (New, Like New, Good, Fair)
- Location-based filtering (8 Nepal cities)
- Category and subcategory filtering
- Date range filtering
- Active filter display with badges

## Installation & Setup

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL/TiDB database
- Environment variables configured

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Security
JWT_SECRET=your_jwt_secret

# Email
RESEND_API_KEY=your_resend_api_key

# Owner
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

### Installation Steps

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Development Workflow

### 1. Database Changes
```bash
# Edit drizzle/schema.ts
# Then push changes
pnpm db:push
```

### 2. Adding Backend Procedures
```bash
# 1. Add database helper in server/db.ts
# 2. Add tRPC procedure in server/routers.ts
# 3. Write tests in server/routers.test.ts
# 4. Run tests: pnpm test
```

### 3. Adding Frontend Components
```bash
# 1. Create component in client/src/components/
# 2. Use tRPC hooks: trpc.feature.useQuery/useMutation
# 3. Write tests in component.test.ts
# 4. Add route in client/src/App.tsx if needed
```

### 4. Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/routers.test.ts

# Watch mode
pnpm test --watch
```

## Deployment

### Production Build
```bash
# Build frontend and backend
pnpm build

# The build output is in the dist/ directory
```

### Docker Deployment
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Environment-Specific Configuration
- Development: `NODE_ENV=development pnpm dev`
- Production: `NODE_ENV=production pnpm start`

## Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading of routes
- Image optimization (S3 storage)
- CSS optimization with Tailwind

### Backend
- Database query optimization
- Connection pooling
- Caching strategies
- Rate limiting

### Database
- Indexed columns for fast queries
- Efficient foreign key relationships
- Query result pagination

## Security Best Practices

1. **Authentication**: Manus OAuth with session cookies
2. **Authorization**: Role-based access control (RBAC)
3. **Data Validation**: Input validation on all endpoints
4. **SQL Injection Prevention**: Drizzle ORM parameterized queries
5. **CORS**: Configured for same-origin requests
6. **Environment Variables**: Sensitive data in .env files
7. **Rate Limiting**: Implemented for API endpoints
8. **HTTPS**: Required in production

## Monitoring & Logging

- Server logs in console
- Database query logging
- WebSocket connection tracking
- Email delivery logging
- Admin action audit logs
- Error tracking and reporting

## Support & Documentation

- API Documentation: Available via tRPC introspection
- Component Documentation: See component files
- Database Schema: See drizzle/schema.ts
- Test Examples: See *.test.ts files

## License

This project is proprietary software for Sasto Marketplace.

## Contact

For support or questions, contact the development team.
