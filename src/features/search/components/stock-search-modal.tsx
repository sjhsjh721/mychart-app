"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useChartStore, type SelectedStock } from "@/store/chart-store";
import { useSearchModalStore } from "@/store/search-modal-store";

type ApiStock = {
  code: string;
  name: string;
  market?: string;
};

type SearchResponse = {
  stocks: ApiStock[];
};

const RECENTS_KEY = "mychart:recentStocks";

const POPULAR: SelectedStock[] = [
  { code: "005930", name: "삼성전자", market: "KOSPI" },
  { code: "000660", name: "SK하이닉스", market: "KOSPI" },
  { code: "035420", name: "NAVER", market: "KOSPI" },
  { code: "035720", name: "카카오", market: "KOSPI" },
  { code: "AAPL", name: "Apple" },
  { code: "TSLA", name: "Tesla" },
  { code: "NVDA", name: "NVIDIA" },
];

function safeParseRecents(raw: string | null): SelectedStock[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: SelectedStock[] = [];

    for (const x of parsed) {
      if (!x || typeof x !== "object") continue;
      const anyX = x as Record<string, unknown>;

      const code = typeof anyX.code === "string" ? anyX.code : null;
      if (!code) continue;

      const name = typeof anyX.name === "string" ? anyX.name : undefined;
      const market = typeof anyX.market === "string" ? anyX.market : undefined;

      out.push({ code, name, market });
    }

    return out;
  } catch {
    return [];
  }
}

function pushRecent(stock: SelectedStock) {
  try {
    const prev = safeParseRecents(localStorage.getItem(RECENTS_KEY));
    const next = [stock, ...prev.filter((s) => s.code !== stock.code)].slice(0, 10);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function StockSearchModal() {
  const open = useSearchModalStore((s) => s.open);
  const closeModal = useSearchModalStore((s) => s.closeModal);

  const setSelectedStock = useChartStore((s) => s.setSelectedStock);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState<string>("");
  const [remote, setRemote] = useState<ApiStock[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<SelectedStock[]>([]);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setRemote([]);
    setLoading(false);
    setError(null);
    setRecents(safeParseRecents(localStorage.getItem(RECENTS_KEY)));

    // focus next tick
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (!q) {
      setRemote([]);
      setLoading(false);
      setError(null);
      return;
    }

    const t = window.setTimeout(() => {
      const ac = new AbortController();
      setLoading(true);
      setError(null);

      fetch(`/api/kis/search?q=${encodeURIComponent(q)}`, {
        signal: ac.signal,
        cache: "no-store",
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`${res.status} ${res.statusText} ${text}`);
          }
          return (await res.json()) as SearchResponse;
        })
        .then((json) => {
          setRemote(json.stocks ?? []);
        })
        .catch((e) => {
          if ((e as Error).name === "AbortError") return;
          setError(e instanceof Error ? e.message : String(e));
        })
        .finally(() => {
          setLoading(false);
        });

      return () => ac.abort();
    }, 180);

    return () => window.clearTimeout(t);
  }, [open, query]);

  const localMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return POPULAR.filter((s) => {
      const codeHit = s.code.toLowerCase().includes(q);
      const nameHit = (s.name ?? "").toLowerCase().includes(q);
      return codeHit || nameHit;
    });
  }, [query]);

  const mergedResults = useMemo(() => {
    const map = new Map<string, SelectedStock>();

    for (const s of localMatches) map.set(s.code, s);
    for (const s of remote) map.set(s.code, { code: s.code, name: s.name, market: s.market });

    return Array.from(map.values()).slice(0, 30);
  }, [localMatches, remote]);

  const onPick = (stock: SelectedStock) => {
    setSelectedStock(stock);
    pushRecent(stock);
    closeModal();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") closeModal();
      }}
    >
      <div
        className="w-full max-w-xl rounded-lg border bg-background shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b p-3">
          <div className="text-sm font-semibold">종목 검색</div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={closeModal}>
              닫기
            </Button>
          </div>
        </div>

        <div className="p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="종목명/코드 검색 (예: 삼성, 005930, AAPL)"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            {loading ? "검색 중…" : error ? `오류: ${error}` : ""}
          </div>
        </div>

        {recents.length > 0 && !query.trim() && (
          <section className="border-t p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">최근 검색</div>
            <div className="flex flex-wrap gap-2">
              {recents.map((s) => (
                <Button
                  key={s.code}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onPick(s)}
                >
                  {s.name ? `${s.name} (${s.code})` : s.code}
                </Button>
              ))}
            </div>
          </section>
        )}

        {!query.trim() && (
          <section className="border-t p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">인기 종목</div>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((s) => (
                <Button
                  key={s.code}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPick(s)}
                >
                  {s.name ? `${s.name} (${s.code})` : s.code}
                </Button>
              ))}
            </div>
          </section>
        )}

        {query.trim() && (
          <section className="border-t p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">검색 결과</div>
            {mergedResults.length === 0 ? (
              <div className="text-sm text-muted-foreground">결과 없음</div>
            ) : (
              <div className="max-h-[360px] overflow-auto rounded-md border">
                {mergedResults.map((s) => (
                  <button
                    type="button"
                    key={s.code}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted active:bg-muted/80"
                    onClick={() => onPick(s)}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{s.name ?? s.code}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {s.code}
                        {s.market ? ` · ${s.market}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">선택</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
