import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import type { Timeframe } from "@/lib/timeframe";

const TF_TO_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 60 * 5,
  "15m": 60 * 15,
  "1h": 60 * 60,
  "1D": 60 * 60 * 24,
  "1W": 60 * 60 * 24 * 7,
  "1M": 60 * 60 * 24 * 30,
};

export function generateSampleCandles(timeframe: Timeframe, count = 200): CandlestickData[] {
  const step = TF_TO_SECONDS[timeframe];
  const now = Math.floor(Date.now() / 1000);
  const start = now - step * count;

  let price = 180;
  const data: CandlestickData[] = [];

  for (let i = 0; i < count; i++) {
    const t = (start + step * i) as UTCTimestamp;

    const volatility = timeframe === "1m" ? 0.8 : timeframe === "5m" ? 1.2 : 2;
    const drift = (Math.random() - 0.5) * 0.2;
    const move = (Math.random() - 0.5) * volatility + drift;

    const open = price;
    const close = Math.max(1, open + move);

    const high = Math.max(open, close) + Math.random() * (volatility * 0.6);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.6);

    data.push({
      time: t,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
    });

    price = close;
  }

  return data;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
