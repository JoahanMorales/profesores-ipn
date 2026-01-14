import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Actualizar título de la página
    document.title = '404 - Página no encontrada | Profesores IPN';
    
    // Track 404 errors for analytics
    if (window.gtag) {
      window.gtag('event', 'page_not_found', {
        page_path: window.location.pathname
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4 transition-colors duration-200">
      <div className="text-center max-w-md">
        {/* Animated Icon */}
        <div className="mb-8 animate-bounce">
          <svg className="w-24 h-24 mx-auto text-ipn-guinda-900 dark:text-ipn-guinda-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Error Code */}
        <div className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-ipn-guinda-900 to-ipn-guinda-700 dark:from-ipn-guinda-400 dark:to-ipn-guinda-600 mb-4">
          404
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          ¡Ups! Página no encontrada
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          Parece que este profesor no existe en nuestra base de datos... o quizás te perdiste en el camino 🗺️
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => navigate('/buscar')}
            className="px-8 py-3 text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-lg hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-all transform hover:scale-105 font-semibold shadow-lg"
          >
            🔍 Buscar Profesores
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 text-ipn-guinda-900 dark:text-ipn-guinda-400 bg-white dark:bg-gray-800 border-2 border-ipn-guinda-900 dark:border-ipn-guinda-700 rounded-lg hover:bg-ipn-guinda-50 dark:hover:bg-gray-700 transition-all transform hover:scale-105 font-semibold shadow-lg"
          >
            🏠 Volver al Inicio
          </button>
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-4">¿Necesitas ayuda?</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <button
              onClick={() => navigate('/evaluar')}
              className="text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:text-ipn-guinda-700 dark:hover:text-ipn-guinda-300 font-medium hover:underline transition-colors"
            >
              Evaluar Profesor
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:text-ipn-guinda-700 dark:hover:text-ipn-guinda-300 font-medium hover:underline transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => navigate('/privacidad')}
              className="text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:text-ipn-guinda-700 dark:hover:text-ipn-guinda-300 font-medium hover:underline transition-colors"
            >
              Privacidad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
