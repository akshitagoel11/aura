"use client"

import { useEffect, useState } from "react"

interface MountedOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * A wrapper component that only renders its children on the client side.
 * This is used to prevent hydration mismatches for components that render
 * dynamic data like dates and times.
 */
export function MountedOnly({ children, fallback = null }: MountedOnlyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
