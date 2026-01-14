import { useEffect } from 'react';

/**
 * Hook para prevenir problemas con el teclado virtual en móviles
 * Especialmente el bug donde el contenido desaparece al escribir
 */
export const useMobileKeyboard = () => {
  useEffect(() => {
    // Solo ejecutar en móviles
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Guardar la altura inicial del viewport
    const initialHeight = window.innerHeight;
    
    // Función para manejar cambios de viewport (cuando aparece/desaparece teclado)
    const handleResize = () => {
      // Forzar un repaint para prevenir que el contenido desaparezca
      document.body.style.minHeight = `${window.innerHeight}px`;
    };

    // Función para manejar focus en inputs
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Pequeño delay para que el teclado termine de aparecer
        setTimeout(() => {
          // Scroll suave al elemento enfocado
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    // Prevenir el comportamiento extraño del viewport
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        // Aplicar la altura del viewport visual al root
        document.documentElement.style.setProperty('--vh', `${currentHeight * 0.01}px`);
      }
    };

    // Event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }

    // Inicializar
    handleResize();
    handleVisualViewportResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
    };
  }, []);
};

export default useMobileKeyboard;
