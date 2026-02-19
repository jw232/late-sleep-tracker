import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic';
import { getSubscriptionStatus } from '@/lib/subscription';
import type { SleepRecord } from '@/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data: records, error } = await supabase
    .from('sleep_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('record_date', fromDate.toISOString().split('T')[0])
    .order('record_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const typedRecords = records as SleepRecord[];

  // Aggregate reason counts from analysis
  const reasonCounts: Record<string, number> = {};
  typedRecords.forEach((r) => {
    if (r.analysis?.top_reasons) {
      r.analysis.top_reasons.forEach((item) => {
        reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
      });
    }
  });

  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  // Sleep time stats
  const times = typedRecords
    .map((r) => r.sleep_time)
    .filter(Boolean)
    .map((t) => {
      const [h, m] = t.split(':').map(Number);
      // Normalize: times before 12:00 are next-day (add 24)
      return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
    });

  let avgTime = '';
  let earliestTime = '';
  let latestTime = '';

  if (times.length > 0) {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const earliest = Math.min(...times);
    const latest = Math.max(...times);

    const formatMin = (m: number) => {
      const normalized = m >= 24 * 60 ? m - 24 * 60 : m;
      const hours = Math.floor(normalized / 60);
      const mins = normalized % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    avgTime = formatMin(avg);
    earliestTime = formatMin(earliest);
    latestTime = formatMin(latest);
  }

  // Last 14 days trend
  const last14 = typedRecords.slice(-14).map((r) => ({
    date: r.record_date,
    time: r.sleep_time,
  }));

  // AI Pattern Analysis (only if 3+ records AND Pro user)
  const subStatus = await getSubscriptionStatus(supabase, user.id);
  let patternAnalysis = null;
  if (typedRecords.length >= 3 && subStatus.isPro) {
    try {
      const summary = typedRecords.map((r) =>
        `${r.record_date} ${r.sleep_time} - ${r.reason_text}`
      ).join('\n');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        system: `You are a sleep pattern analyst. Analyze the user's sleep records and identify patterns.
Respond ONLY with valid JSON in this exact format:
{
  "patterns": [{"name": "pattern name", "evidence": "evidence description", "frequency": "how often"}],
  "weekday_analysis": {"worst_day": "day name", "analysis": "explanation"},
  "trend": "improving" | "worsening" | "stable",
  "actionable_advice": ["advice 1", "advice 2", "advice 3"]
}
Respond in the same language as the user's input.`,
        messages: [
          {
            role: 'user',
            content: `Here are my sleep records:\n${summary}`,
          },
        ],
        max_tokens: 1024,
      });

      const textBlock = response.content.find(b => b.type === 'text');
      const raw = textBlock && 'text' in textBlock ? textBlock.text : '{}';
      const content = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      patternAnalysis = JSON.parse(content);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.error('Pattern analysis error:', detail);
    }
  }

  return NextResponse.json({
    topReasons,
    sleepStats: { avgTime, earliestTime, latestTime },
    trend: last14,
    patternAnalysis,
    totalRecords: typedRecords.length,
    isPro: subStatus.isPro,
  });
}
