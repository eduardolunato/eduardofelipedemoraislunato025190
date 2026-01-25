// hooks/useTokenRefresh.ts
import { useEffect, useRef } from 'react';
import { getAccessToken } from '@/utils/auth';
import { refreshAccessToken, logout } from '@/api/auth.service';

export function useTokenRefresh() {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    async function tryRefresh() {
      try {
        const token = getAccessToken();
        if (!token) {
          stopInterval();
          return;
        }

        console.log('[useTokenRefresh] 🔄 Renovando token...');
        await refreshAccessToken();
        console.log('[useTokenRefresh] ✅ Token renovado com sucesso!');
      } catch (error) {
        console.error('[useTokenRefresh] ❌ Erro ao renovar:', error);
        logout();
        window.location.href = '/login';
      }
    }

    function startInterval() {
      if (intervalRef.current !== null) return;

      console.log('[useTokenRefresh] 🚀 Iniciando renovação automática (a cada 4 minutos)');
      intervalRef.current = window.setInterval(tryRefresh, 4 * 60 * 1000);
    }

    function stopInterval() {
      if (intervalRef.current !== null) {
        console.log('[useTokenRefresh] 🛑 Parando renovação automática');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // ✅ Escuta mudanças no token
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ hasToken: boolean }>;
      
      if (customEvent.detail.hasToken) {
        console.log('[useTokenRefresh] 🔑 Login detectado, iniciando renovação');
        startInterval();
      } else {
        console.log('[useTokenRefresh] 🚪 Logout detectado, parando renovação');
        stopInterval();
      }
    };

    window.addEventListener('auth-token-changed', handleAuthChange);

    // Inicia se já tiver token
    const token = getAccessToken();
    if (token) {
      startInterval();
    } else {
      console.log('[useTokenRefresh] ⏸️ Aguardando login...');
    }

    return () => {
      stopInterval();
      window.removeEventListener('auth-token-changed', handleAuthChange);
    };
  }, []);
}