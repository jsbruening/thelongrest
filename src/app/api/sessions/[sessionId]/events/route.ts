import { NextRequest } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { checkSessionAccess } from "~/server/api/middleware/session-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await auth();
  const { sessionId } = await params;

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify session access using centralized helper
  try {
    await checkSessionAccess(sessionId, session.user.id);
  } catch (error) {
    // checkSessionAccess throws TRPCError which has a code property
    if (error && typeof error === "object" && "code" in error) {
      const code = error.code as string;
      if (code === "NOT_FOUND") {
        return new Response("Session not found", { status: 404 });
      }
      if (code === "FORBIDDEN") {
        return new Response("Forbidden", { status: 403 });
      }
    }
    console.error("Error checking session access:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Poll database for changes and send updates
      let lastTokenUpdate = new Date();
      let lastChatUpdate = new Date();

      const pollInterval = setInterval(async () => {
        try {
          // Check for token updates
          const recentTokens = await db.token.findMany({
            where: {
              sessionId,
              updatedAt: { gt: lastTokenUpdate },
            },
            include: {
              character: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          });

          if (recentTokens.length > 0) {
            send({
              type: "tokens",
              tokens: recentTokens,
            });
            lastTokenUpdate = new Date();
          }

          // Check for chat updates
          const recentMessages = await db.chatMessage.findMany({
            where: {
              sessionId,
              createdAt: { gt: lastChatUpdate },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          });

          if (recentMessages.length > 0) {
            send({
              type: "messages",
              messages: recentMessages,
            });
            lastChatUpdate = new Date();
          }
        } catch (error) {
          console.error("Error polling for updates:", error);
        }
      }, 500); // Poll every 500ms for near real-time updates

      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        send({ type: "ping" });
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        clearInterval(pingInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

