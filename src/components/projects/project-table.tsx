'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, Plus, Filter, MoreHorizontal, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { mockProjects, mockTimeEntries } from '@/lib/supabase-placeholders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ProjectTable() {
  const [projects, setProjects] = useState(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const getProjectHours = (projectId: string) => {
    return mockTimeEntries
      .filter(entry => entry.project_id === projectId)
      .reduce((sum, entry) => sum + entry.horas, 0);
  };

  const getProjectLastActivity = (projectId: string) => {
    const projectEntries = mockTimeEntries
      .filter(entry => entry.project_id === projectId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    return projectEntries.length > 0 ? projectEntries[0].data : null;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (projectId: string) => {
    console.log('Editando projeto:', projectId);
    // Aqui será implementada a lógica de edição
  };

  const handleDelete = (projectId: string) => {
    console.log('Deletando projeto:', projectId);
    // Aqui será implementada a lógica de exclusão
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const toggleStatus = (projectId: string) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, status: project.status === 'ativo' ? 'inativo' : 'ativo' }
        : project
    ));
  };

  const getStatusBadge = (status: string) => {
    return status === 'ativo' 
      ? <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      : <Badge variant="secondary">Inativo</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Projetos</CardTitle>
            <CardDescription>
              Gerencie todos os seus projetos e clientes
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-bold">
              {filteredProjects.filter(p => p.status === 'ativo').length} ativo{filteredProjects.filter(p => p.status === 'ativo').length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
                        <span className="font-medium">{project.cliente}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(project.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          {totalHours.toFixed(1)}h
                        </div>
                      </TableCell>
                      <TableCell>
                        {lastActivity ? (
                          <span className="text-sm">
                            {format(new Date(lastActivity), 'dd/MM/yyyy', { locale: ptBR })}
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
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(project.id)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(project.id)}>
                              <Clock className="mr-2 h-4 w-4" />
                              {project.status === 'ativo' ? 'Inativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(project.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Nenhum projeto encontrado com os filtros aplicados
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
