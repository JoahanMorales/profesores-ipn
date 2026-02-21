import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';

/**
 * Obtener credenciales admin del localStorage
 * Necesarias para las funciones RPC que verifican admin server-side
 */
function getAdminCredentials() {
  try {
    const raw = localStorage.getItem('ipn_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user.username !== 'Yojan') return null;
    return {
      username: user.username,
      cancion: user.favoriteSong?.trim().toLowerCase() || ''
    };
  } catch {
    return null;
  }
}

/**
 * Crear un reporte de evaluación
 */
export const crearReporte = async (evaluacionId, tipoReporte, descripcion, fingerprint) => {
  try {
    const { data: usuario } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('reportes')
      .insert({
        evaluacion_id: evaluacionId,
        usuario_id: usuario?.user?.id || null,
        tipo_reporte: tipoReporte,
        descripcion: descripcion,
        fingerprint: fingerprint,
        estado: 'pendiente'
      })
      .select()
      .single();

    if (error) throw error;

    return handleSupabaseSuccess(data, 'Reporte enviado correctamente');
  } catch (error) {
    return handleSupabaseError(error, 'crearReporte');
  }
};

/**
 * Obtener todos los reportes (solo admin, via RPC con verificación)
 */
export const obtenerReportes = async (estado = null) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_obtener_reportes', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_estado: estado
    });

    if (error) throw error;

    return handleSupabaseSuccess(data || [], 'Reportes cargados');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerReportes');
  }
};

/**
 * Ocultar/mostrar evaluación (via RPC con verificación admin server-side)
 */
export const toggleOcultarEvaluacion = async (evaluacionId, ocultar = true) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_toggle_ocultar_evaluacion', {
      p_admin_username: creds.username,
      p_admin_cancion: creds.cancion,
      p_evaluacion_id: evaluacionId,
      p_ocultar: ocultar
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error desconocido');

    return handleSupabaseSuccess(
      { oculto: ocultar }, 
      `Evaluación ${ocultar ? 'ocultada' : 'mostrada'} correctamente`
    );
  } catch (error) {
    return handleSupabaseError(error, 'toggleOcultarEvaluacion');
  }
};

/**
 * Eliminar evaluación permanentemente (via RPC con verificación admin server-side)
 */
export const eliminarEvaluacion = async (evaluacionId) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_eliminar_evaluacion', {
      p_admin_username: creds.username,
      p_admin_cancion: creds.cancion,
      p_evaluacion_id: evaluacionId
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error desconocido');

    return handleSupabaseSuccess(null, 'Evaluación eliminada permanentemente');
  } catch (error) {
    return handleSupabaseError(error, 'eliminarEvaluacion');
  }
};

/**
 * Actualizar estado del reporte (via RPC con verificación admin server-side)
 */
export const actualizarReporte = async (reporteId, estado, notasAdmin = null) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_actualizar_reporte', {
      p_admin_username: creds.username,
      p_admin_cancion: creds.cancion,
      p_reporte_id: reporteId,
      p_estado: estado,
      p_notas_admin: notasAdmin
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Error desconocido');

    return handleSupabaseSuccess(null, 'Reporte actualizado');
  } catch (error) {
    return handleSupabaseError(error, 'actualizarReporte');
  }
};

/**
 * Buscar profesores duplicados (con manejo graceful de errores)
 */
