"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { FogOfWarLayer } from "./fog-of-war-layer";
import { DrawingLayer } from "./drawing-layer";
import { SpellEffectsLayer } from "./spell-effects-layer";
// EffectType enum from Prisma schema
enum EffectType {
  CIRCLE = "CIRCLE",
  SPHERE = "SPHERE",
  CONE = "CONE",
  RECTANGLE = "RECTANGLE",
  LINE = "LINE",
}

type Map = RouterOutputs["map"]["getBySession"];
type Token = RouterOutputs["token"]["getBySession"][number];

interface MapCanvasProps {
  map: Map;
  tokens: Token[];
  selectedTokenId: string | null;
  onSelectToken: (tokenId: string | null) => void;
  onMoveToken: (tokenId: string, x: number, y: number) => void;
  isDM: boolean;
  userId: string;
  drawingMode: "none" | "drawing" | "fog";
  spellEffectMode: EffectType | null;
  onDrawingModeChange: (mode: "none" | "drawing" | "fog") => void;
  onSpellEffectModeChange: (type: EffectType | null) => void;
}

export function MapCanvas({
  map,
  tokens,
  selectedTokenId,
  onSelectToken,
  onMoveToken,
  isDM,
  userId,
  drawingMode,
  spellEffectMode,
  onDrawingModeChange: _onDrawingModeChange,
  onSpellEffectModeChange: _onSpellEffectModeChange,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [localTokenPositions, setLocalTokenPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [currentDrawingPath, setCurrentDrawingPath] = useState<Array<{ x: number; y: number }>>([]);
  const [drawingColor] = useState("#000000"); // Color picker will be in toolbar

  if (!map) {
    return <div className="flex h-full items-center justify-center text-white">No map loaded</div>;
  }

  const utils = api.useUtils();
  const moveTokenMutation = api.token.update.useMutation({
    onMutate: async ({ id, x, y }) => {
      // Cancel outgoing refetches
      await utils.token.getBySession.cancel({ sessionId: map.sessionId });

      // Snapshot previous value
      const previousTokens = utils.token.getBySession.getData({
        sessionId: map.sessionId,
      });

      // Optimistically update
      if (previousTokens) {
        utils.token.getBySession.setData(
          { sessionId: map.sessionId },
          previousTokens.map((token) =>
            token.id === id ? { ...token, x: x ?? token.x, y: y ?? token.y } : token,
          ),
        );
      }

      return { previousTokens };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTokens) {
        utils.token.getBySession.setData(
          { sessionId: map.sessionId },
          context.previousTokens,
        );
      }
    },
    onSuccess: () => {
      // Real-time updates will handle the final state
      utils.token.getBySession.invalidate({ sessionId: map.sessionId });
    },
  });

  const gridSize = map.gridSize;
  const mapWidth = map.width;
  const mapHeight = map.height;

  // Convert grid coordinates to canvas pixels
  const gridToPixel = useCallback(
    (gridX: number, gridY: number) => {
      return {
        x: gridX * gridSize * zoom + pan.x,
        y: gridY * gridSize * zoom + pan.y,
      };
    },
    [gridSize, zoom, pan],
  );

  // Convert canvas pixels to grid coordinates
  const pixelToGrid = useCallback(
    (pixelX: number, pixelY: number) => {
      return {
        x: Math.floor((pixelX - pan.x) / (gridSize * zoom)),
        y: Math.floor((pixelY - pan.y) / (gridSize * zoom)),
      };
    },
    [gridSize, zoom, pan],
  );

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    const gridPixelSize = gridSize * zoom;
    const startX = Math.floor(-pan.x / gridPixelSize);
    const startY = Math.floor(-pan.y / gridPixelSize);
    const endX = Math.ceil((canvas.width - pan.x) / gridPixelSize);
    const endY = Math.ceil((canvas.height - pan.y) / gridPixelSize);

    for (let x = startX; x <= endX; x++) {
      ctx.beginPath();
      ctx.moveTo(x * gridPixelSize + pan.x, 0);
      ctx.lineTo(x * gridPixelSize + pan.x, canvas.height);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * gridPixelSize + pan.y);
      ctx.lineTo(canvas.width, y * gridPixelSize + pan.y);
      ctx.stroke();
    }

    // Draw map image
    if (map.imagePath) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(
          img,
          pan.x,
          pan.y,
          mapWidth * zoom,
          mapHeight * zoom,
        );
        drawTokens(ctx);
      };
      img.onerror = () => {
        console.error("Failed to load map image");
        drawTokens(ctx);
      };
      // Convert file path to URL (assuming images are served from /uploads)
      const relativePath = map.imagePath.includes("uploads/")
        ? map.imagePath.split("uploads/")[1]
        : map.imagePath;
      const imageUrl = `/api/uploads/${relativePath}`;
      img.src = imageUrl;
    } else {
      drawTokens(ctx);
    }

    function drawTokens(ctx: CanvasRenderingContext2D) {
      // Draw tokens
      tokens.forEach((token) => {
        // Use local position if token is being dragged, otherwise use server position
        const position =
          draggedTokenId === token.id && localTokenPositions[token.id]
            ? (localTokenPositions[token.id] ?? { x: token.x, y: token.y })
            : { x: token.x, y: token.y };
        const pixelPos = gridToPixel(position.x, position.y);
        const tokenSize = token.size * gridSize * zoom;

        // Token circle
        ctx.fillStyle =
          selectedTokenId === token.id
            ? "rgba(147, 51, 234, 0.8)"
            : "rgba(59, 130, 246, 0.8)";
        ctx.beginPath();
        ctx.arc(
          pixelPos.x + tokenSize / 2,
          pixelPos.y + tokenSize / 2,
          tokenSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Token border
        ctx.strokeStyle =
          selectedTokenId === token.id ? "#9333ea" : "#3b82f6";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Token name
        ctx.fillStyle = "white";
        ctx.font = `${12 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(
          token.name,
          pixelPos.x + tokenSize / 2,
          pixelPos.y + tokenSize + 15 * zoom,
        );
      });
    }
  }, [
    map,
    tokens,
    selectedTokenId,
    pan,
    zoom,
    gridSize,
    mapWidth,
    mapHeight,
    gridToPixel,
    draggedTokenId,
    localTokenPositions,
    currentDrawingPath,
    drawingMode,
    drawingColor,
  ]);

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on a token
      let clickedToken: Token | null = null;
      for (const token of tokens) {
        // Use local position if available, otherwise server position
        const position =
          localTokenPositions[token.id] ?? { x: token.x, y: token.y };
        const pixelPos = gridToPixel(position.x, position.y);
        const tokenSize = token.size * gridSize * zoom;
        const distance = Math.sqrt(
          Math.pow(x - (pixelPos.x + tokenSize / 2), 2) +
            Math.pow(y - (pixelPos.y + tokenSize / 2), 2),
        );
        if (distance <= tokenSize / 2) {
          clickedToken = token;
          break;
        }
      }

      if (clickedToken && isDM) {
        setDraggedTokenId(clickedToken.id);
        onSelectToken(clickedToken.id);
        setIsDragging(true);
        setDragStart({ x, y });
      } else if (isDM) {
        // Pan the map
        setIsDragging(true);
        setDragStart({ x: x - pan.x, y: y - pan.y });
      } else {
        onSelectToken(null);
      }
    },
    [
      tokens,
      gridToPixel,
      gridSize,
      zoom,
      isDM,
      pan,
      onSelectToken,
      userId,
      localTokenPositions,
      drawingMode,
      spellEffectMode,
      pixelToGrid,
      map.sessionId,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (drawingMode === "drawing" || drawingMode === "fog") {
        // Continue drawing path
        const gridPos = pixelToGrid(x, y);
        setCurrentDrawingPath((prev) => [...prev, { x: gridPos.x, y: gridPos.y }]);
        return;
      }

      if (draggedTokenId) {
        // Move token
        const gridPos = pixelToGrid(x, y);
        const token = tokens.find((t) => t.id === draggedTokenId);
        if (token) {
          // Snap to grid
          const snappedX = Math.max(
            0,
            Math.min(gridPos.x, Math.floor(mapWidth / gridSize) - token.size),
          );
          const snappedY = Math.max(
            0,
            Math.min(gridPos.y, Math.floor(mapHeight / gridSize) - token.size),
          );
          // Update local position for smooth dragging
          setLocalTokenPositions((prev) => ({
            ...prev,
            [draggedTokenId]: { x: snappedX, y: snappedY },
          }));
          onMoveToken(draggedTokenId, snappedX, snappedY);
        }
      } else if (isDM && !spellEffectMode) {
        // Pan map (only if not in drawing/spell effect mode)
        setPan({
          x: x - dragStart.x,
          y: y - dragStart.y,
        });
      }
    },
    [
      isDragging,
      drawingMode,
      draggedTokenId,
      tokens,
      pixelToGrid,
      gridSize,
      mapWidth,
      mapHeight,
      isDM,
      dragStart,
      onMoveToken,
      spellEffectMode,
    ],
  );

  const handleMouseUp = useCallback(() => {
    // Handle drawing completion
    if (drawingMode === "drawing" && currentDrawingPath.length > 1) {
      createDrawingMutation.mutate({
        sessionId: map.sessionId,
        path: currentDrawingPath,
        color: drawingColor,
        strokeWidth: 2,
      });
      setCurrentDrawingPath([]);
    }

    // Handle fog of war reveal
    if (drawingMode === "fog" && currentDrawingPath.length >= 3 && isDM) {
      revealFogMutation.mutate({
        sessionId: map.sessionId,
        polygon: currentDrawingPath,
      });
      setCurrentDrawingPath([]);
    }

    if (draggedTokenId) {
      // Save token position
      const finalPosition = localTokenPositions[draggedTokenId];
      if (finalPosition) {
        moveTokenMutation.mutate({
          id: draggedTokenId,
          x: finalPosition.x,
          y: finalPosition.y,
        });
        // Clear local position after saving
        setLocalTokenPositions((prev) => {
          const next = { ...prev };
          delete next[draggedTokenId];
          return next;
        });
      }
    }
    setIsDragging(false);
    setDraggedTokenId(null);
  }, [
    drawingMode,
    currentDrawingPath,
    map.sessionId,
    drawingColor,
    isDM,
    draggedTokenId,
    localTokenPositions,
    moveTokenMutation,
  ]);

  // Zoom controls
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.5, Math.min(2, prev * delta)));
    },
    [],
  );

  // Fetch fog of war, drawings, and spell effects
  const { data: fogOfWar } = api.fogOfWar.get.useQuery(
    { sessionId: map.sessionId },
    { enabled: !!map.sessionId },
  );
  const { data: drawings = [] } = api.drawing.getBySession.useQuery(
    { sessionId: map.sessionId },
    { enabled: !!map.sessionId },
  );
  const { data: spellEffects = [] } = api.spellEffect.getBySession.useQuery(
    { sessionId: map.sessionId },
    { enabled: !!map.sessionId },
  );

  const createDrawingMutation = api.drawing.create.useMutation();
  const revealFogMutation = api.fogOfWar.revealArea.useMutation();

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="cursor-move"
      />
      {/* Drawing Layer */}
      <DrawingLayer
        drawings={drawings}
        gridSize={gridSize}
        zoom={zoom}
        pan={pan}
      />
      {/* Spell Effects Layer */}
      <SpellEffectsLayer
        effects={spellEffects}
        gridSize={gridSize}
        zoom={zoom}
        pan={pan}
      />
      {/* Fog of War Layer */}
      <FogOfWarLayer
        fogOfWar={fogOfWar ?? null}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        gridSize={gridSize}
        zoom={zoom}
        pan={pan}
        isDM={isDM}
      />
      {/* Zoom controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
          className="rounded bg-black/50 px-3 py-1 text-white hover:bg-black/70"
        >
          +
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
          className="rounded bg-black/50 px-3 py-1 text-white hover:bg-black/70"
        >
          −
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="rounded bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

