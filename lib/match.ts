// /lib/match.ts
import type { CharacterRow, Dir } from './types';

export function norm(s: unknown) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function eq(a: unknown, b: unknown) {
  return norm(a) === norm(b);
}

function genreTokens(s: unknown): Set<string> {
  const clean = String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return new Set(
    clean
      .split(/[,\|;/]/)
      .map((t) => t.trim())
      .filter(Boolean)
  );
}

export function compareRows(answer: CharacterRow, guess: CharacterRow) {
  const yearOk =
    answer.year != null && guess.year != null &&
    Number(answer.year) === Number(guess.year);

  const malOk =
    answer.mal_ranking != null && guess.mal_ranking != null &&
    Number(answer.mal_ranking) === Number(guess.mal_ranking);

  const animeOk = eq(answer.anime_name, guess.anime_name);

  // Token overlap (so "Shounen" matches "Shounen, Action")
  const aT = genreTokens(answer.genre);
  const gT = genreTokens(guess.genre);
  let genreOk = false;
  for (const t of gT) {
    if (aT.has(t)) {
      genreOk = true;
      break;
    }
  }

  return {
    anime_name: animeOk,
    year: yearOk,
    genre: genreOk,
    mal_ranking: malOk,
  };
}

export function direction(answerVal: number | null, guessVal: number | null): Dir {
  if (answerVal == null || guessVal == null) return null;
  const a = Number(answerVal);
  const g = Number(guessVal);
  if (Number.isNaN(a) || Number.isNaN(g)) return null;
  if (a === g) return 'equal';
  return a > g ? 'up' : 'down'; // ▲ means the correct value is higher
}
