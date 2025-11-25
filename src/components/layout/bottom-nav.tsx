'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Clock4, Briefcase, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    {
      href: '/dashboard',
      label: 'Início',
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
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background lg:hidden pb-safe">
      <div className="grid h-full grid-cols-4 mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex flex-col items-center justify-center px-5 transition-colors hover:bg-muted/50 group"
            >
              <div className="relative flex flex-col items-center justify-center gap-1">
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                />
                <span 
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute w-8 h-1 rounded-full -top-3 bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
