import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string
    } & DefaultSession["user"]
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
  }
}
