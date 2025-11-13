'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCachedUserPreferences } from '@/hooks/useCachedResource';
import { updateUserPreferences } from '@/lib/supabase-client';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: preferencesData, mutate: mutatePreferences } = useCachedUserPreferences();

  // Aguarda hidratação para evitar mismatch entre servidor e cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincroniza tema inicial com preferências do usuário
  useEffect(() => {
    if (mounted && preferencesData?.theme && preferencesData.theme !== theme) {
      setTheme(preferencesData.theme);
    }
  }, [mounted, preferencesData?.theme, theme, setTheme]);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      // Atualiza tema imediatamente na interface
      setTheme(newTheme);

      // Atualiza preferências no banco de dados e cache
      if (preferencesData) {
        const updatedPreferences = {
          ...preferencesData,
          theme: newTheme,
        };

        // Atualiza cache imediatamente
        mutatePreferences(updatedPreferences);

        // Salva no banco em background
        await updateUserPreferences({
          theme: newTheme,
          language: preferencesData.language || 'pt-BR',
          week_start_day: preferencesData.week_start_day || 1,
          notifications_email: preferencesData.notifications_email ?? true,
          notifications_push: preferencesData.notifications_push ?? true,
          notifications_reminders: preferencesData.notifications_reminders ?? true,
          auto_track: preferencesData.auto_track ?? false,
          show_decimal_hours: preferencesData.show_decimal_hours ?? true,
          export_format: preferencesData.export_format || 'csv',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
    }
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Alternar tema</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {theme === 'dark' ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : theme === 'light' ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Monitor className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
