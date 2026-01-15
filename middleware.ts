import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname

      if (path.startsWith("/modules") || 
          path.startsWith("/module-equipament/admin")) {

        return !!(token && (token as any).id)
      }
      return true
    },
  },
})

export const config = {
  matcher: ["/modules/:path*", "/module-equipament/admin/:path*"],
}

