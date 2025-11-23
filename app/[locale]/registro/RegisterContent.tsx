// app/[locale]/registro/RegisterContent.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // <--- 1. IMPORTAR
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore'; // <--- 2. IMPORTAR STORE

const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre es muy corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams(); // <--- 3. OBTENER PARAMS
  const { register: registerUser, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Registramos (tu store ya hace el login automático internamente)
      await registerUser({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
      });

      // --- INICIO LÓGICA DE REDIRECCIÓN ---
      
      const callbackUrl = searchParams.get('callbackUrl');
      const token = useAuthStore.getState().token;

      if (callbackUrl && token) {
        // Si viene del carrito, lo devolvemos al carrito logueado
        const targetUrl = decodeURIComponent(callbackUrl);
        const separator = targetUrl.includes('?') ? '&' : '?';
        window.location.href = `${targetUrl}${separator}token=${token}`;
      } else {
        // Si es un registro normal, va al onboarding
        router.push('/onboarding/paso-bienvenida');
      }
      
      // --- FIN LÓGICA DE REDIRECCIÓN ---

    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('registerTitle')}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('registerSubtitle')}
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            label={t('nameLabel')}
            type="text"
            icon={User}
            placeholder={t('namePlaceholder')}
            error={errors.nombre?.message}
            {...register('nombre')}
          />

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

          <Input
            label={t('confirmPasswordLabel')}
            type="password"
            icon={Lock}
            placeholder={t('confirmPasswordPlaceholder')}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('acceptTerms')}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              {t('acceptTerms')}{' '}
              <Link href="/terminos" className="text-blue-600 hover:text-blue-500">
                {t('termsLink')}
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-red-500 mt-1">{errors.acceptTerms.message}</p>
          )}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          {t('registerButton')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('hasAccount')}{' '}
          <Link
            href={`/login?${searchParams.toString()}`} // Mantenemos el callbackUrl si cambia a login
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t('loginLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}
