'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { createClient, updateClient } from '@/lib/client-service';
import { Client } from '@/types/db';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  horas_contratadas: z.coerce.number().min(0).default(0),
  tipo_servico: z.string().optional(),
  contrato_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  clientToEdit?: Client | null;
}

export function ClientForm({ open, onOpenChange, onSuccess, clientToEdit }: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      horas_contratadas: 0,
      tipo_servico: '',
      contrato_id: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (clientToEdit) {
        form.reset({
          nome: clientToEdit.nome,
          cnpj: clientToEdit.cnpj || '',
          horas_contratadas: clientToEdit.horas_contratadas || 0,
          tipo_servico: clientToEdit.tipo_servico || '',
          contrato_id: clientToEdit.contrato_id || '',
        });
      } else {
        form.reset({
          nome: '',
          cnpj: '',
          horas_contratadas: 0,
          tipo_servico: '',
          contrato_id: '',
        });
      }
    }
  }, [open, clientToEdit, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const payload = {
        nome: data.nome,
        cnpj: data.cnpj || undefined,
        horas_contratadas: data.horas_contratadas,
        tipo_servico: data.tipo_servico || undefined,
        contrato_id: data.contrato_id || undefined,
      };

      if (clientToEdit) {
        await updateClient(clientToEdit.id, payload);
      } else {
        await createClient(payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving client:', error);
      alert('Erro ao salvar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = !!clientToEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} value={field.value || ''} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="horas_contratadas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Contratadas</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="tipo_servico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Serviço</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Desenvolvimento" {...field} value={field.value || ''} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="contrato_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Contrato</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: #12345" {...field} value={field.value || ''} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
