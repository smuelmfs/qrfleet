import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { createAuditLog } from "./audit"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        await createAuditLog(
          user.id,
          "LOGIN",
          "USUARIO",
          user.id,
          `Login realizado: ${user.email}`
        )

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {

      if (user) {
        token.role = (user as any).role || "EDITOR"
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }

      if (trigger === "update" && session) {
        if (session.name) {
          token.name = session.name as string
        }
        if ((session as any).email) {
          token.email = (session as any).email as string
        }
      }

      return token
    },
    async session({ session, token }) {

      if (!token || !(token as any).id) {
        return session
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: (token as any).id as string },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })


      if (!dbUser) {
        return session
      }

      session.user = {
        ...session.user,
        id: dbUser.id,
        name: dbUser.name || dbUser.email.split("@")[0],
        email: dbUser.email,

        role: dbUser.role,
      } as any

      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

