'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReasonChartProps {
  reasons: { reason: string; count: number }[];
  title: string;
}

export function ReasonChart({ reasons, title }: ReasonChartProps) {
  if (reasons.length === 0) return null;

  const maxCount = Math.max(...reasons.map((r) => r.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reasons.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.reason}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
