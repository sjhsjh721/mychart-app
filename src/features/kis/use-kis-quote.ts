"use client";

import { useEffect, useState } from "react";

export type KisQuote = {
  code: string;
  name?: string;
  price: number;
  change?: number;
  changeRate?: number;
  time?: string;
  raw?: unknown;
};

type QuoteResponse = {
  quote: KisQuote;
};

export function useKisQuote(params: { code: string; enabled?: boolean; refreshMs?: number }) {
  const enabled = params.enabled !== false;
  const refreshMs = params.refreshMs ?? 5000;

  const [quote, setQuote] = useState<KisQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setQuote(null);
      return;
    }

    let alive = true;
    const ac = new AbortController();

    const runOnce = async () => {
      try {
        setLoading(true);
        setError(null);

        const qs = new URLSearchParams({ code: params.code });
        const res = await fetch(`/api/kis/quote?${qs.toString()}`, {
          signal: ac.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText} ${text}`);
        }

        const json = (await res.json()) as QuoteResponse;
        if (!alive) return;
        setQuote(json.quote);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    void runOnce();
    const id = window.setInterval(() => {
      void runOnce();
    }, refreshMs);

    return () => {
      alive = false;
      ac.abort();
      window.clearInterval(id);
    };
  }, [enabled, params.code, refreshMs]);

  return { quote, loading, error };
}
