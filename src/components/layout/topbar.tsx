'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Download, Database, User } from 'lucide-react';
import { mockUser, connectToSupabase, exportToCSV, logout } from '@/lib/supabase-placeholders';

export function Topbar() {
  const handleExportCSV = () => {
    exportToCSV([], 'relatorio-horas');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getUserInitials = (nome: string, sobrenome: string) => {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left section - Greeting */}
        <div className="flex items-center space-x-4">
          <div className="lg:hidden" /> {/* Espaço para o botão do menu mobile */}
          <div className="flex flex-col lg:ml-0 ml-12">
            <h1 className="text-lg font-semibold">
              {getGreeting()}, {mockUser.nome}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seu tempo de forma produtiva
            </p>
          </div>
        </div>

        {/* Right section - Actions and Profile */}
        <div className="flex items-center space-x-3">
          {/* Export button - hidden on small screens */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="hidden md:flex"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

          {/* Supabase connection button - hidden on small screens */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={connectToSupabase}
            className="hidden md:flex"
          >
            <Database className="mr-2 h-4 w-4" />
            Conectar Supabase
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials(mockUser.nome, mockUser.sobrenome)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{mockUser.nome} {mockUser.sobrenome}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {mockUser.email}
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
              <DropdownMenuSeparator className="md:hidden" />
              {/* Mobile-only options */}
              <DropdownMenuItem onClick={handleExportCSV} className="md:hidden">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={connectToSupabase} className="md:hidden">
                <Database className="mr-2 h-4 w-4" />
                Conectar Supabase
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
