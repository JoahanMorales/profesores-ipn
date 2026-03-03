import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerTodosLosProfesores } from '../services/supabaseService';
import { actualizarCacheProfesores } from '../services/cacheUpdateService';
import { useSEO } from '../hooks/useSEO';
import { CacheManager, CACHE_KEYS } from '../lib/cacheManager';
import Navbar from './Navbar';

const SearchPage = () => {
  const navigate = useNavigate();
  const { user, logout, monedas, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [todosLosProfesores, setTodosLosProfesores] = useState([]); // Todos los profes cargados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  
  // SEO dinámico para búsqueda
  useSEO(
    `${searchQuery ? `Resultados: ${searchQuery}` : 'Buscar Profesores'} | ip`,
    searchQuery 
      ? `Encuentra información sobre "${searchQuery}" en nuestra base de datos de profesores del IPN. Calificaciones, opiniones y recomendaciones de estudiantes.`
      : 'Busca y compara profesores del IPN. Encuentra los mejores docentes según evaluaciones de estudiantes reales de ESCOM, UPIICSA, ESIME y más.',
    'buscar profesores IPN, calificaciones docentes, opiniones estudiantes, mejores profesores'
  );
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const RESULTADOS_POR_PAGINA = 20;

  // 🔍 BÚSQUEDA LOCAL: Filtrar profesores en memoria (sin llamar a la BD)
  const profesoresFiltrados = useMemo(() => {
    if (!searchQuery.trim()) {
      return todosLosProfesores;
    }
    
    const query = searchQuery.toLowerCase().trim();
    // Normalizar texto para búsqueda (quitar acentos)
    const normalizar = (texto) => 
      texto?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
    
    return todosLosProfesores.filter(profesor => {
      const nombre = normalizar(profesor.nombre_completo);
      const queryNormalizado = normalizar(query);
      return nombre.includes(queryNormalizado);
    });
  }, [todosLosProfesores, searchQuery]);

  // Profesores paginados para mostrar
  const profesoresPaginados = useMemo(() => {
    const fin = paginaActual * RESULTADOS_POR_PAGINA;
    return profesoresFiltrados.slice(0, fin);
  }, [profesoresFiltrados, paginaActual]);

  const hayMasResultados = profesoresPaginados.length < profesoresFiltrados.length;

  // Color según calificación (intensidad de guinda)
  const getRatingColor = (cal) => {
    if (!cal) return 'text-gray-400 dark:text-gray-500';
    const num = typeof cal === 'string' ? parseFloat(cal) : cal;
    if (isNaN(num)) return 'text-gray-400 dark:text-gray-500';
    if (num >= 7) return 'text-ipn-guinda-900 dark:text-ipn-guinda-300';
    if (num >= 5) return 'text-ipn-guinda-500 dark:text-ipn-guinda-400';
    return 'text-ipn-guinda-300 dark:text-ipn-guinda-600';
  };

  // Cargar TODOS los profesores al iniciar (una sola vez)
  useEffect(() => {
    cargarTodosLosProfesores();
  }, []);

  // Reset paginación cuando cambia el query
  useEffect(() => {
    setPaginaActual(1);
  }, [searchQuery]);

  const cargarTodosLosProfesores = async () => {
    setLoading(true);
    setError(null);
    
    // Cargar de Supabase (ya tiene caché interno de 30 min)
    const resultado = await obtenerTodosLosProfesores();
    
    if (resultado.success) {
      const profesores = Array.isArray(resultado.data) ? resultado.data : [];
      setTodosLosProfesores(profesores);
    } else {
      setError(resultado.error);
    }
    
    setLoading(false);
  };

  const cargarMasResultados = () => {
    setPaginaActual(prev => prev + 1);
  };

  const actualizarDatos = async () => {
    setActualizando(true);
    
    // Limpiar caché de profesores
    CacheManager.remove(CACHE_KEYS.TODOS_PROFESORES);
    
    const resultado = await actualizarCacheProfesores();
    
    if (resultado.success) {
      // Recargar todos los profesores con datos frescos
      await cargarTodosLosProfesores();
    } else {
      // Error silencioso
    }
    
    setActualizando(false);
  };

  const handleProfesorClick = (profesor) => {
    navigate(`/profesor/${profesor.slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* Search Hero */}
        <section className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-14 sm:pb-10">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 uppercase tracking-widest mb-3">Buscador</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Encuentra a tu{' '}
                <span className="text-ipn-guinda-900 dark:text-ipn-guinda-400">profesor</span>
              </h1>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg 
                  className="h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre del profesor..."
                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ipn-guinda-900/20 dark:focus:ring-ipn-guinda-400/20 focus:border-ipn-guinda-900 dark:focus:border-ipn-guinda-400 transition-all shadow-sm placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Cargando...' : (
                  <>
                    <span className="font-semibold text-gray-900 dark:text-white">{profesoresFiltrados.length}</span>
                    {' '}{profesoresFiltrados.length === 1 ? 'resultado' : 'resultados'}
                    {searchQuery && !loading && ` para "${searchQuery}"`}
                  </>
                )}
              </p>
              <button
                onClick={actualizarDatos}
                disabled={actualizando}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-ipn-guinda-900 dark:hover:text-ipn-guinda-400 transition-colors disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${actualizando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {actualizando ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-600 font-medium">Error al cargar profesores</p>
              <p className="text-sm text-red-500 mt-2">{error}</p>
              <button
                onClick={cargarTodosLosProfesores}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : profesoresFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No se encontraron resultados</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Intenta con otro término de búsqueda
              </p>
              
              {/* Opción para agregar nuevo profesor */}
              {searchQuery.trim() && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg max-w-md mx-auto">
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                        ¿El profesor no está registrado?
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        Agrégalo ahora. <span className="font-semibold">Recuerda:</span> escribe apellidos primero para mejor búsqueda (Ej: PÉREZ GARCÍA JUAN).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/evaluar?nombre=${encodeURIComponent(searchQuery.trim().toUpperCase())}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white text-sm font-medium rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar y evaluar profesor
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profesoresPaginados.map((profesor) => (
                <div
                  key={profesor.id}
                  onClick={() => handleProfesorClick(profesor)}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-ipn-guinda-200 dark:hover:border-ipn-guinda-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 break-words">
                          {profesor.nombre_completo}
                        </h3>
                        {/* Badge de Verificado si tiene 3+ evaluaciones */}
                        {profesor.total_evaluaciones >= 3 && (
                          <div className="flex-shrink-0" title="Profesor con múltiples evaluaciones">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-ipn-guinda-700 via-ipn-guinda-400 to-ipn-guinda-700 animate-badge-shimmer flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-4">
                      <span className={`text-3xl font-bold ${getRatingColor(profesor.calificacion_promedio)}`}>
                        {profesor.calificacion_promedio || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">/10</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {profesor.total_evaluaciones || 0} eval.
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {profesor.total_evaluadores || 0}
                    </span>
                    {profesor.porcentaje_recomendacion != null && profesor.total_evaluaciones > 0 && (
                      <span className="flex items-center gap-1 ml-auto font-medium text-ipn-guinda-900 dark:text-ipn-guinda-400">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        {Math.round(profesor.porcentaje_recomendacion)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón Cargar Más */}
          {!loading && hayMasResultados && profesoresPaginados.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={cargarMasResultados}
                className="px-8 py-3 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white rounded-xl hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-all font-semibold flex items-center gap-2 shadow-md shadow-ipn-guinda-900/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Cargar más profesores ({profesoresFiltrados.length - profesoresPaginados.length} restantes)
              </button>
            </div>
          )}

          {/* Indicador de fin de resultados */}
          {!loading && !hayMasResultados && profesoresFiltrados.length > RESULTADOS_POR_PAGINA && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ✓ Has visto todos los resultados ({profesoresFiltrados.length} profesores)
              </p>
            </div>
          )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SearchPage;
