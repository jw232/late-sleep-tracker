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
  isPro: boolean;
}

export default function InsightsPage() {
  const { t } = useLocale();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/insights?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
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
      ) : error ? (
        <p className="text-center text-red-600 dark:text-red-400 font-medium py-8">{t.insights.error}</p>
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
          ) : data.totalRecords >= 3 && !data.isPro ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-6 text-center">
              <p className="font-medium text-amber-600 dark:text-amber-300">{t.billing.proFeature}</p>
              <p className="text-sm text-amber-700/70 dark:text-amber-400/70 mt-1">{t.billing.upgradeForPatterns}</p>
              <a href="/billing" className="inline-block mt-3 text-sm font-medium text-primary underline">
                {t.billing.upgrade}
              </a>
            </div>
          ) : data.totalRecords < 3 ? (
            <p className="text-center text-muted-foreground py-4">
              {t.insights.needMoreRecords}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
    </div>
  );
}
