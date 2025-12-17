"use client";

import { useState } from "react";
import { EffectType } from "@prisma/client";
import { api } from "~/trpc/react";

interface MapToolbarProps {
  sessionId: string;
  isDM: boolean;
  onDrawingModeChange: (mode: "none" | "drawing" | "fog") => void;
  drawingMode: "none" | "drawing" | "fog";
  onSpellEffectModeChange: (type: EffectType | null) => void;
  spellEffectMode: EffectType | null;
}

export function MapToolbar({
  sessionId,
  isDM,
  onDrawingModeChange,
  drawingMode,
  onSpellEffectModeChange,
  spellEffectMode,
}: MapToolbarProps) {
  const [showSpellEffects, setShowSpellEffects] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#000000");

  const clearFogMutation = api.fogOfWar.clear.useMutation();
  const autoRevealMutation = api.vision.autoRevealFog.useMutation({
    onSuccess: () => {
      // Refresh fog of war
      window.location.reload(); // Simple refresh for now
    },
  });

  return (
    <div className="absolute left-4 top-4 flex flex-col gap-2">
      {/* Drawing Tools */}
      {isDM && (
        <>
          <div className="flex gap-2 rounded bg-black/50 p-2">
            <button
              onClick={() => {
                onDrawingModeChange(drawingMode === "drawing" ? "none" : "drawing");
                onSpellEffectModeChange(null);
              }}
              className={`rounded px-3 py-1 text-sm text-white transition ${
                drawingMode === "drawing"
                  ? "bg-[hsl(280,100%,70%)]"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              ✏️ Draw
            </button>
            <button
              onClick={() => {
                onDrawingModeChange(drawingMode === "fog" ? "none" : "fog");
                onSpellEffectModeChange(null);
              }}
              className={`rounded px-3 py-1 text-sm text-white transition ${
                drawingMode === "fog"
                  ? "bg-[hsl(280,100%,70%)]"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              👁️ Fog
            </button>
            {drawingMode === "fog" && (
              <>
                <button
                  onClick={() => {
                    autoRevealMutation.mutate({ sessionId });
                  }}
                  disabled={autoRevealMutation.isPending}
                  className="rounded bg-green-500/20 px-3 py-1 text-sm text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                >
                  {autoRevealMutation.isPending ? "Calculating..." : "Auto-Reveal"}
                </button>
                <button
                  onClick={() => {
                    clearFogMutation.mutate({ sessionId });
                  }}
                  className="rounded bg-red-500/20 px-3 py-1 text-sm text-red-400 hover:bg-red-500/30"
                >
                  Clear
                </button>
              </>
            )}
          </div>

          {drawingMode === "drawing" && (
            <div className="rounded bg-black/50 p-2">
              <input
                type="color"
                value={drawingColor}
                onChange={(e) => setDrawingColor(e.target.value)}
                className="h-8 w-16 cursor-pointer"
              />
            </div>
          )}
        </>
      )}

      {/* Spell Effects */}
      <div className="flex gap-2 rounded bg-black/50 p-2">
        <button
          onClick={() => setShowSpellEffects(!showSpellEffects)}
          className={`rounded px-3 py-1 text-sm text-white transition ${
            spellEffectMode ? "bg-[hsl(280,100%,70%)]" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          ✨ Effects
        </button>
        {showSpellEffects && (
          <div className="absolute left-0 top-12 flex flex-col gap-1 rounded bg-black/90 p-2">
            <button
              onClick={() => {
                onSpellEffectModeChange(
                  spellEffectMode === EffectType.CIRCLE ? null : EffectType.CIRCLE,
                );
                onDrawingModeChange("none");
              }}
              className={`rounded px-2 py-1 text-xs text-white ${
                spellEffectMode === EffectType.CIRCLE
                  ? "bg-[hsl(280,100%,70%)]"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Circle
            </button>
            <button
              onClick={() => {
                onSpellEffectModeChange(
                  spellEffectMode === EffectType.RECTANGLE ? null : EffectType.RECTANGLE,
                );
                onDrawingModeChange("none");
              }}
              className={`rounded px-2 py-1 text-xs text-white ${
                spellEffectMode === EffectType.RECTANGLE
                  ? "bg-[hsl(280,100%,70%)]"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Rectangle
            </button>
            <button
              onClick={() => {
                onSpellEffectModeChange(
                  spellEffectMode === EffectType.CONE ? null : EffectType.CONE,
                );
                onDrawingModeChange("none");
              }}
              className={`rounded px-2 py-1 text-xs text-white ${
                spellEffectMode === EffectType.CONE
                  ? "bg-[hsl(280,100%,70%)]"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Cone
            </button>
            <button
              onClick={() => {
                onSpellEffectModeChange(
                  spellEffectMode === EffectType.LINE ? null : EffectType.LINE,
                );
                onDrawingModeChange("none");
              }}
              className={`rounded px-2 py-1 text-xs text-white ${
                spellEffectMode === EffectType.LINE
                  ? "bg-[hsl(280,100%,70%)]"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Line
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

