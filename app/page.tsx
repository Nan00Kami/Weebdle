'use client';

import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import GuessesTable, { CharacterRow } from '@/components/GuessesTable';
import WinModal from '@/components/WinModal';
import GameOverModal from '@/components/GameOverModal';

type Suggestion = { id: string; character_name: string; image_url?: string | null };

// How many guesses per round
const MAX_TURNS = 8;

export default function Home() {
  // UI / game state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The current answer row (the one with the quote)
  const [answer, setAnswer] = useState<CharacterRow | null>(null);

  // Input + suggestions
  const [guess, setGuess] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focused, setFocused] = useState(false);

  // Guess history (rows resolved from the DB for each guess)
  const [guesses, setGuesses] = useState<CharacterRow[]>([]);

  // Win modal / confetti sizing
  const [winOpen, setWinOpen] = useState(false);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  // Derived state
  const outOfTurns = !winOpen && guesses.length >= MAX_TURNS;
  const gameOver = winOpen || outOfTurns;
  const guessesLeft = Math.max(0, MAX_TURNS - guesses.length);

  // Keep confetti sized to viewport (client only)
  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load one random quote row on mount
  const loadQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quote', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.id) throw new Error(data?.error || 'Failed to load quote');
      setAnswer(data as CharacterRow);
      setGuesses([]);
      setGuess('');
      setWinOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to load quote');
      setAnswer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, []);

  // Suggestions from /api/characters (client side)
  const fetchSuggestions = async (q: string) => {
    try {
      const res = await fetch('/api/characters?search=' + encodeURIComponent(q || ''), {
        cache: 'no-store',
      });
      const list = await res.json();
      setSuggestions(Array.isArray(list) ? list : []);
    } catch {
      setSuggestions([]);
    }
  };

  // Trigger suggestions while typing and when focusing the box
  useEffect(() => {
    if (!focused || gameOver) return;
    fetchSuggestions(guess);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guess, focused, gameOver]);

  // Click-outside to close the custom dropdown
  const inputWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!inputWrapRef.current) return;
      if (!inputWrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Submit guess
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gameOver) return;

    setError(null);
    const trimmed = guess.trim();
    if (!trimmed || !answer) return;

    // Block duplicate guesses (case-insensitive)
    const already = guesses.some(
      (g) => g.character_name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (already) {
      setError('You already guessed that character.');
      return;
    }

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: trimmed, quoteId: answer.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Check failed. Try again.');
        return;
      }

      const resolved: CharacterRow | undefined =
        data?.row || data?.guess || data?.guessRow;

      if (resolved) setGuesses((prev) => [...prev, resolved]);

      if (data?.ok) {
        // Win!
        if (data?.row) setAnswer(data.row as CharacterRow);
        setWinOpen(true);
      } else if (!resolved) {
        setError('No such character in the database.');
      }
      // out-of-turns is derived from guesses.length, so no extra state needed
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    }
  };

  // Pick from custom dropdown
  const onPick = (s: Suggestion) => {
    if (gameOver) return;
    setGuess(s.character_name);
    setFocused(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-6">
      {/* Confetti on win */}
      {winOpen && <Confetti width={dims.w} height={dims.h} numberOfPieces={350} />}

      {/* Win modal (non-dismissable) */}
      <WinModal
        open={winOpen}
        name={answer?.character_name || ''}
        image_url={answer?.image_url || null}
      />

      {/* Lose modal (non-dismissable) */}
      <GameOverModal
        open={outOfTurns}
        correctName={answer?.character_name || ''}
        correctImage={answer?.image_url || null}
      />

      <div className="w-full max-w-3xl rounded-2xl bg-neutral-900/70 p-8 shadow-xl border border-neutral-800">
        <h1 className="text-4xl font-bold text-center mb-2">Weebdle</h1>

        {/* Quote */}
        <div className="mb-3 min-h-[56px]">
          {loading && <div className="text-neutral-400 italic">Loading quote…</div>}
          {!loading && answer && (
            <blockquote className="italic text-lg border-l-4 border-indigo-500 pl-4">
              “{answer.quote}”
            </blockquote>
          )}
          {!loading && !answer && (
            <div className="text-rose-400">Couldn’t load a quote.</div>
          )}
        </div>

        {/* Guesses left */}
        {!gameOver && (
          <div className="mb-2 text-sm text-neutral-400">
            Guesses left:{' '}
            <span className={guessesLeft <= 2 ? 'text-amber-400' : 'text-neutral-200'}>
              {guessesLeft}
            </span>
          </div>
        )}

        {/* Guess input + custom suggestions */}
        <form onSubmit={handleSubmit} className="mb-3">
          <div ref={inputWrapRef} className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onFocus={() => {
                  setFocused(true);
                  fetchSuggestions(guess);
                }}
                placeholder="Type character name…"
                className="flex-1 rounded-lg bg-neutral-800 px-4 py-3 outline-none ring-1 ring-neutral-700 focus:ring-indigo-500 disabled:opacity-50"
                disabled={loading || !answer || gameOver}
                aria-autocomplete="list"
                aria-expanded={focused && !gameOver && suggestions.length > 0}
                aria-controls="character-suggest-list"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold disabled:opacity-50"
                disabled={loading || !answer || gameOver || !guess.trim()}
              >
                Guess
              </button>
            </div>

            {/* popup list */}
            {focused && !gameOver && suggestions.length > 0 && (
              <ul
                id="character-suggest-list"
                className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl"
                role="listbox"
              >
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={false}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-neutral-800"
                    onMouseDown={(e) => e.preventDefault()} // keep focus until we click
                    onClick={() => onPick(s)}
                  >
                    <img
                      src={s.image_url || '/favicon.ico'}
                      alt={s.character_name}
                      className="h-8 w-8 rounded object-cover border border-neutral-800"
                    />
                    <span>{s.character_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>

        {/* Errors */}
        {error && <div className="text-amber-400 mb-3">{error}</div>}

        {/* Guesses table */}
        <GuessesTable guesses={guesses} answer={answer} />

        {/* Locked banner on game over */}
        {gameOver && (
          <div className="mt-4 text-center text-sm text-neutral-400">
            Game over — refresh the page to play again.
          </div>
        )}
      </div>
    </main>
  );
}
