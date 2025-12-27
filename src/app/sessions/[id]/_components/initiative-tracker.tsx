"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface InitiativeTrackerProps {
  sessionId: string;
  isDM: boolean;
}

export function InitiativeTracker({ sessionId, isDM }: InitiativeTrackerProps) {
  const [initiatives, setInitiatives] = useState<
    Record<string, number>
  >({});
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);

  const { data: tokens } = api.token.getBySession.useQuery({ sessionId });

  const sortedTokens = tokens
    ? [...tokens].sort((a, b) => {
        const initA = initiatives[a.id] ?? 0;
        const initB = initiatives[b.id] ?? 0;
        if (initB !== initA) {
          return initB - initA;
        }
        return a.name.localeCompare(b.name);
      })
    : [];

  const handleSetInitiative = (tokenId: string, value: number) => {
    setInitiatives((prev) => ({ ...prev, [tokenId]: value }));
  };

  const handleNextTurn = () => {
    if (sortedTokens.length === 0) return;
    setCurrentTurn((prev) => (prev + 1) % sortedTokens.length);
    if (currentTurn === sortedTokens.length - 1) {
      setRound((prev) => prev + 1);
    }
  };

  const handlePreviousTurn = () => {
    if (sortedTokens.length === 0) return;
    setCurrentTurn((prev) => {
      const newTurn = prev - 1;
      if (newTurn < 0) {
        setRound((r) => Math.max(1, r - 1));
        return sortedTokens.length - 1;
      }
      return newTurn;
    });
  };

  if (!tokens || tokens.length === 0) {
    return (
      <div className="rounded-lg bg-black/20 p-4">
        <h3 className="mb-2 text-sm font-semibold text-white">
          Initiative Tracker
        </h3>
        <p className="text-xs text-white/60">No tokens in session</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Initiative</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Round {round}</span>
          <button
            onClick={handlePreviousTurn}
            className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
          >
            ←
          </button>
          <button
            onClick={handleNextTurn}
            className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
          >
            →
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {sortedTokens.map((token, index) => {
          const initiative = initiatives[token.id] ?? 0;
          const isCurrentTurn = index === currentTurn;

          return (
            <div
              key={token.id}
              className={`flex items-center gap-2 rounded p-2 ${
                isCurrentTurn
                  ? "bg-[hsl(280,100%,70%)]/30"
                  : "bg-white/5"
              }`}
            >
              {isCurrentTurn && (
                <span className="text-[hsl(280,100%,70%)]">▶</span>
              )}
              <div className="flex-1">
                <p className="text-xs font-medium text-white">{token.name}</p>
              </div>
              {isDM ? (
                <input
                  type="number"
                  value={initiative}
                  onChange={(e) =>
                    handleSetInitiative(token.id, Number(e.target.value))
                  }
                  className="w-16 rounded bg-white/10 px-2 py-1 text-xs text-white"
                  placeholder="Init"
                />
              ) : (
                <span className="text-xs text-white/60">{initiative || "-"}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

