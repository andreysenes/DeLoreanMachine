import { TimeEntry, Client } from '@/types/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const generateFormattedCSV = (
  entries: any[], 
  client: Client | null, 
  reportTitle: string = 'Relatório de Horas'
): string => {
  // Build CSV content
  const rows: string[] = [];
  
  // Header Info
  rows.push(`Título: ${reportTitle}`);
  if (client) {
    rows.push(`Cliente: ${client.nome}`);
    rows.push(`CNPJ: ${client.cnpj || 'N/A'}`);
    rows.push(`Contrato: ${client.contrato_id || 'N/A'}`);
  }
  rows.push(''); // Empty line
  
  // Table Headers
  const tableHeaders = ['Data', 'Projeto', 'Função', 'Descrição', 'Horas'];
  rows.push(tableHeaders.join(','));
  
  // Data Rows
  let totalHours = 0;
  
  entries.forEach(entry => {
    let dateStr = '';
    try {
      if (entry.data) {
        dateStr = format(new Date(entry.data), 'dd/MM/yyyy', { locale: ptBR });
      }
    } catch (e) {
      dateStr = entry.data || '';
    }

    // Handle project name - could be in project object or flattened
    const project = entry.project_name || entry.project?.nome || 'N/A';
    const func = entry.funcao || '';
    
    // Escape quotes in description to prevent CSV breakage
    const rawDesc = entry.descricao || '';
    const desc = rawDesc.includes(',') || rawDesc.includes('"') || rawDesc.includes('\n')
      ? `"${rawDesc.replace(/"/g, '""')}"` 
      : rawDesc;

    const hours = Number(entry.horas) || 0;
    
    totalHours += hours;
    
    rows.push(`${dateStr},${project},${func},${desc},${hours}`);
  });
  
  rows.push('');
  rows.push(`Total de Horas,,,,${totalHours.toFixed(2)}`);
  
  return rows.join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
