import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  sessionAccessProcedure,
} from "~/server/api/trpc";

export const fogOfWarRouter = createTRPCRouter({
  get: sessionAccessProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const fogOfWar = await ctx.db.fogOfWarState.findUnique({
        where: { sessionId: input.sessionId },
      });

      return fogOfWar;
    }),

  update: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        revealedAreas: z.array(
          z.array(
            z.object({
              x: z.number(),
              y: z.number(),
            }),
          ),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure
      // Only DM can update fog of war
      if (!ctx.isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can update fog of war",
        });
      }

      const fogOfWar = await ctx.db.fogOfWarState.upsert({
        where: { sessionId: input.sessionId },
        update: {
          revealedAreas: input.revealedAreas as unknown as object,
        },
        create: {
          sessionId: input.sessionId,
          revealedAreas: input.revealedAreas as unknown as object,
        },
      });

      return fogOfWar;
    }),

  revealArea: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        polygon: z.array(
          z.object({
            x: z.number(),
            y: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure
      // Only DM can reveal fog of war
      if (!ctx.isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can reveal fog of war",
        });
      }

      const existing = await ctx.db.fogOfWarState.findUnique({
        where: { sessionId: input.sessionId },
      });

      const currentAreas =
        (existing?.revealedAreas as Array<Array<{ x: number; y: number }>>) ?? [];

      // Merge new polygon with existing ones
      const updatedAreas = [...currentAreas, input.polygon];

      const fogOfWar = await ctx.db.fogOfWarState.upsert({
        where: { sessionId: input.sessionId },
        update: {
          revealedAreas: updatedAreas as unknown as object,
        },
        create: {
          sessionId: input.sessionId,
          revealedAreas: updatedAreas as unknown as object,
        },
      });

      return fogOfWar;
    }),

  clear: sessionAccessProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure
      // Only DM can clear fog of war
      if (!ctx.isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can clear fog of war",
        });
      }

      await ctx.db.fogOfWarState.update({
        where: { sessionId: input.sessionId },
        data: {
          revealedAreas: [],
        },
      });

      return { success: true };
    }),
});
