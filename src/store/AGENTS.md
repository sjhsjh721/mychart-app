# STORE — Zustand State Management

## OVERVIEW

Five Zustand stores managing all client-side state. No Redux, no Context API.

## STORES

| Store                 | File                    | Persist                    | Purpose                                  |
| --------------------- | ----------------------- | -------------------------- | ---------------------------------------- |
| `useChartStore`       | `chart-store.ts`        | No                         | Selected stock, timeframe, period        |
| `useIndicatorStore`   | `indicator-store.ts`    | Yes (`mychart-indicators`) | MA/RSI/BB/Ichimoku/Volume settings       |
| `useDrawingStore`     | `drawing-store.ts`      | Yes (`mychart-drawings`)   | Drawing tools state + CRUD (M3 scaffold) |
| `useLayoutStore`      | `layout-store.ts`       | No                         | Sidebar collapsed state                  |
| `useSearchModalStore` | `search-modal-store.ts` | No                         | Search modal open/close                  |

## CONVENTIONS

- **Pattern**: `create<StateType>()` with inline state + actions
- **Naming**: `use<Domain>Store` — always a hook
- **Persist**: Use `persist` middleware for user preferences. `partialize` to exclude transient state
- **Selectors**: Consumers use `useStore((s) => s.field)` — never destructure the whole store
- **Types**: Co-locate state type + settings interfaces in same file
- **Actions**: Defined inside `create()`, not external functions

## ANTI-PATTERNS

- **DO NOT** create stores with side effects (fetching, timers) — use hooks for that
- **DO NOT** store derived data — compute via `useMemo` in components
- `drawing-store.ts` has `getDrawings()` getter — only store that uses `get()` pattern

## WHERE TO LOOK

| Task                    | File                            | Notes                                    |
| ----------------------- | ------------------------------- | ---------------------------------------- |
| Add new store           | Create `<domain>-store.ts` here | Follow `useChartStore` pattern           |
| Add persistent state    | Use `persist` middleware        | See `indicator-store.ts` for template    |
| Complex store with CRUD | See `drawing-store.ts`          | `Record<string, T[]>` keyed by stockCode |
