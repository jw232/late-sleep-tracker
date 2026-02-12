import { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/types';

const FREE_AI_LIMIT = 5;

export async function getSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionStatus> {
  // Get subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, cancel_at_period_end')
    .eq('user_id', userId)
    .single();

  const isPro = sub?.status === 'active' || sub?.status === 'trialing';

  // Count AI usage this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', 'analyze')
    .gte('created_at', monthStart);

  const aiUsageThisMonth = count || 0;

  return {
    isPro,
    aiUsageThisMonth,
    aiLimitReached: !isPro && aiUsageThisMonth >= FREE_AI_LIMIT,
    currentPeriodEnd: sub?.current_period_end || null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
  };
}
