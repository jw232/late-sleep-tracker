'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Analysis } from '@/types';

interface AnalysisResultProps {
  analysis: Analysis;
  t: {
    title: string;
    mainReasons: string;
    confidence: string;
    suggestions: string;
    tags: string;
  };
}

export function AnalysisResult({ analysis, t }: AnalysisResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main reasons with confidence bars */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t.mainReasons}</h4>
          <div className="space-y-2">
            {analysis.top_reasons.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.reason}</span>
                  <span className="text-muted-foreground">{item.confidence}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t.suggestions}</h4>
          <ul className="space-y-1">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t.tags}</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
