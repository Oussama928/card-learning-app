"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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
    <Card className="mt-12">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">
          Performance Heatmap (Last 20 Weeks)
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`inline-block h-3 w-3 rounded-sm ${
                level === 0
                  ? "bg-muted"
                  : level === 1
                    ? "bg-primary/30"
                    : level === 2
                      ? "bg-primary/50"
                      : level === 3
                        ? "bg-primary/70"
                        : "bg-primary"
              }`}
            />
          ))}
          <span>More</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-2">
          {heatmapDays.map((day) => (
            <div
              key={day.date}
              title={`${day.date} • ${day.reviews} review${day.reviews === 1 ? "" : "s"}`}
              className={`h-3 w-3 rounded-sm ${
                day.level === 0
                  ? "bg-muted"
                  : day.level === 1
                    ? "bg-primary/30"
                    : day.level === 2
                      ? "bg-primary/50"
                      : day.level === 3
                        ? "bg-primary/70"
                        : "bg-primary"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
