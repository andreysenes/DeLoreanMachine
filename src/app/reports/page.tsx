'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ReportList } from '@/components/reports/report-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ReportFormDialog } from '@/components/reports/report-form-dialog';

export default function ReportsPage() {
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Crie e compartilhe relatórios de horas com seus clientes.
            </p>
          </div>
          <Button onClick={() => setShowNewReportDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
        <ReportList key={refreshTrigger} />
      </div>
      <ReportFormDialog 
        open={showNewReportDialog} 
        onOpenChange={setShowNewReportDialog} 
        onSuccess={handleReportCreated}
      />
    </DashboardLayout>
  );
}
