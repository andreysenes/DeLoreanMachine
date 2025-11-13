'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Calendar, Building } from 'lucide-react';
import { 
  getTimeEntries, 
  getProjects, 
  exportToCSV,
  calculateWeeklySummary 
} from '@/lib/supabase-client';

interface ExportButtonsProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
}

export function ExportButtons({ variant = 'dropdown', size = 'sm' }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

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
        'Data': new Date(entry.data).toLocaleDateString('pt-BR'),
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

  const handleExportWeeklyReport = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exportando relatório semanal...');
      const weeklyData = await calculateWeeklySummary();
      
      if (!weeklyData.dailyBreakdown || weeklyData.dailyBreakdown.length === 0) {
        alert('Nenhum dado semanal encontrado para exportar.');
        return;
      }

      // Formatar dados para CSV
      const csvData = weeklyData.dailyBreakdown.map(day => ({
        'Data': day.date.toLocaleDateString('pt-BR'),
        'Dia da Semana': day.date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        'Horas Trabalhadas': day.totalHours,
        'Número de Apontamentos': day.entries.length
      }));

      // Adicionar resumo no final
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

  // Renderizar botão simples
  if (variant === 'button') {
    return (
      <Button 
        variant="outline" 
        size={size} 
        onClick={handleExportTimeEntries}
        disabled={isExporting}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? 'Exportando...' : 'Exportar CSV'}
      </Button>
    );
  }

  // Renderizar dropdown com opções
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={size}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleExportTimeEntries}>
          <FileText className="mr-2 h-4 w-4" />
          Apontamentos de Horas
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportProjects}>
          <Building className="mr-2 h-4 w-4" />
          Projetos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportWeeklyReport}>
          <Calendar className="mr-2 h-4 w-4" />
          Relatório Semanal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
