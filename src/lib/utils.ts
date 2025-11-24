import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Analisa uma data vinda do Supabase (que pode ser string YYYY-MM-DD ou ISO)
 * e garante que ela seja interpretada corretamente no fuso horário local.
 * 
 * O problema: new Date("2025-11-24") cria UTC 00:00, que no Brasil é 23/11 21:00.
 * A solução: Adicionar T00:00:00 ou usar parseISO para tratar como local time se não houver timezone.
 */
export function parseSupabaseDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  
  // Se for string YYYY-MM-DD simples (10 chars)
  if (typeof date === 'string' && date.length === 10 && date.includes('-')) {
    // Adicionando T00:00:00, a maioria dos parsers locais interpretará como meia-noite local
    // Alternativamente, podemos construir a data manualmente com os componentes
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Se for ISO string completa, usa parseISO ou new Date
  return new Date(date);
}
