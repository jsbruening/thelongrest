"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { MapCanvas } from "./map-canvas";
import { TokenPanel } from "./token-panel";
import { ChatPanel } from "./chat-panel";
import { MapToolbar } from "./map-toolbar";
import { InitiativeTracker } from "./initiative-tracker";
import { MapUpload } from "./map-upload";
import { useSessionEvents } from "./use-session-events";
import { EffectType } from "@prisma/client";
import type { RouterOutputs } from "~/trpc/react";

type Session = RouterOutputs["session"]["getById"];
type Map = RouterOutputs["map"]["getBySession"];
type Token = RouterOutputs["token"]["getBySession"][number];

interface SessionViewProps {
  session: Session;
  map: Map | null;
  isDM: boolean;
  userId: string;
}

export function SessionView({
  session,
  map,
  isDM,
  userId,
}: SessionViewProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<"none" | "drawing" | "fog">("none");
  const [spellEffectMode, setSpellEffectMode] = useState<EffectType | null>(null);
  const [showMapUpload, setShowMapUpload] = useState(false);

  const { data: currentMap } = api.map.getBySession.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id },
  );

  // Fetch tokens via React Query - single source of truth
  const { data: tokens = [] } = api.token.getBySession.useQuery({
    sessionId: session.id,
  });

  // Use real-time events to invalidate React Query cache
  useSessionEvents(session.id);

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-2">
        <div className="flex items-center gap-4">
          <Link
            href={`/campaigns/${session.campaignId}`}
            className="text-white/60 hover:text-white"
          >
            ← Back to Campaign
          </Link>
          <h1 className="text-xl font-bold text-white">{session.name}</h1>
          <span
            className={`rounded px-2 py-1 text-xs ${
              session.status === "ACTIVE"
                ? "bg-green-500/20 text-green-400"
                : session.status === "COMPLETED"
                  ? "bg-gray-500/20 text-gray-400"
                  : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {session.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDM && (
            <span className="rounded bg-[hsl(280,100%,70%)]/20 px-2 py-1 text-xs text-[hsl(280,100%,70%)]">
              DM
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Token Panel */}
        <div className="w-64 border-r border-white/10 bg-black/10">
          <TokenPanel
            sessionId={session.id}
            tokens={tokens}
            selectedTokenId={selectedTokenId}
            onSelectToken={setSelectedTokenId}
            isDM={isDM}
            campaignId={session.campaignId}
          />
        </div>

        {/* Center - Map Canvas */}
        <div className="relative flex-1 overflow-hidden">
          {map || currentMap ? (
            <>
              <MapCanvas
                map={(map ?? currentMap)!}
                tokens={tokens}
                selectedTokenId={selectedTokenId}
                onSelectToken={setSelectedTokenId}
                onMoveToken={(tokenId, x, y) => {
                  // This will be handled by the MapCanvas component
                }}
                isDM={isDM}
                userId={userId}
                drawingMode={drawingMode}
                spellEffectMode={spellEffectMode}
                onDrawingModeChange={setDrawingMode}
                onSpellEffectModeChange={setSpellEffectMode}
              />
              <MapToolbar
                sessionId={session.id}
                isDM={isDM}
                drawingMode={drawingMode}
                spellEffectMode={spellEffectMode}
                onDrawingModeChange={setDrawingMode}
                onSpellEffectModeChange={setSpellEffectMode}
              />
              {isDM && (
                <button
                  onClick={() => setShowMapUpload(!showMapUpload)}
                  className="absolute bottom-4 left-4 z-50 rounded bg-black/50 px-4 py-2 text-sm text-white hover:bg-black/70"
                >
                  {showMapUpload ? "Hide Upload" : "Upload Map"}
                </button>
              )}
              {showMapUpload && isDM && (
                <div className="absolute bottom-16 left-4 z-50 max-w-md rounded-lg bg-black/90 p-4 shadow-xl">
                  <MapUpload sessionId={session.id} />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-white/60">
                <p className="mb-2 text-lg">No map uploaded yet</p>
                {isDM && (
                  <>
                    {!showMapUpload ? (
                      <button
                        onClick={() => setShowMapUpload(true)}
                        className="mt-4 rounded bg-[hsl(280,100%,70%)] px-6 py-2 font-semibold text-white transition hover:bg-[hsl(280,100%,60%)]"
                      >
                        Upload Map
                      </button>
                    ) : (
                      <div className="mt-4 max-w-md rounded-lg bg-black/90 p-4">
                        <MapUpload sessionId={session.id} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat Panel */}
        <div className="w-80 border-l border-white/10 bg-black/10 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatPanel sessionId={session.id} userId={userId} />
          </div>
          <div className="border-t border-white/10 p-4">
            <InitiativeTracker sessionId={session.id} isDM={isDM} />
          </div>
        </div>
      </div>
    </div>
  );
}

