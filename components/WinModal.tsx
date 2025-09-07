'use client';

import React from 'react';

interface WinModalProps {
  open: boolean;
  name: string;
  image_url?: string | null;
}

export default function WinModal({ open, name, image_url }: WinModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 p-6 rounded-xl shadow-xl max-w-sm text-center">
        <h2 className="text-xl font-bold mb-4">You guessed the correct character!</h2>
        {image_url && (
          <img
            src={image_url}
            alt={name}
            className="mx-auto mb-4 h-24 w-24 rounded-full object-cover border border-neutral-700"
          />
        )}
        <p className="font-semibold text-lg">{name}</p>
        <p className="mt-4 text-sm text-neutral-400">
          Refresh the page to play again.
        </p>
      </div>
    </div>
  );
}
