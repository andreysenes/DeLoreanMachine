'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { User, Clock, Settings, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
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
  
  // Refs para armazenar valores anteriores para desfazer
  const previousProfileRef = useRef<ProfileFormData | null>(null);
  const previousGoalRef = useRef<GoalFormData | null>(null);
  const previousPreferencesRef = useRef<PreferencesFormData | null>(null);
  const previousSystemSettingsRef = useRef<SystemSettingsFormData | null>(null);
  
  // Refs para timeouts de debounce
  const profileSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const goalSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preferencesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const systemSettingsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Refs para armazenar valores anteriores e evitar resets desnecessários
  const prevProfileDataRef = useRef<any>(null);
  const prevSettingsDataRef = useRef<any>(null);
  const prevPreferencesDataRef = useRef<any>(null);

  // Atualizar formulários quando dados chegarem (apenas se mudaram)
  useEffect(() => {
    if (profileData && profileData !== prevProfileDataRef.current) {
      const { user, profile } = profileData;
      
      let formData: ProfileFormData;
      if (user && profile) {
        formData = {
          nome: profile.first_name || '',
          sobrenome: profile.last_name || '',
          email: user.email || '',
        };
      } else if (user) {
        formData = {
          nome: (user.user_metadata as any)?.nome || '',
          sobrenome: (user.user_metadata as any)?.sobrenome || '',
          email: user.email || '',
        };
      } else {
        prevProfileDataRef.current = profileData;
        return;
      }
      
      profileForm.reset(formData);
      previousProfileRef.current = { ...formData };
      prevProfileDataRef.current = profileData;
    }
  }, [profileData, profileForm]);

  useEffect(() => {
    if (settingsData && settingsData !== prevSettingsDataRef.current) {
      const goalData: GoalFormData = {
        dailyGoal: settingsData.daily_goal,
        weeklyGoal: settingsData.weekly_goal,
        workStartTime: settingsData.work_start_time,
        workEndTime: settingsData.work_end_time,
      };
      
      const systemData: SystemSettingsFormData = {
        timezone: settingsData.timezone || 'America/Sao_Paulo',
        hour_format: settingsData.hour_format || '24h',
        date_format: settingsData.date_format || 'dd/MM/yyyy',
      };

      goalForm.reset(goalData);
      systemSettingsForm.reset(systemData);
      
      previousGoalRef.current = { ...goalData };
      previousSystemSettingsRef.current = { ...systemData };
      
      prevSettingsDataRef.current = settingsData;
    }
  }, [settingsData, goalForm, systemSettingsForm]);

  useEffect(() => {
    if (preferencesData && preferencesData !== prevPreferencesDataRef.current) {
      const formData: PreferencesFormData = {
        theme: preferencesData.theme || 'system',
        language: preferencesData.language || 'pt-BR',
        week_start_day: preferencesData.week_start_day || 1,
        export_format: preferencesData.export_format || 'csv',
      };
      
      preferencesForm.reset(formData);
      previousPreferencesRef.current = { ...formData };
      
      prevPreferencesDataRef.current = preferencesData;
    }
  }, [preferencesData, preferencesForm]);

  const saveProfile = useCallback(async (data: ProfileFormData, showToast = true) => {
    // Capturar o valor anterior ANTES de salvar (para o undo funcionar corretamente)
    const previousData = previousProfileRef.current ? { ...previousProfileRef.current } : null;
    
    try {
      await updateUserProfile({
        first_name: data.nome,
        last_name: data.sobrenome,
      });
      
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
      
      // Atualizar o ref com os novos dados ANTES de mostrar o toast
      previousProfileRef.current = { ...data };
      
      if (showToast) {
        toast.success('Perfil salvo automaticamente', {
          action: previousData ? {
            label: 'Desfazer',
            onClick: () => {
              profileForm.reset(previousData);
              saveProfile(previousData, false);
            },
          } : undefined,
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar perfil';
      toast.error(errorMessage);
    }
  }, [profileData, mutateProfile, profileForm]);

  const saveGoals = useCallback(async (data: GoalFormData, showToast = true) => {
    // Capturar o valor anterior ANTES de salvar (para o undo funcionar corretamente)
    const previousData = previousGoalRef.current ? { ...previousGoalRef.current } : null;
    
    try {
      await updateUserSettingsComplete({
        daily_goal: data.dailyGoal,
        weekly_goal: data.weeklyGoal,
        work_start_time: data.workStartTime,
        work_end_time: data.workEndTime,
      });
      
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
      
      // Atualizar o ref com os novos dados ANTES de mostrar o toast
      previousGoalRef.current = { ...data };
      
      if (showToast) {
        toast.success('Metas salvas automaticamente', {
          action: previousData ? {
            label: 'Desfazer',
            onClick: () => {
              goalForm.reset(previousData);
              saveGoals(previousData, false);
            },
          } : undefined,
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar metas:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar metas';
      toast.error(errorMessage);
    }
  }, [settingsData, mutateSettings, goalForm]);

  const savePreferences = useCallback(async (data: PreferencesFormData, showToast = true) => {
    // Capturar o valor anterior ANTES de salvar (para o undo funcionar corretamente)
    const previousData = previousPreferencesRef.current ? { ...previousPreferencesRef.current } : null;
    
    try {
      await updateUserPreferences(data);
      
      // Atualizar o cache local com os dados atualizados
      if (preferencesData) {
        const updatedPreferencesData = {
          ...preferencesData,
          ...data,
        };
        mutatePreferences(updatedPreferencesData);
      }
      
      // Atualizar o ref com os novos dados ANTES de mostrar o toast
      previousPreferencesRef.current = { ...data };
      
      if (showToast) {
        toast.success('Preferências salvas automaticamente', {
          action: previousData ? {
            label: 'Desfazer',
            onClick: () => {
              preferencesForm.reset(previousData);
              savePreferences(previousData, false);
            },
          } : undefined,
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar preferências:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar preferências';
      toast.error(errorMessage);
    }
  }, [preferencesData, mutatePreferences, preferencesForm]);

  const saveSystemSettings = useCallback(async (data: SystemSettingsFormData, showToast = true) => {
    // Capturar o valor anterior ANTES de salvar (para o undo funcionar corretamente)
    const previousData = previousSystemSettingsRef.current ? { ...previousSystemSettingsRef.current } : null;
    
    try {
      await updateUserSettingsComplete(data);
      
      // Atualizar o cache local com os dados atualizados
      if (settingsData) {
        const updatedSettingsData = {
          ...settingsData,
          ...data,
        };
        mutateSettings(updatedSettingsData);
      }
      
      // Atualizar o ref com os novos dados ANTES de mostrar o toast
      previousSystemSettingsRef.current = { ...data };
      
      if (showToast) {
        toast.success('Configurações salvas automaticamente', {
          action: previousData ? {
            label: 'Desfazer',
            onClick: () => {
              systemSettingsForm.reset(previousData);
              saveSystemSettings(previousData, false);
            },
          } : undefined,
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar configurações do sistema:', error);
      const errorMessage = error.message || 'Erro desconhecido ao atualizar configurações';
      toast.error(errorMessage);
    }
  }, [settingsData, mutateSettings, systemSettingsForm]);

  // Salvamento automático do perfil
  useEffect(() => {
    const subscription = profileForm.watch((data) => {
      if (!profileData || !previousProfileRef.current) return;
      
      const hasChanges = 
        data.nome !== previousProfileRef.current.nome ||
        data.sobrenome !== previousProfileRef.current.sobrenome;
      
      if (!hasChanges) return;
      
      // Validar antes de salvar
      if (!data.nome || data.nome.length < 2 || !data.sobrenome || data.sobrenome.length < 2) {
        return;
      }
      
      if (profileSaveTimeoutRef.current) {
        clearTimeout(profileSaveTimeoutRef.current);
      }
      
      profileSaveTimeoutRef.current = setTimeout(() => {
        saveProfile(data as ProfileFormData);
      }, 1000); // 1 segundo de debounce
    });
    
    return () => {
      subscription.unsubscribe();
      if (profileSaveTimeoutRef.current) {
        clearTimeout(profileSaveTimeoutRef.current);
      }
    };
  }, [profileForm, profileData, saveProfile]);

  // Salvamento automático de metas
  useEffect(() => {
    const subscription = goalForm.watch((data) => {
      if (!settingsData || !previousGoalRef.current) return;
      
      const hasChanges = 
        data.dailyGoal !== previousGoalRef.current.dailyGoal ||
        data.weeklyGoal !== previousGoalRef.current.weeklyGoal ||
        data.workStartTime !== previousGoalRef.current.workStartTime ||
        data.workEndTime !== previousGoalRef.current.workEndTime;
      
      if (!hasChanges) return;
      
      if (goalSaveTimeoutRef.current) {
        clearTimeout(goalSaveTimeoutRef.current);
      }
      
      goalSaveTimeoutRef.current = setTimeout(() => {
        saveGoals(data as GoalFormData);
      }, 1000);
    });
    
    return () => {
      subscription.unsubscribe();
      if (goalSaveTimeoutRef.current) {
        clearTimeout(goalSaveTimeoutRef.current);
      }
    };
  }, [goalForm, settingsData, saveGoals]);

  // Salvamento automático de preferências
  useEffect(() => {
    const subscription = preferencesForm.watch((data) => {
      if (!preferencesData || !previousPreferencesRef.current) return;
      
      const hasChanges = 
        data.theme !== previousPreferencesRef.current.theme ||
        data.language !== previousPreferencesRef.current.language ||
        data.week_start_day !== previousPreferencesRef.current.week_start_day ||
        data.export_format !== previousPreferencesRef.current.export_format;
      
      if (!hasChanges) return;
      
      if (preferencesSaveTimeoutRef.current) {
        clearTimeout(preferencesSaveTimeoutRef.current);
      }
      
      preferencesSaveTimeoutRef.current = setTimeout(() => {
        savePreferences(data as PreferencesFormData);
      }, 1000);
    });
    
    return () => {
      subscription.unsubscribe();
      if (preferencesSaveTimeoutRef.current) {
        clearTimeout(preferencesSaveTimeoutRef.current);
      }
    };
  }, [preferencesForm, preferencesData, savePreferences]);

  // Salvamento automático de configurações do sistema
  useEffect(() => {
    const subscription = systemSettingsForm.watch((data) => {
      if (!settingsData || !previousSystemSettingsRef.current) return;
      
      const hasChanges = 
        data.timezone !== previousSystemSettingsRef.current.timezone ||
        data.hour_format !== previousSystemSettingsRef.current.hour_format ||
        data.date_format !== previousSystemSettingsRef.current.date_format;
      
      if (!hasChanges) return;
      
      if (systemSettingsSaveTimeoutRef.current) {
        clearTimeout(systemSettingsSaveTimeoutRef.current);
      }
      
      systemSettingsSaveTimeoutRef.current = setTimeout(() => {
        saveSystemSettings(data as SystemSettingsFormData);
      }, 1000);
    });
    
    return () => {
      subscription.unsubscribe();
      if (systemSettingsSaveTimeoutRef.current) {
        clearTimeout(systemSettingsSaveTimeoutRef.current);
      }
    };
  }, [systemSettingsForm, settingsData, saveSystemSettings]);

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
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
              <User className="w-4 h-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Clock className="w-4 h-4 mr-2" />
              Metas de Horas
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="w-4 h-4 mr-2" />
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
                  <form className="space-y-4">
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
                  <form className="space-y-4">
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
                    <form className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
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
                      </div>
                      
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
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferências Pessoais</CardTitle>
                  <CardDescription>
                    Configure tema e idioma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form className="space-y-4">
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
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sair da Conta</h4>
                      <p className="text-sm text-muted-foreground">
                        Fazer logout da sua sessão atual
                      </p>
                    </div>
                    <Button variant="destructive" onClick={logout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
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
