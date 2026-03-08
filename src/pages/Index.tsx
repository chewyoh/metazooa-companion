import { useState, useEffect } from "react";
import {
  Battalion,
  GuessResult,
  compareBattalions,
  getDailyBattalion,
  getTodayKey,
  battalions,
} from "@/data/idfUnits";
import { GuessInput } from "@/components/GuessInput";
import { GuessHistory } from "@/components/GuessHistory";
import { Trophy, HelpCircle, X, RefreshCw } from "lucide-react";

const STORAGE_KEY = "idf-game-state";

interface GameState {
  dateKey: string;
  guessIds: string[];
  won: boolean;
}

function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    if (state.dateKey !== getTodayKey()) return null;
    return state;
  } catch {
    return null;
  }
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const Index = () => {
  const [target, setTarget] = useState<Battalion>(getDailyBattalion);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [won, setWon] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFreePlay, setIsFreePlay] = useState(false);

  // Load saved state only for daily mode
  useEffect(() => {
    if (isFreePlay) return;
    const saved = loadState();
    if (saved) {
      const results: GuessResult[] = saved.guessIds
        .map((id: string) => {
          const b = battalions.find((bn) => bn.id === id);
          if (!b) return null;
          return compareBattalions(b, target);
        })
        .filter(Boolean) as GuessResult[];
      setGuesses(results);
      setWon(saved.won);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuess = (battalion: Battalion) => {
    const result = compareBattalions(battalion, target);
    const newGuesses = [result, ...guesses];
    setGuesses(newGuesses);

    const isWon = result.isCorrect;
    if (isWon) setWon(true);

    if (!isFreePlay) {
      saveState({
        dateKey: getTodayKey(),
        guessIds: newGuesses.map((g) => g.battalion.id),
        won: isWon,
      });
    }
  };

  const guessedIds = new Set(guesses.map((g) => g.battalion.id));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8 w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <button
            onClick={() => setShowHelp(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <h1 className="text-4xl font-black text-primary text-glow tracking-tight">
            🎖️ מטא-צה״ל
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          נחשו את הגדוד היומי — כל ניחוש חושף את הקרבה במבנה הארגוני
        </p>
      </header>

      {/* Win state */}
      {won && (
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg text-center max-w-md animate-slide-down">
          <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="text-success font-bold text-lg">מצאת!</p>
          <p className="text-foreground text-sm mt-1">
            {target.name} — {target.brigade}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            ב-{guesses.length} ניחושים
          </p>
          <button
            onClick={() => {
              const randomIndex = Math.floor(Math.random() * battalions.length);
              setTarget(battalions[randomIndex]);
              setGuesses([]);
              setWon(false);
              setIsFreePlay(true);
            }}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            שחק שוב
          </button>
        </div>
      )}

      {/* Input */}
      <GuessInput
        onGuess={handleGuess}
        disabled={won}
        guessedIds={guessedIds}
      />

      {/* Guess counter */}
      {guesses.length > 0 && !won && (
        <p className="text-muted-foreground text-sm mt-3">
          ניחושים: {guesses.length}
        </p>
      )}

      {/* Guess history */}
      <GuessHistory guesses={guesses} />

      {/* Legend */}
      <div className="mt-8 flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span>התאמה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-miss" />
          <span>לא תואם</span>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                איך משחקים?
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-secondary-foreground leading-relaxed">
              <p>
                🎯 <strong>המטרה:</strong> לנחש את הגדוד היומי של צה״ל.
              </p>
              <p>
                📝 <strong>בכל ניחוש</strong> תראו את מידת הקרבה ב-4 רמות:
              </p>
              <ul className="space-y-1 mr-4">
                <li>
                  <strong>פיקוד</strong> — צפון, מרכז, דרום
                </li>
                <li>
                  <strong>אוגדה</strong> — 36, 98, 162 וכו׳
                </li>
                <li>
                  <strong>חטיבה</strong> — גולני, צנחנים, גבעתי...
                </li>
                <li>
                  <strong>סוג</strong> — חי״ר, שריון, צנחנים, קומנדו
                </li>
              </ul>
              <p>
                🟢 <strong>ירוק</strong> = התאמה מדויקת
              </p>
              <p>
                🔴 <strong>אדום</strong> = לא תואם
              </p>
              <p className="text-muted-foreground">
                פאזל חדש כל יום! 🎖️
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
