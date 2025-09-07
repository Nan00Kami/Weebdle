import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic'; // ensure not statically analyzed

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('search') || '').trim();

    let query = supabase
      .from('characters')
      .select('id, character_name, image_url')
      .order('character_name', { ascending: true })
      .limit(20);

    if (q) {
      query = supabase
        .from('characters')
        .select('id, character_name, image_url')
        .ilike('character_name', `%${q}%`)
        .order('character_name', { ascending: true })
        .limit(20);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
