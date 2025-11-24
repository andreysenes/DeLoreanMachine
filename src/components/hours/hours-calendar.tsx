'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Briefcase, FileText, Edit2, Trash2, Plus } from 'lucide-react';
import { getTimeEntries, getProjects, deleteTimeEntry } from '@/lib/supabase-client';
import { TimeEntry, Project } from '@/types/db';
import { TimeEntryForm } from './time-entry-form';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  isToday 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, parseSupabaseDate } from '@/lib/utils';

export function HoursCalendar() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Sheet/Details State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Edit Form State
  const [showEditForm, setShowEditForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);
  const [newEntryDate, setNewEntryDate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [entriesData, projectsData] = await Promise.all([
        getTimeEntries(),
        getProjects()
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
    return project?.nome || 'Projeto desconhecido';
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

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const today = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (date: Date) => {
    const { hasEntries } = getDayData(date);
    if (hasEntries) {
      setSelectedDate(date);
      setIsSheetOpen(true);
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEntryToEdit(entry);
    setNewEntryDate(null);
    setShowEditForm(true);
  };

  const handleNewEntry = (date: Date) => {
    setNewEntryDate(date);
    setEntryToEdit(null);
    setShowEditForm(true);
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Tem certeza que deseja excluir este apontamento?')) {
      return;
    }
    
    try {
      await deleteTimeEntry(entryId);
      // Atualiza lista localmente
      const updatedEntries = entries.filter(e => e.id !== entryId);
      setEntries(updatedEntries);
      
      // Se não houver mais entradas no dia, fecha o sheet?
      // Não, mantém aberto vazio ou com restantes
      if (!updatedEntries.some(e => isSameDay(parseSupabaseDate(e.data), selectedDate!))) {
        setIsSheetOpen(false);
      }
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert(`Erro ao excluir: ${error.message}`);
    }
  };

  const handleFormSuccess = () => {
    loadData(); // Recarrega tudo para garantir consistência
    setEntryToEdit(null);
    setNewEntryDate(null);
    // O Sheet permanece aberto pois showEditForm é independente
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDayData = (date: Date) => {
    const dayEntries = entries.filter(entry => 
      isSameDay(parseSupabaseDate(entry.data), date)
    );
    
    const totalHours = dayEntries.reduce((sum, entry) => sum + entry.horas, 0);
    const hasEntries = dayEntries.length > 0;
    
    return { totalHours, hasEntries, dayEntries };
  };

  // Dados do dia selecionado para o Sheet
  const selectedDayEntries = selectedDate 
    ? entries.filter(e => isSameDay(parseSupabaseDate(e.data), selectedDate))
    : [];
  
  const selectedDayTotal = selectedDayEntries.reduce((sum, e) => sum + e.horas, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Carregando calendário...</span>
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
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarIcon className="w-5 h-5" />
                Calendário de Horas
              </CardTitle>
              <CardDescription>
                Visualização mensal dos seus apontamentos
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-[140px] text-center font-medium">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={today} className="ml-2">
                Hoje
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="py-2 text-sm font-medium text-center text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-1 auto-rows-fr">
            {calendarDays.map((day, dayIdx) => {
              const { totalHours, hasEntries } = getDayData(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-md flex flex-col transition-colors relative group",
                    hasEntries ? "cursor-pointer hover:bg-accent/50" : "cursor-default hover:bg-accent/20",
                    !isCurrentMonth && "bg-muted/30 opacity-50",
                    isTodayDate && "border-primary bg-accent/20",
                    hasEntries && isCurrentMonth && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className={cn(
                      "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                      isTodayDate && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {hasEntries && (
                      <div className="w-2 h-2 rounded-full bg-primary" title="Possui apontamentos" />
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1 gap-1 mt-2">
                    {hasEntries ? (
                      <>
                        <span className="text-lg font-bold text-primary">
                          {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h
                        </span>
                        <span className="text-xs text-muted-foreground">
                          apontadas
                        </span>
                      </>
                    ) : (
                      isCurrentMonth && (
                      <span className="text-xs text-muted-foreground/30">
                        -
                      </span>
                      )
                    )}
                  </div>

                  {/* Botão de Adicionar no Hover */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute w-6 h-6 transition-opacity border shadow-sm opacity-0 bottom-1 right-1 group-hover:opacity-100 bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNewEntry(day);
                    }}
                    title="Adicionar apontamento"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          {/* Legenda / Resumo */}
          <div className="flex justify-end mt-6 text-sm text-muted-foreground">
             <div>
               Total no mês: <span className="font-medium text-foreground">
                 {calendarDays
                   .filter(d => isSameMonth(d, monthStart))
                   .reduce((acc, day) => acc + getDayData(day).totalHours, 0)
                   .toFixed(1)}h
               </span>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet de Detalhes */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Apontamentos do Dia</SheetTitle>
            <SheetDescription>
              {selectedDate && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <span className="font-medium">Total do dia</span>
              <span className="text-xl font-bold">{selectedDayTotal.toFixed(1)}h</span>
            </div>

            <div className="space-y-4">
              {selectedDayEntries.length > 0 ? (
                selectedDayEntries.map((entry) => (
                  <div key={entry.id} className="p-4 space-y-3 transition-colors border rounded-lg hover:bg-accent/20">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{getProjectName(entry.project_id)}</span>
                        </div>
                        <Badge variant="secondary" className={cn("mt-1", getFunctionColor(entry.funcao))}>
                          {entry.funcao}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {entry.descricao && (
                      <div className="flex gap-2 p-2 text-sm rounded text-muted-foreground bg-muted/30">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>{entry.descricao}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 text-sm font-medium border-t">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{entry.horas} horas</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum apontamento encontrado para este dia.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Formulário de Edição */}
      <TimeEntryForm 
        open={showEditForm} 
        onOpenChange={setShowEditForm} 
        onSuccess={handleFormSuccess}
        entryToEdit={entryToEdit}
        initialDate={newEntryDate || undefined}
      />
    </>
  );
}
