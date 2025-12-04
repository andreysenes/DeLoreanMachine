import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TimeEntryTable } from '@/components/hours/time-entry-table';
import { HoursCalendar } from '@/components/hours/hours-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Calendar } from 'lucide-react';
import { ExportButtons } from '@/components/export/export-buttons';

export default function HoursPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Controle de Horas</h2>
            <p className="text-muted-foreground">
              Gerencie todos os seus apontamentos de tempo
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButtons />
          </div>
        </div>
        
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <TimeEntryTable />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <HoursCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
