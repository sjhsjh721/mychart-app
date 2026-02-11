"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Period } from "@/store/chart-store";

const PERIODS: { value: Period; label: string }[] = [
  { value: "3M", label: "3개월" },
  { value: "6M", label: "6개월" },
  { value: "1Y", label: "1년" },
  { value: "3Y", label: "3년" },
  { value: "MAX", label: "전체" },
];

export function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (v: Period) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => {
        if (!v) return;
        onChange(v as Period);
      }}
      aria-label="Select period"
      className="flex-wrap gap-1"
    >
      {PERIODS.map((p) => (
        <ToggleGroupItem
          key={p.value}
          value={p.value}
          aria-label={p.label}
          className="h-6 px-2 text-[10px] md:h-7 md:px-2 md:text-xs"
        >
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
