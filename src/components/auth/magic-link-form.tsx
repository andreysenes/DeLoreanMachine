'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Clock4, Mail, Loader2, Database } from 'lucide-react';
import { sendMagicLink, verifyMagicLink } from '@/lib/supabase-client';

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

const verifySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

export function MagicLinkForm() {
  const [step, setStep] = useState<'register' | 'verify' | 'success'>('register');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: '',
      sobrenome: '',
      email: '',
    },
  });

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      token: '',
    },
  });

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await sendMagicLink(data.email);
      setUserEmail(data.email);
      setStep('verify');
    } catch (error) {
      console.error('Erro ao enviar magic link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (data: VerifyFormData) => {
    setIsLoading(true);
    try {
      const result = await verifyMagicLink(data.token, userEmail);
      if (result.success) {
        setStep('success');
        // Redirecionar para dashboard após 3 segundos
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
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
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 mx-auto flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verifique seu email</CardTitle>
          <CardDescription>
            Enviamos um Magic Link para seu email. Cole o token aqui para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...verifyForm}>
            <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
              <FormField
                control={verifyForm.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token do Magic Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cole o token aqui"
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Magic Link'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setStep('register')}
            disabled={isLoading}
          >
            Voltar
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Registration form
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="h-12 w-12 rounded-full bg-primary mx-auto flex items-center justify-center mb-4">
          <Clock4 className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">DeLorean Machine</CardTitle>
        <CardDescription>
          Sistema de controle de horas. Crie sua conta para começar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...registerForm}>
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <FormField
              control={registerForm.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome"
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="sobrenome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sobrenome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu sobrenome"
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seu@email.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando Magic Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Magic Link
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
