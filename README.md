# Ahead of the Menu

Plant-based recipe, dish, and menu-building app for Animal Project Buddies — a Next.js
front end backed by Nhost (PostgreSQL + Hasura GraphQL). Includes dish submission, a
community dish library, reverse-lookup, reviews, and an admin surface.

- **Runtime:** Next.js (App Router) · TypeScript · **Bun** (preferred package manager/runner)
- **Backend:** Nhost — PostgreSQL, Hasura GraphQL, Auth, Storage. Schema lives in the
  `backend_migrations` git submodule.
- **Hosting:** Vercel (frontend) · Nhost (backend)

---

## On First Clone

### 1. Clone with submodules
The backend (`backend_migrations`) is a git **submodule** — make sure it's fetched:

```bash
git clone <repo-url>
cd aheadofthemenu
git submodule update --init --recursive     # populates / updates backend_migrations/
```
If asked for GitHub username and password, [create a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) as the password.

### 2. Run the Next.js app locally

```bash
bun install                      # install deps (use Bun, not npm/yarn)
cp .env.example .env.local       # then fill it in…
bun run env:pull                 # …pull dev env from Vercel  — OR ask a maintainer for the .env file

bun run dev                      # Next dev server on http://localhost:3000
PORT=3001 bun run dev            # run on another port
bun run build                    # production build (full typecheck — good pre-push check)
```

**Testing**

```bash
bun test                         # run all tests
bun test lib/dishes.test.ts      # a single file
```

### 3. Where the data comes from

> ⚠️ **Local dev talks directly to the LIVE PRODUCTION backend.** With the default
> `.env.local`, everything you read is real prod data, and **any write — submitting a
> dish, running a seed with `--execute` — creates real production rows.** There is no
> local database unless you explicitly start one (step below).

The production project is on Nhost — log in at **https://app.nhost.io/** with the provided
credentials to view/manage it (project `are-backend`).

### 4. (Optional) Run a local Nhost stack

To develop against a **local** database instead of prod, use the Nhost CLI inside the
submodule (requires Docker):

```bash
cd backend_migrations/
nhost login
nhost config pull                # sync config from the linked cloud project (config only — not secrets)
nhost up                         # boots local Postgres + Hasura; applies migrations/metadata/seeds
nhost down --volumes             # stop and wipe the local volumes
```

Then point the app's `.env.local` at the local stack. See **Backend (Nhost)** below for
secrets and deployment details.

---

## Common Commands

| Command | What it does |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Next dev server (`:3000`) |
| `PORT=3001 bun run dev` | Dev server on another port |
| `bun run build` | Production build + full typecheck |
| `bun run start` | Serve the production build |
| `bunx tsc --noEmit` | Typecheck only |
| `bun test` | Run all tests |
| `bun run env:pull` | Pull dev env from Vercel → `.env.local` |
| `bun run vercel:sync-preview` | Push `.env.preview` → Vercel preview |
| `bun run vercel:sync-prod` | Push `.env.production` → Vercel prod |

