import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

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
      // Primeiro login: copiar dados do user para o token
      if (user) {
        token.role = (user as any).role || "EDITOR"
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }

      // Atualização via useSession().update({ name: ... })
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
      // Se não houver token de usuário, retornar sessão sem dados
      if (!token || !(token as any).id) {
        return session
      }

      // Garantir que o utilizador ainda existe no banco
      const dbUser = await prisma.user.findUnique({
        where: { id: (token as any).id as string },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      // Se usuário não existe mais, retornar sessão sem dados do usuário
      // As APIs vão verificar se session.user.id existe e bloquear se necessário
      if (!dbUser) {
        return session
      }

      // Preencher a sessão apenas com o que é estritamente necessário no cliente
      session.user = {
        ...session.user,
        id: dbUser.id,
        name: dbUser.name || dbUser.email.split("@")[0],
        email: dbUser.email,
        // Expor role apenas para controlar o que aparece na UI; a segurança real continua nas APIs/middleware
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

