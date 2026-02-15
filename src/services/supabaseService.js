import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { CacheManager, CACHE_KEYS, CACHE_EXPIRATION } from '../lib/cacheManager';

// ============================================
// PROFESORES
// ============================================

/**
 * Obtener TODOS los profesores de una sola vez (para búsqueda local)
 * Se cachea por 30 minutos en el componente que lo llama
 */
export const obtenerTodosLosProfesores = async () => {
  try {
    // Traer todos los profesores ordenados por evaluaciones
    const { data, error } = await supabase
      .from('ranking_profesores')
      .select('*')
      .order('total_evaluaciones', { ascending: false })
      .order('calificacion_promedio', { ascending: false });

    if (error) throw error;
    
    console.log('📥 Total de profesores cargados:', data?.length || 0);
    
    return handleSupabaseSuccess(data || [], 'Profesores cargados exitosamente');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerTodosLosProfesores');
  }
};

/**
 * Buscar profesores por nombre, escuela, carrera o materia (CON CACHÉ)
 * @deprecated Usar obtenerTodosLosProfesores + búsqueda local para mejor rendimiento
 */
export const buscarProfesores = async (searchQuery = '') => {
  try {
    // Intentar obtener del caché
    const cacheKey = searchQuery 
      ? `${CACHE_KEYS.SEARCH_RESULTS}${searchQuery.toLowerCase()}`
      : CACHE_KEYS.PROFESORES_POPULARES;
    
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      console.log('💾 Usando resultados de caché');
      return handleSupabaseSuccess(cached, 'Búsqueda desde caché');
    }

    if (!searchQuery.trim()) {
      // Si no hay búsqueda, traer profesores populares
      const { data, error } = await supabase
        .from('ranking_profesores')
        .select('*')
        .order('total_evaluaciones', { ascending: false })
        .order('calificacion_promedio', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      console.log('🔍 Profesores encontrados:', data?.length || 0);
      
      // Guardar en caché por 1 hora
      CacheManager.set(cacheKey, data, CACHE_EXPIRATION.PROFESORES_POPULARES);
      
      return handleSupabaseSuccess(data, 'Búsqueda exitosa');
    }

    // Estrategia: buscar por nombre de profesor primero
    const { data: profesoresPorNombre, error: errorNombre } = await supabase
      .from('ranking_profesores')
      .select('*')
      .ilike('nombre_completo', `%${searchQuery}%`)
      .order('total_evaluaciones', { ascending: false })
      .order('calificacion_promedio', { ascending: false })
      .limit(50);

    if (errorNombre) throw errorNombre;

    // Si encontró por nombre, retornar y cachear
    if (profesoresPorNombre && profesoresPorNombre.length > 0) {
      console.log('🔍 Profesores encontrados por nombre:', profesoresPorNombre.length);
      CacheManager.set(cacheKey, profesoresPorNombre, CACHE_EXPIRATION.SEARCH_RESULTS);
      return handleSupabaseSuccess(profesoresPorNombre, 'Búsqueda exitosa');
    }

    // Si no, buscar en evaluaciones por materia (solo IDs)
    const { data: evaluaciones, error: errorEvaluaciones } = await supabase
      .from('evaluaciones')
      .select('profesor_id')
      .ilike('materia', `%${searchQuery}%`);

    if (errorEvaluaciones) throw errorEvaluaciones;

    if (!evaluaciones || evaluaciones.length === 0) {
      console.log('🔍 No se encontraron resultados');
      CacheManager.set(cacheKey, [], CACHE_EXPIRATION.SEARCH_RESULTS);
      return handleSupabaseSuccess([], 'No se encontraron resultados');
    }

    // Obtener IDs únicos de profesores
    const profesorIds = [...new Set(evaluaciones.map(e => e.profesor_id))];

    // Obtener información completa de esos profesores
    const { data: rankingProfesores, error: errorRanking } = await supabase
      .from('ranking_profesores')
      .select('*')
      .in('id', profesorIds)
      .order('total_evaluaciones', { ascending: false })
      .order('calificacion_promedio', { ascending: false })
      .limit(50);

    if (errorRanking) throw errorRanking;

    console.log('🔍 Profesores encontrados por materia:', rankingProfesores?.length || 0);
    CacheManager.set(cacheKey, rankingProfesores, CACHE_EXPIRATION.SEARCH_RESULTS);
    return handleSupabaseSuccess(rankingProfesores, 'Búsqueda exitosa');
  } catch (error) {
    return handleSupabaseError(error, 'buscarProfesores');
  }
};

