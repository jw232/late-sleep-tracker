import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET: Export data as CSV or JSON
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  const { data, error } = await supabase
    .from('sleep_records')
    .select('*')
    .order('record_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === 'csv') {
    const headers = ['id', 'record_date', 'sleep_time', 'reason_text', 'mood_score', 'created_at'];
    const rows = data.map((r) =>
      headers.map((h) => {
        const val = r[h as keyof typeof r];
        const str = val == null ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=sleep-records.csv',
      },
    });
  }

  return NextResponse.json(data);
}

// DELETE: Clear all data
export async function DELETE() {
  const { error } = await supabase
    .from('sleep_records')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
