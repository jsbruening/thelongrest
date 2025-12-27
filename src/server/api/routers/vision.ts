import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  sessionAccessProcedure,
} from "~/server/api/trpc";
import {
  calculateTokenVision,
  mergeVisionPolygons,
  type Point,
  type Wall,
} from "~/lib/vision";

export const visionRouter = createTRPCRouter({
  calculateRevealedArea: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: {
          map: true,
          tokens: {
            where: {
              visionRadius: { not: null },
            },
            include: {
              campaignCharacter: {
                include: {
                  character: {
                    include: {
                      user: {
                        select: {
                          id: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!session?.map) {
        return { polygons: [] };
      }

      // Get walls from map
      const walls = (session.map.walls as unknown as Wall[]) ?? [];
      const gridSize = session.map.gridSize;

      // Calculate vision for each token
      const visionPolygons: Point[][] = [];

      for (const token of session.tokens) {
        if (!token.visionRadius) continue;

        // Only calculate vision for tokens owned by the current user (or DM sees all)
        if (
          !ctx.isDM &&
          token.campaignCharacter?.character?.user?.id !== ctx.session.user.id
        ) {
          continue;
        }

        const visionPolygon = calculateTokenVision(
          { x: token.x, y: token.y },
          token.visionRadius,
          walls,
          gridSize,
        );

        if (visionPolygon.length > 0) {
          visionPolygons.push(visionPolygon);
        }
      }

      // Merge all vision polygons
      const mergedPolygon = mergeVisionPolygons(visionPolygons);

      return {
        polygons: visionPolygons,
        merged: mergedPolygon,
      };
    }),

  autoRevealFog: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure
      // Only DM can auto-reveal fog of war
      if (!ctx.isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can auto-reveal fog of war",
        });
      }

      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: {
          map: true,
          tokens: {
            where: {
              visionRadius: { not: null },
            },
          },
        },
      });

      if (!session?.map) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No map uploaded for this session",
        });
      }

      // Calculate vision for all tokens
      const walls = (session.map.walls as unknown as Wall[]) ?? [];
      const gridSize = session.map.gridSize;

      const visionPolygons: Point[][] = [];

      for (const token of session.tokens) {
        if (!token.visionRadius) continue;

        const visionPolygon = calculateTokenVision(
          { x: token.x, y: token.y },
          token.visionRadius,
          walls,
          gridSize,
        );

        if (visionPolygon.length > 0) {
          visionPolygons.push(visionPolygon);
        }
      }

      // Get existing fog of war
      const existingFog = await ctx.db.fogOfWarState.findUnique({
        where: { sessionId: input.sessionId },
      });

      const existingAreas =
        existingFog &&
        (existingFog.revealedAreas as Array<Array<{ x: number; y: number }>>)
          ? (existingFog.revealedAreas as Array<Array<{ x: number; y: number }>>)
          : [];

      // Merge with existing revealed areas
      const allPolygons = [...existingAreas, ...visionPolygons];

      // Update fog of war
      const fogOfWar = await ctx.db.fogOfWarState.upsert({
        where: { sessionId: input.sessionId },
        create: {
          sessionId: input.sessionId,
          revealedAreas: allPolygons as any,
        },
        update: {
          revealedAreas: allPolygons as any,
        },
      });

      return fogOfWar;
    }),
});
