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
    // Verificar caché
    const cached = CacheManager.get(CACHE_KEYS.TODOS_PROFESORES);
    if (cached) {
      return handleSupabaseSuccess(cached, 'Profesores (desde caché)');
    }

    // Traer todos los profesores ordenados por evaluaciones
    const { data, error } = await supabase
      .from('ranking_profesores')
      .select('*')
      .order('total_evaluaciones', { ascending: false })
      .order('calificacion_promedio', { ascending: false });

    if (error) throw error;

    const result = data || [];
    // Cachear por 30 minutos
    CacheManager.set(CACHE_KEYS.TODOS_PROFESORES, result, CACHE_EXPIRATION.TODOS_PROFESORES);

    return handleSupabaseSuccess(result, 'Profesores cargados exitosamente');
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
      .ilike('nombre_completo', `%${escapeIlike(searchQuery)}%`)
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
      .ilike('materia', `%${escapeIlike(searchQuery)}%`);

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

    // No cachear resultados vacíos
    if (data && data.length > 0) {
      CacheManager.set(CACHE_KEYS.ESCUELAS, data, CACHE_EXPIRATION.ESCUELAS);
    }
    console.log('Escuelas cargadas:', data.length);

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

    // No cachear resultados vacíos (evita que se queden 7 días sin carreras)
    if (data && data.length > 0) {
      CacheManager.set(cacheKey, data, CACHE_EXPIRATION.CARRERAS);
    }
    console.log('Carreras cargadas:', data.length);

    return handleSupabaseSuccess(data, 'Carreras cargadas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerCarrerasPorEscuela');
  }
};

// ============================================
// EVALUACIONES
// ============================================

/**
 * Escapa caracteres wildcard de PostgreSQL para uso seguro en ilike
 */
function escapeIlike(str) {
  return str.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Crear una evaluación de forma segura via RPC
 * Valida credenciales → crea profesor si no existe → crea evaluación → suma monedas
 * Todo en una sola transacción atómica server-side
 */
export const crearEvaluacionSegura = async (username, cancionFavorita, formData, captchaToken) => {
  try {
    const params = {
      p_username: username,
      p_cancion_favorita: cancionFavorita?.trim().toLowerCase() || '',
      p_nombre_profesor: formData.nombreProfesor,
      p_escuela_id: formData.escuelaId,
      p_carrera_id: formData.carreraId,
      p_materia: formData.materia,
      p_calificacion: parseInt(formData.calificacion),
      p_recomendado: formData.recomendado ?? true,
      p_asistencia_obligatoria: formData.asistenciaObligatoria ?? false,
      p_calificacion_obtenida: formData.calificacionObtenida || null,
      p_opinion: formData.opinion
    };

    // Solo enviar token si existe
    if (captchaToken) {
      params.p_captcha_token = captchaToken;
    }

    // Enviar score de moderación si existe
    if (formData.moderacionScore != null) {
      params.p_moderacion_score = formData.moderacionScore;
    }

    const { data, error } = await supabase.rpc('crear_evaluacion_segura', params);

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error desconocido');

    // Invalidar caché relacionado
    CacheManager.remove(CACHE_KEYS.PROFESORES_POPULARES);
    CacheManager.remove(CACHE_KEYS.TODOS_PROFESORES);
    CacheManager.remove(CACHE_KEYS.STATS_GLOBALES);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEYS.SEARCH_RESULTS) || key.startsWith(CACHE_KEYS.PROFESOR_PROFILE)) {
        localStorage.removeItem(key);
      }
    });

    return handleSupabaseSuccess(data, 'Evaluación publicada exitosamente');
  } catch (error) {
    return handleSupabaseError(error, 'crearEvaluacionSegura');
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
      .eq('profesor_id', profesorId)
      .eq('oculto', false);

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
      .ilike('nombre_completo', `%${escapeIlike(query)}%`)
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
 * Verificar/crear usuario de forma segura via RPC
 * Las credenciales se verifican server-side — cancion_favorita NUNCA se expone al cliente
 */
export const verificarUsuario = async (username, cancionFavorita, captchaToken) => {
  try {
    const params = {
      p_username: username,
      p_cancion_favorita: cancionFavorita?.trim().toLowerCase() || ''
    };

    // Solo enviar token si existe (compatibilidad con CAPTCHA apagado)
    if (captchaToken) {
      params.p_captcha_token = captchaToken;
    }

    const { data, error } = await supabase.rpc('verificar_usuario', params);

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error desconocido');

    return handleSupabaseSuccess(data.usuario, data.nuevo ? 'Usuario creado' : 'Login exitoso');
  } catch (error) {
    return handleSupabaseError(error, 'verificarUsuario');
  }
};

/**
 * Obtener perfil de usuario (solo columnas públicas seguras)
 */
export const obtenerPerfilUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username, monedas, total_evaluaciones, created_at')
      .eq('id', usuarioId)
      .single();

    if (error) throw error;

    return handleSupabaseSuccess(data, 'Perfil de usuario cargado');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerPerfilUsuario');
  }
};