> **Bun-first:** use `bun <file>`, `bun test`, `bunx` (not node / ts-node / npx). Bun
> auto-loads `.env.local`, so no `dotenv`. Default port `:3000` may collide with another
> local app — use `PORT=3001`.

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in (or `bun run env:pull`, or ask a maintainer).

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_NHOST_GRAPHQL_URL` | Hasura GraphQL endpoint (client-visible) |
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | Nhost project subdomain (client-visible) |
| `NEXT_PUBLIC_NHOST_REGION` | Nhost region, e.g. `us-west-2` (client-visible) |
| `NHOST_SUBDOMAIN` / `NHOST_REGION` | Server-side Nhost project coordinates |
| `NHOST_GRAPHQL_SECRET` / `NHOST_ADMIN_SECRET` | Hasura admin secret (server-side writes) |
| `NHOST_JWT_SECRET` | JWT signing secret |
| `ADMIN_SECRET` | App-level admin gate |
| `ANTHROPIC_API_KEY` | LLM recipe extraction (`/api/dishes/parse`). Optional; that feature is offline without it. |

---

## Backend (Nhost)

The database schema, Hasura metadata, seeds, and Nhost config all live in the
**`backend_migrations`** submodule — **not** in this repo. Manage them with the Nhost CLI
from inside that folder.

### Secrets

`nhost.toml` references secrets (`HASURA_GRAPHQL_ADMIN_SECRET`, `HASURA_GRAPHQL_JWT_SECRET`,
`NHOST_WEBHOOK_SECRET`, `GRAFANA_ADMIN_PASSWORD`) via a **`.secrets`** file that is
**gitignored** — a fresh clone won't have it.

```bash
cd backend_migrations/
nhost config default    # generate a local .secrets (+ default config) for local dev
nhost config show       # render config with secrets resolved — errors if any are missing
nhost secrets list      # list secret NAMES in the CLOUD project (values are write-only)
```

`nhost config pull` fetches **config only** — it does **not** pull secret values (Nhost
never hands secret values back).

### Deploying backend changes

There is **no `nhost deploy` command.** Deployment is **git-push-triggered**: pushing
migrations/metadata/config to the `backend_migrations` repo makes Nhost clone that commit
and apply migrations + metadata to the cloud project.

CLI levers:

| Command | Purpose |
|---|---|
| `nhost config apply` | Push `nhost.toml` **config** to the cloud project (config only) |
| `nhost deployments new` | `[EXPERIMENTAL]` trigger a deployment from the CLI |
| `nhost deployments list` / `logs` | Inspect cloud deployments |
| `nhost up` | Apply migrations/metadata to the **local** stack (not cloud) |

This repo also has `scripts/apply-nhost-migrations.ts` as a project-specific helper.

---

## Data & Seed Scripts

Scripts live in `scripts/` and mostly follow a **dry-run-by-default, `--execute`-to-write**
pattern (writes hit **production** — see the warning above).

```bash
bun scripts/translate-recipes-to-dishes.ts            # dry-run: /recipes content → dishes (local JSON)
bun scripts/translate-recipes-to-dishes.ts --execute  # insert into the dishes table (prod)
bun scripts/seed-reverse-lookup.ts [--execute]         # reverse-lookup catalog seed
bun scripts/seed-ingredients.ts                        # ingredient pool seed
bun scripts/apply-nhost-migrations.ts                  # apply migrations via the Hasura endpoint
```

Other helpers: `build-ingredients-seed.ts`, `assign-ingredient-allergens.ts`,
`purge-meat-ingredients.ts`, `generate-recipe-images.ts`, `wire-recipe-images.ts`,
`seed-review-sample.ts`.

---

## Project Structure

```
aheadofthemenu/
├── app/                    # Next.js App Router
│   ├── dishes/             # dish library + detail
│   ├── submit-dish/        # recipe/dish intake form
│   ├── reverse-lookup/     # reverse-lookup feature
│   ├── reviews/            # review flows
│   ├── admin/              # admin surface
│   └── api/                # route handlers (dishes, reviews, ingredients, …)
├── components/             # shared UI (SiteNav, forms, …)
├── lib/                    # domain logic (dishes, recipe-extract, nhost client, …)
├── public/                 # static assets + static mini-apps (recipes, tips-and-tricks, …)
├── scripts/                # seed / migration / data utilities
├── functions/              # Nhost serverless functions
└── backend_migrations/     # Nhost project (submodule): migrations, metadata, seeds, config
```

---

## Deployment

### Frontend — Vercel
Connect the repo to Vercel; set the environment variables above in the Vercel dashboard.
Vercel auto-detects Next.js. `env:pull` / `vercel:sync-*` scripts help keep env in sync.

### Backend — Nhost
Push to the `backend_migrations` repo to trigger a deployment (see **Backend (Nhost)**).

---

## License

Private — Animal Project Buddies
