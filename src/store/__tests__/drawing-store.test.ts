import { describe, it, expect, beforeEach } from "vitest";
import {
  useDrawingStore,
  createDrawingId,
  type HorizontalLineDrawing,
  type TrendLineDrawing,
} from "../drawing-store";

const createHorizontalLine = (price: number): HorizontalLineDrawing => ({
  id: createDrawingId(),
  type: "horizontal-line",
  price,
  style: { color: "#2962FF", lineWidth: 2, lineStyle: "solid" },
  visible: true,
  locked: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const createTrendLine = (): TrendLineDrawing => ({
  id: createDrawingId(),
  type: "trend-line",
  startPoint: { time: 1000, price: 100 },
  endPoint: { time: 2000, price: 150 },
  style: { color: "#FF0000", lineWidth: 2, lineStyle: "solid" },
  visible: true,
  locked: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe("drawing-store", () => {
  beforeEach(() => {
    useDrawingStore.setState({
      activeTool: null,
      selectedId: null,
      drawings: {},
      isDrawing: false,
      tempPoints: [],
      defaultStyle: {
        color: "#2962FF",
        lineWidth: 2,
        lineStyle: "solid",
        fillColor: "#2962FF",
        fillOpacity: 0.1,
      },
    });
  });

  describe("activeTool", () => {
    it("should set active tool", () => {
      useDrawingStore.getState().setActiveTool("horizontal-line");
      expect(useDrawingStore.getState().activeTool).toBe("horizontal-line");
    });

    it("should clear selectedId when setting tool", () => {
      useDrawingStore.setState({ selectedId: "some-id" });
      useDrawingStore.getState().setActiveTool("trend-line");
      expect(useDrawingStore.getState().selectedId).toBeNull();
    });

    it("should clear active tool", () => {
      useDrawingStore.getState().setActiveTool("fib-retracement");
      useDrawingStore.getState().setActiveTool(null);
      expect(useDrawingStore.getState().activeTool).toBeNull();
    });
  });

  describe("selectDrawing", () => {
    it("should select a drawing", () => {
      useDrawingStore.getState().selectDrawing("drawing-123");
      expect(useDrawingStore.getState().selectedId).toBe("drawing-123");
      expect(useDrawingStore.getState().activeTool).toBe("select");
    });

    it("should deselect when passing null", () => {
      useDrawingStore.getState().selectDrawing("drawing-123");
      useDrawingStore.getState().selectDrawing(null);
      expect(useDrawingStore.getState().selectedId).toBeNull();
      expect(useDrawingStore.getState().activeTool).toBeNull();
    });
  });

  describe("drawing CRUD", () => {
    const stockCode = "005930";

    it("should add drawing", () => {
      const drawing = createHorizontalLine(75000);
      useDrawingStore.getState().addDrawing(stockCode, drawing);

      const drawings = useDrawingStore.getState().getDrawings(stockCode);
      expect(drawings).toHaveLength(1);
      expect(drawings[0].type).toBe("horizontal-line");
    });

    it("should add multiple drawings", () => {
      useDrawingStore.getState().addDrawing(stockCode, createHorizontalLine(75000));
      useDrawingStore.getState().addDrawing(stockCode, createHorizontalLine(80000));
      useDrawingStore.getState().addDrawing(stockCode, createTrendLine());

      expect(useDrawingStore.getState().getDrawings(stockCode)).toHaveLength(3);
    });

    it("should update drawing", () => {
      const drawing = createHorizontalLine(75000);
      useDrawingStore.getState().addDrawing(stockCode, drawing);

      useDrawingStore.getState().updateDrawing(stockCode, drawing.id, {
        style: { ...drawing.style, color: "#FF0000" },
      });

      const updated = useDrawingStore.getState().getDrawings(stockCode)[0];
      expect(updated.style.color).toBe("#FF0000");
    });

    it("should delete drawing", () => {
      const drawing = createHorizontalLine(75000);
      useDrawingStore.getState().addDrawing(stockCode, drawing);
      useDrawingStore.getState().deleteDrawing(stockCode, drawing.id);

      expect(useDrawingStore.getState().getDrawings(stockCode)).toHaveLength(0);
    });

    it("should clear selectedId when deleting selected drawing", () => {
      const drawing = createHorizontalLine(75000);
      useDrawingStore.getState().addDrawing(stockCode, drawing);
      useDrawingStore.getState().selectDrawing(drawing.id);

      useDrawingStore.getState().deleteDrawing(stockCode, drawing.id);
      expect(useDrawingStore.getState().selectedId).toBeNull();
    });

    it("should clear all drawings for a stock", () => {
      useDrawingStore.getState().addDrawing(stockCode, createHorizontalLine(75000));
      useDrawingStore.getState().addDrawing(stockCode, createHorizontalLine(80000));

      useDrawingStore.getState().clearDrawings(stockCode);
      expect(useDrawingStore.getState().getDrawings(stockCode)).toHaveLength(0);
    });

    it("should keep drawings separate per stock", () => {
      useDrawingStore.getState().addDrawing("005930", createHorizontalLine(75000));
      useDrawingStore.getState().addDrawing("000660", createHorizontalLine(180000));

      expect(useDrawingStore.getState().getDrawings("005930")).toHaveLength(1);
      expect(useDrawingStore.getState().getDrawings("000660")).toHaveLength(1);
    });
  });

  describe("drawing state", () => {
    it("should set isDrawing", () => {
      useDrawingStore.getState().setIsDrawing(true);
      expect(useDrawingStore.getState().isDrawing).toBe(true);
    });

    it("should add temp points", () => {
      useDrawingStore.getState().addTempPoint({ time: 1000, price: 100 });
      useDrawingStore.getState().addTempPoint({ time: 2000, price: 150 });

      expect(useDrawingStore.getState().tempPoints).toHaveLength(2);
    });

    it("should clear temp points", () => {
      useDrawingStore.getState().addTempPoint({ time: 1000, price: 100 });
      useDrawingStore.getState().clearTempPoints();

      expect(useDrawingStore.getState().tempPoints).toHaveLength(0);
    });
  });

  describe("defaultStyle", () => {
    it("should update default style partially", () => {
      useDrawingStore.getState().setDefaultStyle({ color: "#FF0000" });

      const style = useDrawingStore.getState().defaultStyle;
      expect(style.color).toBe("#FF0000");
      expect(style.lineWidth).toBe(2); // unchanged
    });

    it("should update multiple style properties", () => {
      useDrawingStore.getState().setDefaultStyle({
        color: "#00FF00",
        lineWidth: 4,
        lineStyle: "dashed",
      });

      const style = useDrawingStore.getState().defaultStyle;
      expect(style.color).toBe("#00FF00");
      expect(style.lineWidth).toBe(4);
      expect(style.lineStyle).toBe("dashed");
    });
  });

  describe("getDrawings", () => {
    it("should return empty array for unknown stock", () => {
      expect(useDrawingStore.getState().getDrawings("UNKNOWN")).toEqual([]);
    });
  });

  describe("createDrawingId", () => {
    it("should create unique ids", () => {
      const id1 = createDrawingId();
      const id2 = createDrawingId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^drawing-\d+-[a-z0-9]+$/);
    });
  });
});
