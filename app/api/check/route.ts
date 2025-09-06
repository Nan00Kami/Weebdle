import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

function norm(s: unknown) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const guess: string = body.guess ?? '';
  const quoteId: string | undefined = body.quoteId;
  if (!guess.trim()) return NextResponse.json({ ok: false, error: 'No guess' });

  // 1) Fetch the answer row we showed
  const { data: answer, error: aErr } = await supabaseAdmin
    .from('characters')
    .select('*')
    .eq('id', quoteId)
    .maybeSingle();

  if (aErr || !answer) return NextResponse.json({ ok: false, error: aErr?.message ?? 'Answer not found' });

  // 2) Fetch the guessed character row (must exist; exact name match, case-insensitive)
  const { data: guessRow, error: gErr } = await supabaseAdmin
    .from('characters')
    .select('*')
    .ilike('character_name', guess) // exact string without % acts as case-insensitive equality
    .maybeSingle();

  if (gErr) return NextResponse.json({ ok: false, error: gErr.message });
  if (!guessRow) return NextResponse.json({ ok: false, reason: 'not_found' }); // ← let client ignore

  // 3) Compare names
  const ok = norm(guessRow.character_name) === norm(answer.character_name);
  return NextResponse.json({ ok, answer, guess: guessRow });
}
