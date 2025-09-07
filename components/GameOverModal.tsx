'use client';

import React from 'react';

interface GameOverModalProps {
  open: boolean;
  correctName: string;
  correctImage?: string | null;
}

export default function GameOverModal({ open, correctName, correctImage }: GameOverModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 p-6 rounded-xl shadow-xl max-w-sm text-center">
        <h2 className="text-xl font-bold mb-4">Game Over!</h2>
        {correctImage && (
          <img
            src={correctImage}
            alt={correctName}
            className="mx-auto mb-4 h-24 w-24 rounded-full object-cover border border-neutral-700"
          />
        )}
        <p className="font-semibold text-lg">The correct answer was {correctName}</p>
        <p className="mt-4 text-sm text-neutral-400">
          Refresh the page to try again.
        </p>
      </div>
    </div>
  );
}
