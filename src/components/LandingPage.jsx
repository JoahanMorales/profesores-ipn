import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import DisclaimerBanner from './DisclaimerBanner';
import { obtenerEstadisticasGlobales } from '../services/supabaseService';
import { useSEO } from '../hooks/useSEO';

const LandingPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProfesores: 0,
    totalEscuelas: 0,
    totalCarreras: 0,
    totalEvaluaciones: 0
  });
  const [loading, setLoading] = useState(true);

  // SEO para landing page
  useSEO(
    'ip - Evalúa Profesores Anónimamente | Plataforma Estudiantil IPN',
    'Plataforma 100% anónima para evaluar profesores del IPN. Descubre las mejores opciones de profesores según estudiantes reales. Gana monedas premium por tus evaluaciones.',
    'IPN, profesores IPN, evaluar profesores, ESCOM, UPIICSA, ESIME, calificaciones profesores, opiniones estudiantes, politécnico'
  );

  useEffect(() => {
    const cargarEstadisticas = async () => {
      const result = await obtenerEstadisticasGlobales();
      if (result.success) {
        setStats(result.data);
      }
      setLoading(false);
    };

    cargarEstadisticas();
  }, []);

  return (
    <div className="min-h-screen-safe bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Disclaimer Banner */}
      <DisclaimerBanner />
      
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              <span className="text-ipn-guinda-900 dark:text-ipn-guinda-400">i</span>
              <span className="text-gray-900 dark:text-white">p</span>
            </h1>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl sm:text-6xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-6">
              Evalúa a tus profesores del IPN
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Una plataforma transparente para compartir opiniones sobre docentes 
              y ayudar a la comunidad politécnica a tomar mejores decisiones académicas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 text-base font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
              >
                Buscar Profesor
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 text-base font-medium text-ipn-guinda-900 dark:text-ipn-guinda-400 bg-white dark:bg-gray-800 border-2 border-ipn-guinda-900 dark:border-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-50 dark:hover:bg-gray-700 transition-colors"
              >
                Evaluar Profesor
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 border-t border-gray-100 dark:border-gray-800">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Búsqueda Inteligente</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Encuentra profesores por nombre, materia, carrera o escuela de forma instantánea.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Evaluaciones Honestas</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comparte tu experiencia real y ayuda a otros estudiantes a elegir mejor.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Comunidad Verificada</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sistema de validación para mantener la calidad y veracidad de las opiniones.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-2">
                {loading ? '...' : stats.totalEscuelas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Escuelas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-2">
                {loading ? '...' : stats.totalCarreras}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Carreras</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-2">
                {loading ? '...' : stats.totalProfesores}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Profesores</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-2">
                {loading ? '...' : stats.totalEvaluaciones}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Evaluaciones</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
