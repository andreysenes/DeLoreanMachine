'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock4, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar se tem parâmetros de erro
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam);
          setStatus('error');
          return;
        }

        // Processar sessão do Magic Link
        if (!supabase) {
          setError('Erro de configuração do Supabase');
          setStatus('error');
          return;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          setError(sessionError.message);
          setStatus('error');
          return;
        }

        if (data?.session) {
          setStatus('success');
          // Redirecionar para o dashboard após 1 segundo
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          setError('Nenhuma sessão encontrada. Tente fazer login novamente.');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('Erro no callback de autenticação:', err);
        setError(err.message || 'Erro desconhecido');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

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
