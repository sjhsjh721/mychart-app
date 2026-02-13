import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MASettings {
  enabled: boolean;
  periods: number[];
}

export interface RSISettings {
  enabled: boolean;
  period: number;
  overbought: number;
  oversold: number;
}

export interface BollingerSettings {
  enabled: boolean;
  period: number;
  stdDev: number;
}

export interface IchimokuSettings {
  enabled: boolean;
  tenkanPeriod: number;
  kijunPeriod: number;
  senkouBPeriod: number;
  displacement: number;
}

export interface VolumeSettings {
  enabled: boolean;
}

export interface IndicatorState {
  ma: MASettings;
  rsi: RSISettings;
  bollinger: BollingerSettings;
  ichimoku: IchimokuSettings;
  volume: VolumeSettings;

  setMA: (settings: Partial<MASettings>) => void;
  setRSI: (settings: Partial<RSISettings>) => void;
  setBollinger: (settings: Partial<BollingerSettings>) => void;
  setIchimoku: (settings: Partial<IchimokuSettings>) => void;
  setVolume: (settings: Partial<VolumeSettings>) => void;
  toggleIndicator: (indicator: "ma" | "rsi" | "bollinger" | "ichimoku" | "volume") => void;
}

export const useIndicatorStore = create<IndicatorState>()(
  persist(
    (set) => ({
      ma: {
        enabled: true,
        periods: [5, 20, 60, 120],
      },
      rsi: {
        enabled: true,
        period: 14,
        overbought: 70,
        oversold: 30,
      },
      bollinger: {
        enabled: true,
        period: 20,
        stdDev: 2,
      },
      ichimoku: {
        enabled: false, // 기본 꺼짐 (복잡하니까)
        tenkanPeriod: 9,
        kijunPeriod: 26,
        senkouBPeriod: 52,
        displacement: 26,
      },
      volume: {
        enabled: true,
      },

      setMA: (settings) => set((state) => ({ ma: { ...state.ma, ...settings } })),
      setRSI: (settings) => set((state) => ({ rsi: { ...state.rsi, ...settings } })),
      setBollinger: (settings) =>
        set((state) => ({ bollinger: { ...state.bollinger, ...settings } })),
      setIchimoku: (settings) => set((state) => ({ ichimoku: { ...state.ichimoku, ...settings } })),
      setVolume: (settings) => set((state) => ({ volume: { ...state.volume, ...settings } })),
      toggleIndicator: (indicator) =>
        set((state) => ({
          [indicator]: { ...state[indicator], enabled: !state[indicator].enabled },
        })),
    }),
    {
      name: "mychart-indicators",
    },
  ),
);
