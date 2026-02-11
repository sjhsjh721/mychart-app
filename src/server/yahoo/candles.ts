import "server-only";

import type { Timeframe } from "@/lib/timeframe";
import type { KisCandle } from "@/server/kis/types";

import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

function normalizeYahooSymbol(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;

  // Domestic: accept both 005930 and 005930.KS
  if (/^\d{6}$/.test(trimmed)) return `${trimmed}.KS`;
  if (/^\d{6}\.KS$/i.test(trimmed)) return trimmed.toUpperCase();

  // Overseas: use as-is
  return trimmed;
}

function timeframeToYahooInterval(
  tf: Timeframe,
): NonNullable<Parameters<typeof yahooFinance.chart>[1]["interval"]> {
  switch (tf) {
    case "1m":
      return "1m";
    case "5m":
      return "5m";
    case "15m":
      return "15m";
    case "1h":
      return "1h";
    case "1D":
      return "1d";
    case "1W":
      return "1wk";
    case "1M":
      return "1mo";
    default: {
      const _exhaustive: never = tf;
      return _exhaustive;
    }
  }
}

function timeframeSeconds(tf: Timeframe): number {
  switch (tf) {
    case "1m":
      return 60;
    case "5m":
      return 5 * 60;
    case "15m":
      return 15 * 60;
    case "1h":
      return 60 * 60;
    case "1D":
      return 24 * 60 * 60;
    case "1W":
      return 7 * 24 * 60 * 60;
    case "1M":
      return 30 * 24 * 60 * 60;
  }
}

function minLookbackDays(tf: Timeframe): number {
  // When the market is closed (weekends/after hours), we still want the latest N bars.
  // So intraday queries should look back a few days at minimum.
  switch (tf) {
    case "1m":
      return 7;
    case "5m":
      return 14;
    case "15m":
      return 30;
    case "1h":
      return 90;
    default:
      return 0;
  }
}

function maxLookbackDays(tf: Timeframe): number | null {
  // Yahoo chart intraday windows are limited (varies by interval).
  // Keep a conservative cap to avoid frequent "data not available" errors.
  switch (tf) {
    case "1m":
      return 30;
    case "5m":
      return 180;
    case "15m":
      return 365;
    case "1h":
      return 730;
    default:
      return null;
  }
}

function isFiniteCandle(x: KisCandle | null): x is KisCandle {
  if (!x) return false;
  return [x.open, x.high, x.low, x.close].every((n) => Number.isFinite(n));
}

export async function getYahooQuote(code: string): Promise<{
  price: number;
  change?: number;
  changeRate?: number;
  name?: string;
}> {
  const symbol = normalizeYahooSymbol(code);
  if (!symbol) return { price: 0 };

  try {
    const result = await yahooFinance.quote(symbol);

    return {
      price: result.regularMarketPrice ?? 0,
      change: result.regularMarketChange,
      changeRate: result.regularMarketChangePercent,
      name: result.shortName || result.longName,
    };
  } catch {
    return { price: 0 };
  }
}

export async function getYahooCandles(params: {
  code: string;
  timeframe: Timeframe;
  count?: number;
}): Promise<KisCandle[]> {
  const count = params.count ?? 240;
  const interval = timeframeToYahooInterval(params.timeframe);
  const symbol = normalizeYahooSymbol(params.code);

  if (!symbol) return [];

  const nowMs = Date.now();

  // We ask for ~2x the requested window, but also enforce a minimum lookback window
  // so that intraday requests work even when the market is closed (weekends/after-hours).
  const requestedLookbackMs =
    Math.max(1, Math.ceil(count * timeframeSeconds(params.timeframe) * 2)) * 1000;
  const minLookbackMs = minLookbackDays(params.timeframe) * 24 * 60 * 60 * 1000;

  const lookbackMs = Math.max(requestedLookbackMs, minLookbackMs);
  let period1 = new Date(nowMs - lookbackMs);

  const maxDays = maxLookbackDays(params.timeframe);
  if (maxDays != null) {
    const maxMs = maxDays * 24 * 60 * 60 * 1000;
    const minAllowed = new Date(nowMs - maxMs);
    if (period1 < minAllowed) period1 = minAllowed;
  }

  const result = await yahooFinance.chart(symbol, {
    period1,
    period2: new Date(nowMs),
    interval,
    return: "object",
    includePrePost: false,
  });

  const ts = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];

  if (!quote || ts.length === 0) return [];

  const candles: KisCandle[] = ts
    .map((t, i): KisCandle | null => {
      const open = quote.open?.[i] ?? null;
      const high = quote.high?.[i] ?? null;
      const low = quote.low?.[i] ?? null;
      const close = quote.close?.[i] ?? null;
      const volume = quote.volume?.[i] ?? null;

      if (
        open == null ||
        high == null ||
        low == null ||
        close == null ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        return null;
      }

      return {
        time: t,
        open,
        high,
        low,
        close,
        volume: volume != null && Number.isFinite(volume) ? volume : undefined,
      };
    })
    .filter(isFiniteCandle)
    .sort((a, b) => a.time - b.time);

  return candles.slice(-count);
}
