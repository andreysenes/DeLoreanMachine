'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Clock, Settings, LogOut, Save, Loader2, RefreshCw } from 'lucide-react';
import { 
  updateUserProfile,
  updateUserPreferences,
  updateUserSettingsComplete, 
  logout 
} from '@/lib/supabase-client';
import { 
  useCachedUserProfile, 
  useCachedUserSettings, 
  useCachedUserPreferences 
} from '@/hooks/useCachedResource';

const profileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

const goalSchema = z.object({
  dailyGoal: z.number().min(1, 'Meta diária deve ser maior que 0').max(24, 'Meta diária não pode ser maior que 24 horas'),
  weeklyGoal: z.number().min(1, 'Meta semanal deve ser maior que 0').max(168, 'Meta semanal não pode ser maior que 168 horas'),
  workStartTime: z.string(),
  workEndTime: z.string(),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['pt-BR', 'en-US', 'es-ES']),
  week_start_day: z.number().min(0).max(6),
  notifications_email: z.boolean(),
  notifications_push: z.boolean(),
  notifications_reminders: z.boolean(),
  auto_track: z.boolean(),
  show_decimal_hours: z.boolean(),
  export_format: z.enum(['csv', 'pdf', 'xlsx']),
});

const systemSettingsSchema = z.object({
  timezone: z.string(),
  hour_format: z.enum(['12h', '24h']),
  date_format: z.enum(['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd']),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type GoalFormData = z.infer<typeof goalSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;
type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);

  // Hooks de cache para cada tipo de dados
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isValidating: isValidatingProfile,
    isStale: isProfileStale,
    mutate: mutateProfile,
  } = useCachedUserProfile();

  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    isValidating: isValidatingSettings,
    isStale: isSettingsStale,
    mutate: mutateSettings,
  } = useCachedUserSettings();

  const {
    data: preferencesData,
    isLoading: isLoadingPreferences,
    isValidating: isValidatingPreferences,
    isStale: isPreferencesStale,
    mutate: mutatePreferences,
  } = useCachedUserPreferences();

  // Estado de loading geral
  const isLoadingData = isLoadingProfile || isLoadingSettings || isLoadingPreferences;
  const isValidatingAny = isValidatingProfile || isValidatingSettings || isValidatingPreferences;

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: '',
      sobrenome: '',
      email: '',
    },
  });

  const goalForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      dailyGoal: 6,
      weeklyGoal: 30,
      workStartTime: '09:00',
      workEndTime: '17:00',
    },
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: 'system',
      language: 'pt-BR',
      week_start_day: 1,
      notifications_email: true,
      notifications_push: true,
      notifications_reminders: true,
      auto_track: false,
      show_decimal_hours: true,
      export_format: 'csv',
    },
  });

  const systemSettingsForm = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      timezone: 'America/Sao_Paulo',
      hour_format: '24h',
      date_format: 'dd/MM/yyyy',
    },
  });

  // Atualizar formulários quando dados chegarem
  useEffect(() => {
    if (profileData) {
      const { user, profile } = profileData;
      
      if (user && profile) {
        profileForm.reset({
          nome: profile.first_name || '',
          sobrenome: profile.last_name || '',
          email: user.email || '',
        });
      } else if (user) {
        profileForm.reset({
          nome: (user.user_metadata as any)?.nome || '',
          sobrenome: (user.user_metadata as any)?.sobrenome || '',
          email: user.email || '',
        });
      }
    }
  }, [profileData, profileForm]);

  useEffect(() => {
    if (settingsData) {
      goalForm.reset({
        dailyGoal: settingsData.daily_goal,
        weeklyGoal: settingsData.weekly_goal,
        workStartTime: settingsData.work_start_time,
        workEndTime: settingsData.work_end_time,
      });

      systemSettingsForm.reset({
        timezone: settingsData.timezone || 'America/Sao_Paulo',
        hour_format: settingsData.hour_format || '24h',
        date_format: settingsData.date_format || 'dd/MM/yyyy',
      });
    }
  }, [settingsData, goalForm, systemSettingsForm]);

  useEffect(() => {
    if (preferencesData) {
      preferencesForm.reset({
        theme: preferencesData.theme || 'system',
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
  }, [preferencesData, preferencesForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        first_name: data.nome,
        last_name: data.sobrenome,
      });
      
      console.log('✅ Perfil atualizado com sucesso!');
      
      // Atualizar o cache local com os dados atualizados
      if (profileData && profileData.profile) {
        const updatedProfileData = {
          ...profileData,
          profile: {
            ...profileData.profile,
            first_name: data.nome,
            last_name: data.sobrenome,
          }
        };
        mutateProfile(updatedProfileData);
      }
      
      // Feedback visual simples
      window.dispatchEvent(new CustomEvent('show-success', { 
        detail: { message: 'Perfil atualizado com sucesso!' }
      }));
      
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar perfil';
      
      window.dispatchEvent(new CustomEvent('show-error', { 
        detail: { message: errorMessage }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const onGoalSubmit = async (data: GoalFormData) => {
    setIsLoading(true);
    try {
      await updateUserSettingsComplete({
        daily_goal: data.dailyGoal,
        weekly_goal: data.weeklyGoal,
        work_start_time: data.workStartTime,
        work_end_time: data.workEndTime,
      });
      
      console.log('✅ Metas atualizadas com sucesso!');
      
      // Atualizar o cache local com os dados atualizados
      if (settingsData) {
        const updatedSettingsData = {
          ...settingsData,
          daily_goal: data.dailyGoal,
          weekly_goal: data.weeklyGoal,
          work_start_time: data.workStartTime,
          work_end_time: data.workEndTime,
        };
        mutateSettings(updatedSettingsData);
      }
      
      // Feedback visual simples
      window.dispatchEvent(new CustomEvent('show-success', { 
        detail: { message: 'Metas atualizadas com sucesso!' }
      }));
      
    } catch (error: any) {
      console.error('Erro ao atualizar metas:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar metas';
      
      window.dispatchEvent(new CustomEvent('show-error', { 
        detail: { message: errorMessage }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const onPreferencesSubmit = async (data: PreferencesFormData) => {
    setIsLoading(true);
    try {
      await updateUserPreferences(data);
      
      console.log('✅ Preferências atualizadas com sucesso!');
      
      // Atualizar o cache local com os dados atualizados
      if (preferencesData) {
        const updatedPreferencesData = {
          ...preferencesData,
          ...data,
        };
        mutatePreferences(updatedPreferencesData);
      }
      
      // Feedback visual simples
      window.dispatchEvent(new CustomEvent('show-success', { 
        detail: { message: 'Preferências atualizadas com sucesso!' }
      }));
      
    } catch (error: any) {
      console.error('Erro ao atualizar preferências:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar preferências';
      
      window.dispatchEvent(new CustomEvent('show-error', { 
        detail: { message: errorMessage }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const onSystemSettingsSubmit = async (data: SystemSettingsFormData) => {
    setIsLoading(true);
    try {
      await updateUserSettingsComplete(data);
      
      console.log('✅ Configurações do sistema atualizadas com sucesso!');
      
      // Atualizar o cache local com os dados atualizados
      if (settingsData) {
        const updatedSettingsData = {
          ...settingsData,
          ...data,
        };
        mutateSettings(updatedSettingsData);
      }
      
      // Feedback visual simples
      window.dispatchEvent(new CustomEvent('show-success', { 
        detail: { message: 'Configurações do sistema atualizadas com sucesso!' }
      }));
      
    } catch (error: any) {
      console.error('Erro ao atualizar configurações do sistema:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar configurações';
      
      window.dispatchEvent(new CustomEvent('show-error', { 
        detail: { message: errorMessage }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados do usuário...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Perfil e Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Clock className="mr-2 h-4 w-4" />
              Metas de Horas
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="mr-2 h-4 w-4" />
              Preferências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais que aparecerão no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="sobrenome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sobrenome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                      <Save className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Metas de Horas</CardTitle>
                <CardDescription>
                  Defina suas metas diárias e semanais de trabalho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...goalForm}>
                  <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={goalForm.control}
                        name="dailyGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Diária (horas)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                max="24"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={goalForm.control}
                        name="weeklyGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Semanal (horas)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                max="168"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Horário de Trabalho</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={goalForm.control}
                          name="workStartTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Início</FormLabel>
                              <FormControl>
                                <Input {...field} type="time" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={goalForm.control}
                          name="workEndTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fim</FormLabel>
                              <FormControl>
                                <Input {...field} type="time" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Salvando...' : 'Salvar Metas'}
                      <Save className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>
                    Configure formatos de data, hora e fuso horário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...systemSettingsForm}>
                    <form onSubmit={systemSettingsForm.handleSubmit(onSystemSettingsSubmit)} className="space-y-4">
                      <FormField
                        control={systemSettingsForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuso Horário</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione seu fuso horário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                                <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                                <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                                <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemSettingsForm.control}
                        name="hour_format"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Formato de Hora</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="24h">24 horas (14:30)</SelectItem>
                                <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemSettingsForm.control}
                        name="date_format"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Formato de Data</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dd/MM/yyyy">DD/MM/AAAA (11/12/2024)</SelectItem>
                                <SelectItem value="MM/dd/yyyy">MM/DD/AAAA (12/11/2024)</SelectItem>
                                <SelectItem value="yyyy-MM-dd">AAAA-MM-DD (2024-12-11)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Configurações'}
                        <Save className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferências Pessoais</CardTitle>
                  <CardDescription>
                    Configure tema, idioma e notificações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={preferencesForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tema</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="light">Claro</SelectItem>
                                  <SelectItem value="dark">Escuro</SelectItem>
                                  <SelectItem value="system">Sistema</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Idioma</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                  <SelectItem value="en-US">English (US)</SelectItem>
                                  <SelectItem value="es-ES">Español</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={preferencesForm.control}
                          name="week_start_day"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primeiro dia da semana</FormLabel>
                              <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">Domingo</SelectItem>
                                  <SelectItem value="1">Segunda-feira</SelectItem>
                                  <SelectItem value="6">Sábado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="export_format"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formato de exportação padrão</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="csv">CSV</SelectItem>
                                  <SelectItem value="pdf">PDF</SelectItem>
                                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Notificações</h4>
                        
                        <FormField
                          control={preferencesForm.control}
                          name="notifications_email"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Notificações por Email</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Receber emails sobre atividades importantes
                                </div>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="notifications_push"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Notificações Push</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Receber notificações no navegador
                                </div>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="notifications_reminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Lembretes</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Receber lembretes para registrar horas
                                </div>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Comportamento</h4>
                        
                        <FormField
                          control={preferencesForm.control}
                          name="auto_track"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Rastreamento Automático</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Iniciar timer automaticamente baseado em atividades
                                </div>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="show_decimal_hours"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Horas Decimais</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Mostrar horas em formato decimal (8.5h) ao invés de horário (8h30m)
                                </div>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Preferências'}
                        <Save className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações da Conta</CardTitle>
                  <CardDescription>
                    Gerencie sua conta e sessão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Sair da Conta</h4>
                        <p className="text-sm text-muted-foreground">
                          Fazer logout da sua sessão atual
                        </p>
                      </div>
                      <Button variant="destructive" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
