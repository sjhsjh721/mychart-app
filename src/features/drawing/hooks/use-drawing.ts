"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineData,
  LineStyle,
  LineWidth,
  MouseEventParams,
  Time,
} from "lightweight-charts";
import {
  useDrawingStore,
  createDrawingId,
  type HorizontalLineDrawing,
  type TrendLineDrawing,
  type VerticalLineDrawing,
  type RayDrawing,
  type Point,
} from "@/store/drawing-store";

interface UseDrawingOptions {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  stockCode: string;
}

export function useDrawing({ chart, series, stockCode }: UseDrawingOptions) {
  const {
    activeTool,
    addDrawing,
    getDrawings,
    defaultStyle,
    setActiveTool,
    tempPoints,
    addTempPoint,
    clearTempPoints,
  } = useDrawingStore();

  // Track price lines for cleanup
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  // Track trend line series
  const trendLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

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
        setActiveTool(null);
      } else if (activeTool === "vertical-line") {
        const time = param.time as number;
        if (!time) return;

        const drawing: VerticalLineDrawing = {
          id: createDrawingId(),
          type: "vertical-line",
          time,
          style: { ...defaultStyle },
          visible: true,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addDrawing(stockCode, drawing);
        setActiveTool(null);
      } else if (activeTool === "trend-line") {
        // Trend line needs two points
        const time = param.time as number;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          addTempPoint(point);
        } else {
          const startPoint = tempPoints[0];
          const drawing: TrendLineDrawing = {
            id: createDrawingId(),
            type: "trend-line",
            startPoint,
            endPoint: point,
            extendLeft: false,
            extendRight: false,
            style: { ...defaultStyle },
            visible: true,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addDrawing(stockCode, drawing);
          clearTempPoints();
          setActiveTool(null);
        }
      } else if (activeTool === "ray") {
        const time = param.time as number;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          addTempPoint(point);
        } else {
          const startPoint = tempPoints[0];
          const drawing: RayDrawing = {
            id: createDrawingId(),
            type: "ray",
            startPoint,
            endPoint: point,
            style: { ...defaultStyle },
            visible: true,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addDrawing(stockCode, drawing);
          clearTempPoints();
          setActiveTool(null);
        }
      }
    },
    [
      activeTool,
      series,
      stockCode,
      addDrawing,
      defaultStyle,
      setActiveTool,
      tempPoints,
      addTempPoint,
      clearTempPoints,
    ],
  );

  // Subscribe to chart clicks
  useEffect(() => {
    if (!chart) return;

    chart.subscribeClick(handleClick);
    return () => {
      chart.unsubscribeClick(handleClick);
    };
  }, [chart, handleClick]);

  // Sync drawings with chart
  useEffect(() => {
    if (!series || !chart) return;

    const drawings = getDrawings(stockCode);
    const currentIds = new Set(drawings.map((d) => d.id));

    // Remove price lines for deleted drawings
    priceLinesRef.current.forEach((priceLine, id) => {
      if (!currentIds.has(id)) {
        series.removePriceLine(priceLine);
        priceLinesRef.current.delete(id);
      }
    });

    // Remove trend lines for deleted drawings
    trendLinesRef.current.forEach((lineSeries, id) => {
      if (!currentIds.has(id)) {
        chart.removeSeries(lineSeries);
        trendLinesRef.current.delete(id);
      }
    });

    // Add/update drawings
    drawings.forEach((drawing) => {
      if (drawing.type === "horizontal-line" && drawing.visible) {
        const existing = priceLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        if (existing) {
          existing.applyOptions({
            price: drawing.price,
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
          });
        } else {
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
      } else if (drawing.type === "trend-line" && drawing.visible) {
        const existing = trendLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const lineData: LineData[] = [
          { time: drawing.startPoint.time as Time, value: drawing.startPoint.price },
          { time: drawing.endPoint.time as Time, value: drawing.endPoint.price },
        ];

        if (existing) {
          existing.applyOptions({
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
          });
          existing.setData(lineData);
        } else {
          const lineSeries = chart.addLineSeries({
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData(lineData);
          trendLinesRef.current.set(drawing.id, lineSeries);
        }
      }
    });
  }, [chart, series, stockCode, getDrawings]);

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
      if (chart) {
        trendLinesRef.current.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore if already removed
          }
        });
        trendLinesRef.current.clear();
      }
    };
  }, [chart, series, stockCode]);

  return {
    activeTool,
    drawings: getDrawings(stockCode),
  };
}
