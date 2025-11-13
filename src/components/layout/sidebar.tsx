'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Clock4, 
  Briefcase, 
  Settings, 
  Menu,
  LogOut
} from 'lucide-react';
import { logout } from '@/lib/supabase-placeholders';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/hours',
    label: 'Horas',
    icon: Clock4,
  },
  {
    href: '/projects',
    label: 'Projetos',
    icon: Briefcase,
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: Settings,
  },
];

interface SidebarContentProps {
  className?: string;
}

function SidebarContent({ className }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Clock4 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">DeLorean</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-card lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
