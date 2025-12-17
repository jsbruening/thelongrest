import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  sessionAccessProcedure,
  checkSessionAccess,
} from "~/server/api/trpc";

export const drawingRouter = createTRPCRouter({
  create: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        path: z.array(
          z.object({
            x: z.number(),
            y: z.number(),
          }),
        ),
        color: z.string().default("#000000"),
        strokeWidth: z.number().int().min(1).max(20).default(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const drawing = await ctx.db.drawing.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
          path: input.path,
          color: input.color,
          strokeWidth: input.strokeWidth,
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

      return drawing;
    }),

  getBySession: sessionAccessProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const drawings = await ctx.db.drawing.findMany({
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

      return drawings;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const drawing = await ctx.db.drawing.findUnique({
        where: { id: input.id },
        include: {
          session: {
            include: {
              campaign: true,
            },
          },
        },
      });

      if (!drawing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Drawing not found",
        });
      }

      // Check session access using helper function
      await checkSessionAccess(drawing.sessionId, ctx.session.user.id);
      const isDM = drawing.session.campaign.dmId === ctx.session.user.id;

      // User can delete their own drawings, DM can delete any
      if (drawing.userId !== ctx.session.user.id && !isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own drawings",
        });
      }

      await ctx.db.drawing.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
