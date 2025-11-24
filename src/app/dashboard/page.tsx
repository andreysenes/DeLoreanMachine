import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { RecentEntries } from '@/components/dashboard/recent-entries';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do seu controle de horas
          </p>
        </div>
        
        <SummaryCards />
        
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-8">
            <RecentEntries />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
