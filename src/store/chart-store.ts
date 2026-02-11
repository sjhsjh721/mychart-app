import { create } from "zustand";
import type { Timeframe } from "@/lib/timeframe";

export type SelectedStock = {
  code: string;
  name?: string;
  market?: string;
};

export type Period = "3M" | "6M" | "1Y" | "3Y" | "MAX";

// 기간별 데이터 개수 (일봉 기준)
export const PERIOD_COUNTS: Record<Period, number> = {
  "3M": 60,
  "6M": 120,
  "1Y": 240,
  "3Y": 720,
  MAX: 1200,
};

type ChartState = {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;

  period: Period;
  setPeriod: (p: Period) => void;

  selectedStock: SelectedStock;
  setSelectedStock: (stock: SelectedStock) => void;
};

export const useChartStore = create<ChartState>((set) => ({
  timeframe: "1D",
  setTimeframe: (tf) => set({ timeframe: tf }),

  period: "1Y",
  setPeriod: (p) => set({ period: p }),

  selectedStock: { code: "005930", name: "삼성전자", market: "KOSPI" },
  setSelectedStock: (stock) => set({ selectedStock: stock }),
}));
