
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## Dishes — edit-detection invariant

Recipes are stored as a `dish_data` JSONB blob built by `buildDishData` (`lib/dishes.ts`).

**Whenever you add a new field to a dish or an ingredient (e.g. `videoEmbeds`,
`possibleAllergens`, an ingredient `optional` flag), you MUST also add it to the
edit-detection algorithm — `DISH_EDIT_FIELDS` in `lib/dish-edit-diff.ts`.** This is part
of "adding a field," not an afterthought. If you skip it, a suggested edit (propose →
admin review) that changes ONLY that field diffs as *"No field differences from the current
recipe"* and silently looks like a no-op.

Full checklist when adding a dish/ingredient field:
1. `buildDishData` — validate + persist it (`lib/dishes.ts`)
2. **`DISH_EDIT_FIELDS` — `lib/dish-edit-diff.ts`** ← the easy-to-forget one
3. Form: type + default (`app/submit-dish/types.ts`), input control, and the submit body (`RecipeIntakeForm.tsx`)
4. Edit-mode prefill — `app/submit-dish/ingredient-format.ts`
5. Dish-page render — `app/dishes/[id]/page.jsx`

## Site nav — two implementations that must stay in sync

The emerald nav bar exists **twice**, and changing one without the other silently
drops tabs on half the site:

| File | Serves |
|---|---|
| `components/SiteNav.tsx` | every Next route (`/dishes`, `/creators`, `/eat-this`, …) |
| `public/recipes/site-nav.js` | the static SPAs in `public/` — `/top-alternatives`, `/menus`, `/tips-and-tricks` (see `STATIC_APPS` in `middleware.ts`) |

The static apps are plain HTML served by a middleware rewrite, so **`SiteNav.tsx`
never renders on them** — they build their nav from `site-nav.js` instead.

**Whenever you add, remove, or reorder a nav tab, you MUST change BOTH files.**
Four lists have to agree:

1. `CONSUMER_TABS` — both files
2. `BUSINESS_TABS` — both files
3. `CONSUMER_SECTIONS` / `BUSINESS_SECTIONS` — both files (these decide which tab
   set a signed-out visitor sees; `SiteNav.tsx` keys them off the URL segment,
   `site-nav.js` off `document.body.dataset.activeNav`)
4. The static file's entries also need an `id` matching the page's
   `data-active-nav` attribute, or that tab never highlights as active

This has already bitten once: the Creators launch added the tab to `SiteNav.tsx`
only, so `/top-alternatives` showed a nav with no Creators tab. The symptom is
subtle — the nav looks fine, it's just missing an entry, and only on the static
pages.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
