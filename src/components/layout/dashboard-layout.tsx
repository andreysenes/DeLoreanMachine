'use client';

import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <main className="flex-1 p-4 pb-24 lg:p-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
