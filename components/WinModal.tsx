'use client';
import type { CharacterRow } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  result: CharacterRow | null;
};

export default function WinModal({ open, onClose, result }: Props) {
  if (!open || !result) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-2">You guessed the correct character!</h2>
        <p className="text-neutral-300 mb-4">Today&apos;s character:</p>
        {result.image_url && (
          <img src={result.image_url} alt={result.character_name} className="mx-auto h-32 w-32 rounded-lg object-cover border border-neutral-800 mb-3" />
        )}
        <div className="text-2xl font-bold mb-6">{result.character_name}</div>
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700">
          Close
        </button>
      </div>
    </div>
  );
}
