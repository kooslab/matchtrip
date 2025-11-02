# MatchTrip - Travel Matching Platform

A modern travel marketplace platform connecting travelers with local guides. Built with SvelteKit 5, PostgreSQL, and Cloudflare R2.

## 🌟 Features

- **Traveler Experience**: Post trip requests, browse guide offers, secure bookings
- **Guide Platform**: Create service listings, respond to trip requests, manage bookings
- **Admin Panel**: Separate admin app for platform management
- **Payment Processing**: Toss Payments integration with webhook support
- **Real-time Messaging**: Chat system between travelers and guides
- **Secure Storage**: Cloudflare R2 with private bucket for file uploads
- **Data Encryption**: AES-256-GCM encryption for sensitive user data

## 🚀 Tech Stack

- **[SvelteKit 2.0+](https://svelte.dev/docs/kit)** - Full-stack framework
- **[Svelte 5.0](https://svelte.dev/docs/svelte)** - With runes syntax
- **[TailwindCSS 4.0](https://tailwindcss.com/)** - Utility-first styling
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database queries
- **[PostgreSQL](https://www.postgresql.org/)** - Database (Neon serverless)
- **[Better-auth](https://better-auth.com)** - Authentication system
- **[Cloudflare R2](https://www.cloudflare.com/products/r2/)** - Object storage
- **[Toss Payments](https://www.tosspayments.com/)** - Payment processing
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL database (Neon or self-hosted)
- Cloudflare R2 account (for file storage)
- Toss Payments account (for payment processing)

## 🛠️ Getting Started

### 1. Installation

```bash
# Install dependencies
bun install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL=your-postgresql-connection-string

# Authentication
BETTER_AUTH_SECRET=your-secret-key
PUBLIC_BETTER_AUTH_URL=http://localhost:5173

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=matchtrip-dev
R2_PUBLIC_BUCKET_NAME=matchtrip-public
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Toss Payments
TOSS_SECRET_KEY=your-toss-secret-key
TOSS_CLIENT_KEY=your-toss-client-key

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key-in-base64

# Kakao AlimTalk (optional)
INFOBIP_API_KEY=your-infobip-api-key
INFOBIP_BASE_URL=your-infobip-base-url
KAKAO_CHANNEL_PROFILE_KEY=your-kakao-channel-key

# Environment
NODE_ENV=development
```

### 3. Database Setup

```bash
# Run migrations
bun run db:migrate

# Or push schema changes (development only)
bun run db:push

# Open Drizzle Studio to view data
bun run db:studio
```

### 4. Development Server

```bash
bun run dev
```

Visit `http://localhost:5173`

## 📝 Available Scripts

### Development

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run start` - Start production server

### Code Quality

- `bun run check` - Type-check with svelte-check
- `bun run lint` - Check code formatting
- `bun run format` - Format code with Prettier

### Database

- `bun run db:push` - Push schema changes (dev only)
- `bun run db:generate` - Generate migration files
- `bun run db:migrate` - Run migrations
- `bun run db:migrate:prod` - Run migrations on production
- `bun run db:studio` - Open Drizzle Studio

### Utilities

- `bun run migrate:images` - Migrate images to private bucket

## 🏗️ Project Structure

```
matchtrip/
├── drizzle/                    # Database migrations
├── scripts/                    # Utility scripts
│   ├── active/                # Active migration scripts
│   └── archive/               # Archived scripts
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   ├── icons/             # Custom icon components
│   │   ├── server/            # Server-only code
│   │   │   ├── db/           # Database schema & connection
│   │   │   ├── kakao/        # Kakao AlimTalk integration
│   │   │   └── services/     # Business logic services
│   │   └── utils/             # Utility functions
│   ├── routes/                # SvelteKit routes
│   │   ├── (app)/            # Protected routes (requires auth)
│   │   ├── (auth)/           # OAuth callback routes
│   │   ├── products/         # Public product pages
│   │   ├── login/            # Authentication page
│   │   └── api/              # API endpoints
│   ├── hooks.server.ts        # Server-side hooks
│   └── app.css                # Global styles
├── static/                     # Static assets
└── docs/                       # Documentation (deprecated)
```

## 🔐 Authentication & Route Access

### Public Routes (로그인 불필요)

- `/` - Main homepage with destination browsing
- `/products` - All travel products listing
- `/products/[id]` - Individual product detail pages
- `/login` - Authentication page
- `/auth/*` - OAuth callback routes

### Protected Routes (로그인 필요)

All routes under `/(app)` layout require authentication:

- `/my-trips` - User's trips management
- `/chat` - Messaging between users
- `/profile` - User profile pages
- `/offers` - Guide offer management
- `/search` - Search functionality
- `/onboarding` - New user onboarding
- `/settings` - Application settings

### Admin Routes (관리자 권한 필요)

Handled by separate admin application (`admin-matchtrip`)

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Main documentation for Claude Code
- **[ENCRYPTION.md](./ENCRYPTION.md)** - Encryption standard and implementation
- **[STORAGE.md](./STORAGE.md)** - Cloudflare R2 storage guide
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema overview
- **[prd.md](./prd.md)** - Design system and typography
- **[CANCELLATION_REFUND_POLICY.md](./CANCELLATION_REFUND_POLICY.md)** - Business policies

## 🔧 Key Features

### Payment Integration

Toss Payments webhook integration for real-time payment updates:

- Production: `https://dev.matchtrip.net/api/webhooks/toss`
- Local Dev: `https://trip.share.zrok.io/api/webhooks/toss` (using zrok tunnel)

### File Storage

- Private bucket for user files (profiles, documents, chat images)
- Public bucket for marketing content (destinations)
- Presigned URLs with 1-hour expiration
- See [STORAGE.md](./STORAGE.md) for details

### Data Encryption

- AES-256-GCM encryption for sensitive user data
- Email encryption with hash-based lookups for auth
- See [ENCRYPTION.md](./ENCRYPTION.md) for details

### Notifications

- Kakao AlimTalk for Korean users
- SMS fallback for international users (via Infobip)
- Template-based messaging system

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Set up Toss Payments webhook URL
- [ ] Configure Cloudflare R2 buckets
- [ ] Set encryption key
- [ ] Update OAuth redirect URLs
- [ ] Run database migrations
- [ ] Test payment flow
- [ ] Test file uploads
- [ ] Verify email encryption

### Recommended Platforms

- **Vercel** - Recommended for SvelteKit
- **Railway** - Good for full-stack apps
- **Fly.io** - For self-hosted deployments

## 🤝 Related Repositories

- **[admin-matchtrip](../admin-matchtrip/)** - Admin panel for platform management

## 📄 License

Proprietary - MatchTrip Platform

---

**Questions or Issues?**

- Check [CLAUDE.md](./CLAUDE.md) for development guidelines
- Review documentation in this repository
- Contact the development team
