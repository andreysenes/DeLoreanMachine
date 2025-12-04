'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Report } from '@/types/db';
import { Copy, Loader2, Check } from 'lucide-react';
import { getReportShares, createShare } from '@/lib/report-service';
import { addYears, isAfter } from 'date-fns';

interface ShareReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
}

export function ShareReportDialog({ open, onOpenChange, report }: ShareReportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (open && report) {
      checkOrCreateShare();
    }
  }, [open, report]);

  const checkOrCreateShare = async () => {
    setIsLoading(true);
    try {
      const shares = await getReportShares(report.id);
      const activeShare = shares.find(s => isAfter(new Date(s.expires_at), new Date()));
      
      if (!activeShare) {
        // Create new share if none exists
        await createShare({
          report_id: report.id,
          expires_at: addYears(new Date(), 1).toISOString()
        });
      }
      setIsReady(true);
    } catch (error: any) {
      console.error('Erro ao verificar/criar compartilhamento:', error);
      if (error) {
        console.error('Mensagem de erro:', error.message);
        console.error('Detalhes:', error.details);
        console.error(' Código:', error.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/shared/${report.id}/view`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      alert('Erro ao copiar link. Por favor, tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compartilhar Relatório: {report.title}</DialogTitle>
          <DialogDescription>
            Copie o link para compartilhar este relatório. O link é válido por 1 ano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            {isLoading ? (
              <Button disabled className="w-full" variant="outline">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando link de acesso...
              </Button>
            ) : (
              <Button onClick={copyLink} className="w-full" variant="outline" disabled={!isReady}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Link Copiado!' : 'Copiar Link de Compartilhamento'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
