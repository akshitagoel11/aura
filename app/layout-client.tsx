'use client';

import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
