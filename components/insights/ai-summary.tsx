'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PatternAnalysis } from '@/types';

interface AISummaryProps {
  analysis: PatternAnalysis;
  t: {
    aiAnalysis: string;
    patterns: string;
    evidence: string;
    frequency: string;
    weekdayAnalysis: string;
    worstDay: string;
    trendDirection: string;
    improving: string;
    worsening: string;
    stable: string;
    advice: string;
  };
}

const trendIcons = {
  improving: TrendingDown,
  worsening: TrendingUp,
  stable: Minus,
};

const trendColors = {
  improving: 'text-green-600 dark:text-green-400',
  worsening: 'text-red-600 dark:text-red-400',
  stable: 'text-yellow-600 dark:text-yellow-400',
};

export function AISummary({ analysis, t }: AISummaryProps) {
  const TrendIcon = trendIcons[analysis.trend] || Minus;
  const trendColor = trendColors[analysis.trend] || '';
  const trendLabel = t[analysis.trend] || analysis.trend;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.aiAnalysis}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Patterns */}
        {analysis.patterns?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t.patterns}</h4>
            <div className="space-y-3">
              {analysis.patterns.map((p, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.evidence}: {p.evidence}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.frequency}: {p.frequency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekday analysis */}
        {analysis.weekday_analysis && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t.weekdayAnalysis}</h4>
            <div className="rounded-lg border p-3">
              <p className="text-sm">
                <span className="font-medium">{t.worstDay}: </span>
                {analysis.weekday_analysis.worst_day}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.weekday_analysis.analysis}
              </p>
            </div>
          </div>
        )}

        {/* Trend */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t.trendDirection}</h4>
          <div className={`flex items-center gap-2 ${trendColor}`}>
            <TrendIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{trendLabel}</span>
          </div>
        </div>

        {/* Actionable advice */}
        {analysis.actionable_advice?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t.advice}</h4>
            <ul className="space-y-1.5">
              {analysis.actionable_advice.map((a, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
