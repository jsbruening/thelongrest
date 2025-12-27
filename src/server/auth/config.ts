import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "~/server/db";
import { verifyPassword } from "./password";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      displayName?: string | null;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash,
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
        };
      },
    }),
    DiscordProvider,
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: async ({ session, token }) => {
      // Fetch latest user data from database to include displayName and image
      if (token.sub) {
        const user = await db.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
          },
        });

        if (user) {
          return {
            ...session,
            user: {
              ...session.user,
              id: user.id,
              name: user.name ?? session.user.name,
              displayName: user.displayName,
              email: user.email ?? session.user.email,
              image: user.image ?? session.user.image,
            },
          };
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? "",
          displayName: null,
          image: null,
        },
      };
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
