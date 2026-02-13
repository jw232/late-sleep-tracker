'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecordForm } from '@/components/record/record-form';
import { AnalysisResult } from '@/components/record/analysis-result';
import { StreakCard } from '@/components/record/streak-card';
import { useLocale } from '@/hooks/use-locale';
import { calculateStreak } from '@/lib/streak';
import type { Analysis, RecordFormData, SubscriptionStatus } from '@/types';

export default function RecordPage() {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [streak, setStreak] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [usage, setUsage] = useState<SubscriptionStatus | null>(null);

  // Fetch streak and usage on mount
  useEffect(() => {
    fetchStreak();
    fetch('/api/usage').then(r => r.json()).then(setUsage).catch(() => {});
  }, []);

  async function fetchStreak() {
    try {
      const res = await fetch('/api/records?days=365');
      const records = await res.json();
      if (!Array.isArray(records)) return;

      const dates = records.map((r: { record_date: string }) => r.record_date);
      setStreak(calculateStreak(dates));
    } catch {
      // ignore
    }
  }

  async function handleSubmit(data: RecordFormData) {
    setIsLoading(true);
    setAnalysis(null);
    setSaved(false);
    setError(false);
    setLimitReached(false);

    try {
      // Step 1: Get AI analysis
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason_text: data.reason_text,
          sleep_time: data.sleep_time,
        }),
      });

      let analysisData: Analysis | null = null;

      if (analyzeRes.status === 403) {
        // Limit reached — save record without AI analysis
        setLimitReached(true);
      } else if (analyzeRes.ok) {
        analysisData = await analyzeRes.json();
        setAnalysis(analysisData);
      } else {
        console.error('Analysis failed:', analyzeRes.status);
      }

      // Step 2: Auto-save (with or without analysis)
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          analysis: analysisData,
        }),
      });
      setSaved(true);
      fetchStreak();

      // Refresh usage count
      fetch('/api/usage').then(r => r.json()).then(setUsage).catch(() => {});
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.record.title}</h1>

      {usage && !usage.isPro && (
        <div className="text-sm text-muted-foreground text-right">
          {t.billing.aiUsage}: {usage.aiUsageThisMonth}{t.billing.aiUsageOf}5
        </div>
      )}

      <StreakCard streak={streak} t={t.record} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.record.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordForm t={t.record} onSubmit={handleSubmit} isLoading={isLoading} />
          {saved && (
            <p className="mt-3 text-sm text-green-400 font-medium">
              {t.record.saved}
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-400 font-medium">
              {t.record.error}
            </p>
          )}
        </CardContent>
      </Card>

      {limitReached && (
        <Card className="border-amber-400/30 bg-amber-400/5">
          <CardContent className="pt-6">
            <p className="font-medium text-amber-300">{t.billing.limitReached}</p>
            <p className="text-sm text-amber-400/70 mt-1">{t.billing.upgradeToUnlock}</p>
            <a href="/billing" className="inline-block mt-3 text-sm font-medium text-primary underline">
              {t.billing.upgrade}
            </a>
          </CardContent>
        </Card>
      )}

      {analysis && <AnalysisResult analysis={analysis} t={t.analysis} />}
    </div>
    </div>
  );
}
