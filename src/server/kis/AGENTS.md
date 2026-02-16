# KIS API — 한국투자증권 Server Layer

## OVERVIEW

Server-only module for KIS OpenAPI. OAuth token management, HTTP abstraction, candle/quote/search endpoints. **레거시** — Yahoo Finance (`src/server/yahoo/`) is now the primary data source; this layer is fallback.

## FILES

| File             | Role                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `config.ts`      | `getKisConfig()` — reads env vars, determines enabled/mock state          |
| `auth.ts`        | `getAccessToken()` — OAuth token issue + cache with 60s refresh skew      |
| `token-store.ts` | In-memory + `.cache/kis-token.json` file-based token persistence          |
| `http.ts`        | `kisRequest<T>()` — authenticated fetch wrapper with KIS error parsing    |
| `market.ts`      | `getCandles()`, `getQuote()` — routes to Yahoo or KIS based on stock code |
| `master.ts`      | Stock master (.mst.zip) download/parse for domestic search                |
| `mock.ts`        | Random sample candles/quotes when KIS keys missing                        |
| `types.ts`       | `KisAccessToken`, `KisStock`, `KisCandle`, `KisQuote`                     |

## CONVENTIONS

- **Every file** starts with `import "server-only"` — enforced server boundary
- **Config-driven**: `getKisConfig().enabled` gates all real API calls
- **Graceful fallback**: Missing keys → mock mode, no crashes
- **Token caching**: Memory-first, file `.cache/kis-token.json` for dev persistence (ignored in prod)
- **Master cache**: `.cache/kis-domestic-master.json`, 7-day TTL, fflate for .zip decompression

## ANTI-PATTERNS

- **DO NOT** call external KIS endpoints without checking `cfg.enabled` first
- **DO NOT** import these files from client components — `server-only` will error
- **AVOID** adding new KIS-specific endpoints — prefer Yahoo Finance path in `market.ts`

## DATA FLOW

```
API Route (/api/kis/candles)
  → market.ts getCandles()
    → detects stock type (domestic 6-digit vs international)
    → domestic: KIS real API or mock
    → international: Yahoo Finance (yahoo-finance2)
```
