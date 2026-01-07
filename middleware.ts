import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname.startsWith("/admin")) {
        // Verificar se há token e se tem um id válido
        return !!(token && (token as any).id)
      }
      return true
    },
  },
})

export const config = {
  matcher: ["/admin/:path*"],
}

