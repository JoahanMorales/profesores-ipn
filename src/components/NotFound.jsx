import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Track 404 errors for analytics
    if (window.gtag) {
      window.gtag('event', 'page_not_found', {
        page_path: window.location.pathname
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-ipn-guinda-900">i</span>
          <span className="text-gray-900">p</span>
        </h1>

        {/* Error Code */}
        <div className="text-8xl font-bold text-ipn-guinda-900 mb-4">404</div>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/buscar')}
            className="px-6 py-3 text-white bg-ipn-guinda-900 rounded-md hover:bg-ipn-guinda-800 transition-colors font-medium"
          >
            Buscar Profesores
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 text-ipn-guinda-900 bg-white border-2 border-ipn-guinda-900 rounded-md hover:bg-ipn-guinda-50 transition-colors font-medium"
          >
            Volver al Inicio
          </button>
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">¿Buscabas algo específico?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-ipn-guinda-900 hover:underline"
            >
              Inicio
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-ipn-guinda-900 hover:underline"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => navigate('/buscar')}
              className="text-ipn-guinda-900 hover:underline"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
