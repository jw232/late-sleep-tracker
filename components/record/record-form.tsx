'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { RecordFormData } from '@/types';

// Generate time slots: 21:00 - 04:00 in 30min intervals
const timeSlots: string[] = [];
for (let h = 21; h <= 28; h++) {
  for (const m of [0, 30]) {
    const hour = h >= 24 ? h - 24 : h;
    timeSlots.push(`${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

interface RecordFormProps {
  t: {
    date: string;
    sleepTime: string;
    reason: string;
    reasonPlaceholder: string;
    moodScore: string;
    submit: string;
    analyzing: string;
  };
  onSubmit: (data: RecordFormData) => void;
  isLoading: boolean;
}

export function RecordForm({ t, onSubmit, isLoading }: RecordFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [sleepTime, setSleepTime] = useState('');
  const [reason, setReason] = useState('');
  const [moodScore, setMoodScore] = useState(3);

  const handleSubmit = () => {
    if (!sleepTime || !reason.trim()) return;
    onSubmit({
      record_date: date,
      sleep_time: sleepTime,
      reason_text: reason.trim(),
      mood_score: moodScore,
    });
  };

  return (
    <div className="space-y-5">
      {/* Date */}
      <div className="space-y-2">
        <Label>{t.date}</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {/* Time button grid */}
      <div className="space-y-2">
        <Label>{t.sleepTime}</Label>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <Button
              key={time}
              variant={sleepTime === time ? 'default' : 'outline'}
              size="sm"
              className="text-sm"
              onClick={() => setSleepTime(time)}
            >
              {time}
            </Button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label>{t.reason}</Label>
        <Textarea
          placeholder={t.reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>

      {/* Mood score 1-5 */}
      <div className="space-y-2">
        <Label>{t.moodScore}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <Button
              key={score}
              variant={moodScore === score ? 'default' : 'outline'}
              size="sm"
              className={cn('w-10 h-10', moodScore === score && 'ring-2 ring-offset-2')}
              onClick={() => setMoodScore(score)}
            >
              {score}
            </Button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!sleepTime || !reason.trim() || isLoading}
      >
        {isLoading ? t.analyzing : t.submit}
      </Button>
    </div>
  );
}
