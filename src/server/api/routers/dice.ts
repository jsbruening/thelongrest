import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  sessionAccessProcedure,
} from "~/server/api/trpc";

export const diceRouter = createTRPCRouter({
  roll: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        notation: z.string().min(1).max(50), // e.g., "2d20+5", "1d6", "3d8-2"
        advantage: z.boolean().optional(), // For advantage/disadvantage
        disadvantage: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      // Parse dice notation (e.g., "2d20+5")
      const notationRegex = /^(\d+)d(\d+)([+-]\d+)?$/;
      const match = input.notation.match(notationRegex);

      if (!match) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid dice notation. Use format like '2d20+5'",
        });
      }

      const numDice = parseInt(match[1] ?? "1", 10);
      const diceSize = parseInt(match[2] ?? "20", 10);
      const modifier = match[3] ? parseInt(match[3], 10) : 0;

      if (numDice < 1 || numDice > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Number of dice must be between 1 and 100",
        });
      }

      if (diceSize < 2 || diceSize > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dice size must be between 2 and 100",
        });
      }

      // Roll dice
      const rolls: number[] = [];
      for (let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * diceSize) + 1);
      }

      // Handle advantage/disadvantage (for d20 rolls)
      let finalRolls = rolls;
      if (diceSize === 20 && (input.advantage || input.disadvantage)) {
        if (rolls.length < 2) {
          // Roll an extra die for advantage/disadvantage
          rolls.push(Math.floor(Math.random() * 20) + 1);
        }
        if (input.advantage) {
          finalRolls = [Math.max(rolls[0] ?? 0, rolls[1] ?? 0)];
        } else {
          finalRolls = [Math.min(rolls[0] ?? 0, rolls[1] ?? 0)];
        }
      }

      const total = finalRolls.reduce((sum, roll) => sum + roll, 0) + modifier;

      // Create chat message for the roll
      const rollDescription = input.advantage
        ? `${input.notation} (advantage)`
        : input.disadvantage
          ? `${input.notation} (disadvantage)`
          : input.notation;

      const message = await ctx.db.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
          content: `🎲 Rolled ${rollDescription}: ${finalRolls.join(", ")}${modifier !== 0 ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""} = **${total}**`,
          type: "DICE_ROLL",
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

      return {
        rolls: finalRolls,
        modifier,
        total,
        notation: input.notation,
        advantage: input.advantage,
        disadvantage: input.disadvantage,
        message,
      };
    }),
});
