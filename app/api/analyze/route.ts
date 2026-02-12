import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a sleep habit analyst. Analyze the user's late sleep reason and provide structured feedback.
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
        },
        {
          role: 'user',
          content: `Sleep time: ${sleep_time}\nReason: ${reason_text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content);

    // Record AI usage
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      endpoint: 'analyze',
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
