import { GuessResult, classificationLevels } from "@/data/idfUnits";

interface GuessHistoryProps {
  guesses: GuessResult[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-sm font-bold text-muted-foreground text-right border-b border-border">
              ניחוש
            </th>
            {classificationLevels.map((level) => (
              <th
                key={level.key}
                className="px-3 py-2 text-sm font-bold text-muted-foreground text-center border-b border-border"
              >
                {level.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guesses.map((guess, rowIdx) => (
            <tr
              key={guess.battalion.id + rowIdx}
              className="animate-slide-down"
              style={{ animationDelay: `${rowIdx * 0.05}s` }}
            >
              <td
                className={`px-3 py-3 text-sm font-semibold text-right border-b border-border/50 ${
                  guess.isCorrect
                    ? "text-success"
                    : "text-foreground"
                }`}
              >
                <div>{guess.battalion.name} <span className="text-muted-foreground font-normal">({guess.battalion.number})</span></div>
                <div className="text-xs text-muted-foreground font-normal">
                  {guess.battalion.brigade} ({guess.battalion.brigadeNumber})
                </div>
              </td>
              {classificationLevels.map((level, colIdx) => {
                const match = guess.matches[level.key];
                const value =
                  level.key === "command"
                    ? guess.battalion.command
                    : level.key === "division"
                    ? guess.battalion.division
                    : guess.battalion.brigade;

                return (
                  <td
                    key={level.key}
                    className={`px-3 py-3 text-xs text-center border-b border-border/50 font-medium ${
                      match ? "cell-correct" : "cell-miss"
                    }`}
                    style={{
                      animationDelay: `${rowIdx * 0.05 + colIdx * 0.1}s`,
                    }}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
