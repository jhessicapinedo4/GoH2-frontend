'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link'; 
import { useRouter, useSearchParams } from 'next/navigation'; // Importamos useSearchParams
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, Suspense } from 'react'; // Importamos Suspense

// Layout
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Oso from '@/components/layout/OsoRegistro'; 

// UI
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';

// Logic
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore'; // Importamos AuthStore

// ... (Esquema de validación y Iconos se mantienen igual) ...
const registerSchema = z.object({
  nombre: z.string().min(1, 'Auth.errors.nameRequired'),
  email: z.string().email('Auth.errors.emailInvalid'),
  password: z.string().min(6, 'Auth.errors.passwordMinLength'),
  confirmPassword: z.string()
})
.refine(data => data.password === data.confirmPassword, {
  message: "Auth.errors.passwordMismatch",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Iconos auxiliares (se mantienen igual)
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const EmailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>);
const ErrorIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>);
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null;
  const t = useTranslations();
  return (<p role="alert" className="flex items-center text-red-500 text-sm mt-1"><ErrorIcon />{t(message as any)}</p>);
};

function RegisterComponent() {
  const t = useTranslations('Auth');
  const tOnboarding = useTranslations('Auth.onboarding');
  // Usamos 'register' en lugar de 'handleRegister' para controlar el flujo manualmente
  const { register: registerUser, isLoading, error } = useAuth(); 
  const setAccountData = useOnboardingStore(state => state.setAccountData);
  const router = useRouter();
  const searchParams = useSearchParams(); // Capturamos params

  const [percentage, setPercentage] = useState(25);
  const targetPercentage = 37.5;

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = (targetPercentage - 25) / steps;
    const stepDuration = duration / steps;
    let current = 25;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetPercentage) {
        setPercentage(targetPercentage);
        clearInterval(timer);
      } else {
        setPercentage(current);
      }
    }, stepDuration);
    return () => clearInterval(timer);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    // 1. Guardamos datos en store local por si acaso
    setAccountData({ nombre: data.nombre, email: data.email, password: data.password });
    
    const { confirmPassword, ...dataToRegister } = data;

    try {
        // 2. Llamamos al registro
        await registerUser(dataToRegister);

        // 3. Verificamos si se generó token (registro exitoso)
        const token = useAuthStore.getState().token;

        if (token) {
            // 4. Lógica de Redirección Callback
            const callbackUrl = searchParams.get('callbackUrl');
            
            if (callbackUrl) {
                // Si viene de la tienda, redirigimos de vuelta a la tienda
                const targetUrl = decodeURIComponent(callbackUrl);
                const separator = targetUrl.includes('?') ? '&' : '?';
                window.location.href = `${targetUrl}${separator}token=${token}`;
            } else {
                // Si no, flujo normal de onboarding
                router.push('/onboarding/paso-bienvenida');
            }
        }
    } catch (err) {
        console.error("Error en registro:", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <Header />
      
      {/* Contenido Principal */}
      <div className="flex flex-col md:flex-row min-h-screen items-center justify-center px-8 pt-24 pb-24 gap-8 md:gap-12 max-w-7xl mx-auto">
        
        {/* Barra de progreso */}
        <div className="absolute top-20 left-0 right-0 px-8 z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-light">
                {tOnboarding('step', { current: 3, total: 8 })}
              </span>
              <span className="text-xs text-primary font-semibold">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-progress-step-3" style={{ width: '37.5%' }} />
            </div>
          </div>
        </div>

        {/* Columna Izquierda */}
        <div className="flex-1 flex flex-col items-center justify-center w-full animate-scale-in">
          <div className="relative w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72">
            <Oso />
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-primary/10 blur-2xl animate-pulse-glow" />
            </div>
          </div>
        </div>

        {/* Columna Derecha (Formulario) */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-center w-full animate-fade-in">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1 text-center md:text-left">
                {t('registerTitle')}
              </h1>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Campos del formulario (igual que antes) */}
              <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <Input id="nombre" icon={<UserIcon />} placeholder={t('name')} type="text" {...register('nombre')} isInvalid={!!errors.nombre} />
                <FormError message={errors.nombre?.message} />
              </div>
              <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <Input id="email" icon={<EmailIcon />} placeholder={t('email')} type="email" {...register('email')} isInvalid={!!errors.email} />
                <FormError message={errors.email?.message} />
              </div>
              <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                <PasswordInput id="password" placeholder={t('password')} {...register('password')} isInvalid={!!errors.password} />
                <FormError message={errors.password?.message} />
              </div>
              <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
                <PasswordInput id="confirmPassword" placeholder={t('confirmPassword')} {...register('confirmPassword')} isInvalid={!!errors.confirmPassword} />
                <FormError message={errors.confirmPassword?.message} />
              </div>
              {/* Terms */}
              <div className="flex items-center">
                 {/* ... tu checkbox de términos ... */}
              </div>

              {error && (
                <p role="alert" className="flex items-center justify-center text-red-500 text-sm text-center py-2">
                  <ErrorIcon /> {error}
                </p>
              )}

              <div className="animate-fade-in-delayed">
                <Button type="submit" variant="primary" isLoading={isLoading} className="mt-5 w-full">
                  {t('registerButton')}
                </Button>
              </div>

              <div className="text-center pt-4 text-gray-light animate-fade-in-delayed">
                  {t('alreadyHaveAccount')}{' '}
                  {/* Pasamos el callbackUrl al login */}
                  <Link href={`/login?${searchParams.toString()}`} className="text-primary hover:text-primary/80 font-semibold">
                    {t('loginLink')}
                  </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
      {/* Estilos JSX (igual que antes) */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes progress-step-3 {
          from {
            width: 25%;
          }
          to {
            width: 37.5%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in 0.8s ease-out 0.6s both;
        }

        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out both;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-progress-step-3 {
          animation: progress-step-3 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function RegisterContent() {
  return (
    <Suspense>
      <RegisterComponent />
    </Suspense>
  );
}
