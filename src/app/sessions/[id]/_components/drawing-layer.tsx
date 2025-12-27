"use client";

import { useEffect, useRef } from "react";
import type { RouterOutputs } from "~/trpc/react";

type Drawing = RouterOutputs["drawing"]["getBySession"][number];

interface DrawingLayerProps {
  drawings: Drawing[];
  gridSize: number;
  zoom: number;
  pan: { x: number; y: number };
}

export function DrawingLayer({
  drawings,
  gridSize,
  zoom,
  pan,
}: DrawingLayerProps) {
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

    // Draw all drawings
    drawings.forEach((drawing) => {
      const path = drawing.path as Array<{ x: number; y: number }>;
      if (path.length < 2) return;

      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.strokeWidth * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      const firstPoint = path[0];
      if (!firstPoint) return;
      const pixelX = firstPoint.x * gridSize * zoom + pan.x;
      const pixelY = firstPoint.y * gridSize * zoom + pan.y;
      ctx.moveTo(pixelX, pixelY);

      for (let i = 1; i < path.length; i++) {
        const point = path[i];
        if (!point) continue;
        const px = point.x * gridSize * zoom + pan.x;
        const py = point.y * gridSize * zoom + pan.y;
        ctx.lineTo(px, py);
      }

      ctx.stroke();
    });
  }, [drawings, gridSize, zoom, pan]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20"
      style={{ touchAction: "none" }}
    />
  );
}

