'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, ExternalLink } from 'lucide-react';
import { getTimeEntries, getProjects } from '@/lib/supabase-client';
import { TimeEntry, Project } from '@/types/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseSupabaseDate } from '@/lib/utils';

export function RecentEntries() {
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [entriesData, projectsData] = await Promise.all([
          getTimeEntries(),
          getProjects(),
        ]);

        setRecentEntries(entriesData.slice(0, 5)); // Pegar as 5 mais recentes
        setProjects(projectsData);
      } catch (error) {
        console.error('Erro ao carregar apontamentos recentes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.nome || 'Projeto não encontrado';
  };

  const getProjectClient = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.cliente || '';
  };

  const getFunctionColor = (funcao: string) => {
    const colors: Record<string, string> = {
      'Desenvolvimento': 'bg-blue-100 text-blue-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Reunião': 'bg-green-100 text-green-800',
      'Pesquisa': 'bg-yellow-100 text-yellow-800',
      'Testes': 'bg-red-100 text-red-800',
    };
    return colors[funcao] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="w-40 h-5 mb-2 rounded bg-muted animate-pulse" />
              <div className="w-56 h-4 rounded bg-muted animate-pulse" />
            </div>
            <div className="w-32 rounded h-9 bg-muted animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 rounded bg-muted animate-pulse" />
                  <div className="w-24 h-3 rounded bg-muted animate-pulse" />
                  <div className="w-48 h-3 rounded bg-muted animate-pulse" />
                </div>
                <div className="w-12 h-4 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Apontamentos Recentes</CardTitle>
            <CardDescription>
              Seus últimos registros de horas trabalhadas
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <a href="/hours">
              <Plus className="w-4 h-4 mr-2" />
              Novo Apontamento
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-4 transition-colors border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">
                      {getProjectName(entry.project_id)}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {getProjectClient(entry.project_id)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getFunctionColor(entry.funcao)}`}>
                      {entry.funcao}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(parseSupabaseDate(entry.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  
                  {entry.descricao && (
                    <p className="text-sm text-muted-foreground">
                      {entry.descricao}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-sm font-medium">
                    <Clock className="w-4 h-4 mr-1" />
                    {entry.horas}h
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/hours">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhum apontamento encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Comece registrando suas primeiras horas de trabalho.
              </p>
              <Button className="mt-4" asChild>
                <a href="/hours">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Apontamento
                </a>
              </Button>
            </div>
          )}
        </div>
        
        {recentEntries.length > 0 && (
          <div className="pt-4 mt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <a href="/hours">
                Ver Todos os Apontamentos
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
