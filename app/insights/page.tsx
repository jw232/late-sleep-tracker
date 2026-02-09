'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ReasonChart } from '@/components/insights/reason-chart';
import { SleepStats } from '@/components/insights/sleep-stats';
import { AISummary } from '@/components/insights/ai-summary';
import { useLocale } from '@/hooks/use-locale';
import type { PatternAnalysis } from '@/types';

interface InsightsData {
  topReasons: { reason: string; count: number }[];
  sleepStats: { avgTime: string; earliestTime: string; latestTime: string };
  trend: { date: string; time: string }[];
  patternAnalysis: PatternAnalysis | null;
  totalRecords: number;
}

export default function InsightsPage() {
  const { t } = useLocale();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/insights?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.insights.title}</h1>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={days === 7 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDays(7)}
        >
          {t.insights.last7Days}
        </Button>
        <Button
          variant={days === 30 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDays(30)}
        >
          {t.insights.last30Days}
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : data ? (
        <div className="space-y-6">
          <ReasonChart reasons={data.topReasons} title={t.insights.topReasons} />

          <SleepStats
            stats={data.sleepStats}
            trend={data.trend}
            t={t.insights}
          />

          {data.patternAnalysis ? (
            <AISummary analysis={data.patternAnalysis} t={t.insights} />
          ) : (
            data.totalRecords < 3 && (
              <p className="text-center text-muted-foreground py-4">
                {t.insights.needMoreRecords}
              </p>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
