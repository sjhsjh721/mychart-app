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
  type FibRetracementDrawing,
  type RectangleDrawing,
  type TriangleDrawing,
  type ParallelChannelDrawing,
  type TextDrawing,
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
    selectedId,
    addDrawing,
    getDrawings,
    deleteDrawing,
    selectDrawing,
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
  // Track vertical line series
  const verticalLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  // Track ray line series
  const rayLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  // Track fibonacci price lines (multiple per drawing)
  const fibLinesRef = useRef<Map<string, IPriceLine[]>>(new Map());
  // Track rectangle line series (4 lines per rectangle)
  const rectangleLinesRef = useRef<Map<string, ISeriesApi<"Line">[]>>(new Map());
  // Track triangle line series (3 lines per triangle)
  const triangleLinesRef = useRef<Map<string, ISeriesApi<"Line">[]>>(new Map());
  // Track parallel channel line series (2 parallel lines)
  const channelLinesRef = useRef<Map<string, ISeriesApi<"Line">[]>>(new Map());

  // Find closest drawing to click point
  const findClosestDrawing = useCallback(
    (clickPrice: number, clickTime: number, threshold = 0.02) => {
      const drawings = getDrawings(stockCode);
      let closest: { id: string; distance: number } | null = null;

      for (const drawing of drawings) {
        let distance = Infinity;

        if (drawing.type === "horizontal-line") {
          // Distance is relative price difference
          const priceDiff = Math.abs(drawing.price - clickPrice) / clickPrice;
          distance = priceDiff;
        } else if (drawing.type === "trend-line" || drawing.type === "ray") {
          // Point-to-line distance
          const { startPoint, endPoint } = drawing;
          const dx = endPoint.time - startPoint.time;
          const dy = endPoint.price - startPoint.price;

          if (dx === 0 && dy === 0) {
            distance = Math.abs(clickPrice - startPoint.price) / clickPrice;
          } else {
            // Parametric projection
            const t = Math.max(
              0,
              Math.min(
                1,
                ((clickTime - startPoint.time) * dx + (clickPrice - startPoint.price) * dy) /
                  (dx * dx + dy * dy),
              ),
            );
            const projPrice = startPoint.price + t * dy;
            distance = Math.abs(clickPrice - projPrice) / clickPrice;
          }
        } else if (drawing.type === "fib-retracement") {
          // Check distance to any fib level
          const { startPoint, endPoint, levels } = drawing;
          const priceRange = endPoint.price - startPoint.price;
          for (const level of levels) {
            const levelPrice = startPoint.price + priceRange * level;
            const priceDiff = Math.abs(levelPrice - clickPrice) / clickPrice;
            if (priceDiff < distance) {
              distance = priceDiff;
            }
          }
        } else if (drawing.type === "text") {
          // Distance to text position
          const priceDiff = Math.abs(drawing.position.price - clickPrice) / clickPrice;
          distance = priceDiff;
        }

        if (distance < threshold && (!closest || distance < closest.distance)) {
          closest = { id: drawing.id, distance };
        }
      }

      return closest?.id || null;
    },
    [getDrawings, stockCode],
  );

  // Handle chart click
  const handleClick = useCallback(
    (param: MouseEventParams) => {
      if (!series || !param.point) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;

      const time = param.time as number;

      // Select mode: find and select closest drawing
      if (activeTool === "select" || !activeTool) {
        const closestId = findClosestDrawing(price, time || 0);
        selectDrawing(closestId);
        return;
      }

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
      } else if (activeTool === "fib-retracement") {
        const time = param.time as number;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          addTempPoint(point);
        } else {
          const startPoint = tempPoints[0];
          const drawing: FibRetracementDrawing = {
            id: createDrawingId(),
            type: "fib-retracement",
            startPoint,
            endPoint: point,
            levels: [0, 0.236, 0.382, 0.5, 0.618, 1],
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
      } else if (activeTool === "text") {
        const time = param.time as number;
        if (!time) return;

        const text = prompt("메모 내용을 입력하세요:");
        if (!text) {
          setActiveTool(null);
          return;
        }

        const drawing: TextDrawing = {
          id: createDrawingId(),
          type: "text",
          position: { time, price },
          text,
          fontSize: 12,
          style: { ...defaultStyle },
          visible: true,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addDrawing(stockCode, drawing);
        setActiveTool(null);
      } else if (activeTool === "rectangle") {
        // Rectangle needs two points (corners)
        const time = param.time as number;
        if (!time) return;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          addTempPoint(point);
        } else {
          const firstPoint = tempPoints[0];
          // Determine topLeft and bottomRight
          const topLeft: Point = {
            time: Math.min(firstPoint.time, point.time),
            price: Math.max(firstPoint.price, point.price),
          };
          const bottomRight: Point = {
            time: Math.max(firstPoint.time, point.time),
            price: Math.min(firstPoint.price, point.price),
          };

          const drawing: RectangleDrawing = {
            id: createDrawingId(),
            type: "rectangle",
            topLeft,
            bottomRight,
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
      } else if (activeTool === "triangle") {
        // Triangle needs three points
        const time = param.time as number;
        if (!time) return;
        const point: Point = { time, price };

        if (tempPoints.length < 2) {
          addTempPoint(point);
        } else {
          const drawing: TriangleDrawing = {
            id: createDrawingId(),
            type: "triangle",
            point1: tempPoints[0],
            point2: tempPoints[1],
            point3: point,
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
      } else if (activeTool === "parallel-channel") {
        // Parallel channel: 2 points for first line, then 1 point to set width
        const time = param.time as number;
        if (!time) return;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          // First point: start of first line
          addTempPoint(point);
        } else if (tempPoints.length === 1) {
          // Second point: end of first line
          addTempPoint(point);
        } else {
          // Third point: determines channel width (distance from line to this point)
          const line1Start = tempPoints[0];
          const line1End = tempPoints[1];

          // Calculate perpendicular distance from third point to the line
          const dx = line1End.time - line1Start.time;
          const dy = line1End.price - line1Start.price;
          const lineLength = Math.sqrt(dx * dx + dy * dy);

          // Cross product gives signed distance
          const channelWidth =
            lineLength > 0
              ? ((point.time - line1Start.time) * dy - (point.price - line1Start.price) * dx) /
                lineLength
              : price - line1Start.price;

          const drawing: ParallelChannelDrawing = {
            id: createDrawingId(),
            type: "parallel-channel",
            line1Start,
            line1End,
            channelWidth: Math.abs(channelWidth),
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
      findClosestDrawing,
      selectDrawing,
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

    // Remove vertical lines for deleted drawings
    verticalLinesRef.current.forEach((lineSeries, id) => {
      if (!currentIds.has(id)) {
        chart.removeSeries(lineSeries);
        verticalLinesRef.current.delete(id);
      }
    });

    // Remove ray lines for deleted drawings
    rayLinesRef.current.forEach((lineSeries, id) => {
      if (!currentIds.has(id)) {
        chart.removeSeries(lineSeries);
        rayLinesRef.current.delete(id);
      }
    });

    // Remove fibonacci lines for deleted drawings
    fibLinesRef.current.forEach((priceLines, id) => {
      if (!currentIds.has(id)) {
        priceLines.forEach((line) => {
          try {
            series.removePriceLine(line);
          } catch {
            // Ignore
          }
        });
        fibLinesRef.current.delete(id);
      }
    });

    // Remove rectangle lines for deleted drawings
    rectangleLinesRef.current.forEach((lineSeriesArr, id) => {
      if (!currentIds.has(id)) {
        lineSeriesArr.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore
          }
        });
        rectangleLinesRef.current.delete(id);
      }
    });

    // Remove triangle lines for deleted drawings
    triangleLinesRef.current.forEach((lineSeriesArr, id) => {
      if (!currentIds.has(id)) {
        lineSeriesArr.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore
          }
        });
        triangleLinesRef.current.delete(id);
      }
    });

    // Remove channel lines for deleted drawings
    channelLinesRef.current.forEach((lineSeriesArr, id) => {
      if (!currentIds.has(id)) {
        lineSeriesArr.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore
          }
        });
        channelLinesRef.current.delete(id);
      }
    });

    // Helper: get highlight style for selected drawing
    const getHighlightColor = (color: string, isSelected: boolean) => {
      if (!isSelected) return color;
      // Make color brighter/more saturated for selection
      return "#FFEB3B"; // Yellow highlight
    };

    const getHighlightWidth = (width: number, isSelected: boolean): LineWidth => {
      return (isSelected ? Math.min(width + 1, 4) : width) as LineWidth;
    };

    // Add/update drawings
    drawings.forEach((drawing) => {
      const isSelected = drawing.id === selectedId;

      if (drawing.type === "horizontal-line" && drawing.visible) {
        const existing = priceLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);

        if (existing) {
          existing.applyOptions({
            price: drawing.price,
            color,
            lineWidth,
            lineStyle,
          });
        } else {
          const priceLine = series.createPriceLine({
            price: drawing.price,
            color,
            lineWidth,
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

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);

        const lineData: LineData[] = [
          { time: drawing.startPoint.time as Time, value: drawing.startPoint.price },
          { time: drawing.endPoint.time as Time, value: drawing.endPoint.price },
        ];

        if (existing) {
          existing.applyOptions({
            color,
            lineWidth,
            lineStyle,
          });
          existing.setData(lineData);
        } else {
          const lineSeries = chart.addLineSeries({
            color,
            lineWidth,
            lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData(lineData);
          trendLinesRef.current.set(drawing.id, lineSeries);
        }
      } else if (drawing.type === "vertical-line" && drawing.visible) {
        // Vertical line: Lightweight Charts doesn't support true vertical lines natively
        // We use createPriceLine with a marker at the specific time
        // Alternative: Use series markers for visual indication
        const existingMarkers = series.markers();
        const hasMarker = existingMarkers?.some((m) => (m as { id?: string }).id === drawing.id);

        if (!hasMarker) {
          const markers = [
            ...(existingMarkers || []),
            {
              id: drawing.id,
              time: drawing.time as Time,
              position: "aboveBar" as const,
              color: drawing.style.color,
              shape: "arrowDown" as const,
              text: "│",
            },
          ];
          series.setMarkers(markers);
          verticalLinesRef.current.set(drawing.id, series as unknown as ISeriesApi<"Line">);
        }
      } else if (drawing.type === "ray" && drawing.visible) {
        // Ray: extends from startPoint through endPoint to chart boundary
        const existing = rayLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);

        // Calculate ray extension
        const { startPoint, endPoint } = drawing;
        const dx = endPoint.time - startPoint.time;
        const dy = endPoint.price - startPoint.price;

        // Extend to a far future point (1 year = ~31536000 seconds)
        const extensionFactor = 31536000;
        const extendedTime =
          dx > 0 ? endPoint.time + extensionFactor : endPoint.time - extensionFactor;
        const extendedPrice =
          dy !== 0 && dx !== 0
            ? endPoint.price + (dy / dx) * (dx > 0 ? extensionFactor : -extensionFactor)
            : endPoint.price;

        const lineData: LineData[] = [
          { time: startPoint.time as Time, value: startPoint.price },
          { time: extendedTime as Time, value: extendedPrice },
        ];

        // Sort by time (lineSeries requires ascending order)
        lineData.sort((a, b) => (a.time as number) - (b.time as number));

        if (existing) {
          existing.applyOptions({
            color,
            lineWidth,
            lineStyle,
          });
          existing.setData(lineData);
        } else {
          const lineSeries = chart.addLineSeries({
            color,
            lineWidth,
            lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData(lineData);
          rayLinesRef.current.set(drawing.id, lineSeries);
        }
      } else if (drawing.type === "fib-retracement" && drawing.visible) {
        // Fibonacci Retracement: multiple horizontal lines at fib levels
        const existingLines = fibLinesRef.current.get(drawing.id);

        // Remove existing lines first (to recreate with updated values)
        if (existingLines) {
          existingLines.forEach((line) => {
            try {
              series.removePriceLine(line);
            } catch {
              // Ignore
            }
          });
        }

        const { startPoint, endPoint, levels } = drawing;
        const priceRange = endPoint.price - startPoint.price;

        // Fibonacci level colors
        const fibColors: Record<number, string> = {
          0: "#787B86",
          0.236: "#F7525F",
          0.382: "#FF9800",
          0.5: "#4CAF50",
          0.618: "#2196F3",
          1: "#787B86",
        };

        const newLines: IPriceLine[] = [];
        const fibLineWidth = isSelected ? (2 as LineWidth) : (1 as LineWidth);

        levels.forEach((level) => {
          const price = startPoint.price + priceRange * level;
          const baseColor = fibColors[level] || drawing.style.color;
          const color = isSelected ? "#FFEB3B" : baseColor;
          const levelPercent = (level * 100).toFixed(1);

          const priceLine = series.createPriceLine({
            price,
            color,
            lineWidth: fibLineWidth,
            lineStyle: 2, // Dotted
            axisLabelVisible: true,
            title: `${levelPercent}%`,
          });
          newLines.push(priceLine);
        });

        fibLinesRef.current.set(drawing.id, newLines);
      } else if (drawing.type === "text" && drawing.visible) {
        // Text: render as series marker
        const existingMarkers = series.markers() || [];
        const hasMarker = existingMarkers.some((m) => (m as { id?: string }).id === drawing.id);

        if (!hasMarker) {
          const color = isSelected ? "#FFEB3B" : drawing.style.color;
          const markers = [
            ...existingMarkers,
            {
              id: drawing.id,
              time: drawing.position.time as Time,
              position: "aboveBar" as const,
              color,
              shape: "circle" as const,
              text: drawing.text,
            },
          ];
          series.setMarkers(markers);
        }
      } else if (drawing.type === "rectangle" && drawing.visible) {
        // Rectangle: render as 4 line series (top, bottom, left, right)
        const existing = rectangleLinesRef.current.get(drawing.id);

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);
        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const { topLeft, bottomRight } = drawing;

        // 4 lines: top, bottom, left (approximated), right (approximated)
        const topLineData: LineData[] = [
          { time: topLeft.time as Time, value: topLeft.price },
          { time: bottomRight.time as Time, value: topLeft.price },
        ];
        const bottomLineData: LineData[] = [
          { time: topLeft.time as Time, value: bottomRight.price },
          { time: bottomRight.time as Time, value: bottomRight.price },
        ];
        // Vertical lines approximated with very close time points
        const leftLineData: LineData[] = [
          { time: topLeft.time as Time, value: topLeft.price },
          { time: (topLeft.time + 1) as Time, value: bottomRight.price },
        ];
        const rightLineData: LineData[] = [
          { time: (bottomRight.time - 1) as Time, value: topLeft.price },
          { time: bottomRight.time as Time, value: bottomRight.price },
        ];

        if (existing && existing.length === 4) {
          // Update existing lines
          existing[0].applyOptions({ color, lineWidth, lineStyle });
          existing[0].setData(topLineData);
          existing[1].applyOptions({ color, lineWidth, lineStyle });
          existing[1].setData(bottomLineData);
          existing[2].applyOptions({ color, lineWidth, lineStyle });
          existing[2].setData(leftLineData);
          existing[3].applyOptions({ color, lineWidth, lineStyle });
          existing[3].setData(rightLineData);
        } else {
          // Remove old if exists
          if (existing) {
            existing.forEach((ls) => {
              try {
                chart.removeSeries(ls);
              } catch {
                // Ignore
              }
            });
          }

          // Create 4 new line series
          const createLine = (data: LineData[]) => {
            const ls = chart.addLineSeries({
              color,
              lineWidth,
              lineStyle,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            ls.setData(data);
            return ls;
          };

          const lines = [
            createLine(topLineData),
            createLine(bottomLineData),
            createLine(leftLineData),
            createLine(rightLineData),
          ];
          rectangleLinesRef.current.set(drawing.id, lines);
        }
      } else if (drawing.type === "triangle" && drawing.visible) {
        // Triangle: render as 3 line series connecting 3 points
        const existing = triangleLinesRef.current.get(drawing.id);

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);
        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const { point1, point2, point3 } = drawing;

        // Sort points by time for each line segment
        const sortByTime = (a: Point, b: Point): [Point, Point] =>
          a.time <= b.time ? [a, b] : [b, a];

        const [line1Start, line1End] = sortByTime(point1, point2);
        const [line2Start, line2End] = sortByTime(point2, point3);
        const [line3Start, line3End] = sortByTime(point3, point1);

        const line1Data: LineData[] = [
          { time: line1Start.time as Time, value: line1Start.price },
          { time: line1End.time as Time, value: line1End.price },
        ];
        const line2Data: LineData[] = [
          { time: line2Start.time as Time, value: line2Start.price },
          { time: line2End.time as Time, value: line2End.price },
        ];
        const line3Data: LineData[] = [
          { time: line3Start.time as Time, value: line3Start.price },
          { time: line3End.time as Time, value: line3End.price },
        ];

        if (existing && existing.length === 3) {
          // Update existing lines
          existing[0].applyOptions({ color, lineWidth, lineStyle });
          existing[0].setData(line1Data);
          existing[1].applyOptions({ color, lineWidth, lineStyle });
          existing[1].setData(line2Data);
          existing[2].applyOptions({ color, lineWidth, lineStyle });
          existing[2].setData(line3Data);
        } else {
          // Remove old if exists
          if (existing) {
            existing.forEach((ls) => {
              try {
                chart.removeSeries(ls);
              } catch {
                // Ignore
              }
            });
          }

          // Create 3 new line series
          const createLine = (data: LineData[]) => {
            const ls = chart.addLineSeries({
              color,
              lineWidth,
              lineStyle,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            ls.setData(data);
            return ls;
          };

          const lines = [createLine(line1Data), createLine(line2Data), createLine(line3Data)];
          triangleLinesRef.current.set(drawing.id, lines);
        }
      } else if (drawing.type === "parallel-channel" && drawing.visible) {
        // Parallel channel: render as 2 parallel line series
        const existing = channelLinesRef.current.get(drawing.id);

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);
        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const { line1Start, line1End, channelWidth } = drawing;

        // Calculate direction vector and perpendicular offset
        const dx = line1End.time - line1Start.time;
        const dy = line1End.price - line1Start.price;
        const length = Math.sqrt(dx * dx + dy * dy);

        // Perpendicular vector (normalized) * channelWidth
        // For price-based offset, we use the price component
        const offsetPrice = length > 0 ? (channelWidth * dx) / length : channelWidth;

        // Line 1 (original)
        const sortByTime1 = line1Start.time <= line1End.time;
        const firstLineData: LineData[] = sortByTime1
          ? [
              { time: line1Start.time as Time, value: line1Start.price },
              { time: line1End.time as Time, value: line1End.price },
            ]
          : [
              { time: line1End.time as Time, value: line1End.price },
              { time: line1Start.time as Time, value: line1Start.price },
            ];

        // Line 2 (parallel, offset by channelWidth in price)
        const line2Start: Point = {
          time: line1Start.time,
          price: line1Start.price + offsetPrice,
        };
        const line2End: Point = {
          time: line1End.time,
          price: line1End.price + offsetPrice,
        };

        const sortByTime2 = line2Start.time <= line2End.time;
        const secondLineData: LineData[] = sortByTime2
          ? [
              { time: line2Start.time as Time, value: line2Start.price },
              { time: line2End.time as Time, value: line2End.price },
            ]
          : [
              { time: line2End.time as Time, value: line2End.price },
              { time: line2Start.time as Time, value: line2Start.price },
            ];

        if (existing && existing.length === 2) {
          // Update existing lines
          existing[0].applyOptions({ color, lineWidth, lineStyle });
          existing[0].setData(firstLineData);
          existing[1].applyOptions({ color, lineWidth, lineStyle });
          existing[1].setData(secondLineData);
        } else {
          // Remove old if exists
          if (existing) {
            existing.forEach((ls) => {
              try {
                chart.removeSeries(ls);
              } catch {
                // Ignore
              }
            });
          }

          // Create 2 new line series
          const createLine = (data: LineData[]) => {
            const ls = chart.addLineSeries({
              color,
              lineWidth,
              lineStyle,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            ls.setData(data);
            return ls;
          };

          const lines = [createLine(firstLineData), createLine(secondLineData)];
          channelLinesRef.current.set(drawing.id, lines);
        }
      }
    });
  }, [chart, series, stockCode, getDrawings, selectedId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          // Delete selected drawing
          if (selectedId) {
            deleteDrawing(stockCode, selectedId);
          }
          break;
        case "Escape":
          // Cancel current tool or deselect
          setActiveTool(null);
          selectDrawing(null);
          clearTempPoints();
          break;
        case "v":
        case "V":
          setActiveTool("select");
          break;
        case "h":
        case "H":
          setActiveTool("horizontal-line");
          break;
        case "t":
        case "T":
          setActiveTool("trend-line");
          break;
        case "f":
        case "F":
          setActiveTool("fib-retracement");
          break;
        case "r":
        case "R":
          setActiveTool("rectangle");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, stockCode, deleteDrawing, selectDrawing, setActiveTool, clearTempPoints]);

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

        // Cleanup fibonacci lines
        fibLinesRef.current.forEach((priceLines) => {
          priceLines.forEach((line) => {
            try {
              series.removePriceLine(line);
            } catch {
              // Ignore
            }
          });
        });
        fibLinesRef.current.clear();
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

        verticalLinesRef.current.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore if already removed
          }
        });
        verticalLinesRef.current.clear();

        rayLinesRef.current.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore if already removed
          }
        });
        rayLinesRef.current.clear();

        rectangleLinesRef.current.forEach((lineSeriesArr) => {
          lineSeriesArr.forEach((lineSeries) => {
            try {
              chart.removeSeries(lineSeries);
            } catch {
              // Ignore
            }
          });
        });
        rectangleLinesRef.current.clear();

        triangleLinesRef.current.forEach((lineSeriesArr) => {
          lineSeriesArr.forEach((lineSeries) => {
            try {
              chart.removeSeries(lineSeries);
            } catch {
              // Ignore
            }
          });
        });
        triangleLinesRef.current.clear();

        channelLinesRef.current.forEach((lineSeriesArr) => {
          lineSeriesArr.forEach((lineSeries) => {
            try {
              chart.removeSeries(lineSeries);
            } catch {
              // Ignore
            }
          });
        });
        channelLinesRef.current.clear();
      }
    };
  }, [chart, series, stockCode]);

  const allDrawings = getDrawings(stockCode);
  const textDrawings = allDrawings.filter(
    (d): d is import("@/store/drawing-store").TextDrawing => d.type === "text",
  );

  return {
    activeTool,
    selectedId,
    drawings: allDrawings,
    textDrawings,
    selectDrawing,
    deleteDrawing: (id: string) => deleteDrawing(stockCode, id),
  };
}