export const buscarDuplicados = async (nombreProfesor) => {
  try {
    // Sanitizar el nombre para evitar errores con caracteres especiales
    const nombreSanitizado = nombreProfesor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos para búsqueda
      .replace(/[^a-zA-Z0-9\s]/g, '') // Solo alfanuméricos
      .trim();
    
    if (nombreSanitizado.length < 2) {
      return handleSupabaseSuccess([], 'Búsqueda muy corta');
    }

    // Búsqueda directa sin RPC - buscar por nombre similar
    const { data, error } = await supabase
      .from('profesores')
      .select('id, nombre_completo, total_evaluaciones, calificacion_promedio')
      .ilike('nombre_completo', `%${nombreSanitizado}%`)
      .limit(10);

    if (error) {
      // Fallar silenciosamente - no es crítico
      console.warn('⚠️ Error buscando duplicados (no crítico):', error.message);
      return handleSupabaseSuccess([], 'Búsqueda no disponible');
    }

    // Agregar campo de similitud aproximada
    const resultadosConSimilitud = (data || []).map(profesor => ({
      ...profesor,
      similitud: nombreProfesor.toLowerCase().includes(profesor.nombre_completo?.toLowerCase()?.substring(0, 5)) ? 0.8 : 0.5
    }));

    return handleSupabaseSuccess(resultadosConSimilitud, 'Búsqueda completada');
  } catch (error) {
    // Nunca fallar - solo retornar vacío
    console.warn('⚠️ buscarDuplicados error (ignorado):', error);
    return handleSupabaseSuccess([], 'Búsqueda no disponible');
  }
};

/**
 * Verificar si usuario es admin
 */
export const verificarAdmin = async (adminEmail) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, esAdmin: false };
    }

    // Verificar si el email coincide
    const esAdmin = user.email === adminEmail;

    return { success: true, esAdmin, email: user.email };
  } catch (error) {
    return { success: false, esAdmin: false };
  }
};

// ============================================
// EVENTOS ADMIN CRUD
// ============================================

/**
 * Obtener todos los eventos (incluyendo no publicados) — solo admin via RPC
 */
export const obtenerEventosAdmin = async () => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_obtener_eventos_todos', {
      p_username: creds.username,
      p_cancion: creds.cancion
    });

    if (error) throw error;

    return handleSupabaseSuccess(data || [], 'Eventos cargados');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerEventosAdmin');
  }
};

/**
 * Crear evento (via RPC con verificación admin)
 */
export const crearEvento = async (evento) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_crear_evento', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_slug: evento.slug,
      p_titulo: evento.titulo,
      p_descripcion: evento.descripcion,
      p_contenido: evento.contenido || null,
      p_fecha_inicio: evento.fecha_inicio,
      p_fecha_fin: evento.fecha_fin || null,
      p_hora: evento.hora || null,
      p_lugar: evento.lugar || '',
      p_categoria: evento.categoria || 'General',
      p_link_externo: evento.link_externo || null,
      p_destacado: evento.destacado || false,
      p_publicado: evento.publicado !== false,
      p_nombre_contribuidor: evento.nombre_contribuidor || null,
      p_instagram_contribuidor: evento.instagram_contribuidor || null,
      p_escuela_contribuidor: evento.escuela_contribuidor || null,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return handleSupabaseSuccess(data, 'Evento creado correctamente');
  } catch (error) {
    return handleSupabaseError(error, 'crearEvento');
  }
};

/**
 * Actualizar evento (via RPC con verificación admin)
 */
export const actualizarEvento = async (id, campos) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_actualizar_evento', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_id: id,
      p_slug: campos.slug || null,
      p_titulo: campos.titulo || null,
      p_descripcion: campos.descripcion || null,
      p_contenido: campos.contenido || null,
      p_fecha_inicio: campos.fecha_inicio || null,
      p_fecha_fin: campos.fecha_fin || null,
      p_hora: campos.hora || null,
      p_lugar: campos.lugar || null,
      p_categoria: campos.categoria || null,
      p_link_externo: campos.link_externo || null,
      p_destacado: campos.destacado ?? null,
      p_publicado: campos.publicado ?? null,
      p_nombre_contribuidor: campos.nombre_contribuidor || null,
      p_instagram_contribuidor: campos.instagram_contribuidor || null,
      p_escuela_contribuidor: campos.escuela_contribuidor || null,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return handleSupabaseSuccess(data, 'Evento actualizado');
  } catch (error) {
    return handleSupabaseError(error, 'actualizarEvento');
  }
};

/**
 * Eliminar evento (via RPC con verificación admin)
 */
export const eliminarEvento = async (id) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_eliminar_evento', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_id: id,
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.error);

    return handleSupabaseSuccess(null, 'Evento eliminado');
  } catch (error) {
    return handleSupabaseError(error, 'eliminarEvento');
  }
};

