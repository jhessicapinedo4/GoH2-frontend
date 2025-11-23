'use client';

import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Usamos el router de i18n
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { authService, LoginData, RegisterData, ForgotPasswordData, ResetPasswordData } from '@/lib/authService';
// import { useOnboardingStore } from '@/store/onboardingStore'; // Importamos el store

/**
 * Hook para manejar la lógica de Login y Registro
 */
export const useAuth = () => {
  const t = useTranslations('Auth');
  // const router = useRouter();
  const { setToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const resetOnboarding = useOnboardingStore(state => state.reset); // Limpiar store al inicio de un flujo
  


  const handleLogin = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(data);
      setToken(res.token);
      // router.push('/dashboard'); // <--- ¡BORRAR ESTA LÍNEA!
      return true; // Éxito
    } catch (err: any) {
      setError(t('loginError'));
      console.error(err);
      return false; // Fallo
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Registro
      await authService.register(data);
      
      // 2. Login Automático
      const loginData: LoginData = { email: data.email, password: data.password };
      const res = await authService.login(loginData);

      // 3. Guardar Token
      setToken(res.token);

      // router.push('/onboarding/paso-datos-basicos'); // <--- ¡BORRAR ESTA LÍNEA!
      return true; // Éxito
      
    } catch (err: any) {
      if (err.message?.includes('correo ya ha sido registrado')) {
        setError(t('registerError'));
      } else {
        setError(t('unknownError'));
      }
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    // Reiniciamos el error del formulario, pero mantenemos el error global de API
    setError(null); 
    
    try {
      await authService.forgotPassword(data);
      
      // === ARREGLO CRÍTICO ===
      // 1. Obtenemos el prefijo de idioma actual (ej: '', '/en', '/fr')
      const currentLocale = document.documentElement.lang;
      const localePrefix = currentLocale === 'es' ? '' : `/${currentLocale}`;
      
      // 2. Construimos la URL completa y forzamos la navegación
      const encodedEmail = encodeURIComponent(data.email);
      const url = `${localePrefix}/restablecer-password-enviado?email=${encodedEmail}`;
      
      // Usamos la navegación nativa para garantizar que la URL se lea bien.
      window.location.href = url;
      // Note: No usamos setIsLoading(false) porque la página se recarga.
      
    } catch (err: any) {
      setError(t('unknownError'));
      console.error(err);
      setIsLoading(false); // Si hay un error de API, mostramos el error y terminamos
    }
  };

  const handleResetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword(data);
      // Redirigir a login después de un éxito (con mensaje de éxito)
      router.push(`/login?messageKey=passwordUpdateSuccess`); 
    } catch (err: any) {
      // Mapeamos el error del backend (Token inválido/expirado)
      setError(t('passwordUpdateError')); 
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    setError,
  };
};
