"use client";

import { PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useKisQuote } from "@/features/kis/use-kis-quote";
import { StockSearchModal } from "@/features/search/components/stock-search-modal";
import { useChartStore } from "@/store/chart-store";
import { useLayoutStore } from "@/store/layout-store";
import { useSearchModalStore } from "@/store/search-modal-store";

export function AppShell({ children }: PropsWithChildren) {
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useLayoutStore();
  const selectedStock = useChartStore((s) => s.selectedStock);
  const setSelectedStock = useChartStore((s) => s.setSelectedStock);

  const openSearch = useSearchModalStore((s) => s.openModal);

  // 국내/해외 모두 실시간 quote
  const { quote } = useKisQuote({ code: selectedStock.code, enabled: true, refreshMs: 5000 });

  const handleSelectStock = (stock: { code: string; name: string }) => {
    setSelectedStock(stock);
    // 모바일에서 종목 선택 시 사이드바 닫기
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-background text-foreground">
      {/* 모바일 헤더 */}
      <header className="flex h-12 items-center gap-2 border-b px-3 md:h-14 md:gap-3 md:px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
        >
          <span className="md:hidden">☰</span>
          <span className="hidden md:inline">{sidebarCollapsed ? "→" : "←"}</span>
        </Button>

        <div className="hidden font-semibold md:block">MyChart</div>
        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

        <Button
          variant="outline"
          size="sm"
          onClick={openSearch}
          className="h-8 px-2 text-xs md:h-9 md:px-3 md:text-sm"
        >
          검색
        </Button>

        <button
          onClick={openSearch}
          className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <div className="truncate text-xs font-semibold md:text-sm">
            {selectedStock.name || selectedStock.code}
            <span className="ml-1 text-muted-foreground">▼</span>
          </div>
          {quote ? (
            <div className="truncate text-[10px] md:text-xs">
              <span
                className={quote.change && quote.change >= 0 ? "text-green-500" : "text-red-500"}
              >
                {quote.price.toLocaleString()}원
              </span>
              <span className="hidden sm:inline text-muted-foreground">
                {typeof quote.change === "number" && typeof quote.changeRate === "number"
                  ? ` ${quote.change >= 0 ? "+" : ""}${quote.change.toLocaleString()} (${quote.changeRate}%)`
                  : ""}
              </span>
            </div>
          ) : null}
        </button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs md:h-9 md:px-3"
          onClick={() => setSelectedStock({ code: "005930", name: "삼성전자", market: "KOSPI" })}
        >
          홈
        </Button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* 모바일 오버레이 */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* 사이드바 - 모바일에서는 오버레이, 데스크톱에서는 인라인 */}
        <aside
          className={
            "fixed left-0 top-12 z-30 h-[calc(100dvh-3rem)] border-r bg-background transition-transform duration-200 ease-out md:static md:z-auto md:h-auto md:translate-x-0 md:transition-[width] " +
            (sidebarCollapsed
              ? "-translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:border-r-0"
              : "w-64 translate-x-0")
          }
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-3">
              <span className="text-xs font-medium text-muted-foreground">WATCHLIST</span>
              <button
                className="text-muted-foreground md:hidden"
                onClick={() => setSidebarCollapsed(true)}
              >
                ✕
              </button>
            </div>
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
                        "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted " +
                        (active ? "bg-muted" : "")
                      }
                      onClick={() => handleSelectStock({ code: s.code, name: s.name })}
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
