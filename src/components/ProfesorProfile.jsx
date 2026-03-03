import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerEvaluacionesProfesor, obtenerProfesorPorSlug, obtenerLikesBatch, obtenerMisLikesBatch, toggleLikeEvaluacion, ocultarEvaluacion } from '../services/supabaseService';
import { crearReporte, adminOcultarEvaluacion } from '../services/adminService';
import { getBrowserFingerprint } from '../lib/browserFingerprint';
import { useSEO } from '../hooks/useSEO';
import Navbar from './Navbar';

const ProfesorProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, logout, monedas, isAuthenticated } = useAuth();
  const [profesor, setProfesor] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportando, setReportando] = useState(null);
  const [formReporte, setFormReporte] = useState({ tipo: '', descripcion: '' });
  const [notificacion, setNotificacion] = useState(null);

  // Likes state
  const [likesMap, setLikesMap] = useState({});
  const [misLikes, setMisLikes] = useState({});
  const [likingId, setLikingId] = useState(null);
  const [loginPromptEvalId, setLoginPromptEvalId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = user?.username === 'Yojan';

  // SEO dinámico basado en el profesor
  useSEO(
    profesor 
      ? `${profesor.nombre_completo} - Calificación ${(profesor.calificacion_promedio || 0).toFixed(1)}/10 | ip`
      : 'Cargando perfil... | ip',
    profesor
      ? `Evaluaciones y opiniones de ${profesor.nombre_completo}. Calificación promedio: ${(profesor.calificacion_promedio || 0).toFixed(1)}/10 basada en ${profesor.total_evaluaciones || 0} evaluaciones de estudiantes del IPN.`
      : 'Cargando información del profesor...',
    profesor ? `${profesor.nombre_completo}, profesor IPN, calificaciones, evaluaciones, opiniones estudiantes` : '',
    profesor ? {
      ogImage: `https://ipnprofes.com/api/og-image/profesor?nombre=${encodeURIComponent(profesor.nombre_completo)}&calificacion=${(profesor.calificacion_promedio || 0).toFixed(1)}&evaluaciones=${profesor.total_evaluaciones || 0}&recomendacion=${Math.round(profesor.porcentaje_recomendacion || 0)}`,
      ogUrl: `https://ipnprofes.com/profesor/${slug}`,
      ogType: 'profile',
    } : {}
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
        const evals = evalResult.data || [];
        setEvaluaciones(evals);

        // Cargar likes en batch
        if (evals.length > 0) {
          const evalIds = evals.map(e => e.id);
          const likes = await obtenerLikesBatch(evalIds, slug);
          setLikesMap(likes);

          // Cargar mis likes usando user.id (session-based)
          if (user?.id) {
            const mis = await obtenerMisLikesBatch(evalIds, String(user.id), slug);
            setMisLikes(mis);
          }
        }
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

  const handleLike = async (evalId, tipo) => {
    if (!user?.id) {
      setLoginPromptEvalId(evalId);
      setTimeout(() => setLoginPromptEvalId(null), 3000);
      return;
    }
    if (likingId) return;

    setLikingId(evalId);
    try {
      const prevTipo = misLikes[evalId];
      const resultado = await toggleLikeEvaluacion(evalId, String(user.id), tipo, slug);

      if (resultado === undefined) return; // error

      // Actualizar mi like
      setMisLikes(prev => {
        const updated = { ...prev };
        if (resultado === null) {
          delete updated[evalId];
        } else {
          updated[evalId] = resultado;
        }
        return updated;
      });

      // Recalcular conteos localmente
      setLikesMap(prev => {
        const updated = { ...prev };
        const current = { ...(updated[evalId] || { likes: 0, dislikes: 0 }) };

        // Restar el anterior
        if (prevTipo === 'like') current.likes = Math.max(0, current.likes - 1);
        if (prevTipo === 'dislike') current.dislikes = Math.max(0, current.dislikes - 1);
        // Sumar el nuevo
        if (resultado === 'like') current.likes++;
        if (resultado === 'dislike') current.dislikes++;

        updated[evalId] = current;
        return updated;
      });
    } finally {
      setLikingId(null);
    }
  };

  const handleOcultarEvaluacion = async (evalId) => {
    if (!user?.id || deleting) return;
    setDeleting(true);
    try {
      const evalTarget = evaluaciones.find(e => e.id === evalId);
      const esMia = evalTarget?.usuario_id === user.id;
      const result = esMia
        ? await ocultarEvaluacion(evalId, user.id)
        : isAdmin
          ? await adminOcultarEvaluacion(evalId)
          : { success: false, error: 'No tienes permiso' };
      if (result.success) {
        // Quitar la evaluación de la lista local
        setEvaluaciones(prev => prev.filter(e => e.id !== evalId));
        setNotificacion({ tipo: 'exito', mensaje: 'Evaluación eliminada correctamente.' });
        setTimeout(() => setNotificacion(null), 4000);
        // Recargar datos del profesor (promedio actualizado)
        const profesorResult = await obtenerProfesorPorSlug(slug);
        if (profesorResult.success) setProfesor(profesorResult.data);
      } else {
        setNotificacion({ tipo: 'error', mensaje: result.error || 'Error al eliminar la evaluación.' });
        setTimeout(() => setNotificacion(null), 3000);
      }
    } catch (err) {
      setNotificacion({ tipo: 'error', mensaje: 'Error al eliminar la evaluación.' });
      setTimeout(() => setNotificacion(null), 3000);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
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
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  ¿El profesor no está registrado?
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
                  Sé el primero en evaluarlo. <span className="font-semibold">Tip:</span> Escribe apellidos primero para mejor búsqueda.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/evaluar?nombre=${encodeURIComponent(nombreDesdeSlug.toUpperCase())}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white text-sm font-medium rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors shadow-sm hover:shadow-md"
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
      <Navbar />

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
                      {/* Botón eliminar (propias o admin) */}
                      {user?.id && (evaluacion.usuario_id === user.id || isAdmin) && (
                        <button
                          onClick={() => setConfirmDeleteId(evaluacion.id)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Eliminar mi evaluación"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
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

                  {/* Likes / Dislikes */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 relative">
                    <span className="text-xs text-gray-400 dark:text-gray-500">¿Útil?</span>
                    <button
                      onClick={() => handleLike(evaluacion.id, 'like')}
                      disabled={likingId === evaluacion.id}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        misLikes[evaluacion.id] === 'like'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                      {(likesMap[evaluacion.id]?.likes || 0) > 0 ? likesMap[evaluacion.id].likes : ''}
                    </button>
                    <button
                      onClick={() => handleLike(evaluacion.id, 'dislike')}
                      disabled={likingId === evaluacion.id}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        misLikes[evaluacion.id] === 'dislike'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" /></svg>
                      {(likesMap[evaluacion.id]?.dislikes || 0) > 0 ? likesMap[evaluacion.id].dislikes : ''}
                    </button>
                    {/* Login prompt tooltip */}
                    {loginPromptEvalId === evaluacion.id && (
                      <div className="absolute left-0 -top-10 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-10">
                        <button onClick={() => navigate('/login?returnTo=' + encodeURIComponent('/profesor/' + slug))} className="underline hover:text-ipn-guinda-300">Inicia sesión</button> para dar tu opinión
                        <div className="absolute left-4 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                      </div>
                    )}
                  </div>

                  {/* Modal de Confirmación para Eliminar */}
                  {confirmDeleteId === evaluacion.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6">
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            ¿Eliminar evaluación?
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Tu evaluación dejará de ser visible y ya no contará en el promedio del profesor. Esta acción no se puede deshacer.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deleting}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleOcultarEvaluacion(evaluacion.id)}
                              disabled={deleting}
                              className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                              {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
