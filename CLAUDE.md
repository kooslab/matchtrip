# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Development: `bun run dev`
- Build: `bun run build`
- Type check: `bun run check`
- Format code: `bun run format`
- Lint check: `bun run lint`
- Start production: `bun run start`
- Database:
  - Push schema changes (dev): `bun run db:push`
  - Generate migrations: `bun run db:generate`
  - Apply migrations: `bun run db:migrate`
  - Open database UI: `bun run db:studio`
- Image migration: `bun run migrate:images`

## Code Style Guidelines

- **Imports**: Group by external/internal dependencies, sort alphabetically
- **Formatting**: Uses Prettier with TailwindCSS plugin
- **TypeScript**: Strict mode enabled, prefer explicit types over `any`. Let typescript infer types when possible, don't create types for everything.
- **Naming**:
  - camelCase for variables, functions, properties
  - PascalCase for component files and classes
  - snake_case for database column names
  - plural table names in the database
- **Components**: Svelte 5 runes syntax
- **Database**: Drizzle ORM with PostgreSQL
- **Authentication**: better-auth library with session management

## Tech Stack

- 🚀 **[SvelteKit 2.0+](https://svelte.dev/docs/kit)** - Latest version
- 🔄 **[Svelte 5.0](https://svelte.dev/docs/svelte)** - With runes
- 🎨 **[TailwindCSS 4.0](https://tailwindcss.com/)** - Utility-first styling
- 🎨 **Icons**: Use custom icons from `src/lib/icons/` when available, fallback to [Lucide](https://lucide.dev/) icons
- 🎨 **[Bits-UI](https://bits-ui.com/)** - Headless UI components
- 🗃️ **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database queries and Drizzle-kit for migrations
- 🐘 **[PostgreSQL](https://www.postgresql.org/)** - Database
- 🔒 **[Better-auth](https://better-auth.com)** - Authentication system with:
  - Google OAuth integration
  - Session management
  - Rate limiting
- 📦 **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager
- 🧩 **[TypeScript](https://www.typescriptlang.org/)** - For type safety throughout the codebase
- 🧹 **[Prettier](https://prettier.io/)** - Code formatting with Tailwind plugin
- 🧪 **[Vite](https://vite.dev/)** - Build tool
- 🌐 **[Arctic](https://github.com/pilcrowOnPaper/arctic)** - OAuth 2.0 library
- 📧 **[Resend](https://resend.com/)** - Email API
- 💾 **[AWS S3](https://aws.amazon.com/s3/)** - File storage with R2 compatible API
- 🎬 **[TinyMCE](https://www.tiny.cloud/)** - Rich text editor
- 💳 **[Toss Payments](https://www.tosspayments.com/)** - Payment processing

## Project Structure

- `src/lib/server/db` - Database connection and schema
- `src/lib/auth.ts` - Better-auth configuration
- `src/routes` - SvelteKit routes
- `src/routes/(auth)` - Authentication routes
- `src/routes/(app)` - Protected app routes with layout
- `src/routes/admin` - Admin panel routes
- `src/routes/api` - API endpoints
- `src/hooks.server.ts` - Server-side hooks for auth and request handling
- `src/lib/components` - Reusable UI components
- `src/lib/utils` - Utility functions and helpers
- `src/lib/stores` - Svelte stores for state management

## Key Architecture Patterns

### Authentication Flow
The app uses better-auth with Google OAuth. Authentication state is managed through:
- Server-side session validation in `hooks.server.ts`
- Protected routes under `(app)` layout group
- Role-based access control (traveler, guide, admin)
- User profiles split between `users`, `travelerProfiles`, and `guideProfiles` tables

### Database Schema
- **Users**: Core user data with role enum (traveler/guide/admin)
- **Profiles**: Separate tables for traveler and guide specific data
- **Trips**: Trip listings created by travelers
- **Offers**: Guide offers for trips with status tracking
- **Conversations & Messages**: Real-time messaging between users
- **Payments**: Payment tracking with Toss Payments integration
- **Reviews**: Review system for completed trips

### Route Protection
- Public routes: Landing, auth pages, public profiles
- Protected routes: Under `(app)` layout, requires authentication
- Admin routes: Requires admin role, separate layout
- API routes: Use better-auth session validation

### File Storage
Uses AWS S3/R2 for file uploads with presigned URLs:
- Public bucket for profile images
- Private bucket for documents and certifications
- Image optimization and migration utilities

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for auth sessions
- `PUBLIC_BETTER_AUTH_URL` - Public URL for auth redirects
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth credentials
- `R2_*` - R2/S3 storage configuration
- `VITE_TINYMCE_API_KEY` - TinyMCE editor key

## SvelteKit Navigation Rules

- **Use SvelteKit's built-in navigation**: Prefer `<a href="/path">` or SvelteKit's `<Link>` component for client-side navigation to leverage prefetching and SPA behavior.
- **Programmatic navigation**: Use the `goto` function from `$app/navigation` for navigation in scripts or after actions (e.g., after form submission).
- **Prefetching**: Use `sveltekit:prefetch` on links to enable preloading of pages for faster navigation.
- **Avoid full page reloads**: Do not use `window.location` for internal navigation; use SvelteKit navigation utilities instead.
- **Active link styling**: Use the `$page.url` store to determine the current route and apply active styles to navigation links.
- **Nested layouts**: Organize routes with nested layouts for shared navigation bars, sidebars, or breadcrumbs.
- **Accessibility**: Ensure navigation elements are accessible (e.g., use semantic HTML, ARIA attributes as needed).
- **Scroll behavior**: SvelteKit handles scroll restoration by default, but you can customize it in `handle` hooks if needed.
- **Error boundaries**: Use `+error.svelte` files to handle navigation errors gracefully.
- **Route guards**: Protect routes using hooks or layout logic (e.g., check authentication in `+layout.server.ts`).

## Icons to Use

- Use custom icons from `src/lib/icons/` when available (designer resources)
- Fallback to lucide-svelte icons if not found in custom icons
- Additional icon libraries available: phosphor-svelte

## Common Development Tasks

### Running Tests
- Type checking: `bun run check` (runs svelte-check)
- Linting: `bun run lint` (checks Prettier formatting)
- Format code: `bun run format` (applies Prettier formatting)

### Database Operations
- View/edit data: `bun run db:studio` opens Drizzle Studio
- Schema changes: Edit files in `src/lib/server/db/schema.ts`, then run `bun run db:push` for development
- Production migrations: Generate with `bun run db:generate`, apply with `bun run db:migrate`

### Working with Authentication
- Auth configuration: `src/lib/auth.ts`
- Session handling: Managed in `src/hooks.server.ts`
- Protected routes: Place under `src/routes/(app)/`
- Auth debugging: Check `/auth-debug` route in development

## Application-Specific Context

This is a travel marketplace platform connecting travelers with local guides:
- **Travelers**: Create trip requests, browse guide offers, book experiences
- **Guides**: Browse trips, make offers, manage bookings
- **Admin**: Platform management, user verification, payment oversight

Key user flows:
1. Traveler posts trip → Guides make offers → Traveler accepts → Payment → Trip completion → Reviews
2. Role selection on first login → Profile completion → Platform access
