import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const characterRouter = createTRPCRouter({
  // Get all characters owned by the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const characters = await ctx.db.character.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return characters;
  }),

  // Get a single character by ID (must be owned by user)
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { id: input.id },
        include: {
          campaignCharacters: {
            include: {
              campaign: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      // User can only access their own characters
      if (character.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access your own characters",
        });
      }

      return character;
    }),

  // Create a new character (user-owned)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        race: z.string().min(1),
        class: z.string().min(1),
        avatarUrl: z
          .string()
          .refine(
            (val) => {
              if (!val || val.trim() === "") return true; // Allow empty/null
              // Allow full URLs or relative paths starting with /
              return val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/");
            },
            { message: "Avatar URL must be a valid URL or relative path" },
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          race: input.race,
          class: input.class,
          avatarUrl: input.avatarUrl,
        },
      });

      return character;
    }),

  // Update a character (user-owned)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        race: z.string().min(1).optional(),
        class: z.string().min(1).optional(),
        avatarUrl: z.string().url().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { id: input.id },
      });

      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      // User can only update their own characters
      if (character.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own characters",
        });
      }

      const updated = await ctx.db.character.update({
        where: { id: input.id },
        data: {
          name: input.name,
          race: input.race,
          class: input.class,
          avatarUrl: input.avatarUrl,
        },
      });

      return updated;
    }),

  // Delete a character (user-owned)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { id: input.id },
      });

      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      // User can only delete their own characters
      if (character.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own characters",
        });
      }

      await ctx.db.character.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get characters linked to a campaign
  getByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify campaign access
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
        include: {
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
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

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

      return campaign.campaignCharacters.map((cc) => ({
        id: cc.id,
        campaignId: cc.campaignId,
        characterId: cc.characterId,
        level: cc.level,
        character: cc.character,
      }));
    }),
});
