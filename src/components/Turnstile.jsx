import { useEffect, useRef, useCallback } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

// Control global del script de Turnstile
let scriptPromise = null;

function loadTurnstileScript() {
  if (scriptPromise) return scriptPromise;
  if (window.turnstile) return Promise.resolve();

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Cloudflare Turnstile CAPTCHA widget
 * 
 * Solo se renderiza si VITE_TURNSTILE_SITE_KEY está configurado.
 * Si no hay key, retorna null (CAPTCHA desactivado).
 * 
 * @param {Function} onVerify - Callback con el token cuando el usuario pasa
 * @param {Function} onExpire - Callback cuando el token expira
 * @param {string} theme - 'light' | 'dark' | 'auto'
 */
export default function Turnstile({ onVerify, onExpire, theme = 'auto' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  const handleVerify = useCallback((token) => {
    onVerify?.(token);
  }, [onVerify]);

  const handleExpire = useCallback(() => {
    onExpire?.();
    onVerify?.(''); // Limpiar token expirado
  }, [onExpire, onVerify]);

  useEffect(() => {
    if (!SITE_KEY) return;

    let mounted = true;

    loadTurnstileScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.turnstile) return;

        // Limpiar widget anterior si existe
        if (widgetIdRef.current != null) {
          try { window.turnstile.remove(widgetIdRef.current); } catch {}
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme,
          callback: handleVerify,
          'expired-callback': handleExpire,
          'error-callback': () => {
            // En caso de error, permitir continuar (no bloquear)
            handleVerify('');
          },
        });
      })
      .catch(() => {
        // Si falla cargar el script, no bloquear la UI
        console.warn('No se pudo cargar Turnstile');
      });

    return () => {
      mounted = false;
      if (widgetIdRef.current != null) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [theme, handleVerify, handleExpire]);

  // Si no hay site key, no renderizar nada
  if (!SITE_KEY) return null;

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} />
    </div>
  );
}

/**
 * Verifica si Turnstile está habilitado (key configurada)
 */
export function isTurnstileEnabled() {
  return !!SITE_KEY;
}
