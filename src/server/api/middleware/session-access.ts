import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";

/**
 * Check if a user has access to a session.
 * 
 * A user has access if:
 * 1. They are the DM of the campaign, OR
 * 2. They have a character linked to the campaign (via CampaignCharacter), OR
 * 3. They are a direct participant in the session (via SessionParticipant)
 * 
 * @param sessionId - The session ID to check access for
 * @param userId - The user ID to check access for
 * @returns The session with campaign data if access is granted
 * @throws TRPCError with code NOT_FOUND if session doesn't exist
 * @throws TRPCError with code FORBIDDEN if user doesn't have access
 */
export async function checkSessionAccess(sessionId: string, userId: string) {
  // Fetch session with campaign data
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      campaign: true,
    },
  });

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Session not found",
    });
  }

  // Check if user is DM
  const isDM = session.campaign.dmId === userId;
  if (isDM) {
    return session;
  }

  // Check if user has a character in the campaign
  // Using CampaignCharacter join table (correct way)
  const hasCharacter = await db.campaignCharacter.findFirst({
    where: {
      campaignId: session.campaignId,
      character: {
        userId: userId,
      },
    },
  });

  if (hasCharacter) {
    return session;
  }

  // Check if user is a direct session participant
  const isParticipant = await db.sessionParticipant.findUnique({
    where: {
      sessionId_userId: {
        sessionId: sessionId,
        userId: userId,
      },
    },
  });

  if (isParticipant) {
    return session;
  }

  // No access
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You don't have access to this session",
  });
}

/**
 * Type helper for procedures that have verified session access.
 * Adds `session` and `isDM` to the context.
 */
export type SessionAccessContext = {
  session: Awaited<ReturnType<typeof checkSessionAccess>>;
  isDM: boolean;
};


