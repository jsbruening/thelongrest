import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import {
  createTRPCRouter,
  protectedProcedure,
  sessionAccessProcedure,
  checkSessionAccess,
} from "~/server/api/trpc";

// Basic VTT parser - will be enhanced later
async function parseVTTFile(vttContent: string) {
  // Universal VTT format parsing
  // This is a basic implementation - will need enhancement for full support
  const walls: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const doors: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const lighting: unknown[] = [];

  // Parse VTT format (simplified - real implementation needs proper parsing)
  const lines = vttContent.split("\n");
  let currentSection = "";

  for (const line of lines) {
    if (line.startsWith("[walls]")) {
      currentSection = "walls";
      continue;
    }
    if (line.startsWith("[doors]")) {
      currentSection = "doors";
      continue;
    }
    if (line.startsWith("[lights]")) {
      currentSection = "lights";
      continue;
    }

    if (currentSection === "walls" && line.trim()) {
      const coords = line.split(",").map(Number);
      if (coords.length === 4) {
        walls.push({ x1: coords[0], y1: coords[1], x2: coords[2], y2: coords[3] });
      }
    }
    // Similar parsing for doors and lights...
  }

  return { walls, doors, lighting };
}

export const mapRouter = createTRPCRouter({
  upload: sessionAccessProcedure
    .input(
      z.object({
        sessionId: z.string(),
        name: z.string().min(1),
        vttFile: z.string(), // Base64 encoded VTT file content
        imageFile: z.string(), // Base64 encoded image file
        imageFileName: z.string(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        gridSize: z.number().int().positive().default(70),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure
      // Only DM can upload maps
      if (!ctx.isDM) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the DM can upload maps",
        });
      }

      // Ensure upload directory exists
      const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
      const sessionDir = join(uploadDir, "sessions", input.sessionId);

      if (!existsSync(sessionDir)) {
        await mkdir(sessionDir, { recursive: true });
      }

      // Parse VTT file
      const vttBuffer = Buffer.from(input.vttFile, "base64");
      const vttContent = vttBuffer.toString("utf-8");
      const parsedData = await parseVTTFile(vttContent);

      // Save files
      const vttFileName = `${input.sessionId}.vtt`;
      const imageFileName = input.imageFileName || `${input.sessionId}.png`;
      const vttPath = join(sessionDir, vttFileName);
      const imagePath = join(sessionDir, imageFileName);

      await writeFile(vttPath, vttBuffer);
      const imageBuffer = Buffer.from(input.imageFile, "base64");
      await writeFile(imagePath, imageBuffer);

      // Create or update map record
      const map = await ctx.db.map.upsert({
        where: { sessionId: input.sessionId },
        create: {
          sessionId: input.sessionId,
          name: input.name,
          filePath: vttPath,
          imagePath: imagePath,
          width: input.width,
          height: input.height,
          gridSize: input.gridSize,
          walls: parsedData.walls,
          doors: parsedData.doors,
          lighting: parsedData.lighting,
        },
        update: {
          name: input.name,
          filePath: vttPath,
          imagePath: imagePath,
          width: input.width,
          height: input.height,
          gridSize: input.gridSize,
          walls: parsedData.walls,
          doors: parsedData.doors,
          lighting: parsedData.lighting,
        },
      });

      return map;
    }),

  getBySession: sessionAccessProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Access already verified by sessionAccessProcedure

      const map = await ctx.db.map.findUnique({
        where: { sessionId: input.sessionId },
      });

      return map;
    }),
});


