"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

interface SessionEvent {
  type: "tokens" | "messages" | "ping";
  tokens?: unknown[];
  messages?: unknown[];
}

type ConnectionState = "connecting" | "connected" | "reconnecting" | "error" | "disconnected";

/**
 * Hook to manage SSE connection for real-time session updates.
 * Invalidates React Query cache when updates are received, ensuring
 * React Query is the single source of truth.
 */
export function useSessionEvents(sessionId: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const utils = api.useUtils();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const maxRetries = 10; // Max retry attempts before giving up

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
  const getRetryDelay = (attempt: number): number => {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    return delay;
  };

  const connect = () => {
    // Don't reconnect if component is unmounted
    if (!isMountedRef.current) return;

    // Don't reconnect if we've exceeded max retries
    if (retryCountRef.current >= maxRetries) {
      setConnectionState("error");
      console.error("Max reconnection attempts reached. Please refresh the page.");
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionState(retryCountRef.current > 0 ? "reconnecting" : "connecting");

    try {
      const eventSource = new EventSource(`/api/sessions/${sessionId}/events`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMountedRef.current) {
          eventSource.close();
          return;
        }
        setConnectionState("connected");
        retryCountRef.current = 0; // Reset retry count on successful connection
      };

      eventSource.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const data: SessionEvent = JSON.parse(event.data);

          // Ignore ping messages
          if (data.type === "ping") {
            return;
          }

          // Invalidate React Query cache when updates are received
          // This ensures React Query is the single source of truth
          if (data.type === "tokens") {
            utils.token.getBySession.invalidate({ sessionId });
          }

          if (data.type === "messages") {
            utils.chat.getMessages.invalidate({ sessionId });
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        if (!isMountedRef.current) return;

        // EventSource will automatically close on error
        // Check if connection is actually closed before attempting reconnect
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionState("disconnected");
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          // Schedule reconnection with exponential backoff
          const delay = getRetryDelay(retryCountRef.current);
          retryCountRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, delay);
        }
      };
    } catch (error) {
      console.error("Error creating EventSource:", error);
      setConnectionState("error");
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close EventSource connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [sessionId, utils]);

  return { connectionState };
}

