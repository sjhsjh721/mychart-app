"use client";

import { useMemo } from "react";
import { CandlestickChart } from "@/features/chart/components/candlestick-chart";
import { TimeframeSelector } from "@/features/chart/components/timeframe-selector";
import { generateSampleCandles } from "@/features/chart/lib/sample-data";
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
    data: kisData,
    loading,
    error,
  } = useKisCandles({
    code: selectedStock.code,
    timeframe,
    count: 240,
    enabled: domestic,
  });

  const sampleData = useMemo(() => generateSampleCandles(timeframe, 240), [timeframe]);

  const data = domestic ? kisData : sampleData;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{selectedStock.code}</div>
            <div className="text-xs text-muted-foreground">
              {domestic ? (
                <>
                  KIS candles via <code className="font-mono">/api/kis/candles</code> (mock
                  fallback)
                  {loading ? " · loading…" : ""}
                  {error ? ` · error: ${error}` : ""}
                </>
              ) : (
                <>Sample data (overseas integration later)</>
              )}
            </div>
          </div>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <div className="h-full min-h-[420px] w-full rounded-lg border bg-card">
          <CandlestickChart data={data} />
        </div>
      </div>
    </div>
  );
}
