'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface StreakCardProps {
  streak: number;
  t: {
    streak: string;
    streakDays: string;
    streakMessages: string[];
  };
}

export function StreakCard({ streak, t }: StreakCardProps) {
  // 6 levels of motivational messages based on streak
  const messageIndex = Math.min(
    Math.floor(streak / 2),
    t.streakMessages.length - 1
  );
  const message = t.streakMessages[Math.max(0, messageIndex)];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Flame className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{streak}</span>
            <span className="text-sm text-muted-foreground">{t.streakDays}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t.streak} · {message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
