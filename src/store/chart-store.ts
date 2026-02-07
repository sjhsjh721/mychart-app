import { create } from "zustand";
import type { Timeframe } from "@/lib/timeframe";

export type SelectedStock = {
  code: string;
  name?: string;
  market?: string;
};

type ChartState = {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;

  selectedStock: SelectedStock;
  setSelectedStock: (stock: SelectedStock) => void;
};

export const useChartStore = create<ChartState>((set) => ({
  timeframe: "1D",
  setTimeframe: (tf) => set({ timeframe: tf }),

  selectedStock: { code: "005930", name: "삼성전자", market: "KOSPI" },
  setSelectedStock: (stock) => set({ selectedStock: stock }),
}));
