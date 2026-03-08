import { useState, useRef, useEffect } from "react";
import { Battalion, battalions } from "@/data/idfUnits";
import { Search } from "lucide-react";

interface GuessInputProps {
  onGuess: (battalion: Battalion) => void;
  disabled: boolean;
  guessedIds: Set<string>;
}

export function GuessInput({ onGuess, disabled, guessedIds }: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? battalions.filter(
        (b) =>
          !guessedIds.has(b.id) &&
          (b.name.includes(query) ||
            b.nameEn.toLowerCase().includes(query.toLowerCase()) ||
            String(b.number).includes(query))
      )
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (battalion: Battalion) => {
    onGuess(battalion);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) {
      if (e.key === "Enter" && filtered.length === 1) {
        handleSelect(filtered[0]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="הקלד שם גדוד או מספר גדוד"
          className="w-full bg-input border border-border rounded-lg pr-10 pl-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          dir="rtl"
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-60 overflow-auto"
        >
          {filtered.slice(0, 10).map((battalion, index) => (
            <button
              key={battalion.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(battalion);
              }}
              className={`w-full text-right px-4 py-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-0 ${
                index === selectedIndex ? "bg-secondary" : ""
              }`}
            >
              <div className="font-semibold text-foreground">
                {battalion.name} <span className="text-muted-foreground font-normal text-sm">({battalion.number})</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