/**
 * Obtener evaluaciones de un usuario (con caché)
 */
export const obtenerEvaluacionesUsuario = async (usuarioId) => {
  try {
    const cacheKey = `${CACHE_KEYS.USER_EVALUACIONES}${usuarioId}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      return handleSupabaseSuccess(cached, 'Evaluaciones del usuario (desde caché)');
    }

    const { data, error } = await supabase
      .from('evaluaciones')
      .select(`
        *,
        profesor:profesores(id, nombre_completo, slug),
        escuela:escuelas(nombre, abreviatura),
        carrera:carreras(nombre)
      `)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    CacheManager.set(cacheKey, data || [], CACHE_EXPIRATION.USER_EVALUACIONES);
    return handleSupabaseSuccess(data || [], 'Evaluaciones del usuario cargadas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEvaluacionesUsuario');
  }
};

/**
 * Obtener estadísticas globales de la plataforma
 */
export const obtenerEstadisticasGlobales = async () => {
  try {
    // Verificar caché (1 hora — estas estadísticas no cambian rápido)
    const cached = CacheManager.get(CACHE_KEYS.STATS_GLOBALES);
    if (cached) {
      return handleSupabaseSuccess(cached, 'Estadísticas (desde caché)');
    }

    // Obtener todos los conteos en paralelo
    const [profesores, escuelas, carreras, evaluaciones] = await Promise.all([
      supabase.from('profesores').select('*', { count: 'exact', head: true }),
      supabase.from('escuelas').select('*', { count: 'exact', head: true }),
      supabase.from('carreras').select('*', { count: 'exact', head: true }),
      supabase.from('evaluaciones').select('*', { count: 'exact', head: true }),
    ]);

    if (profesores.error) throw profesores.error;
    if (escuelas.error) throw escuelas.error;
    if (carreras.error) throw carreras.error;
    if (evaluaciones.error) throw evaluaciones.error;

    const stats = {
      totalProfesores: profesores.count || 0,
      totalEscuelas: escuelas.count || 0,
      totalCarreras: carreras.count || 0,
      totalEvaluaciones: evaluaciones.count || 0
    };

    // Cachear por 1 hora
    CacheManager.set(CACHE_KEYS.STATS_GLOBALES, stats, CACHE_EXPIRATION.STATS_GLOBALES);

    return handleSupabaseSuccess(stats, 'Estadísticas obtenidas');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEstadisticasGlobales');
  }
};

// incrementarEvaluacionesUsuario y agregarMonedasUsuario fueron eliminados.
// crear_evaluacion_segura ya maneja monedas + evaluaciones internamente
// y las RPCs standalone fueron revocadas para anon por seguridad.

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

// ============================================
// EVENTOS
// ============================================

/**
 * Obtener todos los eventos publicados
 */
export const obtenerEventos = async () => {
  try {
    // Verificar caché
    const cached = CacheManager.get(CACHE_KEYS.EVENTOS);
    if (cached) {
      return handleSupabaseSuccess(cached, 'Eventos (desde caché)');
    }

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('publicado', true)
      .order('fecha_inicio', { ascending: true });

    if (error) throw error;

    const result = data || [];
    CacheManager.set(CACHE_KEYS.EVENTOS, result, CACHE_EXPIRATION.EVENTOS);

    return handleSupabaseSuccess(result, 'Eventos cargados');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEventos');
  }
};

/**
 * Obtener un evento por slug
 */
export const obtenerEventoPorSlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('slug', slug)
      .eq('publicado', true)
      .single();

    if (error) throw error;

    return handleSupabaseSuccess(data, 'Evento encontrado');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEventoPorSlug');
  }
};

// ============================================
// BLOG
// ============================================

/**
 * Obtener todos los artículos publicados
 */
export const obtenerArticulos = async () => {
  try {
    // Verificar caché
    const cached = CacheManager.get(CACHE_KEYS.ARTICULOS);
    if (cached) {
      return handleSupabaseSuccess(cached, 'Artículos (desde caché)');
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('publicado', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = data || [];
    CacheManager.set(CACHE_KEYS.ARTICULOS, result, CACHE_EXPIRATION.ARTICULOS);

    return handleSupabaseSuccess(result, 'Artículos cargados');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerArticulos');
  }
};

/**
 * Obtener un artículo por slug
 */
export const obtenerArticuloPorSlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('publicado', true)
      .single();

    if (error) throw error;

    return handleSupabaseSuccess(data, 'Artículo encontrado');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerArticuloPorSlug');
  }
};

// ═══════════════════════════════════════════════════════════
// LIKES / DISLIKES EN EVALUACIONES
// ═══════════════════════════════════════════════════════════

/**
 * Obtener conteo de likes/dislikes para un batch de evaluaciones (con caché por slug)
 */
export const obtenerLikesBatch = async (evaluacionIds, profesorSlug = '') => {
  if (!evaluacionIds || evaluacionIds.length === 0) return {};

  try {
    // Cachear por slug del profesor si disponible
    const cacheKey = profesorSlug ? `${CACHE_KEYS.LIKES_BATCH}${profesorSlug}` : null;
    if (cacheKey) {
      const cached = CacheManager.get(cacheKey);
      if (cached) return cached;
    }

    const { data, error } = await supabase
      .from('evaluacion_likes')
      .select('evaluacion_id, tipo')
      .in('evaluacion_id', evaluacionIds);

    if (error) throw error;

    const result = {};
    evaluacionIds.forEach(id => {
      result[id] = { likes: 0, dislikes: 0 };
    });

    (data || []).forEach(d => {
      if (!result[d.evaluacion_id]) {
        result[d.evaluacion_id] = { likes: 0, dislikes: 0 };
      }
      if (d.tipo === 'like') result[d.evaluacion_id].likes++;
      else result[d.evaluacion_id].dislikes++;
    });

    if (cacheKey) {
      CacheManager.set(cacheKey, result, CACHE_EXPIRATION.LIKES_BATCH);
    }
    return result;
  } catch (error) {
    console.warn('Error cargando likes:', error);
    return {};
  }
};

/**
 * Obtener los likes/dislikes del visitor actual para un batch de evaluaciones (con caché)
 */
export const obtenerMisLikesBatch = async (evaluacionIds, visitorId, profesorSlug = '') => {
  if (!evaluacionIds || evaluacionIds.length === 0 || !visitorId) return {};

  try {
    const cacheKey = profesorSlug ? `${CACHE_KEYS.MIS_LIKES}${profesorSlug}` : null;
    if (cacheKey) {
      const cached = CacheManager.get(cacheKey);
      if (cached) return cached;
    }

    const { data, error } = await supabase
      .from('evaluacion_likes')
      .select('evaluacion_id, tipo')
      .in('evaluacion_id', evaluacionIds)
      .eq('visitor_id', visitorId);

    if (error) throw error;

    const result = {};
    (data || []).forEach(d => {
      result[d.evaluacion_id] = d.tipo;
    });

    if (cacheKey) {
      CacheManager.set(cacheKey, result, CACHE_EXPIRATION.MIS_LIKES);
    }
    return result;
  } catch (error) {
    console.warn('Error cargando mis likes:', error);
    return {};
  }
};

/**
 * Toggle like/dislike en una evaluación
 * - Si no existe → crear
 * - Si existe mismo tipo → quitar (toggle off)
 * - Si existe tipo opuesto → cambiar
 */
export const toggleLikeEvaluacion = async (evaluacionId, visitorId, tipo, profesorSlug = '') => {
  try {
    // Verificar si ya existe un like/dislike de este visitor
    const { data: existing } = await supabase
      .from('evaluacion_likes')
      .select('id, tipo')
      .eq('evaluacion_id', evaluacionId)
      .eq('visitor_id', visitorId)
      .maybeSingle();

    if (existing) {
      if (existing.tipo === tipo) {
        // Toggle off — quitar el like/dislike
        await supabase.from('evaluacion_likes').delete().eq('id', existing.id);
        return null;
      } else {
        // Cambiar de like a dislike o viceversa
        await supabase.from('evaluacion_likes').update({ tipo }).eq('id', existing.id);
        return tipo;
      }
    } else {
      // Crear nuevo like/dislike
      await supabase.from('evaluacion_likes').insert({
        evaluacion_id: evaluacionId,
        visitor_id: visitorId,
        tipo
      });
      return tipo;
    }
  } catch (error) {
    console.error('Error en toggleLike:', error);
    return undefined; // undefined = error
  } finally {
    // Invalidar caché de likes para este profesor
    if (profesorSlug) {
      CacheManager.invalidateLikes(profesorSlug);
    }
  }
};

/**
 * Ocultar (soft delete) una evaluación propia
 * Solo funciona si la evaluación pertenece al usuario
 */
export const ocultarEvaluacion = async (evaluacionId, usuarioId) => {
  try {
    const { data, error } = await supabase.rpc('ocultar_evaluacion_propia', {
      p_evaluacion_id: evaluacionId,
      p_usuario_id: usuarioId
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error desconocido');

    // Invalidar cachés relacionados
    CacheManager.remove(CACHE_KEYS.TODOS_PROFESORES);
    CacheManager.remove(CACHE_KEYS.PROFESORES_POPULARES);
    CacheManager.remove(CACHE_KEYS.STATS_GLOBALES);
    CacheManager.invalidateUserEvaluaciones();
    // Invalidar perfiles de profesor y búsquedas
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEYS.SEARCH_RESULTS) || key.startsWith(CACHE_KEYS.PROFESOR_PROFILE)) {
        localStorage.removeItem(key);
      }
    });

    return handleSupabaseSuccess(data, 'Evaluación ocultada');
  } catch (error) {
    return handleSupabaseError(error, 'ocultarEvaluacion');
  }
};