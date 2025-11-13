'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { getTodaySummary, calculateWeeklySummary, getUserSettings } from '@/lib/supabase-client';
import { DailySummary, WeeklySummary, HourGoal } from '@/types/db';

export function SummaryCards() {
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [weekSummary, setWeekSummary] = useState<WeeklySummary | null>(null);
  const [userSettings, setUserSettings] = useState<HourGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        console.log('📊 Carregando dados do dashboard...');
        
        const [todayData, weekData, settingsData] = await Promise.all([
          getTodaySummary().catch(err => {
            console.error('Erro ao carregar resumo de hoje:', err);
            return null;
          }),
          calculateWeeklySummary().catch(err => {
            console.error('Erro ao carregar resumo semanal:', err);
            return null;
          }),
          getUserSettings().catch(err => {
            console.error('Erro ao carregar configurações:', err);
            return null;
          }),
        ]);

        console.log('📊 Dados carregados:', { todayData, weekData, settingsData });

        setTodaySummary(todayData);
        setWeekSummary(weekData);
        setUserSettings(settingsData);
      } catch (error) {
        console.error('Erro geral ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading || !todaySummary || !weekSummary || !userSettings) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-2 w-full bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const todayProgress = (todaySummary.totalHours / userSettings.dailyGoal) * 100;
  const weekProgress = (weekSummary.totalHours / userSettings.weeklyGoal) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Horas de Hoje */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Horas de Hoje</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todaySummary.totalHours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            Meta: {userSettings.dailyGoal}h
          </p>
          <Progress value={todayProgress} className="mt-2" />
        </CardContent>
      </Card>

      {/* Horas da Semana */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Horas da Semana</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {weekSummary.totalHours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            Meta: {userSettings.weeklyGoal}h
          </p>
          <Progress value={weekProgress} className="mt-2" />
        </CardContent>
      </Card>

      {/* Meta Diária */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta Diária</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userSettings.dailyGoal}h</div>
          <p className="text-xs text-muted-foreground">
            {userSettings.workStartTime} - {userSettings.workEndTime}
          </p>
          <div className="text-xs text-muted-foreground mt-2">
            Progresso: {todayProgress.toFixed(0)}%
          </div>
        </CardContent>
      </Card>

      {/* Projetos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {weekSummary.projectBreakdown.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Projetos com horas esta semana
          </p>
          <div className="text-xs text-green-600 mt-2">
            +{weekSummary.projectBreakdown.length} esta semana
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
