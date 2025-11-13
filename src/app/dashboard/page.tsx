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
          <div className="lg:col-span-4">
            <RecentEntries />
          </div>
          <div className="lg:col-span-3">
            {/* Placeholder for charts or additional widgets */}
            <div className="h-full p-6 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-muted-foreground mb-4">
                  📊
                </div>
                <h3 className="text-lg font-medium mb-2">Gráficos e Relatórios</h3>
                <p className="text-sm text-muted-foreground">
                  Aqui serão exibidos gráficos de produtividade e relatórios visuais
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
