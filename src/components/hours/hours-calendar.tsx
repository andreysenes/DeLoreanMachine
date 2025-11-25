'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Briefcase, FileText, Edit2, Trash2, Plus } from 'lucide-react';
import { ScrollAreaHorizontal } from '@/components/ui/scroll-area-horizontal';
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
  isToday,
  addWeeks,
  subWeeks
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, parseSupabaseDate } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function HoursCalendar() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const isMobile = useIsMobile();
  
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

  // Navigation Logic
  const previousPeriod = () => {
    if (isMobile) {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const nextPeriod = () => {
    if (isMobile) {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    const { hasEntries } = getDayData(date);
    // On mobile/list view, clicking always opens details to add new or view existing
    // On desktop grid, same logic
    setSelectedDate(date);
    setIsSheetOpen(true);
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
      const updatedEntries = entries.filter(e => e.id !== entryId);
      setEntries(updatedEntries);
      
      if (!updatedEntries.some(e => isSameDay(parseSupabaseDate(e.data), selectedDate!))) {
        // Keep sheet open even if empty
      }
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert(`Erro ao excluir: ${error.message}`);
    }
  };

  const handleFormSuccess = () => {
    loadData();
    setEntryToEdit(null);
    setNewEntryDate(null);
  };

  // Date Calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // For Grid (Desktop): Full Month + buffer days
  const startGridDate = startOfWeek(monthStart);
  const endGridDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: startGridDate,
    end: endGridDate,
  });

  // For List (Mobile): Current Week Only
  const startWeekDate = startOfWeek(currentDate);
  const endWeekDate = endOfWeek(currentDate);
  const weekDaysList = eachDayOfInterval({
    start: startWeekDate,
    end: endWeekDate,
  });

  const weekDaysHeader = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDayData = (date: Date) => {
    const dayEntries = entries.filter(entry => 
      isSameDay(parseSupabaseDate(entry.data), date)
    );
    
    const totalHours = dayEntries.reduce((sum, entry) => sum + entry.horas, 0);
    const hasEntries = dayEntries.length > 0;
    
    return { totalHours, hasEntries, dayEntries };
  };

  // Selected Day Data for Sheet
  const selectedDayEntries = selectedDate 
    ? entries.filter(e => isSameDay(parseSupabaseDate(e.data), selectedDate))
    : [];
  
  const selectedDayTotal = selectedDayEntries.reduce((sum, e) => sum + e.horas, 0);

  const periodLabel = isMobile 
    ? `Semana de ${format(startWeekDate, 'd MMM', { locale: ptBR })}`
    : format(currentDate, 'MMMM yyyy', { locale: ptBR });

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
                {isMobile ? 'Visualização semanal' : 'Visualização mensal'} dos seus apontamentos
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousPeriod}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-[160px] capitalize text-center font-medium">
                {periodLabel}
              </div>
              <Button variant="outline" size="icon" onClick={nextPeriod}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={today} className="ml-2">
                Hoje
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          
          {/* Desktop Grid View */}
          <div className="hidden md:block">
             <div className="grid grid-cols-7 mb-2">
                {weekDaysHeader.map((day) => (
                  <div key={day} className="py-2 text-sm font-medium text-center text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                {calendarDays.map((day) => {
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
                            <span className="text-xs text-muted-foreground/30">-</span>
                          )
                        )}
                      </div>

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
               {/* Monthly Total - Desktop */}
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
          </div>

          {/* Mobile List View */}
          <div className="space-y-2 md:hidden">
            {weekDaysList.map((day) => {
               const { totalHours, hasEntries } = getDayData(day);
               const isTodayDate = isToday(day);
               
               return (
                 <div 
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg active:bg-accent/50 transition-colors",
                      isTodayDate && "border-primary/50 bg-primary/5"
                    )}
                 >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-muted",
                        isTodayDate && "bg-primary text-primary-foreground"
                      )}>
                        <span className="text-xs font-medium uppercase">{format(day, 'EEE', { locale: ptBR })}</span>
                        <span className="text-lg font-bold">{format(day, 'd')}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Total de Horas</span>
                        <span className={cn("text-lg font-bold", hasEntries ? "text-foreground" : "text-muted-foreground/50")}>
                           {hasEntries ? `${totalHours.toFixed(1)}h` : "0.0h"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                       {hasEntries ? (
                          <Badge variant="secondary" className="ml-2">
                            {getDayData(day).dayEntries.length} regs
                          </Badge>
                       ) : (
                          <Button variant="ghost" size="sm" className="text-primary" onClick={(e) => {
                             e.stopPropagation();
                             handleNewEntry(day);
                          }}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                       )}
                       <ChevronRight className="w-4 h-4 ml-2 text-muted-foreground" />
                    </div>
                 </div>
               )
            })}
            
            {/* Weekly Total - Mobile */}
             <div className="flex items-center justify-between px-4 py-4 mt-4 border-t text-muted-foreground">
                <span className="font-medium">Total da Semana</span>
                <span className="text-lg font-bold text-foreground">
                  {weekDaysList
                    .reduce((acc, day) => acc + getDayData(day).totalHours, 0)
                    .toFixed(1)}h
                </span>
             </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Sheet de Detalhes */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[100vh] sm:max-w-[540px] overflow-y-auto">
           {/* Sheet content remains the same, just responsive side="bottom" on mobile might be nicer, but standard Side sheet is fine too. 
               Actually user is used to side sheet on desktop, maybe bottom sheet on mobile? 
               Shadcn Sheet `side` prop controls this. 
               Let's make it `side={isMobile ? "bottom" : "right"}` logic.
           */}
          <SheetHeader className="mb-6">
            <SheetTitle>Apontamentos do Dia</SheetTitle>
            <SheetDescription>
              {selectedDate && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex justify-end mb-6">
            <Button onClick={() => {
               if (selectedDate) handleNewEntry(selectedDate);
               // Optional: close sheet? No, form opens in Dialog on top.
            }}>
               <Plus className="w-4 h-4 mr-2" />
               Novo Apontamento
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <span className="font-medium">Total do dia</span>
              <span className="text-xl font-bold">{selectedDayTotal.toFixed(1)}h</span>
            </div>

            <div className="pb-8 space-y-4">
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
