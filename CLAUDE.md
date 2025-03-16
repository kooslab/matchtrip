# CLAUDE.md - Full-stack MVP

## Commands
- Development: `bun run dev`
- Build: `bun run build`
- Type check: `bun run check`
- Format code: `bun run format`
- Lint check: `bun run lint`
- Database:
  - Push schema: `bun run db:push`
  - Generate migrations: `bun run db:generate`
  - Apply migrations: `bun run db:migrate`
  - Open database UI: `bun run db:studio`

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

## Tech stack

- 🚀 **[SvelteKit 2.0+](https://svelte.dev/docs/kit)** - Latest version
- 🔄 **[Svelte 5.0](https://svelte.dev/docs/svelte)** - With runes
- 🎨 **[TailwindCSS 4.0](https://tailwindcss.com/)** - Utility-first styling
    - [Lucide](https://lucide.dev/) icons
- 🎨 **[Bits-UI](https://bits-ui.com/)** - Headless UI components
- 🗃️ **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database queries and Drizzle-kit for migrations
- 🐘 **[PostgreSQL](https://www.postgresql.org/)** - Database
- 🔒 **[Better-auth](https://better-auth.com)** - Authentication system with:
    - Simple email/password authentication
- 📦 **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager
- 🧩 **[TypeScript](https://www.typescriptlang.org/)** - For type safety throughout the codebase
- 🧹 **[Prettier](https://prettier.io/)** - Code formatting with Tailwind plugin
- 🧪 **[Vite](https://vite.dev/)** - Build tool

## Project structure

- `src/lib/server/db` - Database connection and schema
- `src/lib/auth.ts` - Better-auth configuration
- `src/routes` - SvelteKit routes
- `src/routes/(auth)` - Authentication routes
- `src/routes/app` - Protected app routes
- `src/hooks.server.ts` - Server-side hooks
