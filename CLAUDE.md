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

- **DRY Principle (CRITICAL)**: ALWAYS follow Don't Repeat Yourself
  - If code appears more than once, create a reusable component immediately
  - Extract repeated logic into functions, components, or utilities
  - Never duplicate code - always look for opportunities to componentize
  - When similar UI patterns appear, create a shared component in `src/lib/components/`
- **SOLID Principles**:
  - **Single Responsibility**: Each function/component should have one clear purpose
  - **Open/Closed**: Code should be open for extension but closed for modification
  - **Liskov Substitution**: Derived classes must be substitutable for their base classes
  - **Interface Segregation**: Prefer many specific interfaces over one general interface
  - **Dependency Inversion**: Depend on abstractions, not concrete implementations
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
- use svelte 5 and runes always. Use onclick and runes.
- use $props() instead of export let, use onclick instead of on:click
- use tailwindcss all the time

## User Data Encryption

**⚠️ IMPORTANT: User PII Encryption Status ⚠️**

In the users table, the following fields are encrypted:
- `name` - **ENCRYPTED** (use `encrypt()` when writing, `decrypt()` when reading)
- `phone` - **ENCRYPTED** (use `encrypt()` when writing, `decrypt()` when reading)  
- `email` - **NOT ENCRYPTED** (store and read directly, no encryption/decryption needed)

Example when handling user data:
```typescript
// When storing user data
const userData = {
  name: encrypt(name),      // Encrypt name
  email: email,            // Email is NOT encrypted
  phone: encrypt(phone)    // Encrypt phone
}

// When reading user data
const decryptedUser = {
  name: decrypt(user.name),    // Decrypt name
  email: user.email,           // Email is NOT encrypted
  phone: decrypt(user.phone)   // Decrypt phone
}
```

## Typography System

### Font Family

- **Primary Font**: Pretendard (already configured in app.css)
- **Font Weights**: Bold (700), SemiBold (600), Medium (500), Regular (400)

### Color Usage

