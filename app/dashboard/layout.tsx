import React from "react"
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  return <>{children}</>;
}
