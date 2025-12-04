'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Calendar, Copy, Share2, Archive, Download, Edit } from 'lucide-react';
import { getReports, archiveReport, getReportDetails } from '@/lib/report-service';
import { generateFormattedCSV, downloadCSV } from '@/lib/export-service';
import { getClients } from '@/lib/client-service';
import { Report, Client } from '@/types/db';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShareReportDialog } from '@/components/reports/share-report-dialog';
import { ReportFormDialog } from '@/components/reports/report-form-dialog';
import { SwipeableItem } from '@/components/ui/swipeable-item';

export function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialogReport, setShareDialogReport] = useState<Report | null>(null);
  const [editReport, setEditReport] = useState<Report | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar relatórios
      let reportsData: Report[] = [];
      try {
        reportsData = await getReports();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('Erro ao buscar relatórios:', { message: errorMessage });
      }
      setReports(Array.isArray(reportsData) ? reportsData : []);

      // Carregar clientes
      let clientsData: Client[] = [];
      try {
        clientsData = await getClients();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('Erro ao buscar clientes:', { message: errorMessage });
      }
      setClients(Array.isArray(clientsData) ? clientsData : []);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao carregar dados:', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getClientName = (id?: string) => {
    if (!id) return '-';
    return clients.find(c => c.id === id)?.nome || 'Cliente removido';
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Arquivar este relatório? Ele não será mais visível.')) return;
    
    setIsLoading(true);
    try {
      await archiveReport(id);
      const updatedReports = reports.filter(r => r.id !== id);
      setReports(updatedReports);
    } catch (error) {
      console.error('Erro ao arquivar relatório:', error);
      alert('Erro ao arquivar relatório. Por favor, tente novamente.');
      await loadData(); // Recarregar dados em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const data = await getReportDetails(reportId);
      if (!data) throw new Error('Dados não encontrados');
      
      const csv = generateFormattedCSV(data.entries, data.client, data.report.title);
      downloadCSV(csv, `Relatorio-${data.client?.nome || 'horas'}-${format(new Date(), 'yyyy-MM-dd')}`);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      alert('Erro ao baixar relatório. Por favor, tente novamente.');
    }
  };

  const handleEditSuccess = () => {
    setEditReport(null);
    loadData();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </CardContent>
      </Card>
    );
  }

  const activeReports = reports.filter(r => r.status === 'active');

  return (
    <>
      <Card>
        <CardContent className="p-0 sm:p-6">
          {activeReports.length === 0 ? (
            <div className="py-12 text-center border-t sm:border-t-0">
               <p className="text-muted-foreground">Nenhum relatório ativo encontrado.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{getClientName(report.client_id)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDate(report.start_date)} - {formatDate(report.end_date)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             <Button size="sm" variant="outline" onClick={() => handleDownload(report.id)}>
                               <Download className="w-3 h-3 mr-2" />
                               Baixar
                             </Button>
                             <Button size="sm" variant="outline" onClick={() => setEditReport(report)}>
                               <Edit className="w-3 h-3 mr-2" />
                               Editar
                             </Button>
                             <Button size="sm" variant="outline" onClick={() => setShareDialogReport(report)}>
                               <Share2 className="w-3 h-3 mr-2" />
                               Compartilhar
                             </Button>
                             <Button size="sm" variant="ghost" onClick={() => handleArchive(report.id)} className="text-red-600">
                               <Archive className="w-3 h-3" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile List */}
              <div className="p-4 space-y-4 md:hidden sm:p-0">
                {activeReports.map((report) => (
                  <SwipeableItem
                    key={report.id}
                     onDelete={() => handleArchive(report.id)}
                     className="border rounded-lg"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="font-medium">{report.title}</div>
                        <Badge variant="outline">{getClientName(report.client_id)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Calendar className="w-3 h-3" />
                         {formatDate(report.start_date)} - {formatDate(report.end_date)}
                      </div>
                      <div className="flex gap-2 mt-2">
                         <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(report.id)}>
                           <Download className="w-3 h-3 mr-2" />
                           Baixar
                         </Button>
                         <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditReport(report)}>
                           <Edit className="w-3 h-3 mr-2" />
                           Editar
                         </Button>
                         <Button size="sm" variant="outline" className="flex-1" onClick={() => setShareDialogReport(report)}>
                           <Share2 className="w-3 h-3 mr-2" />
                           Compartilhar
                         </Button>
                      </div>
                    </div>
                  </SwipeableItem>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {shareDialogReport && (
        <ShareReportDialog 
          open={!!shareDialogReport} 
          onOpenChange={(open: boolean) => !open && setShareDialogReport(null)}
          report={shareDialogReport}
        />
      )}

      {editReport && (
        <ReportFormDialog 
          open={!!editReport} 
          onOpenChange={(open: boolean) => !open && setEditReport(null)}
          report={editReport}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
