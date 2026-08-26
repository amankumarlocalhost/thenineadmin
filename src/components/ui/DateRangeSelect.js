"use client";

import { DATE_PRESETS } from "@/lib/constants";

export function DateRangeSelect({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => onChange(preset.value)}
          className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-medium transition-colors ${
            value === preset.value
              ? "border-stitch bg-stitch text-paper"
              : "border-line-paper text-ink/60 hover:border-stitch hover:text-stitch"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
