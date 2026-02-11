"use client";

import { CandlestickChart } from "@/features/chart/components/candlestick-chart";
import { PeriodSelector } from "@/features/chart/components/period-selector";
import { TimeframeSelector } from "@/features/chart/components/timeframe-selector";
import { useKisCandles } from "@/features/kis/use-kis-candles";
import { PERIOD_COUNTS, useChartStore } from "@/store/chart-store";

export default function HomePage() {
  const timeframe = useChartStore((s) => s.timeframe);
  const setTimeframe = useChartStore((s) => s.setTimeframe);
  const period = useChartStore((s) => s.period);
  const setPeriod = useChartStore((s) => s.setPeriod);
  const selectedStock = useChartStore((s) => s.selectedStock);

  const count = PERIOD_COUNTS[period];

  const { candles, volume, loading, error } = useKisCandles({
    code: selectedStock.code,
    timeframe,
    count,
    enabled: true, // 국내/해외 모두 실데이터
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 타임프레임 + 기간 선택 바 */}
      <div className="border-b px-2 py-2 md:px-4 md:py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <div className="hidden md:block">
            <div className="text-sm font-semibold">{selectedStock.code}</div>
            <div className="text-xs text-muted-foreground">
              {loading ? "loading…" : error ? `error: ${error}` : "Yahoo Finance"}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
            <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            <div className="h-4 w-px bg-border hidden md:block" />
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="min-h-0 flex-1 p-2 md:p-4">
        <div className="h-full min-h-[300px] w-full rounded-lg border bg-card md:min-h-[420px]">
          <CandlestickChart candles={candles} volume={volume} />
        </div>
      </div>
    </div>
  );
}
