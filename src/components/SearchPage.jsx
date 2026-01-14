import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarProfesores } from '../services/supabaseService';
import { actualizarCacheProfesores } from '../services/cacheUpdateService';
import { useSEO } from '../hooks/useSEO';
import { CacheManager, CACHE_KEYS, CACHE_EXPIRATION } from '../lib/cacheManager';

const SearchPage = () => {
  const navigate = useNavigate();
  const { user, logout, monedas } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [todosLosProfesores, setTodosLosProfesores] = useState([]); // Lista completa
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const searchInputRef = useRef(null);
  
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

  // 🔍 FILTRADO LOCAL - Sin requests a Supabase mientras escribes
  const profesoresFiltrados = useMemo(() => {
    if (!searchQuery.trim()) {
      return todosLosProfesores;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return todosLosProfesores.filter(profesor => 
      profesor.nombre_completo?.toLowerCase().includes(query)
    );
  }, [todosLosProfesores, searchQuery]);

  // Profesores a mostrar (con paginación)
  const profesoresPaginados = useMemo(() => {
    const fin = paginaActual * RESULTADOS_POR_PAGINA;
    return profesoresFiltrados.slice(0, fin);
  }, [profesoresFiltrados, paginaActual]);

  const hayMasResultados = profesoresPaginados.length < profesoresFiltrados.length;

  // Cargar TODOS los profesores UNA SOLA VEZ al inicio
  useEffect(() => {
    cargarTodosLosProfesores();
  }, []);

  // Reset paginación cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [searchQuery]);

  // Manejar cambio de input
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const cargarTodosLosProfesores = async () => {
    setLoading(true);
    setError(null);
    
    // 💾 Intentar cargar desde caché primero
    const cacheKey = CACHE_KEYS.PROFESORES_POPULARES;
    const datosCache = CacheManager.get(cacheKey);
    
    if (datosCache && Array.isArray(datosCache)) {
      console.log('💾 Lista completa cargada desde caché:', datosCache.length, 'profesores');
      setTodosLosProfesores(datosCache);
      setLoading(false);
      return;
    }
    
    // Si no hay caché, cargar de Supabase
    const resultado = await buscarProfesores(''); // Query vacía = todos
    
    if (resultado.success) {
      const profesores = Array.isArray(resultado.data) ? resultado.data : [];
      setTodosLosProfesores(profesores);
      
      // 💾 Guardar en caché por 1 hora
      CacheManager.set(cacheKey, profesores, CACHE_EXPIRATION.PROFESORES_POPULARES);
      console.log('💾 Lista completa guardada en caché:', profesores.length, 'profesores');
    } else {
      setError(resultado.error);
      console.error('Error al cargar profesores:', resultado.error);
    }
    
    setLoading(false);
  };

  const cargarMasResultados = () => {
    setPaginaActual(prev => prev + 1);
  };

  const actualizarDatos = async () => {
    setActualizando(true);
    console.log('🔄 Actualizando datos de profesores...');
    
    // Limpiar caché y recargar
    CacheManager.remove(CACHE_KEYS.PROFESORES_POPULARES);
    
    const resultado = await actualizarCacheProfesores();
    
    if (resultado.success) {
      // Recargar lista completa
      await cargarTodosLosProfesores();
      console.log('✅ Datos actualizados');
    } else {
      console.error('❌ Error al actualizar:', resultado.error);
    }
    
    setActualizando(false);
  };

  const handleProfesorClick = (profesor) => {
    console.log('🔍 Profesor seleccionado:', {
      id: profesor.id,
      nombre: profesor.nombre_completo,
      slug: profesor.slug
    });
    navigate(`/profesor/${profesor.slug}`);
  };

  return (
    <div className="min-h-screen-safe bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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
              {user && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-200 via-purple-300 to-pink-300 dark:from-slate-700 dark:via-purple-600 dark:to-pink-600 rounded-full shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-gray-300 to-transparent animate-shimmer opacity-40" />
                    <span className="text-xl relative z-10">💎</span>
                    <span className="font-bold text-gray-900 dark:text-white relative z-10">{monedas}</span>
                  </div>
                  <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
                    Hola, <span className="font-medium">{user.username}</span>
                  </span>
                </>
              )}
              <button
                onClick={() => navigate('/evaluar')}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                Evaluar Profesor
              </button>
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors whitespace-nowrap"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Buscar Profesor
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
              Ingresa el nombre del profesor para buscar
            </p>

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
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar profesor por nombre..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                enterKeyHint="search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? 'Cargando...' : `${profesoresFiltrados.length} ${profesoresFiltrados.length === 1 ? 'resultado' : 'resultados'}`}
                {searchQuery && !loading && ` para "${searchQuery}"`}
              </div>
              <button
                onClick={actualizarDatos}
                disabled={actualizando}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ipn-guinda-900 bg-ipn-guinda-50 border border-ipn-guinda-200 rounded-md hover:bg-ipn-guinda-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg 
                  className={`w-4 h-4 ${actualizando ? 'animate-spin' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {actualizando ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section>
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
          ) : (profesoresFiltrados.length === 0) ? (
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
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profesoresPaginados.map((profesor) => (
                <div
                  key={profesor.id}
                  onClick={() => handleProfesorClick(profesor)}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-500 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 break-words">
                          {profesor.nombre_completo}
                        </h3>
                        {/* Badge de Verificado si tiene 3+ evaluaciones */}
                        {profesor.total_evaluaciones >= 3 && (
                          <div className="flex-shrink-0" title="Profesor verificado con múltiples evaluaciones">
                            <div className="relative">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {profesor.calificacion_promedio || 'N/A'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">/10</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs pt-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                      <span>{profesor.total_evaluaciones || 0} evaluaciones</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{profesor.total_evaluadores || 0} {profesor.total_evaluadores === 1 ? 'persona' : 'personas'}</span>
                    </div>
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
                className="px-8 py-3 bg-ipn-guinda-900 text-white rounded-lg hover:bg-ipn-guinda-800 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Cargar más profesores ({profesoresFiltrados.length - profesoresPaginados.length} restantes)
              </button>
            </div>
          )}

          {/* Indicador de fin de resultados */}
          {!loading && !hayMasResultados && profesoresPaginados.length > RESULTADOS_POR_PAGINA && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ✓ Has visto todos los resultados ({profesoresFiltrados.length} profesores)
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SearchPage;
