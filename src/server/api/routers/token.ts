import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  sessionAccessProcedure,
  checkSessionAccess,
} from "~/server/api/trpc";

export const tokenRouter = createTRPCRouter({
  create: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        name: z.string().min(1),
        x: z.number(),
        y: z.number(),
        size: z.number().int().min(1).default(1),
        visionRadius: z.number().optional(),
        hasDarkvision: z.boolean().default(false),
        imageUrl: z.string().optional(),
        characterId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure
      // ctx.verifiedSession and ctx.isDM are available

      // If characterId is provided, verify it exists and belongs to the campaign
      if (input.characterId) {
        const character = await ctx.db.character.findUnique({
          where: { id: input.characterId },
        });

        if (!character || character.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid character or character doesn't belong to you",
          });
        }

        // Verify character is linked to this campaign
        const campaignCharacter = await ctx.db.campaignCharacter.findUnique({
          where: {
            campaignId_characterId: {
              campaignId: ctx.verifiedSession.campaignId,
              characterId: input.characterId,
            },
          },
        });

        if (!campaignCharacter) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Character is not linked to this campaign",
          });
        }
      }

      const token = await ctx.db.token.create({
        data: {
          sessionId: input.sessionId,
          name: input.name,
          x: input.x,
          y: input.y,
          size: input.size,
          visionRadius: input.visionRadius,
          hasDarkvision: input.hasDarkvision,
          imageUrl: input.imageUrl,
          characterId: input.characterId,
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

      return token;
    }),

  getBySession: sessionAccessProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const tokens = await ctx.db.token.findMany({
        where: { sessionId: input.sessionId },
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
        orderBy: {
          createdAt: "asc",
        },
      });

      return tokens;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        size: z.number().int().min(1).optional(),
        visionRadius: z.number().optional(),
        hasDarkvision: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const token = await ctx.db.token.findUnique({
        where: { id: input.id },
        include: {
          session: {
            include: {
              campaign: true,
            },
          },
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      // Check session access using helper function
      await checkSessionAccess(token.sessionId, ctx.session.user.id);
      const isDM = token.session.campaign.dmId === ctx.session.user.id;

      // Check access: DM can update any token, players can only update their own character's token
      const isOwner =
        token.characterId &&
        (await ctx.db.character.findUnique({
          where: { id: token.characterId },
        }))?.userId === ctx.session.user.id;

      if (!isDM && !isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own tokens",
        });
      }

      const updated = await ctx.db.token.update({
        where: { id: input.id },
        data: {
          name: input.name,
          x: input.x,
          y: input.y,
          size: input.size,
          visionRadius: input.visionRadius,
          hasDarkvision: input.hasDarkvision,
          imageUrl: input.imageUrl,
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

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const token = await ctx.db.token.findUnique({
        where: { id: input.id },
        include: {
          session: {
            include: {
              campaign: true,
            },
          },
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      // Check session access using helper function
      await checkSessionAccess(token.sessionId, ctx.session.user.id);
      const isDM = token.session.campaign.dmId === ctx.session.user.id;

      // Only DM can delete tokens
      if (!isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can delete tokens",
        });
      }

      await ctx.db.token.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
