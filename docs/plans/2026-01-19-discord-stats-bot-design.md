# Discord Stats Bot Design

## Overview

Add a Discord bot to the existing Bun webserver that queries project metrics from Nhost and responds to slash commands.

## Commands

| Command | Options | Output |
|---------|---------|--------|
| `/stat` | `project` (autocomplete) | Latest likes/comments/views for that project |
| `/stat` | `total` | Aggregate across all projects (latest snapshot each) |
| `/stat-growth` | `project` (autocomplete) | Absolute delta between last 2 snapshots, averaged monthly |
| `/growth-pct` | `project` (autocomplete) | Percentage growth between last 2 snapshots, averaged monthly |

## Example Outputs

```
📊 chicken-nor-egg (Jan 15, 2026)
   Likes: 12,450
   Comments: 892
   Views: 45,200
```

```
📊 Total across 7 projects (Jan 15, 2026)
   Likes: 48,320
   Comments: 3,105
   Views: 189,400
```

```
📈 chicken-nor-egg growth (monthly avg)
   Likes: +1,230/mo
   Comments: +89/mo
   Views: +4,500/mo
   (Based on Dec 15 → Jan 15)
```

```
📈 chicken-nor-egg growth % (monthly avg)
   Likes: +10.9%/mo
   Comments: +11.1%/mo
   Views: +11.0%/mo
   (Based on Dec 15 → Jan 15)
```

## Architecture

### File Structure

```
lib/
  discord.ts      # Discord bot setup + command handlers
  nhost.ts        # (exists) - add queries for stats
server.ts         # Add bot initialization after Bun.serve()
```

### Startup Flow

The Discord bot runs in the same process as the webserver. Both are event-driven and non-blocking.

```ts
// server.ts
import { startDiscordBot } from "./lib/discord";

const server = Bun.serve({ ... });

await startDiscordBot();

console.log(`Server running at http://localhost:${server.port}`);
console.log(`Discord bot connected`);
```

### Environment Variables

Add to `.env`:

```
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_server_id  # optional, for faster dev command registration
```

Add to `.env.example`:

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
```

## GraphQL Queries

### 1. Autocomplete - Get Project Handles

```graphql
query GetProjectHandles($search: String!) {
  projects(where: { project_handle: { _ilike: $search } }, limit: 25) {
    project_handle
  }
}
```

### 2. Latest Metrics for Single Project

```graphql
query GetLatestProjectMetrics($handle: String!) {
  latest_project_metrics(where: { project_handle: { _eq: $handle } }) {
    project_handle
    scraped_at
    total_likes
    total_comments
    total_views
  }
}
```

### 3. Total Metrics Across All Projects

```graphql
query GetLatestProjectMetricsTotal {
  latest_project_metrics_aggregate {
    aggregate {
      sum {
        total_likes
        total_comments
        total_views
      }
      count
    }
  }
  latest_project_metrics(limit: 1, order_by: { scraped_at: desc }) {
    scraped_at
  }
}
```

### 4. Last Two Snapshots for Growth Calculation

```graphql
query GetLastTwoSnapshots($handle: String!) {
  project_snapshots(
    where: { project_handle: { _eq: $handle } }
    order_by: { scraped_at: desc }
    limit: 2
  ) {
    scraped_at
    total_likes
    total_comments
    total_views
  }
}
```

## Discord Bot Implementation

### Command Registration

```ts
const commands = [
  {
    name: 'stat',
    description: 'Get project statistics',
    options: [{
      name: 'project',
      description: 'Project handle or "total"',
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    }],
  },
  {
    name: 'stat-growth',
    description: 'Get monthly growth (absolute)',
    options: [{
      name: 'project',
      description: 'Project handle',
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    }],
  },
  {
    name: 'growth-pct',
    description: 'Get monthly growth (percentage)',
    options: [{
      name: 'project',
      description: 'Project handle',
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    }],
  },
];
```

### Autocomplete Handler

When user types in the project field:
1. Query `projects` table with `ILIKE %input%`
2. Return up to 25 matching handles
3. Include "total" as an option for `/stat` command

### Growth Calculation

For `/stat-growth` and `/growth-pct`:

1. Fetch last 2 snapshots for the project
2. Calculate days between snapshots
3. Calculate delta (newer - older)
4. Normalize to 30-day (monthly) average:
   - Absolute: `delta * (30 / daysBetween)`
   - Percentage: `(delta / older) * (30 / daysBetween) * 100`

## Dependencies

```bash
bun add discord.js
```

## Implementation Checklist

- [ ] Add Discord environment variables to `.env` and `.env.example`
- [ ] Install `discord.js`
- [ ] Create `lib/discord.ts` with bot setup and command handlers
- [ ] Add GraphQL query helpers to `lib/nhost.ts`
- [ ] Integrate bot startup in `server.ts`
- [ ] Register slash commands with Discord
- [ ] Test all four commands
