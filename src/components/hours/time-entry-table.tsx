'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, Plus, Filter } from 'lucide-react';
import { mockTimeEntries, mockProjects } from '@/lib/supabase-placeholders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TimeEntryTable() {
  const [entries, setEntries] = useState(mockTimeEntries);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState('all');

  const getProjectName = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    return project?.nome || 'Projeto não encontrado';
  };

  const getProjectClient = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    return project?.cliente || '';
  };

  const getFunctionColor = (funcao: string) => {
    const colors: Record<string, string> = {
      'Desenvolvimento': 'bg-blue-100 text-blue-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Reunião': 'bg-green-100 text-green-800',
      'Pesquisa': 'bg-yellow-100 text-yellow-800',
      'Testes': 'bg-red-100 text-red-800',
    };
    return colors[funcao] || 'bg-gray-100 text-gray-800';
  };

  const functions = [...new Set(mockTimeEntries.map(e => e.funcao))];

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

  const handleEdit = (entryId: string) => {
    console.log('Editando entrada:', entryId);
    // Aqui será implementada a lógica de edição
  };

  const handleDelete = (entryId: string) => {
    console.log('Deletando entrada:', entryId);
    // Aqui será implementada a lógica de exclusão
    setEntries(entries.filter(e => e.id !== entryId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Controle de Horas</CardTitle>
            <CardDescription>
              Gerencie todos os seus apontamentos de tempo
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Apontamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              {mockProjects.map((project) => (
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
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {filteredEntries.length} apontamento{filteredEntries.length !== 1 ? 's' : ''} encontrado{filteredEntries.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-bold">
              Total: {totalHours.toFixed(1)} horas
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
                      {format(new Date(entry.data), 'dd/MM/yyyy', { locale: ptBR })}
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
                    <TableCell className="text-right font-medium">
                      {entry.horas}h
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Nenhum apontamento encontrado com os filtros aplicados
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
