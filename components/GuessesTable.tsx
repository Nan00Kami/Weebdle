import React from 'react';

/** Keep this in sync with your DB columns */
export type CharacterRow = {
  id: string;
  character_name: string;
  quote: string;
  anime_name: string;
  year: number | null;
  genre: string | null;
  mal_ranking: number | null;
  image_url?: string | null;
};

type Props = {
  guesses: CharacterRow[];
  answer: CharacterRow | null;
};

function normStr(s: string | null | undefined) {
  return (s ?? '').trim().toLowerCase();
}

function equalStr(a: string | null | undefined, b: string | null | undefined) {
  return normStr(a) === normStr(b);
}

function equalNum(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null) return false;
  return a === b;
}

type ArrowDir = 'up' | 'down' | null;

/** ▲ if answer > guess, ▼ if answer < guess, null if equal/unknown (for YEAR) */
function arrowFor(guessVal: number | null | undefined, answerVal: number | null | undefined): ArrowDir {
  if (guessVal == null || answerVal == null) return null;
  if (guessVal === answerVal) return null;
  return guessVal < answerVal ? 'up' : 'down';
}

/** For MAL rank: lower number = better rank.
 *  ▲ if answer is BETTER rank (answer < guess),
 *  ▼ if answer is WORSE  rank (answer > guess)
 */
function arrowForRank(
  guessVal: number | null | undefined,
  answerVal: number | null | undefined
): ArrowDir {
  if (guessVal == null || answerVal == null) return null;
  if (guessVal === answerVal) return null;
  return answerVal < guessVal ? 'up' : 'down';
}

const thCls =
  'p-2 font-semibold text-sm text-neutral-200 bg-neutral-800 sticky top-0';
const tdCls =
  'p-2 text-sm align-middle whitespace-normal break-words border-t border-neutral-800';

export default function GuessesTable({ guesses, answer }: Props) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-800">
            <th className={thCls}>Image</th>
            <th className={thCls}>Character</th>
            <th className={thCls}>Anime</th>
            <th className={thCls}>Year</th>
            <th className={thCls}>Genre</th>
            <th className={thCls}>MAL Rank</th>
          </tr>
        </thead>
        <tbody>
          {guesses.map((g) => {
            const matchCharacter = answer ? equalStr(g.character_name, answer.character_name) : false;
            const matchAnime = answer ? equalStr(g.anime_name, answer.anime_name) : false;
            const matchYear = answer ? equalNum(g.year, answer.year) : false;
            const matchGenre = answer ? equalStr(g.genre, answer.genre) : false;
            const matchRank = answer ? equalNum(g.mal_ranking, answer.mal_ranking) : false;

            const yearArrow = answer ? arrowFor(g.year, answer.year) : null;
            const rankArrow = answer ? arrowForRank(g.mal_ranking, answer.mal_ranking) : null;

            const cellOK = 'bg-emerald-700/70 text-white';
            const cellBase = tdCls;

            return (
              <tr key={`${g.id}-${g.character_name}`}>
                {/* Image */}
                <td className={cellBase}>
                  <div className="flex items-center">
                    <img
                      src={g.image_url || '/favicon.ico'}
                      alt={g.character_name}
                      className="h-10 w-10 rounded object-cover border border-neutral-800"
                    />
                  </div>
                </td>

                {/* Character */}
                <td className={`${cellBase} ${matchCharacter ? cellOK : ''}`}>
                  {g.character_name}
                </td>

                {/* Anime */}
                <td className={`${cellBase} ${matchAnime ? cellOK : ''}`}>
                  {g.anime_name}
                </td>

                {/* Year (with arrow) */}
                <td className={`${cellBase} ${matchYear ? cellOK : ''}`}>
                  <div className="flex items-center gap-2">
                    <span>{g.year ?? '-'}</span>
                    {!matchYear && yearArrow && (
                      <span
                        className="text-xs opacity-80"
                        aria-label={yearArrow === 'up' ? 'Answer is higher year' : 'Answer is lower year'}
                        title={yearArrow === 'up' ? 'Answer is higher year' : 'Answer is lower year'}
                      >
                        {yearArrow === 'up' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </td>

                {/* Genre */}
                <td className={`${cellBase} ${matchGenre ? cellOK : ''}`}>
                  {g.genre ?? '-'}
                </td>

                {/* MAL Rank (with inverted arrow semantics) */}
                <td className={`${cellBase} ${matchRank ? cellOK : ''}`}>
                  <div className="flex items-center gap-2">
                    <span>{g.mal_ranking ?? '-'}</span>
                    {!matchRank && rankArrow && (
                      <span
                        className="text-xs opacity-80"
                        aria-label={
                          rankArrow === 'up'
                            ? 'Answer rank is better (lower number)'
                            : 'Answer rank is worse (higher number)'
                        }
                        title={
                          rankArrow === 'up'
                            ? 'Answer rank is better (lower number)'
                            : 'Answer rank is worse (higher number)'
                        }
                      >
                        {rankArrow === 'up' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {guesses.length === 0 && (
            <tr>
              <td className={tdCls} colSpan={6}>
                <span className="text-neutral-400">No guesses yet.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
