import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // ── Super Admin (Jenish) — env-based, no DB needed ──────────────────
        const superEmail = process.env.SUPER_ADMIN_EMAIL ?? "";
        const superPassword = process.env.SUPER_ADMIN_PASSWORD ?? "";
        if (
          superEmail &&
          credentials.email.toLowerCase() === superEmail.toLowerCase() &&
          credentials.password === superPassword
        ) {
          return {
            id: "super-admin",
            name: "Super Admin",
            email: superEmail,
            role: "SUPER_ADMIN",
            tenantId: null,
          };
        }

        // ── Salon owner / staff — check DB ───────────────────────────────────
        const user = await prisma.user.findFirst({
          where: { email: credentials.email.toLowerCase(), isActive: true },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name ?? user.email ?? "User",
          email: user.email ?? "",
          role: user.role,
          tenantId: user.tenantId ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId ?? null;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
