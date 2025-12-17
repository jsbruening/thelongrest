import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  sessionAccessProcedure,
} from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  getMessages: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const messages = await ctx.db.chatMessage.findMany({
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
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages: messages.reverse(),
        nextCursor,
      };
    }),

  sendMessage: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1).max(1000),
        type: z.enum(["TEXT", "SYSTEM", "DICE_ROLL"]).default("TEXT"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const message = await ctx.db.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
          content: input.content,
          type: input.type,
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

      return message;
    }),
});
