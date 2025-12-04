import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ClientTable } from '@/components/clients/client-table';

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie seus clientes e contratos.
          </p>
        </div>
        <ClientTable />
      </div>
    </DashboardLayout>
  );
}
