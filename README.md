# SvelteKit MVP Boilerplate

A modern, full-stack SvelteKit boilerplate with Drizzle ORM, PostgreSQL, TailwindCSS, authentication and more ready to go.

## Questions? Want to contribute? Need help? Found a bug?

- Open an issue on GitHub if you found a bug
- Submit a PR if you have a fix or a feature you want to add
- Start a discussion for general questions or feedback
- Ask for help in the discussions section

## Tech Stack

- 🚀 **[SvelteKit 2.0+](https://svelte.dev/docs/kit)** - Latest version
- 🔄 **[Svelte 5.0](https://svelte.dev/docs/svelte)** - With runes
- 🎨 **[TailwindCSS 4.0](https://tailwindcss.com/)** - Utility-first styling
  - [Lucide](https://lucide.dev/) icons
  - [Shadcn-svelte](https://shadcn-svelte.com) components coming later (based on Bits-UI)
- 🎨 **[Bits-UI](https://bits-ui.com/)** - Headless UI components
- 🗃️ **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database queries and Drizzle-kit for migrations
- 🐘 **[PostgreSQL](https://www.postgresql.org/)** - Database
- 🔒 **[Better-auth](https://better-auth.com)** - Authentication system, check their docs for plugins:
  - Email/password authentication
  - Social/oauth login
  - Rate limiting
  - Handle payments andsubscriptions with Stripe or Polar
  - Organizations/teams
- 📦 **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager
- 🧩 **[TypeScript](https://www.typescriptlang.org/)** - For type safety throughout the codebase
- 🧹 **[Prettier](https://prettier.io/)** - Code formatting with Tailwind plugin
- 🧪 **[Vite](https://vite.dev/)** - Build tool

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 22+
- PostgreSQL database

### Installation

1. Clone this repository

```bash
git clone https://github.com/thomasmolorg/sveltekit-boilerplate.git
cd sveltekit-mvp-boilerplate
```

2. Install dependencies

```bash
bun install
```

3. Set up your environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and other configuration.

4. Run database migrations

```bash
bun run db:migrate
```

5. Start the development server

```bash
bun run dev
```

## Database Management

- Generate migrations: `bun run db:generate`
- Run migrations: `bun run db:migrate`
- Open Drizzle Studio: `bun run db:studio`

## Project Structure

```
├── drizzle/             # Database migrations
├── src/
│   ├── lib/             # Shared utilities and components
│   │   ├── server/      # Server-only code
│   │   │   └── db/      # Database schema and connection
│   ├── routes/          # SvelteKit routes
│   │   ├── app/         # Protected application routes
│   │   └── (auth)/      # Authentication routes
│   ├── hooks.server.ts  # SvelteKit hooks for auth and more
├── static/              # Static assets
├── drizzle.config.ts    # Drizzle ORM configuration
└── svelte.config.js     # SvelteKit configuration
```

## Authentication

This boilerplate includes a pre-configured authentication system using better-auth. It provides:

- User registration and login
- Session management
- Protected routes

## Toss Payments Webhooks

This application includes webhook integration with Toss Payments for real-time payment status updates.

### Webhook Endpoint
- **URL**: `/api/webhooks/toss`
- **Method**: POST
- **Security**: API verification (no signature needed - Toss doesn't provide webhook secrets)

### Webhook URLs

#### Production/Staging
- **URL**: `https://dev.matchtrip.net/api/webhooks/toss`

#### Local Development with zrok
For local webhook testing, use zrok to expose your localhost:

```bash
# Reserve your domain (one-time setup)
zrok reserve public localhost:5173 --unique-name trip

# Start the tunnel (every time you develop)
zrok share reserved trip
```

- **Local URL**: `https://trip.share.zrok.io/api/webhooks/toss`

### Toss Dashboard Configuration

1. Log into [Toss Payments Dashboard](https://dashboard.tosspayments.com)
2. Navigate to Webhook settings
3. Add webhook endpoints:
   - **Production**: `https://dev.matchtrip.net/api/webhooks/toss`
   - **Local Dev**: `https://trip.share.zrok.io/api/webhooks/toss`
4. Select events to receive:
   - `PAYMENT.DONE` - Payment completed
   - `PAYMENT.CANCELED` - Full refund
   - `PAYMENT.PARTIAL_CANCELED` - Partial refund
   - `PAYMENT.FAILED` - Payment failed
   - `PAYMENT.EXPIRED` - Payment expired

### Testing Webhooks Locally

Use the test endpoint to simulate webhook events:

```bash
curl -X POST http://localhost:5173/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "PAYMENT.DONE",
    "paymentKey": "your_payment_key"
  }'
```


### Database Schema

The webhook system uses these tables (already created):
- `webhook_events` - Tracks all webhook events for idempotency
- `payment_refunds` - Records individual refund transactions

## Deployment

This boilerplate can be deployed to any platform that supports SvelteKit applications:

- Vercel
- Netlify
- Cloudflare Pages
- Railway
- Fly.io
- Self-hosted with Node.js or Bun on e.g. AWS, Azure, etc.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
