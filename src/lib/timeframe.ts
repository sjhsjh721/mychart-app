export type Timeframe = "1m" | "5m" | "15m" | "1h" | "1D" | "1W" | "1M";

export const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "1D", "1W", "1M"];

export function isTimeframe(v: string): v is Timeframe {
  return (TIMEFRAMES as string[]).includes(v);
}
