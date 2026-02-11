"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Timeframe } from "@/lib/timeframe";

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
];

export function TimeframeSelector({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (v: Timeframe) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => {
        if (!v) return;
        onChange(v as Timeframe);
      }}
      aria-label="Select timeframe"
      className="flex-wrap gap-1"
    >
      {TIMEFRAMES.map((tf) => (
        <ToggleGroupItem
          key={tf.value}
          value={tf.value}
          aria-label={tf.label}
          className="h-7 px-2 text-xs md:h-8 md:px-3 md:text-sm"
        >
          {tf.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
