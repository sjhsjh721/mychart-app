"use client";

import { useMemo } from "react";
import { CandlestickChart } from "@/features/chart/components/candlestick-chart";
import { TimeframeSelector } from "@/features/chart/components/timeframe-selector";
import { generateSampleOhlcv } from "@/features/chart/lib/sample-data";
import { useKisCandles } from "@/features/kis/use-kis-candles";
import { useChartStore } from "@/store/chart-store";

function isDomesticCode(code: string) {
  return /^\d{6}$/.test(code);
}

export default function HomePage() {
  const timeframe = useChartStore((s) => s.timeframe);
  const setTimeframe = useChartStore((s) => s.setTimeframe);
  const selectedStock = useChartStore((s) => s.selectedStock);

  const domestic = isDomesticCode(selectedStock.code);

  const {
    candles: kisCandles,
    volume: kisVolume,
    loading,
    error,
  } = useKisCandles({
    code: selectedStock.code,
    timeframe,
    count: 240,
    enabled: domestic,
  });

  const sample = useMemo(() => generateSampleOhlcv(timeframe, 240), [timeframe]);

  const candles = domestic ? kisCandles : sample.candles;
  const volume = domestic ? kisVolume : sample.volume;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 타임프레임 선택 바 */}
      <div className="border-b px-2 py-2 md:px-4 md:py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <div className="hidden md:block">
            <div className="text-sm font-semibold">{selectedStock.code}</div>
            <div className="text-xs text-muted-foreground">
              {domestic ? (
                <>{loading ? "loading…" : error ? `error: ${error}` : "실시간 데이터"}</>
              ) : (
                <>샘플 데이터</>
              )}
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <TimeframeSelector value={timeframe} onChange={setTimeframe} />
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
