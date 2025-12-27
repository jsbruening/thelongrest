"use client";

import { useState } from "react";
import { Tile } from "~/app/_components/tile";
import { Plus, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";

type Token = RouterOutputs["token"]["getBySession"][number];

interface TokenPanelProps {
  sessionId: string;
  tokens: Token[];
  selectedTokenId: string | null;
  onSelectToken: (tokenId: string | null) => void;
  isDM: boolean;
  campaignId: string;
}

export function TokenPanel({
  sessionId,
  tokens,
  selectedTokenId,
  onSelectToken,
  isDM,
  campaignId,
}: TokenPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenSize, setNewTokenSize] = useState(1);

  const utils = api.useUtils();
  const createTokenMutation = api.token.create.useMutation({
    onSuccess: () => {
      utils.token.getBySession.invalidate({ sessionId });
      setShowCreateForm(false);
      setNewTokenName("");
      setNewTokenSize(1);
    },
  });

  const deleteTokenMutation = api.token.delete.useMutation({
    onSuccess: () => {
      utils.token.getBySession.invalidate({ sessionId });
      if (selectedTokenId) {
        onSelectToken(null);
      }
    },
  });

  api.character.getByCampaign.useQuery({
    campaignId,
  });

  const handleCreateToken = () => {
    if (!newTokenName.trim()) return;

    createTokenMutation.mutate({
      sessionId,
      name: newTokenName,
      x: 0,
      y: 0,
      size: newTokenSize,
    });
  };

  const handleDeleteToken = (tokenId: string) => {
    if (confirm("Are you sure you want to delete this token?")) {
      deleteTokenMutation.mutate({ id: tokenId });
    }
  };

  return (
    <Tile title="Tokens" size="medium" collapsible draggable className="h-full">
      <div className="flex flex-col gap-3">
        {isDM && (
          <div>
            <button
              className="app-btn app-btn-outline w-full justify-between text-xs"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="h-4 w-4" />
              New Token
            </button>

            {showCreateForm && (
              <div className="mt-3 rounded-lg border border-base-300 bg-base-200/50 p-3">
                <div className="space-y-3">
                  <div className="form-control">
                    <label className="label" htmlFor="tokenName">
                      <span className="label-text text-sm">Token Name</span>
                    </label>
                    <input
                      id="tokenName"
                      type="text"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                  <div className="form-control">
                    <label htmlFor="tokenSize" className="label">
                      <span className="label-text text-xs text-base-content/60">Size:</span>
                    </label>
                    <input
                      id="tokenSize"
                      type="number"
                      value={newTokenSize}
                      onChange={(e) => setNewTokenSize(Number(e.target.value))}
                      min={1}
                      max={4}
                      className="input input-bordered input-sm w-20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateToken}
                      disabled={!newTokenName.trim() || createTokenMutation.isPending}
                      className="app-btn app-btn-primary flex-1 justify-center text-xs"
                    >
                      {createTokenMutation.isPending ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Create"
                      )}
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="app-btn app-btn-outline flex-1 justify-center text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tokens.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-base-content/60">No tokens yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tokens.map((token) => (
              <div
                key={token.id}
                className={cn(
                  "group flex items-center justify-between rounded-md border p-2 transition-all duration-200",
                  selectedTokenId === token.id
                    ? "border-primary bg-primary/10"
                    : "border-base-300 bg-base-100 hover:bg-base-200"
                )}
              >
                <button
                  onClick={() => onSelectToken(token.id)}
                  className="flex-1 text-left"
                >
                  <div className="font-semibold text-sm">{token.name}</div>
                  <div className="mt-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="badge badge-secondary badge-sm">
                        Size {token.size}
                      </div>
                      <span className="text-xs text-base-content/60">
                        ({token.x}, {token.y})
                      </span>
                    </div>
                  </div>
                </button>
                {isDM && (
                  <button
                    className="app-btn app-btn-ghost app-btn-icon text-error opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteToken(token.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Tile>
  );
}
