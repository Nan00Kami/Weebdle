'use client';

import type { CharacterRow } from '@/lib/types';

export default function GameOverModal({
  open,
  answer,
  onTryAgain,
}: {
  open: boolean;
  answer: CharacterRow | null;
  onTryAgain: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-rose-300">Game over!</h2>
        <p className="text-neutral-300 mb-4">
          You ran out of guesses. The correct character was:
        </p>

        {answer && (
          <div className="flex items-center gap-3 mb-6">
            {answer.image_url ? (
              <img
                src={answer.image_url}
                alt={answer.character_name}
                className="h-16 w-16 object-cover rounded-md border border-neutral-800"
              />
            ) : (
              <div className="h-16 w-16 rounded-md border border-neutral-800 grid place-items-center text-neutral-400">
                —
              </div>
            )}
            <div>
              <div className="font-semibold">{answer.character_name}</div>
              <div className="text-sm text-neutral-400">{answer.anime_name}</div>
            </div>
          </div>
        )}

        <button
          onClick={onTryAgain}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold w-full"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
