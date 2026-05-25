# Sasto Marketplace - Complete Source Code Package

## What's Included

This zip archive contains the complete, production-ready source code for the Sasto Marketplace platform.

### File Structure

```
sasto_marketplace/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/                  # Page components (Home, Marketplace, etc.)
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities (tRPC client, CSV export, etc.)
│   │   ├── App.tsx                 # Main app component
│   │   ├── main.tsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── public/                     # Static assets
│   └── index.html                  # HTML template
│
├── server/                         # Express Backend
│   ├── _core/                      # Framework core (OAuth, Vite, context)
│   ├── routers/                    # tRPC router modules
│   ├── db.ts                       # Database query helpers
│   ├── routers.ts                  # Main tRPC procedures
│   ├── websocket.ts                # WebSocket manager
│   ├── email.ts                    # Email service
│   ├── rbac.ts                     # Role-based access control
│   ├── storage.ts                  # S3 storage helpers
│   └── *.test.ts                   # Unit tests
│
├── drizzle/                        # Database Schema
│   ├── schema.ts                   # Drizzle ORM table definitions
│   └── migrations/                 # SQL migration files
│
├── shared/                         # Shared code
│   ├── types.ts                    # Shared TypeScript types
│   └── const.ts                    # Shared constants
│
├── package.json                    # Project dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── vitest.config.ts                # Test configuration
├── drizzle.config.ts               # Database configuration
├── DEPLOYMENT_GUIDE.md             # Deployment instructions
├── SETUP_GUIDE.md                  # Development setup guide
└── README_ZIP_CONTENTS.md          # This file
```

## Quick Start

### 1. Extract the Archive
```bash
unzip sasto_marketplace_source.zip
cd sasto_marketplace
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment
```bash
# Create .env file with required variables
# See DEPLOYMENT_GUIDE.md for complete list
```

### 4. Setup Database
```bash
pnpm db:push
```

### 5. Start Development
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Key Features Implemented

### ✅ Marketplace Features
- Marketplace, auction, and rental listings
- Advanced search with filters (price, condition, location, category, date)
- Real-time listing updates
- Image upload to S3

### ✅ Auctions
- Live bidding with real-time updates
- WebSocket-based bid notifications
- Automatic auction closure
- Bid history tracking

### ✅ User Reviews & Ratings
- 5-star rating system
- Verified purchase badges
- Helpful/unhelpful voting
- Seller responses to reviews
- Review moderation and flagging
- Rating analytics

### ✅ Real-Time Features
- WebSocket-based live auctions
- Instant messaging
- Real-time bid counter
- User online/offline status

### ✅ Role-Based Access Control
- 7 roles with 25 granular permissions
- Role management dashboard
- Audit logging
- Permission enforcement

### ✅ Dashboards
- Seller Dashboard (listings, analytics, sales)
- Buyer Dashboard (purchases, saved items, bids, cart)
- Admin Dashboard (user management, disputes, moderation)
- Super Admin Dashboard (role management, system settings)

### ✅ Email Notifications
- 8 email templates
- Resend API integration
- User preference management
- Email queue with retry logic

### ✅ Ad Monetization
- Google AdSense integration
- Manual ad management
- Ad analytics and tracking
- Advertiser dashboard

## Technology Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Express 4, tRPC 11, Node.js 22
- **Database**: MySQL/TiDB with Drizzle ORM
- **Real-Time**: Socket.IO for WebSockets
- **Authentication**: Manus OAuth
- **Email**: Resend API
- **Storage**: S3 via Manus Forge API

## Database Schema

The project includes 28 tables covering:
- User management and authentication
- Marketplace listings and transactions
- Auctions and bidding
- Reviews and ratings
- Real-time messaging
- Role-based access control
- Email notifications
- Ad monetization
- Dispute resolution
- Admin logging

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Preview production build
pnpm preview

# Database migrations
pnpm db:push
pnpm drizzle-kit generate

# Type checking
pnpm tsc

# Linting (if configured)
pnpm lint
```

## Project Statistics

- **Total Tables**: 28
- **Total Procedures**: 50+
- **Total Components**: 40+
- **Total Tests**: 275+
- **Lines of Code**: 10,000+

## Important Files

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript settings
- `vite.config.ts` - Vite build configuration
- `drizzle.config.ts` - Database configuration

### Documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `SETUP_GUIDE.md` - Development setup instructions
- `todo.md` - Feature tracking and progress

### Core Application
- `client/src/App.tsx` - Main app routes
- `server/_core/index.ts` - Server entry point
- `drizzle/schema.ts` - Database schema

## Environment Variables Required

```env
DATABASE_URL=mysql://user:password@host/database
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key
```

See `DEPLOYMENT_GUIDE.md` for complete environment variable documentation.

## Deployment

### Production Build
```bash
pnpm build
```

### Docker
See `DEPLOYMENT_GUIDE.md` for Docker deployment instructions.

### Cloud Platforms
The application can be deployed to:
- Vercel (frontend)
- Railway (backend)
- Render
- AWS
- Google Cloud
- Azure

## Support & Documentation

- **Setup Guide**: See `SETUP_GUIDE.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Feature Tracking**: See `todo.md`
- **API Documentation**: Available via tRPC introspection

## Testing

The project includes comprehensive test coverage:
- Unit tests for all major features
- Component tests
- Integration tests
- 275+ tests passing

Run tests with:
```bash
pnpm test
```

## Performance

- Optimized React components with lazy loading
- Database query optimization with indexes
- Efficient WebSocket communication
- CSS optimization with Tailwind
- Image optimization with S3 storage

## Security

- OAuth 2.0 authentication
- Role-based access control
- SQL injection prevention (Drizzle ORM)
- Input validation on all endpoints
- CORS configuration
- Environment variable protection

## Next Steps

1. Extract the archive
2. Install dependencies with `pnpm install`
3. Configure environment variables in `.env`
4. Run `pnpm db:push` to setup database
5. Start development with `pnpm dev`
6. Review `SETUP_GUIDE.md` for development workflow
7. Check `DEPLOYMENT_GUIDE.md` for deployment options

## License

This project is proprietary software for Sasto Marketplace.

## Contact

For support or questions about this project, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: April 1, 2026  
**Status**: Production Ready
