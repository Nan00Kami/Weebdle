import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // SERVER-ONLY client

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FIELDS =
  'id, character_name, quote, anime_name, year, genre, mal_ranking, image_url';

export async function GET() {
  try {
    // Pull a pool of rows that actually have non-empty quotes (server-side filter).
    const { data, error } = await supabaseAdmin
      .from('characters')
      .select(FIELDS)
      .not('quote', 'is', null)
      .neq('quote', '')
      .limit(1000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const rows = data ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No quotes available.' }, { status: 404 });
    }

    const pick = rows[Math.floor(Math.random() * rows.length)];
    return NextResponse.json(pick);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
