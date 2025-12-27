"use client";

import { useEffect, useRef } from "react";
import type { RouterOutputs } from "~/trpc/react";

type FogOfWar = RouterOutputs["fogOfWar"]["get"];

interface FogOfWarLayerProps {
  fogOfWar: FogOfWar | null;
  mapWidth: number;
  mapHeight: number;
  gridSize: number;
  zoom: number;
  pan: { x: number; y: number };
  isDM: boolean;
}

export function FogOfWarLayer({
  fogOfWar,
  mapWidth,
  mapHeight,
  gridSize,
  zoom,
  pan,
  isDM,
}: FogOfWarLayerProps) {
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

    if (!fogOfWar || !isDM) {
      // If no fog of war or not DM, show everything
      return;
    }

    const revealedAreas =
      (fogOfWar.revealedAreas as Array<Array<{ x: number; y: number }>>) ??
      [];

    // Draw fog of war (dark overlay)
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out revealed areas
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(255, 255, 255, 1)";

    revealedAreas.forEach((polygon) => {
      if (polygon.length < 3) return; // Need at least 3 points for a polygon

      ctx.beginPath();
      const firstPoint = polygon[0];
      if (!firstPoint) return;
      const pixelX = firstPoint.x * gridSize * zoom + pan.x;
      const pixelY = firstPoint.y * gridSize * zoom + pan.y;
      ctx.moveTo(pixelX, pixelY);

      for (let i = 1; i < polygon.length; i++) {
        const point = polygon[i];
        if (!point) continue;
        const px = point.x * gridSize * zoom + pan.x;
        const py = point.y * gridSize * zoom + pan.y;
        ctx.lineTo(px, py);
      }

      ctx.closePath();
      ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";
  }, [fogOfWar, mapWidth, mapHeight, gridSize, zoom, pan, isDM]);

  // Only show fog of war for non-DM users
  if (isDM || !fogOfWar) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-30"
      style={{ touchAction: "none" }}
    />
  );
}

