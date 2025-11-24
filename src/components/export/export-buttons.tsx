'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileText, Calendar, Building, Settings } from 'lucide-react';
import { 
  getTimeEntries, 
  getProjects, 
  exportToCSV,
  calculateWeeklySummary 
} from '@/lib/supabase-client';
import { parseSupabaseDate } from '@/lib/utils';

interface ExportButtonsProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
}

interface ExportSettings {
  columns: {
    projeto: boolean;
    horas: boolean;
    descricao: boolean;
    data: boolean;
    funcao: boolean;
    created_at: boolean;
  };
  selectedProjects: string[];
}

export function ExportButtons({ variant = 'dropdown', size = 'sm' }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    columns: {
      projeto: true,
      horas: true,
      descricao: true,
      data: true,
      funcao: true,
      created_at: false,
    },
    selectedProjects: [],
  });

  useEffect(() => {
    setIsMounted(true);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsList = await getProjects();
      setProjects(projectsList || []);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const handleExportTimeEntries = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exportando apontamentos de horas...');
      const timeEntries = await getTimeEntries();
      
      if (!timeEntries || timeEntries.length === 0) {
        alert('Nenhum apontamento de horas encontrado para exportar.');
        return;
      }

      // Formatar dados para CSV
      const csvData = timeEntries.map(entry => ({
        'Data': parseSupabaseDate(entry.data).toLocaleDateString('pt-BR'),
        'Projeto ID': entry.project_id,
        'Função': entry.funcao,
        'Descrição': entry.descricao || '',
        'Horas': entry.horas,
        'Criado em': new Date(entry.created_at).toLocaleString('pt-BR')
      }));

      const filename = `apontamentos-${new Date().toISOString().split('T')[0]}`;
      exportToCSV(csvData, filename);
    } catch (error) {
      console.error('Erro ao exportar apontamentos:', error);
      alert('Erro ao exportar apontamentos. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportProjects = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exportando projetos...');
      const projects = await getProjects();
      
      if (!projects || projects.length === 0) {
        alert('Nenhum projeto encontrado para exportar.');
        return;
      }

      // Formatar dados para CSV
      const csvData = projects.map(project => ({
        'Nome': project.nome,
        'Cliente': project.cliente,
        'Status': project.status,
        'Descrição': project.descricao || '',
        'Criado em': new Date(project.created_at).toLocaleDateString('pt-BR')
      }));

      const filename = `projetos-${new Date().toISOString().split('T')[0]}`;
      exportToCSV(csvData, filename);
    } catch (error) {
      console.error('Erro ao exportar projetos:', error);
      alert('Erro ao exportar projetos. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExportTimeEntries = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exportando apontamentos personalizados...', exportSettings);
      const timeEntries = await getTimeEntries();
      
      if (!timeEntries || timeEntries.length === 0) {
        alert('Nenhum apontamento de horas encontrado para exportar.');
        return;
      }

      // Filtrar por projetos selecionados se necessário
      let filteredEntries = timeEntries;
      if (exportSettings.selectedProjects.length > 0) {
        filteredEntries = timeEntries.filter(entry => 
          exportSettings.selectedProjects.includes(entry.project_id)
        );
      }

      // Mapear nome do projeto
      const projectsMap = projects.reduce((acc, project) => {
        acc[project.id] = project.nome;
        return acc;
      }, {} as Record<string, string>);

      // Formatar dados conforme colunas selecionadas
      const csvData = filteredEntries.map(entry => {
        const row: any = {};
        
        if (exportSettings.columns.data) {
          row['Data'] = parseSupabaseDate(entry.data).toLocaleDateString('pt-BR');
        }
        if (exportSettings.columns.projeto) {
          row['Projeto'] = projectsMap[entry.project_id] || 'Projeto não encontrado';
        }
        if (exportSettings.columns.funcao) {
          row['Função'] = entry.funcao;
        }
        if (exportSettings.columns.descricao) {
          row['Descrição'] = entry.descricao || '';
        }
        if (exportSettings.columns.horas) {
          row['Horas'] = entry.horas;
        }
        if (exportSettings.columns.created_at) {
          row['Criado em'] = new Date(entry.created_at).toLocaleString('pt-BR');
        }
        
        return row;
      });

      const filename = `apontamentos-personalizado-${new Date().toISOString().split('T')[0]}`;
      exportToCSV(csvData, filename);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao exportar apontamentos:', error);
      alert('Erro ao exportar apontamentos. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWeeklyReport = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exportando relatório semanal...');
      const weeklyData = await calculateWeeklySummary();
      
      if (!weeklyData.dailyBreakdown || weeklyData.dailyBreakdown.length === 0) {
        alert('Nenhum dado semanal encontrado para exportar.');
        return;
      }

      const csvData = weeklyData.dailyBreakdown.map(day => ({
        'Data': day.date.toLocaleDateString('pt-BR'),
        'Dia da Semana': day.date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        'Horas Trabalhadas': day.totalHours,
        'Número de Apontamentos': day.entries.length
      }));

      csvData.push({
        'Data': 'TOTAL SEMANAL',
        'Dia da Semana': `${weeklyData.weekStart.toLocaleDateString('pt-BR')} - ${weeklyData.weekEnd.toLocaleDateString('pt-BR')}`,
        'Horas Trabalhadas': weeklyData.totalHours,
        'Número de Apontamentos': weeklyData.dailyBreakdown.reduce((sum, day) => sum + day.entries.length, 0)
      });

      const filename = `relatorio-semanal-${weeklyData.weekStart.toISOString().split('T')[0]}`;
      exportToCSV(csvData, filename);
    } catch (error) {
      console.error('Erro ao exportar relatório semanal:', error);
      alert('Erro ao exportar relatório semanal. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Client-only render to prevent hydration issues
  if (!isMounted) {
    return (
      <Button variant="outline" size={size} disabled>
        <Download className="w-4 h-4 mr-2" />
        Exportar...
      </Button>
    );
  }

  // Renderizar botão simples
  if (variant === 'button') {
    return (
      <Button 
        variant="outline" 
        size={size} 
        onClick={handleExportTimeEntries}
        disabled={isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exportando...' : 'Exportar CSV'}
      </Button>
    );
  }

  // Renderizar dropdown com opções
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size={size}
            disabled={isExporting}
            id="export-dropdown-trigger"
            aria-controls="export-dropdown-content"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" id="export-dropdown-content">
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Exportar Personalizado
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem onClick={handleExportProjects}>
            <Building className="w-4 h-4 mr-2" />
            Projetos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleWeeklyReport}>
            <Calendar className="w-4 h-4 mr-2" />
            Relatório Semanal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Apontamentos Personalizado</DialogTitle>
          <DialogDescription>
            Escolha as colunas e projetos que deseja incluir na exportação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seleção de Colunas */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Colunas para exportar</h4>
            <div className="space-y-2">
              {[
                { key: 'data', label: 'Data' },
                { key: 'projeto', label: 'Projeto' },
                { key: 'funcao', label: 'Função' },
                { key: 'descricao', label: 'Descrição' },
                { key: 'horas', label: 'Horas' },
                { key: 'created_at', label: 'Data de criação' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${key}`}
                    checked={exportSettings.columns[key as keyof typeof exportSettings.columns]}
                    onCheckedChange={(checked) =>
                      setExportSettings(prev => ({
                        ...prev,
                        columns: { ...prev.columns, [key]: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor={`column-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Seleção de Projetos */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Filtrar por projetos (opcional)</h4>
            <div className="space-y-2 overflow-y-auto max-h-32">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={exportSettings.selectedProjects.includes(project.id)}
                    onCheckedChange={(checked) => {
                      setExportSettings(prev => ({
                        ...prev,
                        selectedProjects: checked
                          ? [...prev.selectedProjects, project.id]
                          : prev.selectedProjects.filter(id => id !== project.id)
                      }));
                    }}
                  />
                  <Label htmlFor={`project-${project.id}`} className="text-sm">
                    {project.nome} - {project.cliente}
                  </Label>
                </div>
              ))}
            </div>
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum projeto encontrado</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCustomExportTimeEntries} disabled={isExporting}>
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
