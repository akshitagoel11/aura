import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Sidebar } from "@/components/dashboard"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden w-64 md:block">
        <Sidebar user={session.user} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
