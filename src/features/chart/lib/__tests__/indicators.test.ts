import { describe, it, expect } from "vitest";
import {
  calculateSMA,
  calculateRSI,
  calculateBollingerBands,
  calculateIchimoku,
} from "../indicators";
import type { CandlestickData } from "lightweight-charts";

// Helper to create test candles
const createCandles = (closes: number[]): CandlestickData[] =>
  closes.map((close, i) => ({
    time: (1000000 + i) as unknown as CandlestickData["time"],
    open: close - 1,
    high: close + 2,
    low: close - 2,
    close,
  }));

describe("calculateSMA", () => {
  it("should return empty array for empty candles", () => {
    expect(calculateSMA([], 5)).toEqual([]);
  });

  it("should return empty array for invalid period", () => {
    const candles = createCandles([100, 101, 102]);
    expect(calculateSMA(candles, 0)).toEqual([]);
    expect(calculateSMA(candles, -1)).toEqual([]);
    expect(calculateSMA(candles, NaN)).toEqual([]);
  });

  it("should calculate SMA correctly for period 3", () => {
    const candles = createCandles([10, 20, 30, 40, 50]);
    const sma = calculateSMA(candles, 3);

    expect(sma).toHaveLength(3);
    expect(sma[0].value).toBe(20); // (10+20+30)/3
    expect(sma[1].value).toBe(30); // (20+30+40)/3
    expect(sma[2].value).toBe(40); // (30+40+50)/3
  });

  it("should handle period equal to candle length", () => {
    const candles = createCandles([10, 20, 30]);
    const sma = calculateSMA(candles, 3);

    expect(sma).toHaveLength(1);
    expect(sma[0].value).toBe(20); // (10+20+30)/3
  });
});

describe("calculateRSI", () => {
  it("should return empty array for insufficient data", () => {
    const candles = createCandles([100, 101, 102]);
    expect(calculateRSI(candles, 14)).toEqual([]);
  });

  it("should return empty array for empty candles", () => {
    expect(calculateRSI([], 14)).toEqual([]);
  });

  it("should calculate RSI values between 0 and 100", () => {
    // Create candles with alternating up/down movement
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 10);
    const candles = createCandles(closes);
    const rsi = calculateRSI(candles, 14);

    expect(rsi.length).toBeGreaterThan(0);
    rsi.forEach((point) => {
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeLessThanOrEqual(100);
    });
  });

  it("should return RSI near 100 for continuous gains", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const candles = createCandles(closes);
    const rsi = calculateRSI(candles, 14);

    // With all gains, RSI should be very high
    expect(rsi[rsi.length - 1].value).toBeGreaterThan(90);
  });
});

describe("calculateBollingerBands", () => {
  it("should return empty bands for insufficient data", () => {
    const candles = createCandles([100, 101, 102]);
    const bands = calculateBollingerBands(candles, 20);

    expect(bands.upper).toEqual([]);
    expect(bands.middle).toEqual([]);
    expect(bands.lower).toEqual([]);
  });

  it("should calculate bands with correct structure", () => {
    const closes = Array.from({ length: 25 }, (_, i) => 100 + i);
    const candles = createCandles(closes);
    const bands = calculateBollingerBands(candles, 20, 2);

    expect(bands.upper.length).toBe(bands.middle.length);
    expect(bands.middle.length).toBe(bands.lower.length);
    expect(bands.upper.length).toBe(6); // 25 - 20 + 1
  });

  it("should have upper > middle > lower", () => {
    const closes = Array.from({ length: 25 }, () => 100 + Math.random() * 10);
    const candles = createCandles(closes);
    const bands = calculateBollingerBands(candles, 20, 2);

    for (let i = 0; i < bands.middle.length; i++) {
      expect(bands.upper[i].value).toBeGreaterThan(bands.middle[i].value);
      expect(bands.middle[i].value).toBeGreaterThan(bands.lower[i].value);
    }
  });
});

describe("calculateIchimoku", () => {
  it("should return empty for insufficient data", () => {
    const candles = createCandles([100, 101, 102]);
    const ichimoku = calculateIchimoku(candles);

    expect(ichimoku.tenkanSen).toEqual([]);
    expect(ichimoku.kijunSen).toEqual([]);
    expect(ichimoku.senkouSpanA).toEqual([]);
    expect(ichimoku.senkouSpanB).toEqual([]);
    expect(ichimoku.chikouSpan).toEqual([]);
  });

  it("should calculate all components for sufficient data", () => {
    const closes = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 20);
    const candles = createCandles(closes);
    const ichimoku = calculateIchimoku(candles, 9, 26, 52, 26);

    expect(ichimoku.tenkanSen.length).toBeGreaterThan(0);
    expect(ichimoku.kijunSen.length).toBeGreaterThan(0);
    expect(ichimoku.senkouSpanA.length).toBeGreaterThan(0);
    expect(ichimoku.senkouSpanB.length).toBeGreaterThan(0);
    expect(ichimoku.chikouSpan.length).toBeGreaterThan(0);
  });

  it("should calculate tenkan-sen as 9-period high-low average", () => {
    // All same price = tenkan should equal that price
    const candles = createCandles(Array(20).fill(100));
    // Override high/low to be consistent
    candles.forEach((c) => {
      c.high = 105;
      c.low = 95;
    });

    const ichimoku = calculateIchimoku(candles, 9, 26, 52, 26);

    // Tenkan should be (105 + 95) / 2 = 100
    ichimoku.tenkanSen.forEach((point) => {
      expect(point.value).toBe(100);
    });
  });
});
