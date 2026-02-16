# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-16
**Commit:** a425339
**Branch:** main

## OVERVIEW

TradingView-style personal stock charting platform (Korean + international markets). Next.js 14 App Router, TypeScript strict, Tailwind + shadcn/ui, TradingView Lightweight Charts, Zustand state, Supabase backend. Deployed on Vercel.

## STRUCTURE

```
src/
├── app/                  # Next.js App Router (pages + API routes)
│   └── api/kis/          # REST endpoints: candles, quote, search
├── components/
│   ├── layout/           # AppShell (header, sidebar, main)
│   └── ui/               # shadcn/ui primitives (button, toggle, separator)
├── features/
│   ├── chart/            # Candlestick chart + indicators — see subdir AGENTS.md
│   │   ├── components/   # CandlestickChart, IndicatorPanel, selectors
│   │   └── lib/          # Indicator calculation logic, sample data
│   ├── drawing/          # M3 scaffold — drawing tools (NOT YET IMPLEMENTED)
│   ├── kis/              # Client-side data hooks (useKisCandles, useKisQuote)
│   └── search/           # Stock search modal
├── lib/
│   ├── supabase/         # Supabase client/server/middleware/types
│   ├── timeframe.ts      # Timeframe type + validator
│   └── utils.ts          # cn() utility
├── server/
│   ├── kis/              # KIS (한국투자증권) API server layer — see subdir AGENTS.md
│   └── yahoo/            # Yahoo Finance candle fetcher
└── store/                # Zustand stores — see subdir AGENTS.md
docs/                     # PRD, design spec, tickets, KIS docs, drawing plan
supabase/                 # Config + migrations
```

## WHERE TO LOOK

| Task                   | Location                                               | Notes                                                             |
| ---------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Add new page/route     | `src/app/`                                             | App Router — single `page.tsx` currently                          |
| Add API endpoint       | `src/app/api/kis/`                                     | Pattern: `route.ts` with `export const dynamic = "force-dynamic"` |
| Add UI component       | `src/components/ui/`                                   | Use `shadcn/ui` CLI: components.json configured                   |
| Add chart indicator    | `src/features/chart/lib/indicators.ts`                 | Pure calc functions, then wire in `candlestick-chart.tsx`         |
| Add feature module     | `src/features/<name>/`                                 | Barrel export via `index.ts`, co-locate components/hooks/lib      |
| Modify chart behavior  | `src/features/chart/components/candlestick-chart.tsx`  | 535-line monolith — largest file                                  |
| Add/modify store       | `src/store/`                                           | Zustand `create()` pattern, some use `persist` middleware         |
| Server-side data fetch | `src/server/`                                          | Guarded by `import "server-only"`                                 |
| Drawing tools (M3)     | `src/features/drawing/` + `src/store/drawing-store.ts` | Store scaffold exists, primitives TODO                            |
| Environment config     | `.env.local` (from `.env.local.example`)               | Supabase + KIS keys                                               |

## CONVENTIONS

- **Imports**: Use `@/*` path alias (maps to `src/*`)
- **Quotes**: Double quotes, semicolons always, trailing commas all
- **Print width**: 100 chars (Prettier enforced via ESLint)
- **Components**: `"use client"` directive on all interactive components
- **Server code**: Must use `import "server-only"` guard at top
- **State**: Zustand stores in `src/store/`, named `use<Domain>Store`
- **Data hooks**: Feature-local, named `use-kis-<thing>.ts`, use `useEffect` + fetch pattern
- **API routes**: `NextResponse.json()`, validate params inline, `export const dynamic = "force-dynamic"`
- **Dark mode**: Always-on via `<html className="dark">`, class-based Tailwind
- **shadcn/ui**: "new-york" style, Radix primitives, HSL CSS variables
- **Locale**: Korean UI text, `ko-KR` locale, `Asia/Seoul` timezone in chart formatting

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** hit external KIS master-download endpoints when keys are missing — mock/fallback instead
- **DO NOT** commit `.env.local`, KIS keys, or Supabase secrets
- **DO NOT** use `as any` or `@ts-ignore` — strict mode is on
- **AVOID** modifying `src/components/ui/` manually — these are shadcn/ui generated
- `src/server/kis/` is labeled "레거시" in README — Yahoo Finance is the primary data source now
- `eslint-disable-next-line react-hooks/exhaustive-deps` used in `candlestick-chart.tsx` — intentional (chart init once)

## MILESTONE STATUS

| Milestone      | Status        | Key Files                                       |
| -------------- | ------------- | ----------------------------------------------- |
| M1: Foundation | COMPLETE      | app-shell, candlestick-chart, KIS/Yahoo API     |
| M2: Indicators | IN PROGRESS   | indicators.ts, indicator-store, indicator-panel |
| M3: Drawing    | SCAFFOLD ONLY | drawing-store (types+CRUD), index.ts (barrel)   |
| M4: Watchlist  | NOT STARTED   | —                                               |
| M5: Polish     | NOT STARTED   | —                                               |

## COMMANDS

```bash
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint autofix
npm run format       # Prettier write
npm run format:check # Prettier check only
```

No test framework configured. No CI/CD pipelines — Vercel auto-deploys from `main`.

## NOTES

- **Single-page app**: Only one route (`/`) — all UI in `page.tsx` + `AppShell`
- **Watchlist hardcoded**: Sidebar has 3 hardcoded stocks (AAPL, TSLA, 삼성전자)
- **KIS token**: Server-side OAuth, cached in memory + `.cache/kis-token.json` (dev only)
- **Stock master**: `.cache/kis-domestic-master.json` with 7-day TTL
- **candlestick-chart.tsx is 535 lines**: Many refs for each indicator series — prime refactor target
- **No tests**: Zero test files, no test config
- **Vercel project**: `.vercel/project.json` exists for deployment binding
