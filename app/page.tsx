'use client';

import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

import CharacterDropdown from '@/components/CharacterDropdown';
import GuessesTable from '@/components/GuessesTable';
import WinModal from '@/components/WinModal';
import GameOverModal from '@/components/GameOverModal';

import type { Attempt, CharacterRow, Suggestion } from '@/lib/types';
import { compareRows, direction } from '@/lib/match';

const MAX_TURNS = 8;

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [quoteRow, setQuoteRow] = useState<CharacterRow | null>(null);

  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [result, setResult] = useState<CharacterRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [turnsLeft, setTurnsLeft] = useState<number>(MAX_TURNS);

  useEffect(() => {
    function onResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load a random quote & full answer row
  async function loadQuote() {
    setLoading(true);
    try {
      const res = await fetch('/api/quote', { cache: 'no-store' });
      const data = await res.json();
      if (data?.id) {
        setQuoteRow(data);
        setError(null);
      } else {
        setError('Failed to load quote');
      }
    } catch {
      setError('Failed to load quote');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    resetGame();
  }, []);

  function resetGame() {
    setGuess('');
    setAttempts([]);
    setResult(null);
    setError(null);
    setTurnsLeft(MAX_TURNS);
    setShowConfetti(false);
    setShowWinModal(false);
    setShowGameOver(false);
    loadQuote();
  }

  function onPickSuggestion(s: Suggestion) {
    setGuess(s.character_name);
  }

  // prevent duplicate names (case-insensitive)
  function alreadyGuessed(name: string) {
    const n = name.trim().toLowerCase();
    return attempts.some((a) => a.guess.character_name.trim().toLowerCase() === n);
  }

  async function submitGuess() {
    if (!guess.trim() || !quoteRow?.id) return;

    // block duplicates before calling API
    if (alreadyGuessed(guess)) {
      setError('You already guessed that character.');
      return;
    }

    // also block if no turns left or already won
    if (turnsLeft <= 0 || !!result) return;

    const res = await fetch('/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess, quoteId: quoteRow.id }),
    });
    const data = await res.json();

    // not in DB
    if (data?.reason === 'not_found') {
      setError('Pick a character from the list.');
      return;
    }

    // correct
    if (data?.ok && data?.answer) {
      const answer: CharacterRow = data.answer;
      setResult(answer);
      setError(null);
      setShowConfetti(true);
      setShowWinModal(true);
      setTimeout(() => setShowConfetti(false), 3000);
      return;
    }

    // wrong but valid → consume a turn & add attempt
    if (data?.answer && data?.guess) {
      const answer: CharacterRow = data.answer;
      const guessed: CharacterRow = data.guess;

      const matches = compareRows(answer, guessed);
      const hints = {
        year: direction(answer.year, guessed.year),
        mal_ranking: direction(answer.mal_ranking, guessed.mal_ranking),
      };

      setAttempts((prev) => [...prev, { guess: guessed, matches, hints }]);
      setError('Wrong guess! Matching fields are highlighted.');

      const newLeft = turnsLeft - 1;
      setTurnsLeft(newLeft);

      if (newLeft <= 0) {
        // out of turns → reveal correct answer
        setShowGameOver(true);
      }
      return;
    }

    setError('Something went wrong. Try again.');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitGuess();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-6">
      {showConfetti && (
        <Confetti
          width={viewport.width}
          height={viewport.height}
          recycle={false}
          numberOfPieces={350}
          gravity={0.6}
        />
      )}

      <WinModal
        open={showWinModal}
        onClose={() => setShowWinModal(false)}
        result={result}
      />

      <GameOverModal
        open={showGameOver}
        answer={quoteRow}
        onTryAgain={resetGame}
      />

      <div className="w-full max-w-4xl rounded-2xl bg-neutral-900/70 p-8 shadow-xl border border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">Weebdle</h1>
          <div className="text-sm text-neutral-400">
            Turns left: <span className="font-semibold text-neutral-200">{turnsLeft}</span>
          </div>
        </div>

        <div className="mb-6">
          {loading && <div className="text-neutral-400 italic">Loading quote…</div>}
          {!loading && quoteRow && (
            <blockquote className="italic text-lg border-l-4 border-indigo-500 pl-4">
              “{quoteRow.quote}”
            </blockquote>
          )}
          {!loading && !quoteRow && <div className="text-rose-400">Couldn’t load a quote.</div>}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
          <CharacterDropdown
            value={guess}
            onChange={setGuess}
            onPick={onPickSuggestion}
            onEnter={submitGuess}
          />
          <button
            type="submit"
            disabled={turnsLeft <= 0 || !!result}
            className="px-4 py-3 bg-indigo-600 disabled:bg-neutral-700 disabled:text-neutral-400 hover:bg-indigo-500 rounded-lg font-semibold"
          >
            Guess
          </button>
        </form>

        {error && <div className="text-amber-400 mb-2">{error}</div>}

        <div className="overflow-x-auto">
          <GuessesTable attempts={attempts} />
        </div>

        {result && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed mt-4">
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
                <tr>
                  <td className="p-2 align-top border-t border-neutral-800 w-16">
                    {result.image_url ? (
                      <img
                        src={result.image_url}
                        alt={result.character_name}
                        className="h-12 w-12 object-cover rounded-md border border-neutral-800 mx-auto"
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 align-top border-t border-neutral-800 w-40 break-words whitespace-normal">
                    {result.character_name}
                  </td>
                  <td className="p-2 align-top border-t border-neutral-800 w-48 break-words whitespace-normal">
                    {result.anime_name}
                  </td>
                  <td className="p-2 align-top border-t border-neutral-800 w-20">
                    {result.year ?? '-'}
                  </td>
                  <td className="p-2 align-top border-t border-neutral-800 w-48 break-words whitespace-normal">
                    {result.genre ?? '-'}
                  </td>
                  <td className="p-2 align-top border-t border-neutral-800 w-24">
                    {result.mal_ranking ?? '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
