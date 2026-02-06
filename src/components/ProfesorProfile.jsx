import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerEvaluacionesProfesor, obtenerProfesorPorSlug } from '../services/supabaseService';
import { crearReporte } from '../services/adminService';
import { getBrowserFingerprint } from '../lib/browserFingerprint';
import { useSEO } from '../hooks/useSEO';

const ProfesorProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, logout, monedas, isAuthenticated } = useAuth();
  const [profesor, setProfesor] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportando, setReportando] = useState(null); // ID de evaluación siendo reportada
  const [formReporte, setFormReporte] = useState({ tipo: '', descripcion: '' });
  const [notificacion, setNotificacion] = useState(null); // { tipo: 'exito'|'error', mensaje: '' }

  // SEO dinámico basado en el profesor
  useSEO(
    profesor 
      ? `${profesor.nombre_completo} - Calificación ${(profesor.calificacion_promedio || 0).toFixed(1)}/10 | ip`
      : 'Cargando perfil... | ip',
    profesor
      ? `Evaluaciones y opiniones de ${profesor.nombre_completo}. Calificación promedio: ${(profesor.calificacion_promedio || 0).toFixed(1)}/10 basada en ${profesor.total_evaluaciones || 0} evaluaciones de estudiantes del IPN.`
      : 'Cargando información del profesor...',
    profesor ? `${profesor.nombre_completo}, profesor IPN, calificaciones, evaluaciones, opiniones estudiantes` : ''
  );

  useEffect(() => {
    if (slug) {
      cargarProfesor();
    }
  }, [slug]);

  const cargarProfesor = async () => {
    setLoading(true);
    
    // Cargar datos del profesor por slug
    const profesorResult = await obtenerProfesorPorSlug(slug);
    
    if (profesorResult.success && profesorResult.data) {
      setProfesor(profesorResult.data);
      
      // Cargar evaluaciones
      const evalResult = await obtenerEvaluacionesProfesor(profesorResult.data.id);
      if (evalResult.success) {
        setEvaluaciones(evalResult.data || []);
      }
    }
    
    setLoading(false);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleReportar = (evaluacionId) => {
    setReportando(evaluacionId);
    setFormReporte({ tipo: '', descripcion: '' });
  };

  const handleCancelarReporte = () => {
    setReportando(null);
    setFormReporte({ tipo: '', descripcion: '' });
  };

  const handleEnviarReporte = async (evaluacionId) => {
    if (!formReporte.tipo || !formReporte.descripcion.trim()) {
      setNotificacion({ tipo: 'error', mensaje: 'Por favor completa todos los campos' });
      setTimeout(() => setNotificacion(null), 3000);
      return;
    }

    const fingerprintData = getBrowserFingerprint();
    const fingerprint = fingerprintData.fingerprint;
    const result = await crearReporte(
      evaluacionId,
      formReporte.tipo,
      formReporte.descripcion,
      fingerprint
    );

    if (result.success) {
      setNotificacion({ tipo: 'exito', mensaje: '✅ Reporte enviado. Gracias por ayudarnos a mantener la plataforma segura.' });
      setTimeout(() => setNotificacion(null), 4000);
      handleCancelarReporte();
    } else {
      setNotificacion({ tipo: 'error', mensaje: '❌ Error al enviar el reporte. Inténtalo de nuevo.' });
      setTimeout(() => setNotificacion(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profesor) {
    // Convertir slug a nombre legible para pre-llenar el formulario
    const nombreDesdeSlug = slug
      ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : '';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profesor no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No encontramos a <span className="font-medium text-gray-900 dark:text-white">"{nombreDesdeSlug}"</span> en nuestra base de datos.
          </p>

          {/* Opción para agregar nuevo profesor */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
              ¿El profesor no está registrado? Sé el primero en evaluarlo y agregarlo a la plataforma.
            </p>
            <button
              onClick={() => navigate(`/evaluar?nombre=${encodeURIComponent(nombreDesdeSlug.toUpperCase())}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white text-sm font-medium rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar y evaluar profesor
            </button>
          </div>

          <button
            onClick={() => navigate('/buscar')}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Volver a búsqueda
          </button>
        </div>
      </div>
    );
  }

  // Mock evaluaciones para demostración
  const mockEvaluaciones = [
    {
      id: 1,
      calificacion: 9.5,
      recomendado: true,
      asistenciaObligatoria: true,
      calificacionObtenida: '10',
      opinion: 'Excelente profesor, explica muy bien los temas y siempre está dispuesto a resolver dudas. Sus clases son dinámicas y aprende uno mucho.',
      fecha: '2025-12-15'
    },
    {
      id: 2,
      calificacion: 8.5,
      recomendado: true,
      asistenciaObligatoria: true,
      calificacionObtenida: '9',
      opinion: 'Buen profesor, domina la materia. A veces va un poco rápido pero si le preguntas te explica con paciencia.',
      fecha: '2025-11-28'
    },
    {
      id: 3,
      calificacion: 9.0,
      recomendado: true,
      asistenciaObligatoria: false,
      calificacionObtenida: '9',
      opinion: 'Muy recomendado, las tareas son justas y los exámenes evalúan lo visto en clase. No pasa lista siempre.',
      fecha: '2025-11-10'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 
              className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/buscar')}
            >
              <span className="text-ipn-guinda-900 dark:text-ipn-guinda-400">i</span>
              <span className="text-gray-900 dark:text-white">p</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              {isAuthenticated() ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-200 via-purple-300 to-pink-300 dark:from-slate-700 dark:via-purple-600 dark:to-pink-600 rounded-full shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-gray-300 to-transparent animate-shimmer opacity-40" />
                    <span className="text-xl relative z-10">💎</span>
                    <span className="font-bold text-gray-900 dark:text-white relative z-10">{monedas}</span>
                  </div>
                  <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
                    Hola, <span className="font-medium">{user.username}</span>
                  </span>
                  <button
                    onClick={() => navigate('/buscar')}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                  >
                    Buscar
                  </button>
                  <button
                    onClick={logout}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors whitespace-nowrap"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/buscar')}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                  >
                    Buscar
                  </button>
                  <button
                    onClick={() => navigate(`/login?returnTo=${encodeURIComponent(`/profesor/${slug}`)}`)}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors whitespace-nowrap"
                  >
                    Iniciar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/buscar')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Volver a resultados</span>
        </button>

        {/* Professor Info Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white break-words">
                  {profesor.nombre_completo}
                </h2>
                {/* Badge de Verificado si tiene 3+ evaluaciones */}
                {profesor.total_evaluaciones >= 3 && (
                  <div className="flex-shrink-0" title="Profesor verificado con múltiples evaluaciones">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg animate-pulse">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-75"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <span className="text-lg">{profesor.total_evaluaciones || 0} evaluaciones</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{profesor.total_evaluadores || 0} {profesor.total_evaluadores === 1 ? 'persona' : 'personas'}</span>
                </div>
              </div>
            </div>

            {/* Rating Box */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center md:min-w-[200px]">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {profesor.calificacion_promedio?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">de 10</div>
              {profesor.porcentaje_recomendacion !== null && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {profesor.porcentaje_recomendacion}% lo recomienda
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                if (!isAuthenticated()) {
                  const returnTo = `/evaluar?nombre=${encodeURIComponent(profesor.nombre_completo)}&slug=${encodeURIComponent(profesor.slug)}`;
                  navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                  return;
                }
                const params = new URLSearchParams({
                  nombre: profesor.nombre_completo,
                  slug: profesor.slug
                });
                navigate(`/evaluar?${params.toString()}`);
              }}
              className="w-full md:w-auto px-6 py-3 text-base font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
            >
              {isAuthenticated() ? 'Evaluar a este profesor' : 'Inicia sesión para evaluar'}
            </button>
          </div>
        </div>

        {/* Evaluations Section */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Evaluaciones ({evaluaciones.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : evaluaciones.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aún no hay evaluaciones
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Sé el primero en evaluar a este profesor
              </p>
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    nombre: profesor.nombre_completo,
                    slug: profesor.slug
                  });
                  navigate(`/evaluar?${params.toString()}`);
                }}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                Evaluar ahora
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluaciones.map((evaluacion) => (
                <div
                  key={evaluacion.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 overflow-hidden"
                >
                  {/* Header con calificación y badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {evaluacion.calificacion}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/10</span>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {evaluacion.recomendado && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            ✓ Recomendado
                          </span>
                        )}
                        {evaluacion.asistencia_obligatoria && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                            Asistencia obligatoria
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Calificación obtenida:</span> {evaluacion.calificacion_obtenida}
                    </div>
                  </div>

                  {/* Información de la materia */}
                  <div className="mb-4 text-sm">
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="break-words min-w-0"><span className="font-medium">Materia:</span> {evaluacion.materia}</span>
                    </div>
                  </div>

                  {/* Opinión */}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 break-words whitespace-pre-wrap">
                    {evaluacion.opinion}
                  </p>

                  {/* Mini-perfil del evaluador */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {evaluacion.usuario_nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {evaluacion.usuario_nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {evaluacion.escuela?.abreviatura || 'IPN'} • {evaluacion.carrera?.nombre || 'Carrera'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {formatearFecha(evaluacion.created_at)}
                      </div>
                      <button
                        onClick={() => handleReportar(evaluacion.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                        title="Reportar contenido inapropiado"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Modal de Reporte */}
                  {reportando === evaluacion.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reportar Evaluación</h3>
                          <button
                            onClick={handleCancelarReporte}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Motivo del reporte *
                            </label>
                            <select
                              value={formReporte.tipo}
                              onChange={(e) => setFormReporte({ ...formReporte, tipo: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ipn-guinda-900 dark:focus:ring-ipn-guinda-600 focus:border-transparent"
                            >
                              <option value="">Selecciona una opción</option>
                              <option value="contenido-ofensivo">Contenido ofensivo</option>
                              <option value="informacion-falsa">Información falsa</option>
                              <option value="spam">Spam</option>
                              <option value="acoso">Acoso</option>
                              <option value="privacidad">Violación de privacidad</option>
                              <option value="otro">Otro</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Descripción *
                            </label>
                            <textarea
                              value={formReporte.descripcion}
                              onChange={(e) => setFormReporte({ ...formReporte, descripcion: e.target.value })}
                              rows={4}
                              maxLength={500}
                              placeholder="Describe por qué reportas esta evaluación..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ipn-guinda-900 dark:focus:ring-ipn-guinda-600 focus:border-transparent resize-y"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formReporte.descripcion.length}/500 caracteres
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelarReporte}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleEnviarReporte(evaluacion.id)}
                              className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
                            >
                              Enviar Reporte
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Notificación Toast */}
      {notificacion && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className={`max-w-md rounded-lg shadow-lg p-4 ${
            notificacion.tipo === 'exito' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {notificacion.tipo === 'exito' ? (
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="text-sm font-medium">{notificacion.mensaje}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfesorProfile;
