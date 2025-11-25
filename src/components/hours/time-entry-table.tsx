'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, Plus, Filter, Loader2, Clock } from 'lucide-react';
import { getTimeEntries, getProjects, deleteTimeEntry } from '@/lib/supabase-client';
import { SwipeableItem } from '@/components/ui/swipeable-item';
import { TimeEntry, Project } from '@/types/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TimeEntryForm } from './time-entry-form';
import { parseSupabaseDate } from '@/lib/utils';

export function TimeEntryTable() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [entriesData, projectsData] = await Promise.all([
        getTimeEntries(),
        getProjects(),
      ]);
      setEntries(entriesData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.nome || 'Projeto não encontrado';
  };

  const getProjectClient = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.cliente || '';
  };

  const getFunctionColor = (funcao: string) => {
    const colors: Record<string, string> = {
      'Desenvolvimento': 'bg-blue-100 text-blue-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Reunião': 'bg-green-100 text-green-800',
      'Pesquisa': 'bg-yellow-100 text-yellow-800',
      'Testes': 'bg-red-100 text-red-800',
      'Documentação': 'bg-indigo-100 text-indigo-800',
      'Planejamento': 'bg-orange-100 text-orange-800',
      'Review': 'bg-pink-100 text-pink-800',
    };
    return colors[funcao] || 'bg-gray-100 text-gray-800';
  };

  const functions = [...new Set(entries.map(e => e.funcao))];

  const filteredEntries = entries.filter(entry => {
    const projectName = getProjectName(entry.project_id).toLowerCase();
    const descricao = entry.descricao?.toLowerCase() || '';
    
    const matchesSearch = projectName.includes(searchTerm.toLowerCase()) || 
                         descricao.includes(searchTerm.toLowerCase());
    
    const matchesProject = selectedProject === 'all' || entry.project_id === selectedProject;
    const matchesFunction = selectedFunction === 'all' || entry.funcao === selectedFunction;
    
    return matchesSearch && matchesProject && matchesFunction;
  });

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.horas, 0);

  const handleEdit = (entry: TimeEntry) => {
    setEntryToEdit(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Tem certeza que deseja excluir este apontamento?')) {
      return;
    }
    
    try {
      await deleteTimeEntry(entryId);
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (error: any) {
      console.error('Erro ao excluir apontamento:', error);
      alert(`Erro ao excluir apontamento: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleFormSuccess = () => {
    loadData();
    setShowForm(false);
    setEntryToEdit(null);
  };

  const handleNewEntry = () => {
    setEntryToEdit(null);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Carregando apontamentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Controle de Horas</CardTitle>
              <CardDescription>
                Gerencie todos os seus apontamentos de tempo
              </CardDescription>
            </div>
            <Button onClick={handleNewEntry}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Apontamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por projeto ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os projetos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedFunction} onValueChange={setSelectedFunction}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todas as funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {functions.map((func) => (
                  <SelectItem key={func} value={func}>
                    {func}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="p-4 mb-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {filteredEntries.length} apontamento{filteredEntries.length !== 1 ? 's' : ''} encontrado{filteredEntries.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm font-bold">
                Total: {totalHours.toFixed(1)} horas
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(parseSupabaseDate(entry.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getProjectName(entry.project_id)}</div>
                          <div className="text-sm text-muted-foreground">
                            {getProjectClient(entry.project_id)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getFunctionColor(entry.funcao)}`}>
                          {entry.funcao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {entry.descricao || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-right">
                        {entry.horas}h
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {entries.length === 0 
                            ? 'Nenhum apontamento encontrado. Crie seu primeiro apontamento!'
                            : 'Nenhum apontamento encontrado com os filtros aplicados'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List View with Swipe */}
          <div className="space-y-4 md:hidden">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <SwipeableItem
                  key={entry.id}
                  onEdit={() => handleEdit(entry)}
                  onDelete={() => handleDelete(entry.id)}
                  className="border rounded-lg"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{getProjectName(entry.project_id)}</div>
                        <div className="text-sm text-muted-foreground">
                          {getProjectClient(entry.project_id)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{entry.horas}h</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={`${getFunctionColor(entry.funcao)}`}>
                        {entry.funcao}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {format(parseSupabaseDate(entry.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                    
                    {entry.descricao && (
                      <div className="pt-2 text-sm border-t text-muted-foreground">
                        {entry.descricao}
                      </div>
                    )}
                  </div>
                </SwipeableItem>
              ))
            ) : (
              <div className="py-8 text-center border rounded-lg bg-muted/10">
                <div className="flex flex-col items-center gap-2">
                  <Filter className="w-8 h-8 text-muted-foreground" />
                  <p className="px-4 text-muted-foreground">
                    {entries.length === 0 
                      ? 'Nenhum apontamento encontrado. Crie seu primeiro apontamento!'
                      : 'Nenhum apontamento encontrado com os filtros aplicados'
                    }
                  </p>
                </div>
              </div>
            )}
            
            {filteredEntries.length > 0 && (
              <p className="pt-2 text-xs text-center text-muted-foreground">
                Deslize para editar ou excluir
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <TimeEntryForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
        entryToEdit={entryToEdit}
      />
    </>
  );
}