/**
 * Obtener detalles completos de un profesor por ID
 */
export const obtenerProfesorPorId = async (profesorId) => {
  try {
    const { data, error } = await supabase
      .from('ranking_profesores')
      .select('*')
      .eq('id', profesorId)
      .single();

    if (error) throw error;

    return handleSupabaseSuccess(data, 'Profesor encontrado');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerProfesorPorId');
  }
};

/**
 * Obtener profesor por slug (para URLs amigables) - CON CACHÉ
 */
export const obtenerProfesorPorSlug = async (slug) => {
  try {
    // Intentar desde caché
    const cacheKey = `${CACHE_KEYS.PROFESOR_PROFILE}${slug}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      console.log('💾 Profesor desde caché:', slug);
      return handleSupabaseSuccess(cached, 'Profesor desde caché');
    }

    const { data, error } = await supabase
      .from('ranking_profesores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;

    // Guardar en caché por 10 minutos
    CacheManager.set(cacheKey, data, CACHE_EXPIRATION.PROFESOR_PROFILE);
    console.log('✅ Profesor cargado:', data.nombre_completo);

    return handleSupabaseSuccess(data, 'Profesor encontrado');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerProfesorPorSlug');
  }
};

/**
 * Crear o obtener un profesor (evita duplicados)
 */
export const crearOObtenerProfesor = async (nombreCompleto) => {
  try {
    // Primero intentar buscar si ya existe
    const { data: existente, error: errorBusqueda } = await supabase
      .from('profesores')
      .select('*')
      .eq('nombre_completo', nombreCompleto)
      .single();

    if (existente) {
      console.log('👤 Profesor ya existe:', existente.nombre_completo);
      return handleSupabaseSuccess(existente, 'Profesor encontrado');
    }

    // Si no existe, crear uno nuevo
    const slug = nombreCompleto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data: nuevo, error: errorCrear } = await supabase
      .from('profesores')
      .insert([{ nombre_completo: nombreCompleto, slug }])
      .select()
      .single();

    if (errorCrear) throw errorCrear;

    // 🔄 Invalidar caché de profesores cuando se crea uno nuevo
    CacheManager.remove('ipn_todos_profesores');
    console.log('🗑️ Caché de profesores invalidado (nuevo profesor creado)');

    console.log('👤 Nuevo profesor creado:', nuevo.nombre_completo);
    return handleSupabaseSuccess(nuevo, 'Profesor creado');
  } catch (error) {
    return handleSupabaseError(error, 'crearOObtenerProfesor');
  }
};

// ============================================
// ESCUELAS Y CARRERAS
// ============================================

/**
 * Obtener todas las escuelas - CON CACHÉ (raramente cambian)
 */
export const obtenerEscuelas = async () => {
  try {
    // Intentar desde caché
    const cached = CacheManager.get(CACHE_KEYS.ESCUELAS);
    if (cached) {
      console.log('💾 Escuelas desde caché');
      return handleSupabaseSuccess(cached, 'Escuelas desde caché');
    }

    const { data, error } = await supabase
      .from('escuelas')
      .select('*')
      .order('abreviatura');

    if (error) throw error;

    // Guardar en caché por 7 días
    CacheManager.set(CACHE_KEYS.ESCUELAS, data, CACHE_EXPIRATION.ESCUELAS);
    console.log('✅ Escuelas cargadas:', data.length);

    return handleSupabaseSuccess(data, 'Escuelas cargadas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEscuelas');
  }
};

/**
 * Obtener carreras por escuela - CON CACHÉ
 */
export const obtenerCarrerasPorEscuela = async (escuelaId) => {
  try {
    // Intentar desde caché
    const cacheKey = `${CACHE_KEYS.CARRERAS}${escuelaId}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      console.log('💾 Carreras desde caché');
      return handleSupabaseSuccess(cached, 'Carreras desde caché');
    }

    const { data, error } = await supabase
      .from('carreras')
      .select('*')
      .eq('escuela_id', escuelaId)
      .order('nombre');

    if (error) throw error;

    // Guardar en caché por 7 días
    CacheManager.set(cacheKey, data, CACHE_EXPIRATION.CARRERAS);
    console.log('✅ Carreras cargadas:', data.length);

    return handleSupabaseSuccess(data, 'Carreras cargadas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerCarrerasPorEscuela');
  }
};

// ============================================
// EVALUACIONES
// ============================================

/**
 * Crear una nueva evaluación (INVALIDA CACHÉ)
 */
