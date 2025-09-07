// app/api/check/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Row = {
  id: string;
  character_name: string;
  quote: string | null;
  anime_name: string | null;
  year: number | null;
  genre: string | null;
  mal_ranking: number | null;
  image_url: string | null;
};

const FIELDS =
  'id, character_name, quote, anime_name, year, genre, mal_ranking, image_url';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const guessName: string = (body?.guess || '').trim();
    const quoteId: string | undefined = body?.quoteId;

    if (!guessName || !quoteId) {
      return NextResponse.json({ error: 'Missing guess or quoteId' }, { status: 400 });
    }

    // Correct answer
    const { data: answer, error: e1 } = await supabase
      .from('characters')
      .select(FIELDS)
      .eq('id', quoteId)
      .single<Row>();

    if (e1 || !answer) {
      return NextResponse.json({ error: e1?.message || 'Answer not found' }, { status: 500 });
    }

    // Guessed row (case-insensitive; best if user selects exact name from dropdown)
    const { data: guessRow, error: e2 } = await supabase
      .from('characters')
      .select(FIELDS)
      .ilike('character_name', guessName) // pass exact name from dropdown for precise match
      .order('character_name', { ascending: true })
      .limit(1)
      .maybeSingle<Row>();

    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    if (!guessRow) return NextResponse.json({ ok: false, invalid: true });

    // Per-field matches
    const matches = {
      character_name: guessRow.character_name === answer.character_name,
      anime_name: (guessRow.anime_name || '') === (answer.anime_name || ''),
      year: guessRow.year === answer.year,
      genre: (guessRow.genre || '') === (answer.genre || ''),
      mal_ranking: guessRow.mal_ranking === answer.mal_ranking,
    };

    const ok =
      matches.character_name &&
      matches.anime_name &&
      matches.year &&
      matches.genre &&
      matches.mal_ranking;

    // Numeric hints
    const hints = {
      year:
        guessRow.year != null && answer.year != null
          ? guessRow.year === answer.year
            ? 'equal'
            : guessRow.year < answer.year
            ? 'up'
            : 'down'
          : null,
      mal_ranking:
        guessRow.mal_ranking != null && answer.mal_ranking != null
          ? guessRow.mal_ranking === answer.mal_ranking
            ? 'equal'
            : guessRow.mal_ranking > answer.mal_ranking
            ? 'up'   // larger number = worse; “up” means move toward the correct (lower) rank
            : 'down'
          : null,
    } as const;

    return NextResponse.json({ ok, guess: guessRow, answer, matches, hints });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 });
  }
}
