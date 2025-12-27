import { act, renderHook, waitFor } from "@testing-library/react";
import { api } from "~/trpc/react";
import { useSessionEvents } from "./use-session-events";

// Mock EventSource
global.EventSource = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  readyState: EventSource.CONNECTING,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

jest.mock("~/trpc/react", () => ({
  api: {
    useUtils: jest.fn(),
  },
}));

describe("useSessionEvents", () => {
  const sessionId = "session-1";
  const mockUtils = {
    token: {
      getBySession: {
        invalidate: jest.fn(),
      },
    },
    chat: {
      getMessages: {
        invalidate: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (api.useUtils as jest.Mock).mockReturnValue(mockUtils);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with connecting state", () => {
    const { result } = renderHook(() => useSessionEvents(sessionId));

    expect(result.current.connectionState).toBe("connecting");
    expect(global.EventSource).toHaveBeenCalledWith(`/api/sessions/${sessionId}/events`);
  });

  it("transitions to connected state on open", async () => {
    const mockEventSource = new EventSource("");
    (global.EventSource as jest.Mock).mockReturnValue(mockEventSource);

    const { result } = renderHook(() => useSessionEvents(sessionId));

    // Simulate connection open
    if (mockEventSource.onopen) {
      mockEventSource.onopen({} as Event);
    }

    await waitFor(() => {
      expect(result.current.connectionState).toBe("connected");
    });
  });

  it("invalidates token cache on token update", () => {
    const mockEventSource = new EventSource("");
    (global.EventSource as jest.Mock).mockReturnValue(mockEventSource);

    renderHook(() => useSessionEvents(sessionId));

    // Simulate token update message
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({
        data: JSON.stringify({ type: "tokens", tokens: [] }),
      } as MessageEvent);
    }

    expect(mockUtils.token.getBySession.invalidate).toHaveBeenCalledWith({ sessionId });
  });

  it("invalidates chat cache on message update", () => {
    const mockEventSource = new EventSource("");
    (global.EventSource as jest.Mock).mockReturnValue(mockEventSource);

    renderHook(() => useSessionEvents(sessionId));

    // Simulate message update
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({
        data: JSON.stringify({ type: "messages", messages: [] }),
      } as MessageEvent);
    }

    expect(mockUtils.chat.getMessages.invalidate).toHaveBeenCalledWith({ sessionId });
  });

  it("ignores ping messages", () => {
    const mockEventSource = new EventSource("");
    (global.EventSource as jest.Mock).mockReturnValue(mockEventSource);

    renderHook(() => useSessionEvents(sessionId));

    // Simulate ping message
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({
        data: JSON.stringify({ type: "ping" }),
      } as MessageEvent);
    }

    expect(mockUtils.token.getBySession.invalidate).not.toHaveBeenCalled();
    expect(mockUtils.chat.getMessages.invalidate).not.toHaveBeenCalled();
  });

  it("handles reconnection with exponential backoff", async () => {
    const mockEventSource = new EventSource("");
    (global.EventSource as jest.Mock).mockReturnValue(mockEventSource);
    Object.defineProperty(mockEventSource, "readyState", {
      get: () => EventSource.CLOSED,
      configurable: true,
    });

    renderHook(() => useSessionEvents(sessionId));

    // Wait for initial connection
    await waitFor(() => {
      expect(global.EventSource).toHaveBeenCalled();
    });

    // Simulate error - wrap in act() to handle state updates
    await act(async () => {
      if (mockEventSource.onerror) {
        mockEventSource.onerror({} as Event);
      }
    });

    // Fast-forward first retry delay (1s) - wrap in act()
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // The initial call + one retry = 2 calls
    // After error, it should retry once more
    await waitFor(() => {
      const callCount = (global.EventSource as jest.Mock).mock.calls.length;
      // Should have initial call + at least one retry
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });

  it("stops reconnecting after max retries", async () => {
    const mockEventSource = new EventSource("");
    (global.EventSource as jest.Mock).mockReturnValue(mockEventSource);
    Object.defineProperty(mockEventSource, "readyState", {
      get: () => EventSource.CLOSED,
      configurable: true,
    });

    const { result } = renderHook(() => useSessionEvents(sessionId));

    // Simulate 10 failed reconnection attempts
    await act(async () => {
      for (let i = 0; i < 11; i++) {
        if (mockEventSource.onerror) {
          mockEventSource.onerror({} as Event);
        }
        const delay = Math.min(1000 * Math.pow(2, i), 30000);
        jest.advanceTimersByTime(delay);
      }
    });

    await waitFor(() => {
      expect(result.current.connectionState).toBe("error");
    });

    // Should not attempt 11th reconnection
    expect(global.EventSource).toHaveBeenCalledTimes(11); // Initial + 10 retries
  });

  it("cleans up EventSource on unmount", () => {
    const mockEventSource = new EventSource("");
    const closeSpy = jest.spyOn(mockEventSource, "close");
    (global.EventSource as jest.Mock).mockReturnValue(mockEventSource);

    const { unmount } = renderHook(() => useSessionEvents(sessionId));

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });
});

