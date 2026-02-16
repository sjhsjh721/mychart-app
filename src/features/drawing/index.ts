/**
 * Drawing Tools Feature (M3)
 *
 * Chart drawing tools implementation for MyChart.
 * See docs/DRAWING_TOOLS_PLAN.md for detailed specs.
 *
 * @module features/drawing
 */

// Store
export { useDrawingStore, createDrawingId } from "@/store/drawing-store";
export type {
  DrawingTool,
  Drawing,
  DrawingStyle,
  Point,
  HorizontalLineDrawing,
  VerticalLineDrawing,
  TrendLineDrawing,
  RayDrawing,
  FibRetracementDrawing,
  ParallelChannelDrawing,
  RectangleDrawing,
  TriangleDrawing,
  TextDrawing,
} from "@/store/drawing-store";

// Components (TODO: M3)
// export { DrawingToolbar } from "./components/drawing-toolbar";
// export { DrawingLayer } from "./components/drawing-layer";

// Hooks (TODO: M3)
// export { useDrawing } from "./hooks/use-drawing";

// Primitives (TODO: M3)
// export { HorizontalLinePrimitive } from "./primitives/horizontal-line";
// export { TrendLinePrimitive } from "./primitives/trend-line";
