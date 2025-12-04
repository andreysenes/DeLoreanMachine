'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { getClients } from '@/lib/client-service';
import { createReport, updateReport } from '@/lib/report-service';
import { getProjects } from '@/lib/supabase-client';
import { Client, Project, Report } from '@/types/db';
import { subDays, format } from 'date-fns';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  project_ids: z.array(z.string()).optional(),
  start_date: z.string().min(1, 'Data inicial é obrigatória'),
  end_date: z.string().min(1, 'Data final é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface ReportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  report?: Report | null;
}

export function ReportFormDialog({ open, onOpenChange, onSuccess, report }: ReportFormDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      client_id: '',
      project_ids: [],
      start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        title: report.title,
        client_id: report.client_id || '',
        project_ids: report.project_ids || [],
        start_date: report.start_date,
        end_date: report.end_date,
      });
    } else {
      form.reset({
        title: '',
        client_id: '',
        project_ids: [],
        start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [report, form]);

  useEffect(() => {
    if (open) {
      const loadFormData = async () => {
        try {
          const [clientsData, projectsData] = await Promise.all([
            getClients().catch(error => {
              console.error('Erro ao buscar clientes:', error);
              return [];
            }),
            getProjects().catch(error => {
              console.error('Erro ao buscar projetos:', error);
              return [];
            })
          ]);

          if (Array.isArray(clientsData)) {
            setClients(clientsData);
          } else {
            console.error('Dados de clientes inválidos:', clientsData);
            setClients([]);
          }

          if (Array.isArray(projectsData)) {
            setProjects(projectsData);
          } else {
            console.error('Dados de projetos inválidos:', projectsData);
            setProjects([]);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do formulário:', error);
          setClients([]);
          setProjects([]);
        }
      };

      loadFormData();
    }
  }, [open]);

  const selectedClientId = form.watch('client_id');

  useEffect(() => {
    if (selectedClientId) {
      const filtered = projects.filter(p => p.client_id === selectedClientId);
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects([]);
    }
  }, [selectedClientId, projects, clients]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      let result;

      if (report) {
        result = await updateReport(report.id, {
          title: data.title,
          client_id: data.client_id,
          project_ids: data.project_ids,
          start_date: data.start_date,
          end_date: data.end_date,
        });
      } else {
        result = await createReport({
          title: data.title,
          client_id: data.client_id,
          project_ids: data.project_ids,
          start_date: data.start_date,
          end_date: data.end_date,
          status: 'active'
        }, []); 
      }
      
      if (!result) {
        throw new Error('Não foi possível salvar o relatório');
      }

      onOpenChange(false);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      alert('Erro ao criar relatório. Por favor, verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{report ? 'Editar Relatório' : 'Novo Relatório'}</DialogTitle>
          <DialogDescription>Configure os parâmetros para o relatório de horas.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Relatório</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Relatório Mensal - Dezembro" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inicial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedClientId && filteredProjects.length > 0 && (
              <FormField
                control={form.control}
                name="project_ids"
                render={() => (
                  <FormItem>
                    <FormLabel>Projetos (Opcional - selecione para filtrar)</FormLabel>
                    <div className="p-4 space-y-2 border rounded-md">
                      {filteredProjects.map((project) => (
                        <FormField
                          key={project.id}
                          control={form.control}
                          name="project_ids"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={project.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(project.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), project.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== project.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {project.nome}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {report ? 'Salvar Alterações' : 'Criar Relatório'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
