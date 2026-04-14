import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aura AI - Intelligent Productivity Platform",
  description:
    "An AI-powered personal assistant that helps you manage tasks, schedules, and productivity using smart automation and insights.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
