import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config: no Node-only imports (bcrypt, Prisma) so this
 * can run inside middleware. The Credentials provider itself — which needs
 * both — is added on top of this in `auth.ts`, which only runs in the
 * Node.js runtime (API routes, server components).
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
};
