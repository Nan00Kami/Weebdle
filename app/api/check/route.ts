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
    const body = await req.json().catch(() => ({} as any));
    const guessName: string = (body?.guess || '').trim();
    const quoteId: string | undefined = body?.quoteId;

    if (!guessName || !quoteId) {
      return NextResponse.json(
        { error: 'Missing guess or quoteId' },
        { status: 400 }
      );
    }

    // Fetch the correct answer row by id
    const { data: answer, error: aErr } = await supabase
      .from('characters')
      .select(FIELDS)
      .eq('id', quoteId)
      .single<Row>();

    if (aErr || !answer) {
      return NextResponse.json(
        { error: aErr?.message || 'Answer not found' },
        { status: 500 }
      );
    }

    // Resolve the guessed row (case-insensitive; dropdown should pass the exact name)
    const { data: guessRow, error: gErr } = await supabase
      .from('characters')
      .select(FIELDS)
      .ilike('character_name', guessName) // ilike for case-insensitive exact text
      .order('character_name', { ascending: true })
      .limit(1)
      .maybeSingle<Row>();

    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 });
    }
    if (!guessRow) {
      // no such character in DB
      return NextResponse.json({ ok: false, invalid: true });
    }

    // Per-field matches (used to paint your table cells green)
    const matches = {
      character_name:
        (guessRow.character_name || '').trim().toLowerCase() ===
        (answer.character_name || '').trim().toLowerCase(),
      anime_name: (guessRow.anime_name || '') === (answer.anime_name || ''),
      year: guessRow.year === answer.year,
      genre: (guessRow.genre || '') === (answer.genre || ''),
      mal_ranking: guessRow.mal_ranking === answer.mal_ranking,
    };

    // Overall correctness (all fields match)
    const ok =
      matches.character_name &&
      matches.anime_name &&
      matches.year &&
      matches.genre &&
      matches.mal_ranking;

    // Numeric hints for arrows in your GuessesTable
    // year: normal numeric comparison (older/newer)
    // mal_ranking: LOWER is better rank; so if guess rank number is bigger, arrow should be DOWN
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
            : // higher number = worse rank; user should go "down" toward the smaller (better) number
              guessRow.mal_ranking > answer.mal_ranking
            ? 'down'
            : 'up'
          : null,
    } as const;

    return NextResponse.json({
      ok,
      guess: guessRow,   // your UI reads this as the resolved guess row
      answer,            // keep sending the answer (you were using it)
      matches,           // cell highlighting
      hints,             // arrow directions
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
