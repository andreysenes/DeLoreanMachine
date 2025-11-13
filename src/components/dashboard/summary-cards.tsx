'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { getTodaySummary, getCurrentWeekSummary, mockHourGoal } from '@/lib/supabase-placeholders';

export function SummaryCards() {
  const todaySummary = getTodaySummary();
  const weekSummary = getCurrentWeekSummary();
  const goal = mockHourGoal;

  const todayProgress = (todaySummary.totalHours / goal.dailyGoal) * 100;
  const weekProgress = (weekSummary.totalHours / goal.weeklyGoal) * 100;

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
            Meta: {goal.dailyGoal}h
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
            Meta: {goal.weeklyGoal}h
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
          <div className="text-2xl font-bold">{goal.dailyGoal}h</div>
          <p className="text-xs text-muted-foreground">
            {goal.workStartTime} - {goal.workEndTime}
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
