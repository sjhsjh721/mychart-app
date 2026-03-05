import { describe, it, expect, beforeEach } from "vitest";
import { useChartStore, PERIOD_COUNTS } from "../chart-store";

describe("chart-store", () => {
  beforeEach(() => {
    useChartStore.setState({
      timeframe: "1D",
      period: "1Y",
      selectedStock: { code: "005930", name: "삼성전자", market: "KOSPI" },
    });
  });

  describe("timeframe", () => {
    it("should have default timeframe of 1D", () => {
      expect(useChartStore.getState().timeframe).toBe("1D");
    });

    it("should update timeframe", () => {
      useChartStore.getState().setTimeframe("1W");
      expect(useChartStore.getState().timeframe).toBe("1W");
    });
  });

  describe("period", () => {
    it("should have default period of 1Y", () => {
      expect(useChartStore.getState().period).toBe("1Y");
    });

    it("should update period", () => {
      useChartStore.getState().setPeriod("3M");
      expect(useChartStore.getState().period).toBe("3M");
    });

    it("should have correct period counts", () => {
      expect(PERIOD_COUNTS["3M"]).toBe(60);
      expect(PERIOD_COUNTS["1Y"]).toBe(240);
      expect(PERIOD_COUNTS["MAX"]).toBe(1200);
    });
  });

  describe("selectedStock", () => {
    it("should have default stock as 삼성전자", () => {
      const stock = useChartStore.getState().selectedStock;
      expect(stock.code).toBe("005930");
      expect(stock.name).toBe("삼성전자");
    });

    it("should update selected stock", () => {
      useChartStore.getState().setSelectedStock({
        code: "000660",
        name: "SK하이닉스",
        market: "KOSPI",
      });
      const stock = useChartStore.getState().selectedStock;
      expect(stock.code).toBe("000660");
      expect(stock.name).toBe("SK하이닉스");
    });

    it("should allow partial stock info", () => {
      useChartStore.getState().setSelectedStock({ code: "035720" });
      const stock = useChartStore.getState().selectedStock;
      expect(stock.code).toBe("035720");
      expect(stock.name).toBeUndefined();
    });
  });
});
