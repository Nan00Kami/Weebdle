'use client';
import { useEffect, useRef, useState } from 'react';
import type { Suggestion } from '@/lib/types';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onPick: (s: Suggestion) => void; // when user selects an item
  onEnter: () => void;             // parent submits the guess
};

export default function CharacterDropdown({ value, onChange, onPick, onEnter }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | null>(null);

  async function fetchSuggestions(q: string) {
    setLoadingSug(true);
    try {
      const res = await fetch('/api/characters?search=' + encodeURIComponent(q), { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
        setHighlight(0);
      }
    } finally {
      setLoadingSug(false);
    }
  }

  function onType(v: string) {
    onChange(v);
    if (!openList) setOpenList(true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => fetchSuggestions(v), 150);
  }

  function onFocusInput() {
    setOpenList(true);
    fetchSuggestions('');
  }

  function chooseSuggestion(s: Suggestion) {
    onPick(s);
    setOpenList(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openList || suggestions.length === 0) {
      if (e.key === 'Enter') onEnter(); // allow submit if dropdown closed
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlight]) {
        chooseSuggestion(suggestions[highlight]);
        // immediately ask parent to submit
        onEnter();
      }
    } else if (e.key === 'Escape') {
      setOpenList(false);
    }
  }

  // close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !listRef.current?.contains(t)) setOpenList(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onType(e.target.value)}
        onFocus={onFocusInput}
        onKeyDown={onKeyDown}
        placeholder="Type or pick a character…"
        className="w-full rounded-lg bg-neutral-800 px-4 py-3 outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
        role="combobox"
        aria-expanded={openList}
        aria-controls="char-listbox"
        aria-autocomplete="list"
      />

      {(openList && (loadingSug || suggestions.length > 0)) && (
        <div
          ref={listRef}
          id="char-listbox"
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-2 max-h-72 overflow-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl"
        >
          {loadingSug && <div className="px-3 py-2 text-neutral-400">Loading…</div>}
          {!loadingSug && suggestions.length === 0 && (
            <div className="px-3 py-2 text-neutral-400">No results</div>
          )}
          {!loadingSug && suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => chooseSuggestion(s)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left ${
                i === highlight ? 'bg-neutral-800' : 'hover:bg-neutral-800/70'
              }`}
              onMouseEnter={() => setHighlight(i)}
            >
              <img
                src={s.image_url || '/favicon.ico'}
                alt={s.character_name}
                className="h-8 w-8 rounded object-cover border border-neutral-800"
              />
              <span className="truncate">{s.character_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
