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
- 🎨 **Icons**: Use custom icons from `src/lib/icons/` when available, fallback to [Lucide](https://lucide.dev/) icons
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

## Icons to use

- I will use as many as icons from `src/lib/icons` becaus these are the resource from designers.
- If not found from that local files, then use lucide-icons
