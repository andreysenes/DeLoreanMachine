'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getReportPublicData } from '@/lib/report-service';
import { generateFormattedCSV, downloadCSV } from '@/lib/export-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Calendar, Clock, Briefcase, ListChecks, Hash } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface ProcessedProject {
  name: string;
  hours: number;
  entries: any[];
}

export function ReportView({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const result = await getReportPublicData(reportId);

      if (!result) {
        setError('Relatório não encontrado ou expirado.');
        return;
      }

      setData(result);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar relatório.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const csv = generateFormattedCSV(data.entries, data.client, data.report.title);
    downloadCSV(csv, `Relatorio-${data.client?.nome || 'horas'}-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const formatDate = (d: string) => {
    try {
      const date = parse(d, 'yyyy-MM-dd', new Date());
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return d;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4 bg-background">
        <Card className="w-full max-w-md text-center border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-500">Acesso Indisponível</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { report, client, entries } = data;
  const totalHours = entries.reduce((sum: number, e: any) => sum + (Number(e.horas) || 0), 0);
  
  // Group entries by project
  const projectsMap = entries.reduce((acc: Record<string, ProcessedProject>, entry: any) => {
    const projectName = entry.project_name || 'Sem Projeto';
    if (!acc[projectName]) {
      acc[projectName] = {
        name: projectName,
        hours: 0,
        entries: []
      };
    }
    acc[projectName].hours += (Number(entry.horas) || 0);
    acc[projectName].entries.push(entry);
    return acc;
  }, {});

  const projects = Object.values(projectsMap) as ProcessedProject[];
  const projectCount = projects.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between px-4 py-3 mx-auto">
          <div className="flex items-center gap-2 font-semibold">
            <Clock className="w-5 h-5 text-primary" />
            <span>DeLorean Machine</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Baixar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl px-4 py-8 mx-auto space-y-8">
        
        {/* Report Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground">Relatório</Badge>
                {client?.nome && <Badge>{client.nome}</Badge>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(report.start_date)} - {formatDate(report.end_date)}</span>
              </div>
            </div>
            {client?.cnpj && (
               <div className="text-sm text-right text-muted-foreground">
                 <p>CNPJ: {client.cnpj}</p>
                 {client.contrato_id && <p>Contrato: {client.contrato_id}</p>}
               </div>
            )}
          </div>
        </div>

        {/* Indicators Grid */}
         <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalHours.toFixed(2)}h</div>
              <p className="text-xs text-muted-foreground">Horas trabalhadas no período</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Registros</CardTitle>
              <ListChecks className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
              <p className="text-xs text-muted-foreground">Entradas de tempo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectCount}</div>
              <p className="text-xs text-muted-foreground">Projetos neste relatório</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Breakdown */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">Detalhamento por Projeto</h2>
          
          {projects.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
               <Briefcase className="w-12 h-12 mb-4 opacity-20" />
               <p>Nenhum registro encontrado neste período.</p>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.name} className="overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                  <div className="flex items-center gap-2 font-semibold">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    {project.name}
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {project.hours.toFixed(2)}h
                  </Badge>
                </div>
                <div className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="w-[120px]">Data</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="min-w-[300px]">Descrição</TableHead>
                        <TableHead className="text-right w-[100px]">Horas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.entries.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {formatDate(entry.data)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-normal">
                              {entry.funcao}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                             {entry.descricao || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {Number(entry.horas).toFixed(2)}h
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
