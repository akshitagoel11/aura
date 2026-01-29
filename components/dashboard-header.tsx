'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Aura</h1>
        </div>
        <Button variant="outline" onClick={handleLogout} className="text-foreground border-border hover:bg-muted bg-transparent">
          Logout
        </Button>
      </div>
    </header>
  );
}