- **Primary Text**: Use `text-primary` (--color-text-primary: #052236)
- **Secondary Text**: Use `text-secondary` (--color-text-secondary: #666666)
- **Brand Colors**: `text-color-primary` (#1095f4), `text-color-secondary` (#8ea0ac)
- **Alert Colors**: `text-color-success` (#19b989), `text-color-error` (#f72b2b)

### Typography Classes

- **Headings**: h1-h6 are styled by default
- **Body Text**:
  - `.text-body-large` (13px/20px)
  - `.text-body-medium` (12px/18px) - default
  - `.text-body-small` (11px/16px)
  - `.text-body-xsmall` (10px/12px)
  - `.text-label` (9px/12px, semibold)
- **Font Weights**: `.font-bold`, `.font-semibold`, `.font-medium`, `.font-regular`

### Spacing System

- Uses 8-point grid system with 4pt for small elements
- Spacing utilities: `.spacing-4` through `.spacing-40`
- CSS variables: `--spacing-4` through `--spacing-40`

### Background Colors

- `.bg-primary`, `.bg-secondary`, `.bg-light`, `.bg-white`
- `.bg-gray-f1`, `.bg-gray-f7`

### Border Colors

- `.border-gray-e1`, `.border-gray-c8`

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

- **IMPORTANT POLICY**: ALL files MUST be uploaded to the PRIVATE bucket (R2_BUCKET_NAME)
- **DO NOT USE PUBLIC BUCKET** - It's deprecated and should never be used
- All files served through `/api/images/` endpoint with authentication
- Presigned URLs generated on-demand with 1-hour expiration
- Files organized in folders: content/, product_attachment/, guide-profile/, etc.
- See STORAGE_POLICY.md for complete storage rules and exceptions (currently: NONE)

## Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for auth sessions
- `PUBLIC_BETTER_AUTH_URL` - Public URL for auth redirects
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth credentials
- `R2_*` - R2/S3 storage configuration

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

## Modal Implementation Rules

### CRITICAL: Modal Structure Requirements

When creating ANY modal in the application, follow these rules:

1. **Use Svelte 5 State Management**:
   - ALWAYS use `$state()` for modal visibility and data
   - Example: `let showModal = $state(false)` NOT `let showModal = false`

2. **Modal Structure Pattern**:
   ```svelte
   {#if showModal}
     <!-- Backdrop - separate element -->
     <div class="fixed inset-0 bg-black/50 z-40" onclick={closeModal}></div>
     
     <!-- Modal Content - separate element at same level -->
     <div class="fixed [position] z-50">
       <!-- Modal content here -->
     </div>
   {/if}
   ```

3. **Z-Index Layering**:
   - Backdrop: `z-40` or `z-[40]`
   - Modal content: `z-50` or `z-[50]`
   - Higher priority modals: `z-[60]`, `z-[70]` etc.

4. **Background Opacity**:
   - Use Tailwind's modern syntax: `bg-black/50` NOT `bg-opacity-50`
   - Standard opacity: `/50` for 50% opacity
   - Light overlay: `/10` or `/20` for subtle overlays

5. **Bottom Sheet Modals** (Mobile):
   ```svelte
   <div class="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-w-md mx-auto z-50">
   ```

6. **Right-Side Slide Modals** (Admin):
   ```svelte
   <div class="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
   ```

7. **Center Modals**:
   ```svelte
   <div class="fixed inset-0 flex items-center justify-center z-50">
     <div class="bg-white rounded-lg max-w-md w-full mx-4">
   ```

8. **NEVER**:
   - Don't nest the backdrop inside wrapper divs
   - Don't use `bg-opacity-X` classes (use `/X` syntax)
   - Don't forget to use `$state()` for reactive variables
   - Don't use transform classes unnecessarily

## UI Layout Rules

### CRITICAL: Mobile Viewport Constraints

- **ALWAYS wrap ALL pages in a mobile viewport container**: `<div class="max-w-md mx-auto">`
  - This is MANDATORY for every single page component
  - Apply to the outermost wrapper div of every route
  - Never allow content to extend beyond mobile viewport width
  - Example structure:
    ```svelte
    <div class="min-h-screen bg-white">
    	<div class="relative mx-auto max-w-md">
    		<!-- All page content goes here -->
    	</div>
    </div>
    ```

### Fixed Elements and Mobile Viewport

- **Fixed bottom elements MUST also respect mobile viewport**:
  ```svelte
  <div class="fixed right-0 bottom-0 left-0">
  	<div class="mx-auto max-w-md">
  		<!-- Fixed content here -->
  	</div>
  </div>
  ```
- **Fixed headers MUST also respect mobile viewport**:
  ```svelte
  <div class="sticky top-0 z-10">
  	<div class="mx-auto max-w-md">
  		<!-- Header content -->
  	</div>
  </div>
  ```

### Bottom Navigation Spacing

- **Bottom Navigation Spacing**: ALWAYS add `pb-24` (96px bottom padding) to any fixed bottom elements when BottomNav is present
  - Apply to action buttons, floating buttons, or any fixed bottom UI elements
  - This prevents the BottomNav from covering important UI elements
  - Example: `<div class="fixed bottom-0 left-0 right-0 p-4 pb-24">`

### Mobile-First Design Principles

- Design for mobile viewport (390px - 430px) FIRST
- Test all UI components within max-w-md container
- Never use fixed widths larger than mobile viewport
- Always use responsive units (%, rem, viewport units) within the container

## Icons to Use

- **ALWAYS** check `src/lib/icons/` FIRST for any icon needs
- Only use lucide-svelte icons if the required icon is not found in custom icons
- Additional icon libraries available: phosphor-svelte (use only as last resort)
- When an icon is needed, ask the user if they want to use an alternative if not found in custom icons

## Rich Text Editor Component

- **IMPORTANT**: We have a reusable `RichTextEditor` component at `src/lib/components/RichTextEditor.svelte`
- **Always use this component** instead of TinyMCE or creating custom contenteditable implementations
- Features:
  - Contenteditable div with rich text editing
  - Built-in image upload with drag & drop
  - Customizable placeholder, height, and helper text
  - Auto-saves with 300ms debounce
  - Responsive image handling
- Usage example:
  ```svelte
  <RichTextEditor
  	value={content}
  	onchange={(newContent) => (content = newContent)}
  	placeholder="Enter content..."
  	minHeight="300px"
  	showImageButton={true}
  	showHelperText={true}
  />
  ```

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

## Kakao AlimTalk Integration

### Template Code Environment Selection

The application automatically selects the correct Kakao AlimTalk template codes based on the environment:

- **Development (default)**: Uses `testcodeXX` templates (e.g., `testcode21`, `testcode23`)
- **Production**: Uses `codeXX` templates (e.g., `code01`, `code23`)

**Configuration:**
- Development: No configuration needed (default behavior)
- Production: Must set `NODE_ENV=production` environment variable

The template selection is handled in `src/lib/server/kakao/templateHelper.ts` which checks `NODE_ENV` to determine the environment. When `NODE_ENV=production`, production template codes are automatically used.

### Template Code Updates (As of 2025-08-25)

**Important:** Several template codes have been deprecated and replaced with new ones:

#### Deprecated Template Codes (DO NOT USE):
- `testcode01` → Use `testcode21` (traveler signup)
- `testcode03` → Use `testcode23` (trip registration)
- `testcode04` → Use `testcode24` (guide offer arrival)
- `testcode06` → Use `testcode26` (payment completion)
- `testcode09` → Use `testcode29` (guide offer registration)

#### Active Template Codes:

**Development Environment:**
- `testcode21` - Traveler signup welcome
- `testcode02` - Guide signup welcome
- `testcode23` - Trip registration confirmation
- `testcode24` - Guide offer arrival notification
- `testcode05` - Guide reply to traveler
- `testcode26` - Payment completion
- `testcode07` - Trip reminder for traveler
- `testcode08` - CS inquiry registration
- `testcode29` - Guide offer registration
- `testcode10` - Traveler inquiry to guide
- `testcode11` - Offer acceptance notification
- `testcode12` - Trip reminder for guide
- `testcode13` - Customer cancellation request
- `testcode14` - Customer cancellation notification to guide
- `testcode15` - Guide cancellation request
- `testcode16` - Guide cancellation notification to customer
- `testcode17` - Customer cancellation completion
- `testcode18` - Customer cancellation completion to guide
- `testcode19` - Guide cancellation completion
- `testcode20` - Guide cancellation completion to customer

**Production Environment:**
- `code01` - Traveler signup welcome
- `code02` - Guide signup welcome
- `code23` - Trip registration confirmation
- `code24` - Guide offer arrival notification
- `code05` - Guide reply to traveler
- `code26` - Payment completion
- `code07` - Trip reminder for traveler
- `code08` - CS inquiry registration
- `code29` - Guide offer registration
- `code10` - Traveler inquiry to guide
- `code11` - Offer acceptance notification
- `code12` - Trip reminder for guide
- `code13` - Customer cancellation request
- `code14` - Customer cancellation notification to guide
- `code15` - Guide cancellation request
- `code16` - Guide cancellation notification to customer
- `code17` - Customer cancellation completion
- `code18` - Customer cancellation completion to guide
- `code19` - Guide cancellation completion
- `code20` - Guide cancellation completion to customer

### CRITICAL: Implementation Rules (Based on Trial & Error)

**Template Management:**

- Templates are stored in `src/lib/server/kakao/templates.json` with dev/prod environments
- Each template is pre-registered and approved by Kakao - you CANNOT modify template structure
- Template codes must match EXACTLY what's registered (e.g., `testcode01`, not `1`)

**API Request Structure:**

- Service implementation: `src/lib/server/kakao/kakaoAlimTalk.ts`
- Endpoint: `https://[base_url]/kakao-alim/1/messages`
- Required headers: `Authorization: App [API_KEY]`, `Content-Type: application/json`

**Template Variables:**

- Variables use `#{VARIABLE_NAME}` format in templates
- Variables MUST be replaced in the text before sending - the API does NOT accept a `templateData` field
- Replacement happens server-side in the service layer
- Example: `#{NAME}` → `홍길동`, `#{SHOPNAME}` → `매치트립`

**Button Configuration:**

- Buttons must match EXACTLY what was registered with the template
- Button structure:
  ```json
  {
  	"type": "URL",
  	"name": "나의프로필보기", // MUST match registered button name
  	"urlMobile": "https://...",
  	"urlPc": "https://..."
  }
  ```
- Button name mismatch will cause `EC_INVALID_TEMPLATE` error

**Common Errors:**

- `EC_INVALID_TEMPLATE` (7009): Template structure mismatch or button configuration doesn't match registration
- `EC_INVALID_TEMPLATE_ARGS` (7008): Missing or invalid template parameters

**Request Body Example:**

```json
{
	"messages": [
		{
			"sender": "KAKAO_CHANNEL_PROFILE_KEY",
			"destinations": [{ "to": "821012345678" }],
			"content": {
				"templateCode": "testcode01",
				"text": "[매치트립], 안녕하세요. 홍길동님! 매치트립에 회원가입 해주셔서 진심으로 감사드립니다!",
				"type": "TEMPLATE",
				"buttons": [
					{
						"type": "URL",
						"name": "나의프로필보기",
						"urlMobile": "https://dev.matchtrip.net/profile/traveler",
						"urlPc": "https://dev.matchtrip.net/profile/traveler"
					}
				]
			}
		}
	]
}
```

**Environment Variables Required:**

- `INFOBIP_API_KEY`: API authentication key
- `INFOBIP_BASE_URL`: Base URL for Infobip API
- `KAKAO_CHANNEL_PROFILE_KEY`: Your Kakao channel identifier
- `NODE_ENV=production`: **Required in production only** to use production template codes (codeXX instead of testcodeXX)

## Toss Payments Webhooks

### Overview

The application uses Toss Payments webhooks to receive real-time payment status updates. Unlike many payment providers, Toss does NOT provide webhook secrets or signatures.

**IMPORTANT**: This is the ONLY webhook endpoint for Toss Payments. Both main app and admin-initiated payments/refunds are processed here to prevent duplicate processing.

### Security Model

- **No webhook secret**: Toss doesn't provide webhook secrets in their dashboard
- **API verification**: Each webhook event is verified by calling Toss API to confirm the payment status
- **Idempotency**: Events are tracked in `webhook_events` table to prevent duplicate processing

### Webhook Endpoint

- **Location**: `/api/webhooks/toss/+server.ts`
- **Production URL**: `https://dev.matchtrip.net/api/webhooks/toss` (register ONLY this URL with Toss)
- **Local Dev URL**: `https://trip.share.zrok.io/api/webhooks/toss`
- **Admin App**: Does NOT have its own webhook endpoint - all webhooks come here
- **Events handled**:
  - `PAYMENT.DONE` - Payment completion
  - `PAYMENT.CANCELED` - Full cancellation/refund (including admin-initiated)
  - `PAYMENT.PARTIAL_CANCELED` - Partial refund (including admin-initiated)
  - `PAYMENT.FAILED` - Payment failure
  - `PAYMENT.EXPIRED` - Payment expiration

### Local Development Setup

1. **Start zrok tunnel**:

```bash
# One-time reservation
zrok reserve public localhost:5173 --unique-name trip

# Start tunnel (every dev session)
zrok share reserved trip
```

2. **Configure in Toss Dashboard**:

- Production: `https://dev.matchtrip.net/api/webhooks/toss`
- Local Dev: `https://trip.share.zrok.io/api/webhooks/toss`
- Select all payment events
- No secret to copy (Toss doesn't provide one)

3. **Test webhooks**:

```bash
# Use test endpoint
curl -X POST http://localhost:5173/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"eventType":"PAYMENT.DONE","paymentKey":"test_key"}'
```

### Database Tables

- **webhook_events**: Tracks all webhook events (shared with admin app)
  - `eventId` (unique) - Prevents duplicate processing
  - `status` - pending/processed/failed
  - `payload` - Full webhook data
- **payment_refunds**: Individual refund transactions
  - Links to payments table
  - Tracks refund type, amount, reason
  - Includes admin-initiated refunds

### Implementation Notes

- **Single Webhook**: Processes payments/refunds from BOTH main app and admin app
- **Shared Database**: Both apps use the same database tables
- **No Duplicate Endpoints**: Admin app does NOT have its own webhook
- Uses database transactions for consistency
- Returns 200 OK even on processing errors (handles retries internally)
- Verifies payment status with Toss API before processing
- Handles admin-initiated refunds automatically when Toss sends the webhook

## OAuth Profile Images

### Google OAuth Profile Images

#### Issue
Google OAuth profile images are sometimes stored without the protocol prefix (e.g., `ACg8ocI2_O3-x_nW_Ya1EG7DzUGrSop6Q_YPqjjB7-ghNcuo1E-g5QM=s96-c`), which causes 400 Bad Request errors when the browser tries to load them.

#### Solution
The `transformImageUrl` utility in `src/lib/utils/imageUrl.ts` handles this by:

1. Detecting Google profile image IDs (pattern: `[A-Za-z0-9_-]+=s\d+-c`)
2. Constructing the proper URL format: `https://lh3.googleusercontent.com/a/[ENCODED_ID]`
3. URL-encoding the image ID to handle special characters like `=`

### Kakao OAuth Profile Images

#### TODO: Implementation Needed
Kakao OAuth profile images need special handling similar to Google OAuth images.

**Known Issues:**
- (To be documented when Kakao login is implemented)

**Solution:**
- (To be implemented in `transformImageUrl` utility)

**Pattern Detection:**
- (To be determined based on Kakao's image URL format)

### Implementation Notes

- Always use `transformImageUrl()` when displaying user profile images
- This utility handles all OAuth provider image URLs (Google, Kakao, etc.)
- Already integrated in chat pages and API endpoints that return user data

## Application-Specific Context

This is a travel marketplace platform connecting travelers with local guides:

- **Travelers**: Create trip requests, browse guide offers, book experiences
- **Guides**: Browse trips, make offers, manage bookings
- **Admin**: Platform management, user verification, payment oversight

Key user flows:

1. Traveler posts trip → Guides make offers → Traveler accepts → Payment → Trip completion → Reviews
2. Role selection on first login → Profile completion → Platform access
