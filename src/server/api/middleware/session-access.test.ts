import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { checkSessionAccess } from "./session-access";

jest.mock("~/server/db", () => ({
  db: {
    gameSession: {
      findUnique: jest.fn(),
    },
    campaignCharacter: {
      findFirst: jest.fn(),
    },
    sessionParticipant: {
      findUnique: jest.fn(),
    },
  },
}));

describe("checkSessionAccess", () => {
  const sessionId = "session-1";
  const userId = "user-1";
  const campaignId = "campaign-1";
  const dmId = "dm-1";

  const mockSession = {
    id: sessionId,
    campaignId,
    campaign: {
      id: campaignId,
      dmId,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws NOT_FOUND if session does not exist", async () => {
    (db.gameSession.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(checkSessionAccess(sessionId, userId)).rejects.toThrow(TRPCError);
    await expect(checkSessionAccess(sessionId, userId)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Session not found",
    });
  });

  it("grants access if user is DM", async () => {
    (db.gameSession.findUnique as jest.Mock).mockResolvedValue({
      ...mockSession,
      campaign: { ...mockSession.campaign, dmId: userId },
    });

    const result = await checkSessionAccess(sessionId, userId);

    expect(result).toBeDefined();
    expect(db.campaignCharacter.findFirst).not.toHaveBeenCalled();
    expect(db.sessionParticipant.findUnique).not.toHaveBeenCalled();
  });

  it("grants access if user has character in campaign", async () => {
    (db.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
    (db.campaignCharacter.findFirst as jest.Mock).mockResolvedValue({
      id: "cc-1",
      campaignId,
      character: { userId },
    });

    const result = await checkSessionAccess(sessionId, userId);

    expect(result).toBeDefined();
    expect(db.campaignCharacter.findFirst).toHaveBeenCalledWith({
      where: {
        campaignId,
        character: { userId },
      },
    });
    expect(db.sessionParticipant.findUnique).not.toHaveBeenCalled();
  });

  it("grants access if user is session participant", async () => {
    (db.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
    (db.campaignCharacter.findFirst as jest.Mock).mockResolvedValue(null);
    (db.sessionParticipant.findUnique as jest.Mock).mockResolvedValue({
      sessionId,
      userId,
    });

    const result = await checkSessionAccess(sessionId, userId);

    expect(result).toBeDefined();
    expect(db.sessionParticipant.findUnique).toHaveBeenCalledWith({
      where: {
        sessionId_userId: { sessionId, userId },
      },
    });
  });

  it("throws FORBIDDEN if user has no access", async () => {
    (db.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
    (db.campaignCharacter.findFirst as jest.Mock).mockResolvedValue(null);
    (db.sessionParticipant.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(checkSessionAccess(sessionId, userId)).rejects.toThrow(TRPCError);
    await expect(checkSessionAccess(sessionId, userId)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You don't have access to this session",
    });
  });

  it("checks access in correct order: DM -> Character -> Participant", async () => {
    (db.gameSession.findUnique as jest.Mock).mockResolvedValue({
      ...mockSession,
      campaign: { ...mockSession.campaign, dmId: userId },
    });

    await checkSessionAccess(sessionId, userId);

    // Should not check character or participant if DM check passes
    expect(db.campaignCharacter.findFirst).not.toHaveBeenCalled();
    expect(db.sessionParticipant.findUnique).not.toHaveBeenCalled();
  });
});






