'// app/[locale]/login/LoginContent.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // <--- 1. IMPORTAR useSearchParams
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore'; // <--- 2. IMPORTAR STORE PARA LEER EL TOKEN

// Esquema de validación (se mantiene igual)
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams(); // <--- 3. OBTENER PARÁMETROS URL
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Intentamos loguear
      await login(data.email, data.password);
      
      // --- INICIO LÓGICA DE REDIRECCIÓN ---
      
      // 1. Buscamos si hay una URL de retorno en la barra de direcciones
      const callbackUrl = searchParams.get('callbackUrl');
      
      // 2. Obtenemos el token recién generado directamente del estado
      const token = useAuthStore.getState().token;

      if (callbackUrl && token) {
        // 3. Si hay URL de retorno, decodificamos y redirigimos externamente
        const targetUrl = decodeURIComponent(callbackUrl);
        // Construimos la URL con el token (manejamos si ya tiene ? o no)
        const separator = targetUrl.includes('?') ? '&' : '?';
        
        // ¡REDIRECCIÓN EXTERNA A LA LANDING!
        window.location.href = `${targetUrl}${separator}token=${token}`;
      } else {
        // 4. Si no hay callback, flujo normal al dashboard
        router.push('/dashboard');
      }
      
      // --- FIN LÓGICA DE REDIRECCIÓN ---

    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('loginTitle')}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('loginSubtitle')}
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            label={t('emailLabel')}
            type="email"
            icon={Mail}
            placeholder={t('emailPlaceholder')}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <Input
              label={t('passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder={t('passwordPlaceholder')}
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/restablecer-password"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {t('forgotPassword')}
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          {t('loginButton')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('noAccount')}{' '}
          <Link
            href={`/registro?${searchParams.toString()}`} // Mantenemos el callbackUrl si cambia a registro
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t('registerLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}
// Envolvemos todo el Login en Suspense
