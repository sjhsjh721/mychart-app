# CHART FEATURE — Candlestick Chart + Indicators

## OVERVIEW

Core charting feature using TradingView Lightweight Charts v4. Candlestick rendering, 6 MA lines, Bollinger Bands, RSI, Ichimoku, volume. All indicator math is pure functions.

## FILES

| File                                | Lines | Role                                                                                      |
| ----------------------------------- | ----- | ----------------------------------------------------------------------------------------- |
| `components/candlestick-chart.tsx`  | 535   | **Monolith** — chart init, all series, crosshair, resize                                  |
| `components/indicator-panel.tsx`    | —     | Indicator toggle UI (popover with checkboxes)                                             |
| `components/period-selector.tsx`    | —     | Period selector (3M/6M/1Y/3Y/MAX)                                                         |
| `components/timeframe-selector.tsx` | —     | Timeframe selector (1m→1M)                                                                |
| `lib/indicators.ts`                 | —     | Pure math: `calculateSMA`, `calculateRSI`, `calculateBollingerBands`, `calculateIchimoku` |
| `lib/sample-data.ts`                | —     | Static sample candle data for dev/testing                                                 |

## CONVENTIONS

- **Indicator functions**: Pure `(candles: CandlestickData[], ...params) → LineData[]` — no side effects
- **Series management**: One `useRef` per chart series. Init all in first `useEffect([], [])`, update in second `useEffect`
- **Visibility toggle**: Third `useEffect` watches `indicators` store, calls `applyOptions({ visible })` on each series ref
- **Colors**: `MA_COLORS` map (period → hex). BB: red/indigo/green. RSI: orange. Ichimoku: red/blue/green/orange/purple
- **Scales**: RSI on `priceScaleId: "rsi"` (bottom 20%), volume on `"volume"` (bottom 25%), main candles top 72%

## ANTI-PATTERNS

- **DO NOT** add more refs to `candlestick-chart.tsx` without considering refactor — already 17 refs
- `eslint-disable-next-line react-hooks/exhaustive-deps` on init `useEffect` is **intentional** — chart must init once
- **AVOID** importing `lightweight-charts` types outside this feature — keep chart lib isolated

## ADDING A NEW INDICATOR

1. Add pure calculation function to `lib/indicators.ts`
2. Add settings interface + defaults to `src/store/indicator-store.ts`
3. In `candlestick-chart.tsx`: add ref, create series in init effect, set data in update effect, toggle visibility in third effect
4. Add toggle checkbox to `indicator-panel.tsx`

## REFACTOR OPPORTUNITY

`candlestick-chart.tsx` is the largest file (535 lines). Each indicator's ref+init+update+toggle could be extracted into custom hooks like `useMAIndicator(chart, candles)` returning nothing but managing its own series lifecycle.
