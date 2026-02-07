"use client";

import { PropsWithChildren, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useKisQuote } from "@/features/kis/use-kis-quote";
import { StockSearchModal } from "@/features/search/components/stock-search-modal";
import { useChartStore } from "@/store/chart-store";
import { useLayoutStore } from "@/store/layout-store";
import { useSearchModalStore } from "@/store/search-modal-store";

function isDomesticCode(code: string) {
  return /^\d{6}$/.test(code);
}

export function AppShell({ children }: PropsWithChildren) {
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const selectedStock = useChartStore((s) => s.selectedStock);
  const setSelectedStock = useChartStore((s) => s.setSelectedStock);

  const openSearch = useSearchModalStore((s) => s.openModal);

  const domestic = useMemo(() => isDomesticCode(selectedStock.code), [selectedStock.code]);

  const { quote } = useKisQuote({ code: selectedStock.code, enabled: domestic, refreshMs: 5000 });

  return (
    <div className="flex h-dvh w-full flex-col bg-background text-foreground">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarCollapsed ? "→" : "←"}
        </Button>
        <div className="font-semibold">MyChart</div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="outline" size="sm" onClick={openSearch}>
          종목검색
        </Button>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {selectedStock.name
              ? `${selectedStock.name} (${selectedStock.code})`
              : selectedStock.code}
          </div>
          {quote ? (
            <div className="truncate text-xs text-muted-foreground">
              {quote.price.toLocaleString()}원
              {typeof quote.change === "number" && typeof quote.changeRate === "number"
                ? ` · ${quote.change >= 0 ? "+" : ""}${quote.change.toLocaleString()} (${quote.changeRate}%)`
                : ""}
            </div>
          ) : (
            <div className="truncate text-xs text-muted-foreground">M1 Foundation</div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStock({ code: "005930", name: "삼성전자", market: "KOSPI" })}
          >
            홈
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={
            "min-h-0 border-r transition-[width] duration-200 ease-out " +
            (sidebarCollapsed ? "w-14" : "w-64")
          }
        >
          <div className="flex h-full flex-col">
            <div className="p-3 text-xs font-medium text-muted-foreground">WATCHLIST</div>
            <div className="flex-1 overflow-auto px-2 pb-4">
              <div className="space-y-1">
                {[
                  { code: "AAPL", name: "AAPL" },
                  { code: "TSLA", name: "TSLA" },
                  { code: "005930", name: "삼성전자" },
                ].map((s) => {
                  const active = s.code === selectedStock.code;
                  return (
                    <button
                      key={s.code}
                      className={
                        "w-full rounded-md px-2 py-1 text-left text-sm hover:bg-muted " +
                        (active ? "bg-muted" : "")
                      }
                      onClick={() => setSelectedStock({ code: s.code, name: s.name })}
                    >
                      {s.name}
                      {s.code === "005930" ? " (005930)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>

      <StockSearchModal />
    </div>
  );
}
