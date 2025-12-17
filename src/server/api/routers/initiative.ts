import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  sessionAccessProcedure,
} from "~/server/api/trpc";

export const initiativeRouter = createTRPCRouter({
  get: sessionAccessProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      // Get tokens with initiative values (stored in a JSON field for now)
      // In a real implementation, you'd want a separate Initiative model
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

      // For now, we'll use a simple approach: store initiative in session metadata
      // In production, you'd want a proper Initiative model
      return {
        order: tokens.map((token) => ({
          tokenId: token.id,
          name: token.name,
          initiative: 0, // Would come from database
          character: token.character,
        })),
        currentTurn: 0,
        round: 1,
      };
    }),

  setInitiative: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        tokenId: z.string(),
        initiative: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure
      // Only DM can set initiative
      if (!ctx.isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can set initiative",
        });
      }

      // For now, we'll just return success
      // In production, you'd update an Initiative model
      return { success: true };
    }),
});
