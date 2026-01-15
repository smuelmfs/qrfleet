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
        try {
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

          // Tenta criar log de auditoria, mas não bloqueia o login se falhar
          try {
            await createAuditLog(
              user.id,
              "LOGIN",
              "USUARIO",
              user.id,
              `Login realizado: ${user.email}`
            )
          } catch (auditError) {
            console.error("Erro ao criar log de auditoria:", auditError)
            // Não bloqueia o login se o log falhar
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role,
          }
        } catch (error) {
          console.error("Erro no authorize:", error)
          return null
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
      try {
        if (!token || !(token as any).id) {
          return session
        }

        // Tenta buscar dados atualizados do banco, mas se falhar, usa os dados do token
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: (token as any).id as string },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          })

          if (dbUser) {
            session.user = {
              ...session.user,
              id: dbUser.id,
              name: dbUser.name || dbUser.email.split("@")[0],
              email: dbUser.email,
              role: dbUser.role,
            } as any
            return session
          }
        } catch (dbError) {
          // Se houver erro ao acessar o banco, usa os dados do token
          console.error("Erro ao buscar usuário no banco:", dbError)
        }

        // Fallback: usa os dados do token se não conseguir buscar do banco
        session.user = {
          ...session.user,
          id: (token as any).id as string,
          name: (token.name as string) || (token.email as string)?.split("@")[0] || undefined,
          email: token.email as string,
          role: (token as any).role || "EDITOR",
        } as any

        return session
      } catch (error) {
        console.error("Erro no callback session:", error)
        // Retorna sessão básica em caso de erro
        return session
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production",
  debug: process.env.NODE_ENV === "development",
}

