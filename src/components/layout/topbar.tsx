'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User } from 'lucide-react';
import { logout, getCurrentUser } from '@/lib/supabase-client';
import { ExportButtons } from '@/components/export/export-buttons';

export function Topbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };
    
    loadUser();
  }, []);


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getUserInitials = (email: string) => {
    if (!email) return 'US';
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    if (!user) return 'Usuário';
    return user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário';
  };

  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left section - Greeting */}
        <div className="flex items-center space-x-4">
          <div className="lg:hidden" /> {/* Espaço para o botão do menu mobile */}
          <div className="flex flex-col lg:ml-0 ml-12">
            <h1 className="text-lg font-semibold">
              {getGreeting()}, {getUserName()}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seu tempo de forma produtiva
            </p>
          </div>
        </div>

        {/* Right section - Actions and Profile */}
        <div className="flex items-center space-x-3">
          {/* Export button - hidden on small screens */}
          <div className="hidden md:flex">
            <ExportButtons variant="dropdown" size="sm" />
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{getUserName()}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email || 'Carregando...'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
