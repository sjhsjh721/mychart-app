"use client";

import { useEffect, useState } from "react";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import type { Timeframe } from "@/lib/timeframe";

type ApiCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type CandlesResponse = {
  code: string;
  timeframe: Timeframe;
  candles: ApiCandle[];
};

export function useKisCandles(params: {
  code: string;
  timeframe: Timeframe;
  count?: number;
  enabled?: boolean;
}) {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const enabled = params.enabled !== false;

    if (!enabled) {
      setLoading(false);
      setError(null);
      setData([]);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const qs = new URLSearchParams({
          code: params.code,
          timeframe: params.timeframe,
        });
        if (params.count) qs.set("count", String(params.count));

        const res = await fetch(`/api/kis/candles?${qs.toString()}`, {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText} ${text}`);
        }

        const json = (await res.json()) as CandlesResponse;
        const mapped = (json.candles ?? []).map(
          (c) =>
            ({
              time: c.time as UTCTimestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }) satisfies CandlestickData,
        );

        setData(mapped);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();

    return () => {
      ac.abort();
    };
  }, [params.code, params.timeframe, params.count, params.enabled]);

  return { data, loading, error };
}
