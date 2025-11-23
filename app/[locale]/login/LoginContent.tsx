'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link'; 
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Suspense, useEffect, useState } from 'react';

// Layout
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Oso from '@/components/layout/OsoInicioSesion'; 

// UI
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';

// Logic
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore'; // IMPORTAR STORE

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email('Auth.errors.emailInvalid'),
  password: z.string().min(1, 'Auth.errors.passwordRequired'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// Iconos
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null;
  const t = useTranslations();
  return (
    <p role="alert" className="flex items-center text-red-500 text-sm mt-1">
      <ErrorIcon />
      {t(message as any)}
    </p>
  );
};

function LoginComponent() {
  const t = useTranslations('Auth');
  // IMPORTANTE: No destructuramos handleLogin aquí, porque queremos controlar la redirección manualmente.
  // Usamos login directamente o manejamos la promesa de handleLogin si useAuth lo permite.
  // Asumiré que useAuth expone 'login' (la función raw) o que modificaremos la llamada.
  const { login, isLoading, error } = useAuth(); 
  const router = useRouter(); 
  const searchParams = useSearchParams();

  // Lógica de Notificación
  const messageKey = searchParams.get('messageKey');
  const [showNotification, setShowNotification] = useState(!!messageKey);

  useEffect(() => {
    if (messageKey) {
      setShowNotification(true);
    }
  }, [messageKey]);

  const handleCloseNotification = () => {
    router.replace('/login', { scroll: false });
    setShowNotification(false);
  };

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // 1. Ejecutamos el login
      await login(data.email, data.password);
      
      // 2. Verificamos si el login fue exitoso revisando si hay token en el store
      // (useAuth debería actualizar el store antes de resolver la promesa)
      const token = useAuthStore.getState().token;

      if (token) {
        // 3. Lógica de Redirección con Callback
        const callbackUrl = searchParams.get('callbackUrl');

        if (callbackUrl) {
          // Si hay callback, redirigimos externamente
          const targetUrl = decodeURIComponent(callbackUrl);
          const separator = targetUrl.includes('?') ? '&' : '?';
          
          // IMPORTANTE: window.location para salir de la app actual
          window.location.href = `${targetUrl}${separator}token=${token}`;
        } else {
          // Si no, flujo normal al dashboard
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error("Error en login:", err);
      // El hook useAuth ya maneja el estado de error
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <Header />
      
      {showNotification && messageKey && (
        <Notification messageKey={messageKey} type="success" onClose={handleCloseNotification} />
      )}

      <div className="flex flex-col md:flex-row min-h-screen items-center justify-center px-8 pt-24 pb-24 gap-8 md:gap-12 max-w-7xl mx-auto">
        
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
            <Oso /> 
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center md:items-start justify-center w-full">
          <div className="w-full max-w-md">
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-10 text-center md:text-left">
              {t('loginTitle')}
            </h1>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <div>
                <Input 
                  icon={<EmailIcon />}
                  placeholder={t('email')}
                  type="email"
                  {...register('email')}
                  isInvalid={!!errors.email}
                  aria-invalid={!!errors.email}
                />
                <FormError message={errors.email?.message} />
              </div>
              
              <div>
                <PasswordInput 
                  placeholder={t('password')}
                  {...register('password')}
                  isInvalid={!!errors.password}
                  aria-invalid={!!errors.password}
                />
                <FormError message={errors.password?.message} />

                <div className="w-full text-right mt-2">
                  <Link 
                    href="/restablecer-password" 
                    className="text-sm text-gray-light hover:text-white transition-colors underline"
                  >
                    {t('forgotPasswordTitle')}
                  </Link>
                </div>
              </div>

              {error && (
                <p role="alert" className="flex items-center justify-center text-red-500 text-sm text-center py-2">
                  <ErrorIcon /> {error}
                </p>
              )}
              
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isLoading} 
                className="w-full mt-4"
              >
                {t('loginButton')}
              </Button>
              
              <div className="text-center pt-4 text-gray-light">
                  {t('dontHaveAccount')}{' '}
                  {/* Mantenemos el callbackUrl si va a registro */}
                  <Link 
                    href={`/registro?${searchParams.toString()}`} 
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    {t('registerLink')}
                  </Link>
              </div>

            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function LoginContent() {
  return (
    <Suspense>
      <LoginComponent />
    </Suspense>
  );
}
