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
import { Clock4, Mail, Loader2, UserPlus, LogIn } from 'lucide-react';
import { sendMagicLink, verifyMagicLink } from '@/lib/supabase-client';

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
});

const verifySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

export function MagicLinkForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'sent' | 'success'>('form');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: '',
      sobrenome: '',
      email: '',
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
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
    setError('');
    try {
      await sendMagicLink(data.email, true); // true for signup
      setUserEmail(data.email);
      setStep('sent');
    } catch (error: any) {
      console.error('Erro ao enviar magic link para cadastro:', error);
      setError(error.message || 'Erro ao enviar Magic Link. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      await sendMagicLink(data.email, false); // false for login
      setUserEmail(data.email);
      setStep('sent');
    } catch (error: any) {
      console.error('Erro ao enviar magic link para login:', error);
      setError(error.message || 'Erro ao fazer login. Verifique se você já possui cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (data: VerifyFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await verifyMagicLink(data.token, userEmail);
      if (result.success) {
        setStep('success');
        // Redirecionar para dashboard após 2 segundos
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao verificar token:', error);
      setError(error.message || 'Token inválido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setError('');
    setUserEmail('');
    registerForm.reset();
    loginForm.reset();
    verifyForm.reset();
  };

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
            <Clock4 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">
            {mode === 'register' ? 'Cadastro realizado!' : 'Login realizado!'}
          </CardTitle>
          <CardDescription>
            Redirecionando para o dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (step === 'sent') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 mx-auto flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Email enviado!</CardTitle>
          <CardDescription>
            Enviamos um Magic Link para <strong>{userEmail}</strong>. 
            <br />
            <strong>Clique no link</strong> para fazer login automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              📧 Verifique sua caixa de entrada (e spam) e clique no link para entrar no sistema.
            </p>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-xs text-blue-700">
                ✨ <strong>Dica:</strong> O link te levará diretamente ao dashboard - não é necessário inserir token!
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            onClick={resetForm}
          >
            Voltar para Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Form selection and submission
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="h-12 w-12 rounded-full bg-primary mx-auto flex items-center justify-center mb-4">
          <Clock4 className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">DeLorean Machine</CardTitle>
        <CardDescription>
          Sistema de controle de horas e produtividade
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Mode Toggle */}
        <div className="flex mb-6 p-1 bg-muted rounded-lg">
          <Button
            type="button"
            variant={mode === 'login' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => {
              setMode('login');
              setError('');
              registerForm.reset();
              loginForm.reset();
            }}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
          <Button
            type="button"
            variant={mode === 'register' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => {
              setMode('register');
              setError('');
              registerForm.reset();
              loginForm.reset();
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {mode === 'register' ? (
          <Form {...registerForm} key="register-form">
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...loginForm} key="login-form">
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        type="email"
                        disabled={isLoading}
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
        )}
      </CardContent>

      <CardFooter className="text-center">
        <p className="text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              Não tem conta?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Cadastre-se aqui
              </Button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Faça login
              </Button>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
