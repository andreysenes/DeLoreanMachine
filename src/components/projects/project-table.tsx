'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, Plus, Filter, MoreHorizontal, Clock, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getProjects, getTimeEntries, deleteProject, updateProject } from '@/lib/supabase-client';
import { getClients } from '@/lib/client-service';
import { SwipeableItem } from '@/components/ui/swipeable-item';
import { Project, TimeEntry, Client } from '@/types/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseSupabaseDate } from '@/lib/utils';
import { ProjectForm } from './project-form';

export function ProjectTable() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectsData, entriesData, clientsData] = await Promise.all([
        getProjects(),
        getTimeEntries(),
        getClients(),
      ]);
      setProjects(projectsData);
      setTimeEntries(entriesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Cliente não encontrado';
    const client = clients.find(c => c.id === clientId);
    return client?.nome || 'Cliente não encontrado';
  };

  const getProjectHours = (projectId: string) => {
    return timeEntries
      .filter(entry => entry.project_id === projectId)
      .reduce((sum, entry) => sum + entry.horas, 0);
  };

  const getProjectLastActivity = (projectId: string) => {
    const projectEntries = timeEntries
      .filter(entry => entry.project_id === projectId)
      .sort((a, b) => parseSupabaseDate(b.data).getTime() - parseSupabaseDate(a.data).getTime());
    
    return projectEntries.length > 0 ? projectEntries[0].data : null;
  };

  const filteredProjects = projects.filter(project => {
    const clientName = getClientName(project.client_id);
    const matchesSearch = project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (project: Project) => {
    setProjectToEdit(project);
    setShowForm(true);
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${projectName}"?\n\nEsta ação não pode ser desfeita e todos os apontamentos relacionados serão perdidos.`)) {
      return;
    }
    
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      alert(`Erro ao excluir projeto: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const toggleStatus = async (project: Project) => {
    const newStatus = project.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      await updateProject(project.id, { status: newStatus });
      setProjects(projects.map(p => 
        p.id === project.id 
          ? { ...p, status: newStatus }
          : p
      ));
    } catch (error: any) {
      console.error('Erro ao alterar status do projeto:', error);
      alert(`Erro ao alterar status: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleFormSuccess = () => {
    loadData();
    setShowForm(false);
    setProjectToEdit(null);
  };

  const handleNewProject = () => {
    setProjectToEdit(null);
    setShowForm(true);
  };

  const getStatusBadge = (status: string) => {
    return status === 'ativo' 
      ? <Badge className="text-green-800 bg-green-100">Ativo</Badge>
      : <Badge variant="secondary">Inativo</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Carregando projetos...</span>
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
              <CardTitle className="text-xl">Projetos</CardTitle>
              <CardDescription>
                Gerencie todos os seus projetos e clientes
              </CardDescription>
            </div>
            <Button onClick={handleNewProject}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por projeto ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="p-4 mb-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm font-bold">
                {filteredProjects.filter(p => p.status === 'ativo').length} ativo{filteredProjects.filter(p => p.status === 'ativo').length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Horas Totais</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const totalHours = getProjectHours(project.id);
                    const lastActivity = getProjectLastActivity(project.id);
                    
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.nome}</div>
                            {project.descricao && (
                              <div className="text-sm text-muted-foreground">
                                {project.descricao}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{getClientName(project.client_id)}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(project.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {totalHours.toFixed(1)}h
                          </div>
                        </TableCell>
                        <TableCell>
                          {lastActivity ? (
                            <span className="text-sm">
                              {format(parseSupabaseDate(lastActivity), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Sem atividade
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(project)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(project)}>
                                <Clock className="w-4 h-4 mr-2" />
                                {project.status === 'ativo' ? 'Inativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(project.id, project.nome)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {projects.length === 0 
                            ? 'Nenhum projeto encontrado. Crie seu primeiro projeto!'
                            : 'Nenhum projeto encontrado com os filtros aplicados'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List View */}
          <div className="space-y-4 md:hidden">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const totalHours = getProjectHours(project.id);
                
                return (
                  <SwipeableItem
                    key={project.id}
                    onEdit={() => handleEdit(project)}
                    onDelete={() => handleDelete(project.id, project.nome)}
                    className="border rounded-lg"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{project.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {getClientName(project.client_id)}
                          </div>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>
                      
                      {project.descricao && (
                        <div className="text-sm text-muted-foreground">
                          {project.descricao}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 mt-2 border-t">
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                          <span className="font-medium">{totalHours.toFixed(1)}h</span>
                          <span className="ml-1 text-muted-foreground">totais</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(project)}>
                          {project.status === 'ativo' ? 'Inativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  </SwipeableItem>
                );
              })
            ) : (
              <div className="py-8 text-center border rounded-lg bg-muted/10">
                <div className="flex flex-col items-center gap-2">
                  <Filter className="w-8 h-8 text-muted-foreground" />
                  <p className="px-4 text-muted-foreground">
                    {projects.length === 0 
                      ? 'Nenhum projeto encontrado. Crie seu primeiro projeto!'
                      : 'Nenhum projeto encontrado com os filtros aplicados'
                    }
                  </p>
                </div>
              </div>
            )}
            
            {filteredProjects.length > 0 && (
              <p className="pt-2 text-xs text-center text-muted-foreground">
                Deslize para editar ou excluir
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ProjectForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
        projectToEdit={projectToEdit}
      />
    </>
  );
}
