'use client';

import type { Attempt } from '@/lib/types';

type Props = {
  attempts: Attempt[];
};

export default function GuessesTable({ attempts }: Props) {
  if (!attempts || attempts.length === 0) return null;

  const Cell = ({
    children,
    ok,
    extra = '',
  }: {
    children: React.ReactNode;
    ok?: boolean;
    extra?: string;
  }) => (
    <td
      className={[
        'p-2 align-top border-t border-neutral-800 break-words whitespace-normal',
        ok ? 'bg-green-500/20 text-green-200 ring-1 ring-green-500/40' : '',
        extra,
      ].join(' ')}
    >
      {children}
    </td>
  );

  const Arrow = ({ dir }: { dir: 'up' | 'down' | 'equal' | null | undefined }) => {
    if (!dir || dir === 'equal') return null;
    return (
      <span className="ml-2 text-xs opacity-80">
        {dir === 'up' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="mt-4">
      <div className="text-sm text-neutral-400 mb-2">Your guesses</div>

      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-neutral-800">
            <th className="p-2 w-16">Image</th>
            <th className="p-2 w-40">Character</th>
            <th className="p-2 w-48">Anime</th>
            <th className="p-2 w-20">Year</th>
            <th className="p-2 w-48">Genre</th>
            <th className="p-2 w-24">MAL Rank</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a, idx) => (
            <tr key={idx}>
              <td className="p-2 align-top border-t border-neutral-800 w-16">
                {a.guess.image_url ? (
                  <img
                    src={a.guess.image_url}
                    alt={a.guess.character_name}
                    className="w-12 h-12 rounded object-cover border border-neutral-800 mx-auto"
                  />
                ) : (
                  '—'
                )}
              </td>
              <td className="p-2 align-top border-t border-neutral-800 w-40 break-words whitespace-normal">
                {a.guess.character_name}
              </td>

              <Cell ok={a.matches.anime_name} extra="w-48">
                {a.guess.anime_name}
              </Cell>

              <Cell ok={a.matches.year} extra="w-20">
                {a.guess.year ?? '-'}
                {!a.matches.year && <Arrow dir={a.hints?.year} />}
              </Cell>

              <Cell ok={a.matches.genre} extra="w-48">
                {a.guess.genre ?? '-'}
              </Cell>

              <Cell ok={a.matches.mal_ranking} extra="w-24">
                {a.guess.mal_ranking ?? '-'}
                {!a.matches.mal_ranking && <Arrow dir={a.hints?.mal_ranking} />}
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
