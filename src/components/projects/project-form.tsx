'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { createProject, updateProject } from '@/lib/supabase-client';
import { getClients } from '@/lib/client-service';
import { Project, Client } from '@/types/db';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome do projeto é obrigatório').max(100, 'Nome muito longo'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  status: z.enum(['ativo', 'inativo'], { message: 'Status é obrigatório' }),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectToEdit?: Project | null;
}

export function ProjectForm({ open, onOpenChange, onSuccess, projectToEdit }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      client_id: '',
      status: 'ativo',
      descricao: '',
    },
  });

  const isEditing = !!projectToEdit;

  useEffect(() => {
    if (open) {
      getClients().then(setClients);
      
      if (projectToEdit) {
        form.reset({
          nome: projectToEdit.nome,
          client_id: projectToEdit.client_id || '',
          status: projectToEdit.status,
          descricao: projectToEdit.descricao || '',
        });
      } else {
        form.reset({
          nome: '',
          client_id: '',
          status: 'ativo',
          descricao: '',
        });
      }
    }
  }, [open, projectToEdit, form]);

  const handleClientSelect = (clientId: string) => {
    form.setValue('client_id', clientId);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      
      if (isEditing && projectToEdit) {
        await updateProject(projectToEdit.id, {
          nome: data.nome,
          client_id: data.client_id,
          status: data.status,
          descricao: data.descricao || undefined,
        });
      } else {
        await createProject({
          nome: data.nome,
          client_id: data.client_id,
          status: data.status,
          descricao: data.descricao || undefined,
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar projeto:', error);
      // Aqui poderia mostrar um toast de erro
      alert(`Erro ao salvar projeto: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações do projeto'
              : 'Crie um novo projeto para organizar seus apontamentos'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nome do Projeto */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Website Corporativo"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cliente */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={handleClientSelect} 
                      value={field.value} 
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Projeto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ativo">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Ativo
                        </div>
                      </SelectItem>
                      <SelectItem value="inativo">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          Inativo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente o projeto..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {isEditing ? 'Atualizar' : 'Criar'} Projeto
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
