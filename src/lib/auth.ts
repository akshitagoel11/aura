import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

/**
 * Refresh an expired Google OAuth access token using the refresh token.
 * Returns the new token data or an error object.
 */
async function refreshGoogleAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token"
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      console.error("[Auth] Token refresh failed:", refreshedTokens)
      throw new Error(refreshedTokens.error || "Token refresh failed")
    }

    console.log("[Auth] Google access token refreshed successfully")

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Only update refresh token if Google returns a new one
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error("[Auth] Error refreshing Google access token:", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/tasks",
            "https://www.googleapis.com/auth/calendar",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
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
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow credentials sign-in always
      if (account?.provider === "credentials") {
        return true
      }

      // Handle Google OAuth sign-in — link to existing account if needed
      if (account?.provider === "google" && profile?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
            include: { accounts: true },
          })

          if (existingUser) {
            // Check if Google account is already linked
            const googleAccount = existingUser.accounts.find(
              (a) => a.provider === "google"
            )

            if (!googleAccount) {
              // Link Google account to existing user
              console.log("[Auth] Linking Google account to existing user:", profile.email)
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              })
            } else {
              // Update existing Google account tokens
              console.log("[Auth] Updating Google tokens for:", profile.email)
              await prisma.account.update({
                where: {
                  provider_providerAccountId: {
                    provider: "google",
                    providerAccountId: account.providerAccountId,
                  },
                },
                data: {
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                },
              })
            }
          }
          // If no existing user, PrismaAdapter will create one automatically
        } catch (error) {
          console.error("[Auth] Error during Google account linking:", error)
          // Don't block sign-in on linking errors
        }
      }

      console.log(`[Auth] Sign-in successful: provider=${account?.provider}, email=${user.email}`)
      return true
    },
    async jwt({ token, user, account }) {
      // Initial sign-in: capture user info
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }

      // Initial Google OAuth sign-in: capture tokens
      if (account?.provider === "google") {
        console.log("[Auth] Google OAuth tokens captured for JWT")
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000 // default 1 hour
        token.provider = "google"
        return token
      }

      // For non-Google providers, just return the token
      if (!token.accessToken || !token.refreshToken) {
        return token
      }

      // Check if the access token has NOT expired
      const expiresAt = token.accessTokenExpires as number | undefined
      if (expiresAt && Date.now() < expiresAt - 60_000) {
        // Token is still valid (with 1 minute buffer), return as-is
        return token
      }

      // Access token has expired — refresh it
      console.log("[Auth] Access token expired, refreshing...")
      return await refreshGoogleAccessToken(token)
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        // Pass tokens to session for Google API calls
        ;(session as any).accessToken = token.accessToken as string | undefined
        ;(session as any).refreshToken = token.refreshToken as string | undefined
        ;(session as any).provider = token.provider as string | undefined
        ;(session as any).tokenError = token.error as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async createUser({ user }) {
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          workingHoursStart: 9,
          workingHoursEnd: 17,
          workingDays: "1,2,3,4,5",
          timezone: "UTC",
          aiProvider: "openai",
          theme: "system",
          notifications: true,
        },
      })
    },
  },
}
