'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecordForm } from '@/components/record/record-form';
import { AnalysisResult } from '@/components/record/analysis-result';
import { StreakCard } from '@/components/record/streak-card';
import { useLocale } from '@/hooks/use-locale';
import type { Analysis, RecordFormData } from '@/types';

export default function RecordPage() {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState(0);

  // Fetch streak on mount
  useEffect(() => {
    fetchStreak();
  }, []);

  async function fetchStreak() {
    try {
      const res = await fetch('/api/records?days=365');
      const records = await res.json();
      if (!Array.isArray(records)) return;

      // Calculate consecutive days
      const dates = new Set(records.map((r: { record_date: string }) => r.record_date));
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (dates.has(dateStr)) {
          count++;
        } else {
          break;
        }
      }
      setStreak(count);
    } catch {
      // ignore
    }
  }

  async function handleSubmit(data: RecordFormData) {
    setIsLoading(true);
    setAnalysis(null);
    setSaved(false);

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
      const analysisData: Analysis = await analyzeRes.json();
      setAnalysis(analysisData);

      // Step 2: Auto-save with analysis
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
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.record.title}</h1>

      <StreakCard streak={streak} t={t.record} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.record.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordForm t={t.record} onSubmit={handleSubmit} isLoading={isLoading} />
          {saved && (
            <p className="mt-3 text-sm text-green-600 font-medium">
              {t.record.saved}
            </p>
          )}
        </CardContent>
      </Card>

      {analysis && <AnalysisResult analysis={analysis} t={t.analysis} />}
    </div>
  );
}
