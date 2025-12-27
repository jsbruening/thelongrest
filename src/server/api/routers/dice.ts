import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  sessionAccessProcedure,
} from "~/server/api/trpc";

interface ParsedDiceNotation {
  numDice: number;
  diceSize: number;
  modifier: number;
}

function parseDiceNotation(notation: string): ParsedDiceNotation {
  const notationRegex = /^(\d+)d(\d+)([+-]\d+)?$/;
  const match = notationRegex.exec(notation);

  if (!match) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid dice notation. Use format like '2d20+5'",
    });
  }

  const numDice = Number.parseInt(match[1] ?? "1", 10);
  const diceSize = Number.parseInt(match[2] ?? "20", 10);
  const modifier = match[3] ? Number.parseInt(match[3], 10) : 0;

  return { numDice, diceSize, modifier };
}

function validateDiceParameters(numDice: number, diceSize: number): void {
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
}

function rollDice(numDice: number, diceSize: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * diceSize) + 1);
  }
  return rolls;
}

function applyAdvantageDisadvantage(
  rolls: number[],
  diceSize: number,
  advantage?: boolean,
  disadvantage?: boolean,
): number[] {
  if (diceSize !== 20 || (!advantage && !disadvantage)) {
    return rolls;
  }

  if (rolls.length < 2) {
    rolls.push(Math.floor(Math.random() * 20) + 1);
  }

  if (advantage) {
    return [Math.max(rolls[0] ?? 0, rolls[1] ?? 0)];
  }

  return [Math.min(rolls[0] ?? 0, rolls[1] ?? 0)];
}

function createRollDescription(
  notation: string,
  advantage?: boolean,
  disadvantage?: boolean,
): string {
  if (advantage) {
    return `${notation} (advantage)`;
  }
  if (disadvantage) {
    return `${notation} (disadvantage)`;
  }
  return notation;
}

function formatRollContent(
  rollDescription: string,
  finalRolls: number[],
  modifier: number,
  total: number,
): string {
  const rollsText = finalRolls.join(", ");
  let modifierText = "";
  if (modifier !== 0) {
    const sign = modifier > 0 ? "+" : "";
    modifierText = ` ${sign}${modifier}`;
  }
  return `🎲 Rolled ${rollDescription}: ${rollsText}${modifierText} = **${total}**`;
}

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

      const { numDice, diceSize, modifier } = parseDiceNotation(input.notation);
      validateDiceParameters(numDice, diceSize);

      const rolls = rollDice(numDice, diceSize);
      const finalRolls = applyAdvantageDisadvantage(
        rolls,
        diceSize,
        input.advantage,
        input.disadvantage,
      );

      const total = finalRolls.reduce((sum, roll) => sum + roll, 0) + modifier;
      const rollDescription = createRollDescription(
        input.notation,
        input.advantage,
        input.disadvantage,
      );
      const content = formatRollContent(
        rollDescription,
        finalRolls,
        modifier,
        total,
      );

      const message = await ctx.db.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
          content,
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
