import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

const cols =
  'id, character_name, quote, anime_name, year, genre, mal_ranking, image_url';

export async function GET() {
  try {
    // 1) Count rows that have a non-empty quote
    const countRes = await supabase
      .from('characters')
      .select('id', { count: 'exact', head: false })
      .not('quote', 'is', null)
      .neq('quote', '');

    if (countRes.error) {
      return NextResponse.json({ error: countRes.error.message }, { status: 500 });
    }
    const count = countRes.count ?? 0;
    if (count === 0) {
      return NextResponse.json({ error: 'No quotes available.' }, { status: 404 });
    }

    const offset = Math.floor(Math.random() * count);

    // 2) Fetch one row at that offset
    const { data, error } = await supabase
      .from('characters')
      .select(cols)
      .not('quote', 'is', null)
      .neq('quote', '')
      .order('id', { ascending: true })
      .range(offset, offset);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const row = data?.[0];
    if (!row) return NextResponse.json({ error: 'No quotes available.' }, { status: 404 });

    return NextResponse.json(row);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
