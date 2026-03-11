import { describe, it, expect } from "vitest";
import { isTimeframe, TIMEFRAMES } from "../timeframe";

describe("isTimeframe", () => {
  it("should return true for valid timeframes", () => {
    expect(isTimeframe("1m")).toBe(true);
    expect(isTimeframe("5m")).toBe(true);
    expect(isTimeframe("15m")).toBe(true);
    expect(isTimeframe("1h")).toBe(true);
    expect(isTimeframe("4h")).toBe(true);
    expect(isTimeframe("1D")).toBe(true);
    expect(isTimeframe("1W")).toBe(true);
    expect(isTimeframe("1M")).toBe(true);
  });

  it("should return false for invalid timeframes", () => {
    expect(isTimeframe("2m")).toBe(false);
    expect(isTimeframe("1d")).toBe(false); // case sensitive
    expect(isTimeframe("")).toBe(false);
    expect(isTimeframe("invalid")).toBe(false);
  });
});

describe("TIMEFRAMES", () => {
  it("should contain all valid timeframes", () => {
    expect(TIMEFRAMES).toContain("1m");
    expect(TIMEFRAMES).toContain("5m");
    expect(TIMEFRAMES).toContain("15m");
    expect(TIMEFRAMES).toContain("1h");
    expect(TIMEFRAMES).toContain("4h");
    expect(TIMEFRAMES).toContain("1D");
    expect(TIMEFRAMES).toContain("1W");
    expect(TIMEFRAMES).toContain("1M");
  });

  it("should have 8 timeframes", () => {
    expect(TIMEFRAMES).toHaveLength(8);
  });
});
