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
import { User, Clock, Settings, LogOut, Save, Loader2 } from 'lucide-react';
import { 
  getCurrentUser, 
  getUserProfile, 
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserSettingsComplete, 
  updateUserSettingsComplete, 
  logout 
} from '@/lib/supabase-client';
import { mockUser } from '@/lib/supabase-placeholders';

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

type ProfileFormData = z.infer<typeof profileSchema>;
type GoalFormData = z.infer<typeof goalSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoadingData(true);
        
        // Carregar dados do usuário
        const user = await getCurrentUser();
        if (user) {
          profileForm.reset({
            nome: (user.user_metadata as any)?.nome || mockUser.nome,
            sobrenome: (user.user_metadata as any)?.sobrenome || mockUser.sobrenome,
            email: user.email || mockUser.email,
          });
        }

        // Carregar configurações/metas
        const settings = await getUserSettingsComplete();
        if (settings) {
          goalForm.reset({
            dailyGoal: settings.daily_goal,
            weeklyGoal: settings.weekly_goal,
            workStartTime: settings.work_start_time,
            workEndTime: settings.work_end_time,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, [profileForm, goalForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      console.log('Atualizando perfil:', data);
      // Por enquanto apenas simular - futuramente implementar updateUserProfile
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const onGoalSubmit = async (data: GoalFormData) => {
    setIsLoading(true);
    try {
      console.log('Atualizando metas:', data);
      await updateUserSettingsComplete({
        daily_goal: data.dailyGoal,
        weekly_goal: data.weeklyGoal,
        work_start_time: data.workStartTime,
        work_end_time: data.workEndTime,
      });
      alert('Metas atualizadas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar metas:', error);
      alert(`Erro ao atualizar metas: ${error.message || 'Erro desconhecido'}`);
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
                  <CardTitle>Preferências do Sistema</CardTitle>
                  <CardDescription>
                    Configure como o sistema deve se comportar para você
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fuso Horário</Label>
                    <Select defaultValue="America/Sao_Paulo">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Formato de Hora</Label>
                    <Select defaultValue="24h">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 horas (14:30)</SelectItem>
                        <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Formato de Data</Label>
                    <Select defaultValue="dd/mm/yyyy">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/AAAA (11/12/2024)</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/AAAA (12/11/2024)</SelectItem>
                        <SelectItem value="yyyy-mm-dd">AAAA-MM-DD (2024-12-11)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Preferências
                  </Button>
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
