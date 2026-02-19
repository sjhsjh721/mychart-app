"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  LineWidth,
  MouseEventParams,
} from "lightweight-charts";
import {
  useDrawingStore,
  createDrawingId,
  type HorizontalLineDrawing,
} from "@/store/drawing-store";

interface UseDrawingOptions {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  stockCode: string;
}

export function useDrawing({ chart, series, stockCode }: UseDrawingOptions) {
  const { activeTool, addDrawing, getDrawings, defaultStyle, setActiveTool } = useDrawingStore();

  // Track price lines for cleanup
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());

  // Handle chart click
  const handleClick = useCallback(
    (param: MouseEventParams) => {
      if (!activeTool || activeTool === "select" || !series || !param.point) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;

      if (activeTool === "horizontal-line") {
        const drawing: HorizontalLineDrawing = {
          id: createDrawingId(),
          type: "horizontal-line",
          price,
          style: { ...defaultStyle },
          visible: true,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addDrawing(stockCode, drawing);

        // Reset tool after drawing
        setActiveTool(null);
      }

      // TODO: Handle other drawing tools
    },
    [activeTool, series, stockCode, addDrawing, defaultStyle, setActiveTool],
  );

  // Subscribe to chart clicks
  useEffect(() => {
    if (!chart) return;

    chart.subscribeClick(handleClick);
    return () => {
      chart.unsubscribeClick(handleClick);
    };
  }, [chart, handleClick]);

  // Sync drawings with chart price lines
  useEffect(() => {
    if (!series) return;

    const drawings = getDrawings(stockCode);
    const currentIds = new Set(drawings.map((d) => d.id));

    // Remove price lines for deleted drawings
    priceLinesRef.current.forEach((priceLine, id) => {
      if (!currentIds.has(id)) {
        series.removePriceLine(priceLine);
        priceLinesRef.current.delete(id);
      }
    });

    // Add/update price lines for current drawings
    drawings.forEach((drawing) => {
      if (drawing.type === "horizontal-line" && drawing.visible) {
        const existing = priceLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        if (existing) {
          // Update existing price line
          existing.applyOptions({
            price: drawing.price,
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
          });
        } else {
          // Create new price line
          const priceLine = series.createPriceLine({
            price: drawing.price,
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
            axisLabelVisible: true,
            title: "",
          });
          priceLinesRef.current.set(drawing.id, priceLine);
        }
      }
    });
  }, [series, stockCode, getDrawings]);

  // Cleanup on unmount or stock change
  useEffect(() => {
    return () => {
      if (series) {
        priceLinesRef.current.forEach((priceLine) => {
          try {
            series.removePriceLine(priceLine);
          } catch {
            // Ignore if already removed
          }
        });
        priceLinesRef.current.clear();
      }
    };
  }, [series, stockCode]);

  return {
    activeTool,
    drawings: getDrawings(stockCode),
  };
}