// ============================================
// BLOG ADMIN CRUD
// ============================================

/**
 * Obtener todos los artículos (incluyendo borradores) — solo admin via RPC
 */
export const obtenerArticulosAdmin = async () => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_obtener_blog_todos', {
      p_username: creds.username,
      p_cancion: creds.cancion
    });

    if (error) throw error;

    return handleSupabaseSuccess(data || [], 'Artículos cargados');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerArticulosAdmin');
  }
};

/**
 * Crear artículo de blog (via RPC con verificación admin)
 */
export const crearArticulo = async (articulo) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_crear_blog', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_slug: articulo.slug,
      p_titulo: articulo.titulo,
      p_resumen: articulo.resumen,
      p_contenido: articulo.contenido,
      p_categoria: articulo.categoria || 'General',
      p_autor: articulo.nombre_contribuidor || 'IPNProfes',
      p_tiempo_lectura: articulo.tiempo_lectura || '5 min',
      p_publicado: articulo.publicado || false,
      p_nombre_contribuidor: articulo.nombre_contribuidor || null,
      p_instagram_contribuidor: articulo.instagram_contribuidor || null,
      p_escuela_contribuidor: articulo.escuela_contribuidor || null,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return handleSupabaseSuccess(data, 'Artículo creado correctamente');
  } catch (error) {
    return handleSupabaseError(error, 'crearArticulo');
  }
};

/**
 * Actualizar artículo de blog (via RPC con verificación admin)
 */
export const actualizarArticulo = async (id, campos) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_actualizar_blog', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_id: id,
      p_slug: campos.slug || null,
      p_titulo: campos.titulo || null,
      p_resumen: campos.resumen || null,
      p_contenido: campos.contenido || null,
      p_categoria: campos.categoria || null,
      p_autor: campos.nombre_contribuidor || 'IPNProfes',
      p_tiempo_lectura: campos.tiempo_lectura || null,
      p_publicado: campos.publicado ?? null,
      p_nombre_contribuidor: campos.nombre_contribuidor || null,
      p_instagram_contribuidor: campos.instagram_contribuidor || null,
      p_escuela_contribuidor: campos.escuela_contribuidor || null,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return handleSupabaseSuccess(data, 'Artículo actualizado');
  } catch (error) {
    return handleSupabaseError(error, 'actualizarArticulo');
  }
};

/**
 * Eliminar artículo de blog (via RPC con verificación admin)
 */
export const eliminarArticulo = async (id) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_eliminar_blog', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_id: id,
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.error);

    return handleSupabaseSuccess(null, 'Artículo eliminado');
  } catch (error) {
    return handleSupabaseError(error, 'eliminarArticulo');
  }
};

/**
 * Admin: ocultar cualquier evaluación (soft delete)
 */
export const adminOcultarEvaluacion = async (evaluacionId) => {
  try {
    const creds = getAdminCredentials();
    if (!creds) throw new Error('No autorizado');

    const { data, error } = await supabase.rpc('admin_ocultar_evaluacion', {
      p_username: creds.username,
      p_cancion: creds.cancion,
      p_evaluacion_id: evaluacionId,
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.error);

    // Invalidar cachés
    const { CacheManager, CACHE_KEYS } = await import('../lib/cacheManager');
    CacheManager.remove(CACHE_KEYS.TODOS_PROFESORES);
    CacheManager.remove(CACHE_KEYS.PROFESORES_POPULARES);
    CacheManager.remove(CACHE_KEYS.STATS_GLOBALES);
    CacheManager.invalidateUserEvaluaciones();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEYS.SEARCH_RESULTS) || key.startsWith(CACHE_KEYS.PROFESOR_PROFILE)) {
        localStorage.removeItem(key);
      }
    });

    return handleSupabaseSuccess(data, 'Evaluación ocultada por admin');
  } catch (error) {
    return handleSupabaseError(error, 'adminOcultarEvaluacion');
  }
};
