"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface DiceRollerProps {
  sessionId: string;
}

export function DiceRoller({ sessionId }: DiceRollerProps) {
  const [notation, setNotation] = useState("d20");
  const [advantage, setAdvantage] = useState<"none" | "advantage" | "disadvantage">("none");
  const [shareInChat, setShareInChat] = useState(true);
  const [lastRoll, setLastRoll] = useState<{
    notation: string;
    rolls: number[];
    total: number;
    modifier?: number;
  } | null>(null);

  const rollMutation = api.dice.roll.useMutation({
    onSuccess: (result) => {
      setLastRoll(result);
    },
  });

  const handleRoll = () => {
    if (!notation.trim()) return;
    rollMutation.mutate({
      notation: notation.trim(),
      advantage: advantage === "advantage" ? true : undefined,
      disadvantage: advantage === "disadvantage" ? true : undefined,
      sessionId,
    });
  };

  const quickRolls = [
    { label: "d20", value: "d20" },
    { label: "d12", value: "d12" },
    { label: "d10", value: "d10" },
    { label: "d8", value: "d8" },
    { label: "d6", value: "d6" },
    { label: "d4", value: "d4" },
    { label: "2d6", value: "2d6" },
    { label: "3d6", value: "3d6" },
  ];

  return (
    <div className="rounded-lg bg-black/20 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Dice Roller</h3>

      <div className="mb-3 space-y-2">
        <input
          type="text"
          value={notation}
          onChange={(e) => setNotation(e.target.value)}
          placeholder="d20, 2d6+3, etc."
          className="w-full rounded bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleRoll();
            }
          }}
        />

        <div className="flex items-center gap-4">
          <label htmlFor="advantage-none" className="flex items-center gap-2 text-xs text-white/70">
            <input
              id="advantage-none"
              type="radio"
              checked={advantage === "none"}
              onChange={() => setAdvantage("none")}
              className="h-3 w-3"
            />
            <span>Normal</span>
          </label>
          <label htmlFor="advantage-advantage" className="flex items-center gap-2 text-xs text-white/70">
            <input
              id="advantage-advantage"
              type="radio"
              checked={advantage === "advantage"}
              onChange={() => setAdvantage("advantage")}
              className="h-3 w-3"
            />
            <span>Advantage</span>
          </label>
          <label htmlFor="advantage-disadvantage" className="flex items-center gap-2 text-xs text-white/70">
            <input
              id="advantage-disadvantage"
              type="radio"
              checked={advantage === "disadvantage"}
              onChange={() => setAdvantage("disadvantage")}
              className="h-3 w-3"
            />
            <span>Disadvantage</span>
          </label>
        </div>

        <label htmlFor="shareInChat" className="flex items-center gap-2 text-xs text-white/70">
          <input
            id="shareInChat"
            type="checkbox"
            checked={shareInChat}
            onChange={(e) => setShareInChat(e.target.checked)}
            className="h-3 w-3"
          />
          <span>Share in chat</span>
        </label>
      </div>

      <button
        onClick={handleRoll}
        disabled={rollMutation.isPending}
        className="mb-3 w-full rounded bg-[hsl(280,100%,70%)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(280,100%,60%)] disabled:opacity-50"
      >
        {rollMutation.isPending ? "Rolling..." : "Roll Dice"}
      </button>

      {lastRoll && (
        <div className="mb-3 rounded bg-white/10 p-2 text-center">
          <p className="text-xs text-white/60">{lastRoll.notation}</p>
          <p className="text-lg font-bold text-white">{lastRoll.total}</p>
          {lastRoll.rolls.length > 1 && (
            <p className="text-xs text-white/50">
              [{lastRoll.rolls.join(", ")}]
              {lastRoll.modifier !== undefined &&
                ` ${lastRoll.modifier >= 0 ? "+" : ""}${lastRoll.modifier}`}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {quickRolls.map((roll) => (
          <button
            key={roll.value}
            onClick={() => {
              setNotation(roll.value);
              rollMutation.mutate({
                notation: roll.value,
                advantage: advantage === "advantage" ? true : undefined,
                disadvantage: advantage === "disadvantage" ? true : undefined,
                sessionId,
              });
            }}
            className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
          >
            {roll.label}
          </button>
        ))}
      </div>
    </div>
  );
}

