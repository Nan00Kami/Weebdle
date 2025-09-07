// components/CharacterDropdown.tsx
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  MouseEvent,
} from 'react';

type Suggestion = {
  id: string;
  character_name: string;
  image_url?: string | null;
};

type Props = {
  /** Controlled value coming from parent */
  value: string;
  /** Called on every keystroke */
  onChange: (val: string) => void;
  /** Called when user picks a suggestion */
  onSelect: (val: string) => void;
  /** Optional: minimum characters before querying */
  minChars?: number;
  /** Optional: placeholder text */
  placeholder?: string;
  /** Optional: block-list of character names (case-insensitive) */
  blockedNames?: string[];
};

/**
 * Rich dropdown with:
 * - debounced search to /api/characters
 * - keyboard navigation (Up/Down/Enter/Esc)
 * - outside-click to close
 * - empty state
 * - image + name rows
 */
export default function CharacterDropdown({
  value,
  onChange,
  onSelect,
  minChars = 1,
  placeholder = 'Type character name...',
  blockedNames = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const blockedSet = useMemo(
    () => new Set(blockedNames.map((s) => s.toLowerCase())),
    [blockedNames]
  );

  // Debounced fetch
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      const q = value.trim();
      if (q.length < minChars) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/characters?search=${encodeURIComponent(q)}`);
        const data = (await res.json()) as Suggestion[] | { error?: string };
        if (Array.isArray(data)) {
          // filter blocked names
          setSuggestions(
            data.filter((s) => !blockedSet.has(s.character_name.toLowerCase()))
          );
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }

    // small debounce to avoid hammering the API
    t = setTimeout(run, 180);
    return () => t && clearTimeout(t);
  }, [value, minChars, blockedSet]);

  // Open the menu when focusing the input (if we have suggestions)
  const handleFocus = useCallback(() => {
    setOpen(true);
  }, []);

  // Handle outside click (closes the dropdown)
  useEffect(() => {
    function onDocClick(e: MouseEvent | globalThis.MouseEvent) {
      if (!rootRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Keyboard navigation
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        setOpen(true);
        return;
      }
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => {
          const next = Math.min(i + 1, suggestions.length - 1);
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => {
          const next = Math.max(i - 1, 0);
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          const name = suggestions[activeIndex].character_name;
          onSelect(name);
          setOpen(false);
          setActiveIndex(-1);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
        setActiveIndex(-1);
      }
    },
    [open, suggestions, activeIndex, onSelect]
  );

  function scrollIntoView(index: number) {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    if (!item) return;
    const { offsetTop, offsetHeight } = item;
    const { scrollTop, clientHeight } = list;
    const bottom = offsetTop + offsetHeight;
    if (offsetTop < scrollTop) list.scrollTop = offsetTop;
    else if (bottom > scrollTop + clientHeight) list.scrollTop = bottom - clientHeight;
  }

  const handlePick = (s: Suggestion) => {
    onSelect(s.character_name);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={handleFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg bg-neutral-800 px-4 py-3 outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="char-dd-list"
        role="combobox"
      />

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-neutral-800 bg-neutral-900 shadow-xl">
          {/* status row */}
          {loading && (
            <div className="px-3 py-2 text-sm text-neutral-400">Searching…</div>
          )}

          {!loading && value.trim().length < minChars && (
            <div className="px-3 py-2 text-sm text-neutral-400">
              Type at least {minChars} character{minChars > 1 ? 's' : ''}.
            </div>
          )}

          {!loading &&
            value.trim().length >= minChars &&
            suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-neutral-400">No matches.</div>
            )}

          {!loading && suggestions.length > 0 && (
            <ul
              id="char-dd-list"
              ref={listRef}
              className="max-h-64 overflow-auto"
              role="listbox"
            >
              {suggestions.map((s, i) => {
                const active = i === activeIndex;
                return (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={active}
                    className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                      active ? 'bg-neutral-800' : 'hover:bg-neutral-800/70'
                    }`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(-1)}
                    onClick={() => handlePick(s)}
                  >
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.character_name}
                        className="h-8 w-8 rounded object-cover border border-neutral-800"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded border border-neutral-800 bg-neutral-800/50" />
                    )}
                    <span className="truncate">{s.character_name}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
