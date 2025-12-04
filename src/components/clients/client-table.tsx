'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2, Plus, Loader2, Building2 } from 'lucide-react';
import { getClients, deleteClient } from '@/lib/client-service';
import { Client } from '@/types/db';
import { ClientForm } from './client-form';
import { SwipeableItem } from '@/components/ui/swipeable-item';

export function ClientTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setClientToEdit(client);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await deleteClient(id);
      setClients(clients.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const handleNew = () => {
    setClientToEdit(null);
    setShowForm(true);
  };

  const handleSuccess = () => {
    loadClients();
    setShowForm(false);
    setClientToEdit(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Carregando clientes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Gerencie seus clientes e contratos</CardDescription>
            </div>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="py-8 text-center border rounded-lg bg-muted/10">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum cliente cadastrado.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.nome}</TableCell>
                        <TableCell>{client.cnpj || '-'}</TableCell>
                        <TableCell>{client.tipo_servico || '-'}</TableCell>
                        <TableCell>{client.contrato_id || '-'}</TableCell>
                        <TableCell className="text-right">{client.horas_contratadas || 0}h</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(client.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

               {/* Mobile List */}
              <div className="space-y-4 md:hidden">
                {clients.map((client) => (
                   <SwipeableItem
                    key={client.id}
                    onEdit={() => handleEdit(client)}
                    onDelete={() => handleDelete(client.id)}
                    className="border rounded-lg"
                  >
                   <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="pr-2 font-medium truncate">{client.nome}</div>
                         <div className="px-2 py-1 text-xs rounded bg-muted">
                           {client.horas_contratadas || 0}h
                         </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {client.cnpj && <div>CNPJ: {client.cnpj}</div>}
                        {client.tipo_servico && <div>{client.tipo_servico}</div>}
                        {client.contrato_id && <div className="text-xs">Contrato: {client.contrato_id}</div>}
                      </div>
                   </div>
                  </SwipeableItem>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <ClientForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleSuccess}
        clientToEdit={clientToEdit}
      />
    </>
  );
}
