import { z } from "zod";
import { TRPCError } from "@trpc/server";
// SessionStatus enum from Prisma schema
enum SessionStatus {
  PLANNED = "PLANNED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

import {
  createTRPCRouter,
  protectedProcedure,
  checkSessionAccess,
} from "~/server/api/trpc";

export const sessionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        name: z.string().min(1),
        scheduledAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify campaign exists and user is DM
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      if (campaign.dmId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can create sessions",
        });
      }

      const session = await ctx.db.gameSession.create({
        data: {
          campaignId: input.campaignId,
          name: input.name,
          scheduledAt: input.scheduledAt,
          status: "PLANNED",
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return session;
    }),

  getByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify campaign access
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user is DM
      const isDM = campaign.dmId === ctx.session.user.id;
      if (isDM) {
        // DM has access, continue
      } else {
        // Check if user has a character linked to this campaign
        const hasCharacter = await ctx.db.campaignCharacter.findFirst({
          where: {
            campaignId: input.campaignId,
            character: {
              userId: ctx.session.user.id,
            },
          },
        });

        if (!hasCharacter) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this campaign",
          });
        }
      }

      const sessions = await ctx.db.gameSession.findMany({
        where: { campaignId: input.campaignId },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              tokens: true,
              participants: true,
            },
          },
        },
      });

      return sessions;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.id },
        include: {
          campaign: {
            include: {
              dm: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          map: true,
          tokens: {
            include: {
              campaignCharacter: {
                include: {
                  character: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          participants: {
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

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      // Check access using helper function
      await checkSessionAccess(input.id, ctx.session.user.id);

      return session;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PLANNED", "ACTIVE", "COMPLETED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check session access and get verified session
      const verifiedSession = await checkSessionAccess(input.id, ctx.session.user.id);
      
      // Only DM can update session status
      if (verifiedSession.campaign.dmId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can update session status",
        });
      }

      const updated = await ctx.db.gameSession.update({
        where: { id: input.id },
        data: {
          status: input.status as SessionStatus,
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updated;
    }),

  join: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.id },
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

      // Check if user has a character linked to this campaign
      const campaignCharacter = await ctx.db.campaignCharacter.findFirst({
        where: {
          campaignId: session.campaignId,
          character: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!campaignCharacter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You need a character linked to this campaign to join the session",
        });
      }

      // Add or update participant
      await ctx.db.sessionParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId: input.id,
            userId: ctx.session.user.id,
          },
        },
        create: {
          sessionId: input.id,
          userId: ctx.session.user.id,
        },
        update: {},
      });

      return { success: true };
    }),
});


