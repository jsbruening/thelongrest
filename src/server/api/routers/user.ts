import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { hashPassword } from "~/server/auth/password";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const passwordHash = await hashPassword(input.password);

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          displayName: input.name, // Set displayName to name initially
        },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
        },
      });

      return user;
    }),

  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).optional().nullable(),
        image: z
          .string()
          .refine(
            (val) => {
              if (!val || val.trim() === "") return true; // Allow empty/null
              // Allow full URLs or relative paths starting with /
              return val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/");
            },
            { message: "Image must be a valid URL or relative path" },
          )
          .optional()
          .nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          displayName: input.displayName,
          image: input.image,
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true,
          image: true,
        },
      });

      return updated;
    }),

  getCampaignUsers: protectedProcedure
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

      // Get all users who have characters in this campaign
      const users = new Map();
      
      // Include the DM
      const dm = await ctx.db.user.findUnique({
        where: { id: campaign.dmId },
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true,
          image: true,
        },
      });
      if (dm) {
        users.set(dm.id, dm);
      }

      // Include users with linked characters
      campaign.campaignCharacters.forEach((cc) => {
        if (cc.character.user) {
          users.set(cc.character.user.id, cc.character.user);
        }
      });

      return Array.from(users.values());
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });
    return users;
  }),
});


