import { z } from "zod";
import { TRPCError } from "@trpc/server";
// EffectType enum from Prisma schema
enum EffectType {
  CIRCLE = "CIRCLE",
  SPHERE = "SPHERE",
  CONE = "CONE",
  RECTANGLE = "RECTANGLE",
  LINE = "LINE",
}

import {
  createTRPCRouter,
  protectedProcedure,
  sessionAccessProcedure,
  checkSessionAccess,
} from "~/server/api/trpc";

export const spellEffectRouter = createTRPCRouter({
  create: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        type: z.nativeEnum(EffectType),
        x: z.number(),
        y: z.number(),
        radius: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        angle: z.number().optional(),
        color: z.string().default("#ff0000"),
        opacity: z.number().min(0).max(1).default(0.3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const effect = await ctx.db.spellEffect.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
          type: input.type,
          x: input.x,
          y: input.y,
          radius: input.radius,
          width: input.width,
          height: input.height,
          angle: input.angle,
          color: input.color,
          opacity: input.opacity,
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
      });

      return effect;
    }),

  getBySession: sessionAccessProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const effects = await ctx.db.spellEffect.findMany({
        where: { sessionId: input.sessionId },
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

      return effects;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        x: z.number().optional(),
        y: z.number().optional(),
        radius: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        angle: z.number().optional(),
        color: z.string().optional(),
        opacity: z.number().min(0).max(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const effect = await ctx.db.spellEffect.findUnique({
        where: { id: input.id },
        include: {
          session: {
            include: {
              campaign: true,
            },
          },
        },
      });

      if (!effect) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Effect not found",
        });
      }

      // Check session access using helper function
      await checkSessionAccess(effect.sessionId, ctx.session.user.id);
      const isDM = effect.session.campaign.dmId === ctx.session.user.id;

      // User can update their own effects, DM can update any
      if (effect.userId !== ctx.session.user.id && !isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own effects",
        });
      }

      const updated = await ctx.db.spellEffect.update({
        where: { id: input.id },
        data: {
          x: input.x,
          y: input.y,
          radius: input.radius,
          width: input.width,
          height: input.height,
          angle: input.angle,
          color: input.color,
          opacity: input.opacity,
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const effect = await ctx.db.spellEffect.findUnique({
        where: { id: input.id },
        include: {
          session: {
            include: {
              campaign: true,
            },
          },
        },
      });

      if (!effect) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Effect not found",
        });
      }

      // Check session access using helper function
      await checkSessionAccess(effect.sessionId, ctx.session.user.id);
      const isDM = effect.session.campaign.dmId === ctx.session.user.id;

      // User can delete their own effects, DM can delete any
      if (effect.userId !== ctx.session.user.id && !isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own effects",
        });
      }

      await ctx.db.spellEffect.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
