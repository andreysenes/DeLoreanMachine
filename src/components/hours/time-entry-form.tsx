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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, addDays, subDays, startOfToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getProjects, createTimeEntry, updateTimeEntry } from '@/lib/supabase-client';
import { Project, TimeEntry } from '@/types/db';

const formSchema = z.object({
  data: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
  project_id: z.string().min(1, 'Projeto é obrigatório'),
  funcao: z.string().min(1, 'Função é obrigatória'),
  descricao: z.string().optional(),
  horas: z.number().min(0.1, 'Horas deve ser maior que 0').max(24, 'Horas não pode exceder 24h'),
});

type FormData = z.infer<typeof formSchema>;

interface TimeEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entryToEdit?: TimeEntry | null;
}

const functions = [
  'Desenvolvimento',
  'Design',
  'Reunião',
  'Pesquisa',
  'Testes',
  'Documentação',
  'Planejamento',
  'Review',
];

export function TimeEntryForm({ open, onOpenChange, onSuccess, entryToEdit }: TimeEntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: format(startOfToday(), 'yyyy-MM-dd'),
      project_id: '',
      funcao: '',
      descricao: '',
      horas: 0,
    },
  });

  const isEditing = !!entryToEdit;

  useEffect(() => {
    if (open) {
      loadProjects();
      
      if (entryToEdit) {
        form.reset({
          data: format(new Date(entryToEdit.data), 'yyyy-MM-dd'),
          project_id: entryToEdit.project_id,
          funcao: entryToEdit.funcao,
          descricao: entryToEdit.descricao || '',
          horas: entryToEdit.horas,
        });
      } else {
        form.reset({
          data: format(startOfToday(), 'yyyy-MM-dd'),
          project_id: '',
          funcao: '',
          descricao: '',
          horas: 0,
        });
      }
    }
  }, [open, entryToEdit, form]);

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const projectData = await getProjects();
      setProjects(projectData.filter(p => p.status === 'ativo'));
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      
      if (isEditing && entryToEdit) {
        await updateTimeEntry(entryToEdit.id, {
          data: new Date(data.data),
          project_id: data.project_id,
          funcao: data.funcao,
          descricao: data.descricao || undefined,
          horas: data.horas,
        });
      } else {
        await createTimeEntry({
          data: new Date(data.data),
          project_id: data.project_id,
          funcao: data.funcao,
          descricao: data.descricao || undefined,
          horas: data.horas,
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar apontamento:', error);
      // Aqui poderia mostrar um toast de erro
      alert(`Erro ao salvar apontamento: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Apontamento' : 'Novo Apontamento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações do apontamento de tempo'
              : 'Registre um novo apontamento de tempo trabalhado'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data */}
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Apontamento</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isLoading}
                        className="cursor-pointer"
                        placeholder="Selecione a data"
                      />
                    </FormControl>
                    <div className="flex gap-1 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => {
                          const yesterday = subDays(startOfToday(), 1);
                          field.onChange(format(yesterday, 'yyyy-MM-dd'));
                        }}
                        className="text-xs h-6 px-2"
                      >
                        Ontem
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => {
                          field.onChange(format(startOfToday(), 'yyyy-MM-dd'));
                        }}
                        className="text-xs h-6 px-2"
                      >
                        Hoje
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => {
                          const tomorrow = addDays(startOfToday(), 1);
                          field.onChange(format(tomorrow, 'yyyy-MM-dd'));
                        }}
                        className="text-xs h-6 px-2"
                      >
                        Amanhã
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Use os atalhos acima ou selecione qualquer data no calendário
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Horas */}
              <FormField
                control={form.control}
                name="horas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Trabalhadas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="Ex: 8.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Projeto */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isLoadingProjects}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingProjects ? "Carregando projetos..." : "Selecione um projeto"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div>
                            <div className="font-medium">{project.nome}</div>
                            <div className="text-sm text-gray-500">{project.cliente}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Função */}
            <FormField
              control={form.control}
              name="funcao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {functions.map((func) => (
                        <SelectItem key={func} value={func}>
                          {func}
                        </SelectItem>
                      ))}
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
                      placeholder="Descreva as atividades realizadas..."
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {isEditing ? 'Atualizar' : 'Criar'} Apontamento
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