export const crearEvaluacion = async (evaluacionData) => {
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .insert([evaluacionData])
      .select()
      .single();

    if (error) throw error;

    console.log('⭐ Nueva evaluación creada:', data.id);
    
    // IMPORTANTE: Invalidar caché relacionado
    CacheManager.remove(CACHE_KEYS.PROFESORES_POPULARES);
    // Limpiar caché de búsquedas
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEYS.SEARCH_RESULTS)) {
        localStorage.removeItem(key);
      }
    });
    
    return handleSupabaseSuccess(data, 'Evaluación publicada exitosamente');
  } catch (error) {
    return handleSupabaseError(error, 'crearEvaluacion');
  }
};

/**
 * Obtener evaluaciones de un profesor
 */
export const obtenerEvaluacionesProfesor = async (profesorId) => {
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select(`
        *,
        escuela:escuelas(nombre, abreviatura),
        carrera:carreras(nombre),
        usuario:usuarios(username, total_evaluaciones)
      `)
      .eq('profesor_id', profesorId)
      .eq('oculto', false)  // Solo mostrar evaluaciones NO ocultas
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('📊 Evaluaciones cargadas:', data?.length || 0);
    return handleSupabaseSuccess(data, 'Evaluaciones cargadas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEvaluacionesProfesor');
  }
};

/**
 * Obtener estadísticas de un profesor
 */
export const obtenerEstadisticasProfesor = async (profesorId) => {
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('calificacion, recomendado, asistencia_obligatoria')
      .eq('profesor_id', profesorId);

    if (error) throw error;

    const estadisticas = {
      total: data.length,
      promedioCalificacion: data.length > 0 
        ? (data.reduce((sum, e) => sum + e.calificacion, 0) / data.length).toFixed(1)
        : 0,
      porcentajeRecomendacion: data.length > 0
        ? Math.round((data.filter(e => e.recomendado).length / data.length) * 100)
        : 0,
      porcentajeAsistencia: data.length > 0
        ? Math.round((data.filter(e => e.asistencia_obligatoria).length / data.length) * 100)
        : 0
    };

    return handleSupabaseSuccess(estadisticas, 'Estadísticas calculadas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEstadisticasProfesor');
  }
};

// ============================================
// HELPERS DE BÚSQUEDA
// ============================================

/**
 * Autocompletar nombres de profesores para el formulario
 */
export const autocompletarProfesores = async (query) => {
  if (!query || query.length < 2) return { success: true, data: [] };

  try {
    const { data, error } = await supabase
      .from('profesores')
      .select('id, nombre_completo')
      .ilike('nombre_completo', `%${query}%`)
      .limit(5);

    if (error) throw error;

    return handleSupabaseSuccess(data, 'Autocompletado');
  } catch (error) {
    return handleSupabaseError(error, 'autocompletarProfesores');
  }
};
// ============================================
// USUARIOS
// ============================================

/**
 * Crear o obtener un usuario (CON FINGERPRINTING - graceful fallback)
 */
export const crearOObtenerUsuario = async (username, cancionFavorita, fingerprintData = null) => {
  try {
    // Buscar por username (método principal y más confiable)
    const { data: existente, error: errorBusqueda } = await supabase
      .from('usuarios')
      .select('id, username, cancion_favorita, monedas, total_evaluaciones')
      .eq('username', username)
      .maybeSingle();

    // maybeSingle() devuelve null si no encuentra, no lanza error
    if (existente) {
      console.log('👤 Usuario encontrado:', existente.username);
      return handleSupabaseSuccess(existente, 'Usuario encontrado');
    }

    // Crear usuario nuevo con campos básicos
    // Normalizar la canción favorita (lowercase, trim) para comparaciones consistentes
    const nuevoUsuario = {
      username,
      cancion_favorita: cancionFavorita?.trim().toLowerCase() || null,
      total_evaluaciones: 0,
      monedas: 0
    };

    const { data: nuevo, error: errorCrear } = await supabase
      .from('usuarios')
      .insert([nuevoUsuario])
      .select('id, username, cancion_favorita, monedas, total_evaluaciones')
      .single();

    if (errorCrear) throw errorCrear;

    console.log('✨ Usuario creado:', nuevo.username);
    return handleSupabaseSuccess(nuevo, 'Usuario creado');
  } catch (error) {
    return handleSupabaseError(error, 'crearOObtenerUsuario');
  }
};

/**
 * Obtener perfil de usuario con sus evaluaciones
 */
