import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname
      // Proteger rotas de módulos e admin
      if (path.startsWith("/modules") || 
          path.startsWith("/module-equipament/admin")) {
        // Verificar se há token e se tem um id válido
        return !!(token && (token as any).id)
      }
      return true
    },
  },
})

export const config = {
  matcher: ["/modules/:path*", "/module-equipament/admin/:path*"],
}

