'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, ExternalLink } from 'lucide-react';
import { mockTimeEntries, mockProjects } from '@/lib/supabase-placeholders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecentEntries() {
  const recentEntries = mockTimeEntries.slice(0, 5); // Pegar as 5 mais recentes

  const getProjectName = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    return project?.nome || 'Projeto não encontrado';
  };

  const getProjectClient = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
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
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Apontamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">
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
                      {format(new Date(entry.data), 'dd/MM/yyyy', { locale: ptBR })}
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
                    <Clock className="mr-1 h-4 w-4" />
                    {entry.horas}h
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhum apontamento encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Comece registrando suas primeiras horas de trabalho.
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Novo Apontamento
              </Button>
            </div>
          )}
        </div>
        
        {recentEntries.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              Ver Todos os Apontamentos
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
