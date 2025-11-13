'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock4, Loader2, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [shouldClose, setShouldClose] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar se deve fechar a aba automaticamente
        const autoClose = searchParams.get('autoclose') === 'true';
        setShouldClose(autoClose);

        // Verificar se tem parâmetros de erro
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam);
          setStatus('error');
          
          if (autoClose) {
            // Notificar erro para a aba pai
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'AUTH_ERROR', 
                error: errorDescription || errorParam 
              }, window.location.origin);
            }
            // Tentar fechar após 3 segundos
            setTimeout(() => {
              window.close();
            }, 3000);
          }
          return;
        }

        // Processar sessão do Magic Link
        if (!supabase) {
          const errorMsg = 'Erro de configuração do Supabase';
          setError(errorMsg);
          setStatus('error');
          
          if (autoClose && window.opener) {
            window.opener.postMessage({ 
              type: 'AUTH_ERROR', 
              error: errorMsg 
            }, window.location.origin);
            setTimeout(() => window.close(), 3000);
          }
          return;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          setError(sessionError.message);
          setStatus('error');
          
          if (autoClose && window.opener) {
            window.opener.postMessage({ 
              type: 'AUTH_ERROR', 
              error: sessionError.message 
            }, window.location.origin);
            setTimeout(() => window.close(), 3000);
          }
          return;
        }

        if (data?.session) {
          setStatus('success');
          
          if (autoClose) {
            // Notificar sucesso para a aba pai
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'AUTH_SUCCESS', 
                user: data.session.user 
              }, window.location.origin);
            }
            
            // Tentar fechar a aba após 1 segundo
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            // Comportamento normal - redirecionar para dashboard
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          }
        } else {
          const errorMsg = 'Nenhuma sessão encontrada. Tente fazer login novamente.';
          setError(errorMsg);
          setStatus('error');
          
          if (autoClose && window.opener) {
            window.opener.postMessage({ 
              type: 'AUTH_ERROR', 
              error: errorMsg 
            }, window.location.origin);
            setTimeout(() => window.close(), 3000);
          }
        }
      } catch (err: any) {
        console.error('Erro no callback de autenticação:', err);
        const errorMsg = err.message || 'Erro desconhecido';
        setError(errorMsg);
        setStatus('error');
        
        if (shouldClose && window.opener) {
          window.opener.postMessage({ 
            type: 'AUTH_ERROR', 
            error: errorMsg 
          }, window.location.origin);
          setTimeout(() => window.close(), 3000);
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, router, shouldClose]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 mx-auto flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Processando login...</CardTitle>
            <CardDescription>
              Validando seu Magic Link, aguarde um momento.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <Clock4 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Login realizado!</CardTitle>
            <CardDescription>
              Redirecionando para o dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Erro no login</CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600">
            <a href="/login" className="text-blue-600 hover:underline">
              Clique aqui para tentar novamente
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
