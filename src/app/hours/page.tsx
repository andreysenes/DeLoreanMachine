import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TimeEntryTable } from '@/components/hours/time-entry-table';
import { ExportButtons } from '@/components/export/export-buttons';

export default function HoursPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Controle de Horas</h2>
            <p className="text-muted-foreground">
              Gerencie todos os seus apontamentos de tempo
            </p>
          </div>
          <ExportButtons variant="dropdown" />
        </div>
        
        <TimeEntryTable />
      </div>
    </DashboardLayout>
  );
}
