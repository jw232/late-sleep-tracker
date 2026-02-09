import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
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

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
