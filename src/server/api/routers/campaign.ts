import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const campaignRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          dmId: ctx.session.user.id,
        },
        include: {
          dm: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return campaign;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.campaign.findMany({
      where: {
        OR: [
          { dmId: ctx.session.user.id },
          {
            campaignCharacters: {
              some: {
                character: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        ],
      },
      include: {
        dm: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            campaignCharacters: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return campaigns;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          dm: {
            select: {
              id: true,
              name: true,
              displayName: true,
              email: true,
              image: true,
            },
          },
          sessions: {
            orderBy: {
              createdAt: "desc",
            },
          },
          campaignCharacters: {
            include: {
              character: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      displayName: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user has access (DM or has characters linked)
      const hasAccess =
        campaign.dmId === ctx.session.user.id ||
        campaign.campaignCharacters.some(
          (cc) => cc.character.userId === ctx.session.user.id,
        );

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this campaign",
        });
      }

      return campaign;
    }),

  // Link characters to a campaign (when joining)
  linkCharacters: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        characterIds: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Verify all characters belong to the user
      const characters = await ctx.db.character.findMany({
        where: {
          id: { in: input.characterIds },
          userId: ctx.session.user.id,
        },
      });

      if (characters.length !== input.characterIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "All characters must belong to you",
        });
      }

      // Create CampaignCharacter links (skip if already exists)
      const links = await Promise.all(
        input.characterIds.map((characterId) =>
          ctx.db.campaignCharacter.upsert({
            where: {
              campaignId_characterId: {
                campaignId: input.campaignId,
                characterId,
              },
            },
            create: {
              campaignId: input.campaignId,
              characterId,
              level: 1, // Default level
            },
            update: {}, // Don't update if exists
          }),
        ),
      );

      return links;
    }),

  // Unlink a character from a campaign
  unlinkCharacter: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        characterId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Only DM or character owner can unlink
      const campaignCharacter = await ctx.db.campaignCharacter.findUnique({
        where: {
          campaignId_characterId: {
            campaignId: input.campaignId,
            characterId: input.characterId,
          },
        },
        include: {
          character: true,
        },
      });

      if (!campaignCharacter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not linked to this campaign",
        });
      }

      if (
        campaign.dmId !== ctx.session.user.id &&
        campaignCharacter.character.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only unlink your own characters",
        });
      }

      await ctx.db.campaignCharacter.delete({
        where: {
          campaignId_characterId: {
            campaignId: input.campaignId,
            characterId: input.characterId,
          },
        },
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is DM
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
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
          message: "Only the DM can update this campaign",
        });
      }

      const updated = await ctx.db.campaign.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return updated;
    }),
});


