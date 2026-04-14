"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "AI Assistant", href: "/dashboard/ai", icon: Sparkles },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aura-500">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold">Aura AI</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-aura-50 text-aura-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback>
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/api/auth/signout">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Link>
        </Button>
      </div>
    </div>
  )
}
