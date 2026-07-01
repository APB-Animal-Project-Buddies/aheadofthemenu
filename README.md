# APB Seattle

A mostly static web application for Animal Project Buddies Seattle chapter, featuring a landing page, metrics tracking system, and Discord bot integration.

## Tech Stack

### Runtime & Server
- **[Next.js](https://nextjs.org/)** - React framework with API routes
- **[Vercel](https://vercel.com/)** - Deployment platform
- **TypeScript** - Type-safe JavaScript with strict mode enabled

### Backend & Database
- **[Nhost](https://nhost.io/)** - Backend-as-a-Service platform providing:
  - **PostgreSQL** - Primary database
  - **Hasura** - GraphQL API layer with real-time subscriptions
  - **Auth** - Authentication service
  - **Storage** - S3-compatible file storage (MinIO)
  - **Functions** - Serverless functions

### Frontend
- **HTML/CSS/JS** - Static landing page served from `public/`
- **Responsive design** - CSS Grid and Flexbox

### Integrations
- **Discord.js** - Bot for serving community statistics via slash commands

## Project Structure

```
are-seattle/
├── public/
│   ├── index.html          # Landing page
│   ├── styles.css          # Landing page styles
│   ├── impact-animation.js # Client-side animations
│   └── assets/             # Images and media
├── app/
│   ├── layout.tsx          # Next.js root layout
│   ├── page.tsx            # Redirects to index.html
│   └── api/
│       ├── health/route.ts # Health check endpoint
│       ├── impact/route.ts # Impact metrics endpoint
│       └── projects/route.ts # Projects endpoint
├── functions/              # Nhost serverless functions
├── nhost/
│   ├── nhost.toml          # Nhost configuration
│   ├── migrations/         # Database migrations
│   ├── metadata/           # Hasura metadata
│   └── seeds/              # Database seeds
└── docs/
    └── plans/              # Design documents
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- [Nhost CLI](https://docs.nhost.io/development/cli) for local development
- Docker (for running local Nhost stack)

### Installation

```bash
# Install dependencies
npm install
# or
bun install

# Copy environment variables
cp .env.example .env
# Edit .env with your Nhost credentials
```

### Local Development

```bash
# Start the Nhost local development stack
nhost up

# Run the Next.js dev server
npm run dev
# or
bun run dev
```

The server runs on `http://localhost:3000` by default.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NHOST_SUBDOMAIN` | Your Nhost project subdomain |
| `NHOST_REGION` | Nhost region (e.g., `us-west-2`) |
| `NHOST_GRAPHQL_SECRET` | Hasura admin secret |
| `DISCORD_TOKEN` | Discord bot token |
| `DISCORD_CLIENT_ID` | Discord application client ID |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Landing page (static HTML) |
| `GET /api/health` | Health check |
| `GET /api/impact` | Impact metrics |
| `GET /api/projects` | Projects list |

## Deployment

### Vercel

The app is deployed to **Vercel** with Next.js:

1. Connect your repo to Vercel
2. Set environment variables in Vercel Dashboard:
   - `NHOST_SUBDOMAIN`
   - `NHOST_REGION`
   - `NHOST_GRAPHQL_SECRET`
3. Deploy - Vercel auto-detects Next.js

### Nhost (Database)

The backend database is hosted on **Nhost**, providing managed PostgreSQL and Hasura GraphQL.

## Customization

### Colors
Edit CSS variables in `public/styles.css` to change the color scheme:
```css
:root {
    --primary-color: #2d5a3d;  /* Main green */
    --accent-color: #f4a261;   /* Orange accent */
}
```

### Content
All landing page content is in `public/index.html`. Edit the text in each section to customize.

## License

Private - APB Seattle
