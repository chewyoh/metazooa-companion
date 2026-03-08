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
import { OrgTree } from "@/components/OrgTree";
import { Trophy, HelpCircle, X, RefreshCw, Gamepad2, Network, Share2, Flame } from "lucide-react";
import { toast } from "sonner";
import { classificationLevels } from "@/data/idfUnits";

const STORAGE_KEY = "idf-game-state";
const STREAK_KEY = "idf-streak";

interface GameState {
  dateKey: string;
  guessIds: string[];
  won: boolean;
  targetId?: string;
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

interface StreakData {
  current: number;
  max: number;
  lastWinDate: string;
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, max: 0, lastWinDate: "" };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { current: 0, max: 0, lastWinDate: "" };
  }
}

function updateStreak(won: boolean): StreakData {
  const streak = loadStreak();
  const today = getTodayKey();

  if (streak.lastWinDate === today) return streak; // already recorded today

  if (won) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    const newCurrent = streak.lastWinDate === yesterdayKey ? streak.current + 1 : 1;
    const newMax = Math.max(newCurrent, streak.max);
    const updated: StreakData = { current: newCurrent, max: newMax, lastWinDate: today };
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
  } else {
    const updated: StreakData = { current: 0, max: streak.max, lastWinDate: streak.lastWinDate };
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
  }
}

const Index = () => {
  const [target, setTarget] = useState<Battalion>(() => {
    const saved = loadState();
    if (saved?.targetId) {
      const found = battalions.find((b) => b.id === saved.targetId);
      if (found) return found;
    }
    return getDailyBattalion();
  });
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFreePlay, setIsFreePlay] = useState(false);
  const [activeTab, setActiveTab] = useState<"game" | "tree">("game");
  const [streak, setStreak] = useState<StreakData>(() => loadStreak());

  // Load saved state only for daily mode
  useEffect(() => {
    if (isFreePlay) return;
    const saved = loadState();
    if (saved) {
      const savedTarget = saved.targetId
        ? battalions.find((b) => b.id === saved.targetId)
        : null;
      const currentTarget = savedTarget || target;
      if (savedTarget) setTarget(savedTarget);

      const results: GuessResult[] = saved.guessIds
        .map((id: string) => {
          const b = battalions.find((bn) => bn.id === id);
          if (!b) return null;
          return compareBattalions(b, currentTarget);
        })
        .filter(Boolean) as GuessResult[];
      setGuesses(results);
      setWon(saved.won);
      if (!saved.won && results.length >= 10) setLost(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuess = (battalion: Battalion) => {
    const result = compareBattalions(battalion, target);
    const newGuesses = [result, ...guesses];
    setGuesses(newGuesses);

    const isWon = result.isCorrect;
    const isLost = !isWon && newGuesses.length >= 10;
    if (isWon) {
      setWon(true);
      if (!isFreePlay) setStreak(updateStreak(true));
    } else if (isLost) {
      setLost(true);
      if (!isFreePlay) setStreak(updateStreak(false));
    }

    if (!isFreePlay) {
      saveState({
        dateKey: getTodayKey(),
        guessIds: newGuesses.map((g) => g.battalion.id),
        won: isWon,
        targetId: target.id,
      });
    }
  };

  const guessedIds = new Set(guesses.map((g) => g.battalion.id));

  const handleShare = () => {
    const reversedGuesses = [...guesses].reverse();
    const grid = reversedGuesses
      .map((g) =>
        classificationLevels
          .map((level) => (g.matches[level.key] ? "🟩" : "🟥"))
          .join("")
      )
      .join("\n");

    const status = won ? `✅ ב-${guesses.length}/10 ניחושים` : "❌ לא הצלחתי";
    const text = `🎖️ צה"לל - IDFle\n${status}\n\n${grid}\n\nhttps://idfle.lovable.app`;

    navigator.clipboard.writeText(text).then(() => {
      toast.success("התוצאה הועתקה! שתף עם חברים 🎖️");
    }).catch(() => {
      toast.error("לא הצלחנו להעתיק");
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="text-center mb-6 w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <button
            onClick={() => setShowHelp(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <h1 className="text-4xl font-black text-primary text-glow tracking-tight">
            🎖️ צה"לל - IDFle
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          נחשו את הגדוד היומי — כל ניחוש חושף את הקרבה במבנה הארגוני
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-full max-w-xs">
        <button
          onClick={() => setActiveTab("game")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === "game"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          משחק
        </button>
        <button
          onClick={() => setActiveTab("tree")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === "tree"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Network className="w-4 h-4" />
          מבנה ארגוני
        </button>
      </div>

      {activeTab === "game" ? (
        <>
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
                  setLost(false);
                  setIsFreePlay(true);
                }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                שחק שוב
              </button>
              <button
                onClick={handleShare}
                className="mt-3 mr-2 inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                שתף תוצאה
              </button>
            </div>
          )}

          {/* Lose state */}
          {lost && !won && (
            <div className="mb-6 p-4 bg-miss/10 border border-miss/30 rounded-lg text-center max-w-md animate-slide-down">
              <p className="text-miss font-bold text-lg">הפסדת! 😞</p>
              <p className="text-foreground text-sm mt-1">
                הגדוד היומי היה: <strong>{target.name}</strong> ({target.number})
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {target.brigade} — {target.command}
              </p>
              <button
                onClick={() => {
                  const randomIndex = Math.floor(Math.random() * battalions.length);
                  setTarget(battalions[randomIndex]);
                  setGuesses([]);
                  setWon(false);
                  setLost(false);
                  setIsFreePlay(true);
                }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                שחק שוב
              </button>
              <button
                onClick={handleShare}
                className="mt-3 mr-2 inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                שתף תוצאה
              </button>
            </div>
          )}

          <GuessInput
            onGuess={handleGuess}
            disabled={won || lost}
            guessedIds={guessedIds}
          />

          {guesses.length > 0 && !won && !lost && (
            <p className="text-muted-foreground text-sm mt-3">
              ניחושים: {guesses.length}/10
            </p>
          )}

          <GuessHistory guesses={guesses} />

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
        </>
      ) : (
        <OrgTree onBattalionClick={(battalion) => {
          if (!won && !lost && !guessedIds.has(battalion.id)) {
            setActiveTab("game");
            handleGuess(battalion);
          }
        }} />
      )}

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
                📝 <strong>בכל ניחוש</strong> תראו את מידת הקרבה ב-3 רמות:
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
