import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET: Fetch records with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const search = searchParams.get('search') || '';

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  let query = supabase
    .from('sleep_records')
    .select('*')
    .gte('record_date', fromDate.toISOString().split('T')[0])
    .order('record_date', { ascending: false });

  if (search) {
    query = query.ilike('reason_text', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Create a new record
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('sleep_records')
    .insert({
      record_date: body.record_date,
      sleep_time: body.sleep_time,
      reason_text: body.reason_text,
      mood_score: body.mood_score || null,
      analysis: body.analysis || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT: Update a record
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from('sleep_records')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: Delete a record
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('sleep_records')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
