"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { useSessionEvents } from "./use-session-events";
import { DiceRoller } from "./dice-roller";
import type { RouterOutputs } from "~/trpc/react";

type ChatMessage = RouterOutputs["chat"]["getMessages"]["messages"][number];

interface ChatPanelProps {
  sessionId: string;
  userId: string;
}

export function ChatPanel({ sessionId, userId }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages via React Query - single source of truth
  const { data: messagesData } = api.chat.getMessages.useQuery({
    sessionId,
    limit: 50,
  });

  // Use real-time events to invalidate React Query cache
  useSessionEvents(sessionId);

  const allMessages = messagesData?.messages ?? [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const utils = api.useUtils();
  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Invalidate messages cache to refetch with new message
      utils.chat.getMessages.invalidate({ sessionId });
      setMessage("");
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({
      sessionId,
      content: message.trim(),
      type: "TEXT",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {allMessages.length === 0 ? (
          <div className="space-y-2 text-sm text-white/60">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allMessages.map((msg: ChatMessage) => {
              const isOwnMessage = msg.userId === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? "bg-[hsl(280,100%,70%)] text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="mb-1 text-xs font-semibold opacity-70">
                        {msg.user.name ?? msg.user.email}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwnMessage ? "opacity-70" : "opacity-50"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <DiceRoller sessionId={sessionId} />
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            className="flex-1 rounded bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50"
          />
          <button
            onClick={handleSendMessage}
            className="rounded bg-[hsl(280,100%,70%)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(280,100%,60%)]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