export const obtenerPerfilUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        escuela:escuelas(nombre, abreviatura),
        carrera:carreras(nombre)
      `)
      .eq('id', usuarioId)
      .single();

    if (error) throw error;

    return handleSupabaseSuccess(data, 'Perfil de usuario cargado');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerPerfilUsuario');
  }
};

/**
 * Obtener evaluaciones de un usuario
 */
export const obtenerEvaluacionesUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select(`
        *,
        profesor:profesores(nombre_completo),
        escuela:escuelas(nombre, abreviatura),
        carrera:carreras(nombre)
      `)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('📝 Evaluaciones del usuario:', data?.length || 0);
    return handleSupabaseSuccess(data, 'Evaluaciones del usuario cargadas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEvaluacionesUsuario');
  }
};

/**
 * Obtener estadísticas globales de la plataforma
 */
export const obtenerEstadisticasGlobales = async () => {
  try {
    // Obtener conteo de profesores
    const { count: totalProfesores, error: errorProfesores } = await supabase
      .from('profesores')
      .select('*', { count: 'exact', head: true });

    if (errorProfesores) throw errorProfesores;

    // Obtener conteo de escuelas
    const { count: totalEscuelas, error: errorEscuelas } = await supabase
      .from('escuelas')
      .select('*', { count: 'exact', head: true });

    if (errorEscuelas) throw errorEscuelas;

    // Obtener conteo de carreras
    const { count: totalCarreras, error: errorCarreras } = await supabase
      .from('carreras')
      .select('*', { count: 'exact', head: true });

    if (errorCarreras) throw errorCarreras;

    // Obtener conteo de evaluaciones
    const { count: totalEvaluaciones, error: errorEvaluaciones } = await supabase
      .from('evaluaciones')
      .select('*', { count: 'exact', head: true });

    if (errorEvaluaciones) throw errorEvaluaciones;

    const stats = {
      totalProfesores: totalProfesores || 0,
      totalEscuelas: totalEscuelas || 0,
      totalCarreras: totalCarreras || 0,
      totalEvaluaciones: totalEvaluaciones || 0
    };

    console.log('📊 Estadísticas globales:', stats);
    return handleSupabaseSuccess(stats, 'Estadísticas obtenidas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEstadisticasGlobales');
  }
};

/**
 * Incrementar contador de evaluaciones del usuario (vía RPC segura)
 */
export const incrementarEvaluacionesUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase.rpc('incrementar_evaluaciones_seguro', {
      p_usuario_id: usuarioId
    });

    if (error) {
      console.warn('⚠️ No se pudo incrementar evaluaciones:', error);
      return handleSupabaseSuccess(null, 'Contador no actualizado (no crítico)');
    }

    if (!data || !data.success) {
      console.warn('⚠️ RPC incrementar_evaluaciones:', data?.error);
      return handleSupabaseSuccess(null, 'Contador no actualizado (no crítico)');
    }

    console.log('📊 Evaluaciones actualizadas:', data.total_evaluaciones);
    return handleSupabaseSuccess(data, 'Contador actualizado');
  } catch (error) {
    console.warn('⚠️ No se pudo actualizar contador de evaluaciones:', error);
    return handleSupabaseSuccess(null, 'Contador no actualizado (no crítico)');
  }
};

/**
 * Agregar monedas al usuario (recompensa por evaluar) — vía RPC segura
 * La validación de cantidad ocurre en el servidor (max 50 por operación)
 */
export const agregarMonedasUsuario = async (usuarioId, cantidad = 5) => {
  try {
    const { data, error } = await supabase.rpc('agregar_monedas_seguro', {
      p_usuario_id: usuarioId,
      p_cantidad: cantidad
    });

    if (error) throw error;

    if (!data || !data.success) {
      console.warn('⚠️ No se pudieron agregar monedas:', data?.error);
      return { success: false, error: data?.error || 'Error al agregar monedas', data: null };
    }

    console.log(`💰 +${cantidad} monedas agregadas. Total: ${data.monedas}`);
    return handleSupabaseSuccess(data, `¡Ganaste ${cantidad} monedas!`);
  } catch (error) {
    return handleSupabaseError(error, 'agregarMonedasUsuario');
  }
};

/**
 * Obtener monedas del usuario
 */
export const obtenerMonedasUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('monedas')
      .eq('id', usuarioId)
      .single();

    if (error) throw error;

    return handleSupabaseSuccess(data.monedas || 0, 'Monedas obtenidas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerMonedasUsuario');
  }
};