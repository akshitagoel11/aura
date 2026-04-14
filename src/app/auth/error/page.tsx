"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description: "There is a problem with the server configuration. Check that your Google OAuth Client ID and Secret are correctly set in .env.local.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in. If using Google, make sure your email is added as a test user in Google Cloud Console.",
  },
  Verification: {
    title: "Verification Error",
    description: "The verification token has expired or has already been used.",
  },
  OAuthSignin: {
    title: "OAuth Sign-In Error",
    description: "Error constructing the OAuth URL. Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description: "Error during the Google callback. Make sure your authorized redirect URI in Google Cloud Console is set to: http://localhost:3000/api/auth/callback/google",
  },
  OAuthCreateAccount: {
    title: "OAuth Account Creation Error",
    description: "Could not create the OAuth account. The database may have an issue.",
  },
  EmailCreateAccount: {
    title: "Email Account Creation Error",
    description: "Could not create an account with this email address.",
  },
  Callback: {
    title: "Callback Error",
    description: "Error during the authentication callback.",
  },
  OAuthAccountNotLinked: {
    title: "Account Already Exists",
    description: "An account with this email already exists using a different sign-in method. If you registered with email/password, try signing in with those credentials, or use a different Google account.",
  },
  Default: {
    title: "Authentication Error",
    description: "An unexpected error occurred during authentication. Please try again.",
  },
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get("error") || "Default"
  const errorInfo = errorMessages[errorType] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-red-700">{errorInfo.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {errorInfo.description}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-mono text-red-600">
              Error code: {errorType}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
