"use client";

import { useEffect, useRef } from "react";
import type { RouterOutputs } from "~/trpc/react";
// EffectType enum from Prisma schema
enum EffectType {
  CIRCLE = "CIRCLE",
  SPHERE = "SPHERE",
  CONE = "CONE",
  RECTANGLE = "RECTANGLE",
  LINE = "LINE",
}

type SpellEffect = RouterOutputs["spellEffect"]["getBySession"][number];

interface SpellEffectsLayerProps {
  effects: SpellEffect[];
  gridSize: number;
  zoom: number;
  pan: { x: number; y: number };
}

export function SpellEffectsLayer({
  effects,
  gridSize,
  zoom,
  pan,
}: SpellEffectsLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const container = canvas.parentElement;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all spell effects
    effects.forEach((effect) => {
      const pixelX = effect.x * gridSize * zoom + pan.x;
      const pixelY = effect.y * gridSize * zoom + pan.y;

      ctx.fillStyle = effect.color;
      ctx.globalAlpha = effect.opacity;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2 * zoom;

      switch (effect.type) {
        case EffectType.CIRCLE:
        case EffectType.SPHERE:
          if (effect.radius) {
            const radius = effect.radius * gridSize * zoom;
            ctx.beginPath();
            ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.stroke();
          }
          break;

        case EffectType.RECTANGLE:
          if (effect.width && effect.height) {
            const width = effect.width * gridSize * zoom;
            const height = effect.height * gridSize * zoom;
            ctx.fillRect(
              pixelX - width / 2,
              pixelY - height / 2,
              width,
              height,
            );
            ctx.globalAlpha = 1;
            ctx.strokeRect(
              pixelX - width / 2,
              pixelY - height / 2,
              width,
              height,
            );
          }
          break;

        case EffectType.CONE:
          if (effect.width && effect.angle) {
            ctx.save();
            ctx.translate(pixelX, pixelY);
            ctx.rotate((effect.angle * Math.PI) / 180);
            const radius = effect.width * gridSize * zoom;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, -Math.PI / 4, Math.PI / 4);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.stroke();
            ctx.restore();
          }
          break;

        case EffectType.LINE:
          if (effect.width) {
            const length = effect.width * gridSize * zoom;
            ctx.beginPath();
            ctx.moveTo(pixelX, pixelY);
            ctx.lineTo(pixelX + length, pixelY);
            ctx.globalAlpha = 1;
            ctx.stroke();
          }
          break;
      }

      ctx.globalAlpha = 1;
    });
  }, [effects, gridSize, zoom, pan]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-25"
      style={{ touchAction: "none" }}
    />
  );
}

