import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectTable } from '@/components/projects/project-table';
import { ExportButtons } from '@/components/export/export-buttons';

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
            <p className="text-muted-foreground">
              Gerencie todos os seus projetos e clientes
            </p>
          </div>
          <ExportButtons variant="dropdown" />
        </div>
        
        <ProjectTable />
      </div>
    </DashboardLayout>
  );
}
