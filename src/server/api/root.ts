import { campaignRouter } from "~/server/api/routers/campaign";
import { characterRouter } from "~/server/api/routers/character";
import { chatRouter } from "~/server/api/routers/chat";
import { drawingRouter } from "~/server/api/routers/drawing";
import { fogOfWarRouter } from "~/server/api/routers/fog-of-war";
import { mapRouter } from "~/server/api/routers/map";
import { postRouter } from "~/server/api/routers/post";
import { sessionRouter } from "~/server/api/routers/session";
import { spellEffectRouter } from "~/server/api/routers/spell-effect";
import { tokenRouter } from "~/server/api/routers/token";
import { userRouter } from "~/server/api/routers/user";
import { visionRouter } from "~/server/api/routers/vision";
import { diceRouter } from "~/server/api/routers/dice";
import { initiativeRouter } from "~/server/api/routers/initiative";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
  campaign: campaignRouter,
  session: sessionRouter,
  character: characterRouter,
  map: mapRouter,
  token: tokenRouter,
  chat: chatRouter,
  fogOfWar: fogOfWarRouter,
  drawing: drawingRouter,
  spellEffect: spellEffectRouter,
  vision: visionRouter,
  dice: diceRouter,
  initiative: initiativeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
