'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SleepStatsProps {
  stats: { avgTime: string; earliestTime: string; latestTime: string };
  trend: { date: string; time: string }[];
  t: {
    sleepStats: string;
    average: string;
    earliest: string;
    latest: string;
    trend: string;
  };
}

export function SleepStats({ stats, trend, t }: SleepStatsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Convert time to minutes for bar height calculation
  const timeToMin = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
  };

  const trendMinutes = trend.map((d) => timeToMin(d.time));
  const minMin = trendMinutes.length > 0 ? Math.min(...trendMinutes) - 30 : 0;
  const maxMin = trendMinutes.length > 0 ? Math.max(...trendMinutes) + 30 : 1;
  const range = maxMin - minMin || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.sleepStats}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">{t.average}</p>
            <p className="text-lg font-bold">{stats.avgTime || '--:--'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.earliest}</p>
            <p className="text-lg font-bold">{stats.earliestTime || '--:--'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.latest}</p>
            <p className="text-lg font-bold">{stats.latestTime || '--:--'}</p>
          </div>
        </div>

        {/* 14-day trend bar chart */}
        {trend.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">{t.trend}</h4>
            <div className="flex gap-1 h-32 relative">
              {trend.map((d, i) => {
                const height = ((trendMinutes[i] - minMin) / range) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 relative group"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div
                      className="bg-primary/80 hover:bg-primary rounded-t transition-all w-full absolute bottom-0"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    {hoveredIndex === i && (
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {d.date.slice(5)} {d.time?.slice(0, 5)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
