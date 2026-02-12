export interface ReasonItem {
  reason: string;
  confidence: number;
}

export interface Analysis {
  top_reasons: ReasonItem[];
  suggestions: string[];
  tags: string[];
}

export interface SleepRecord {
  id: string;
  record_date: string;
  sleep_time: string;
  reason_text: string;
  mood_score: number | null;
  analysis: Analysis | null;
  created_at: string;
  updated_at: string;
}

export interface RecordFormData {
  record_date: string;
  sleep_time: string;
  reason_text: string;
  mood_score: number;
}

export interface PatternAnalysis {
  patterns: {
    name: string;
    evidence: string;
    frequency: string;
  }[];
  weekday_analysis: {
    worst_day: string;
    analysis: string;
  };
  trend: 'improving' | 'worsening' | 'stable';
  actionable_advice: string[];
}

export interface SubscriptionStatus {
  isPro: boolean;
  aiUsageThisMonth: number;
  aiLimitReached: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}
