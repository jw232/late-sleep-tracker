import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic';
import { getSubscriptionStatus } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check AI usage limit
  const status = await getSubscriptionStatus(supabase, user.id);
  if (status.aiLimitReached) {
    return NextResponse.json({ error: 'limit_reached' }, { status: 403 });
  }

  const { reason_text, sleep_time } = await request.json();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      system: `You are a sleep habit analyst. Analyze the user's late sleep reason and provide structured feedback.
Respond ONLY with valid JSON in this exact format:
{
  "top_reasons": [{"reason": "main reason", "confidence": 85}],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "tags": ["tag1", "tag2"]
}
- top_reasons: 1-3 categorized reasons with confidence percentages (0-100)
- suggestions: 2-4 actionable improvement suggestions
- tags: 2-4 keyword tags in English
Keep responses concise. Respond in the same language as the user's input.`,
      messages: [
        {
          role: 'user',
          content: `Sleep time: ${sleep_time}\nReason: ${reason_text}`,
        },
      ],
      max_tokens: 1024,
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '{}';
    const content = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    const analysis = JSON.parse(content);

    // Record AI usage
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      endpoint: 'analyze',
    });

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    const body = (error as { error?: unknown }).error;
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Analysis error:', { status, body, detail });
    return NextResponse.json(
      { error: 'Analysis failed', detail },
      { status: 500 }
    );
  }
}
