"use client";

import React from "react";

interface ActivityHeatmapEntry {
  date: string;
  reviews: number;
  correctReviews: number;
}

interface PerformanceHeatmapProps {
  activityHeatmap?: ActivityHeatmapEntry[];
}

export default function PerformanceHeatmap({ activityHeatmap = [] }: PerformanceHeatmapProps) {
  const heatmapDays = React.useMemo(() => {
    const byDate = new Map<string, { reviews: number; correctReviews: number }>();

    activityHeatmap.forEach((item) => {
      const dateKey = String(item.date).slice(0, 10);
      byDate.set(dateKey, {
        reviews: Number(item.reviews || 0),
        correctReviews: Number(item.correctReviews || 0),
      });
    });

    const days: Array<{ date: string; reviews: number; correctReviews: number; level: number }> = [];
    const today = new Date();

    for (let i = 139; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const entry = byDate.get(iso) || { reviews: 0, correctReviews: 0 };

      days.push({
        date: iso,
        reviews: entry.reviews,
        correctReviews: entry.correctReviews,
        level:
          entry.reviews === 0
            ? 0
            : entry.reviews < 3
              ? 1
              : entry.reviews < 7
                ? 2
                : entry.reviews < 12
                  ? 3
                  : 4,
      });
    }

    return days;
  }, [activityHeatmap]);

  return (
    <div
      className="mt-12 rounded-xl p-6"
      style={{
        background: "rgba(127,202,201,0.06)",
        border: "1px solid rgba(127,202,201,0.2)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold" style={{ color: "#7fcac9" }}>
          Performance Heatmap (Last 20 Weeks)
        </h4>
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="inline-block h-3 w-3 rounded-sm"
              style={{
                background:
                  level === 0
                    ? "rgba(255,255,255,0.08)"
                    : level === 1
                      ? "#1f6b66"
                      : level === 2
                        ? "#2a8f88"
                        : level === 3
                          ? "#39b7ad"
                          : "#7fcac9",
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-2">
        {heatmapDays.map((day) => (
          <div
            key={day.date}
            title={`${day.date} • ${day.reviews} review${day.reviews === 1 ? "" : "s"}`}
            className="h-3 w-3 rounded-sm"
            style={{
              background:
                day.level === 0
                  ? "rgba(255,255,255,0.08)"
                  : day.level === 1
                    ? "#1f6b66"
                    : day.level === 2
                      ? "#2a8f88"
                      : day.level === 3
                        ? "#39b7ad"
                        : "#7fcac9",
            }}
          />
        ))}
      </div>
    </div>
  );
}
