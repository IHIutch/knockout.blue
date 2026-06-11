# bracket.blue

World Cup 2026 knockout-bracket picks, built on the [AT Protocol](https://atproto.com). Your
bracket is a `blue.bracket.wc2026` record in **your own PDS** — this app has no database.
Anyone's bracket is viewable at `https://bracket.blue/b/<handle>`, resolved live from their
repo, with a generated social preview image of the full bracket.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, Vite) on **Cloudflare Workers**
- [atcute](https://github.com/mary-ext/atcute) — AT proto client, OAuth, identity resolution
- [takumi](https://github.com/kane50613/takumi) — OG image rendering (WASM on workerd)
- Tailwind CSS v4, Zod

## Development

```bash
npm install
npm run dev      # http://127.0.0.1:3000 — must be 127.0.0.1, NOT localhost (see OAuth notes)
npm test         # vitest: bracket derivation, schema, autopick
npm run build && npm run preview   # production build in workerd at :4173
npm run deploy   # build + wrangler deploy (requires `wrangler login`)
```

### OAuth notes

- atproto OAuth forbids `localhost` as an origin. Dev runs on `127.0.0.1` and uses the
  spec's loopback client (`client_id` literally starts with `http://localhost?...`) —
  wired up automatically in `vite.config.ts`.
- Production `client_id` is `https://bracket.blue/oauth/client-metadata.json`, served as a
  static asset from `public/`.
- `src/lib/atproto/oauth.ts` is the **only** module importing
  `@atcute/oauth-browser-client`, which is browser-only. It is loaded exclusively via
  dynamic `import()` inside effects/handlers and throws if evaluated during SSR. Keep it
  that way or the Workers build breaks.

### Pre-launch / launch day (June 27–28, 2026)

The 16 Round-of-32 matchups are unknown until the group stage ends June 27. Until then:

- `src/lib/tournament/data.ts` ships `LIVE_R32_FIELD` with `null` participants — in
  production the editor shows a "picks open June 28" banner and picking is disabled.
- In dev, `src/lib/tournament/fixture.dev.ts` supplies a plausible field so the whole
  flow works (tree-shaken out of production bundles).

**Launch is one reviewed commit**: fill `LIVE_R32_FIELD` in `data.ts` with the real 16
matchups (slot labels for each match are right there in `MATCHES`), then deploy.

### Key modules

| Path | What it is |
|---|---|
| `src/lib/tournament/data.ts` | Static truth: 48 teams, FIFA matches 73–104, venues/dates |
| `src/lib/bracket/derive.ts` | Pure picks→bracket pipeline (kept-if-valid invalidation) |
| `src/lib/bracket/schema.ts` | Zod schema for the `blue.bracket.wc2026` record |
| `src/lib/atproto/` | Identity resolution, PDS reads, OAuth boundary, publish |
| `src/lib/og/render.tsx` | takumi template for `/b/$handle/og.png` (1200×630) |
| `src/routes/b.$handle.tsx` | SSR share page with OG meta |
| `lexicons/blue.bracket.wc2026.json` | Lexicon doc (documentation; runtime uses Zod) |

### Record shape

```json
{
  "$type": "blue.bracket.wc2026",
  "schemaVersion": 1,
  "winners": { "73": "KOR", "...": "...", "104": "BRA" },
  "createdAt": "2026-06-28T…",
  "updatedAt": "2026-06-28T…"
}
```

`winners` maps FIFA match numbers (73–104, including the 3rd-place match 103) to the
picked winner's FIFA code. Partial picks are valid; picks inconsistent with upstream
picks are ignored by derivation and pruned at publish.
