'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Clock4, 
  Briefcase, 
  Settings, 
  LogOut,
  Building2,
  FileText
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
    href: '/clients',
    label: 'Clientes',
    icon: Building2,
  },
  {
    href: '/reports',
    label: 'Relatórios',
    icon: FileText,
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
      <div className="flex items-center h-16 px-6 border-b">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Clock4 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">DeLorean</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
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
                <Icon className="w-4 h-4 mr-3" />
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
          className="justify-start w-full text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-card lg:border-r">
      <SidebarContent />
    </div>
  );
}
