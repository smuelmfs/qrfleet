import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: "ADMIN" | "EDITOR"
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: "ADMIN" | "EDITOR"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "ADMIN" | "EDITOR"
  }
}

