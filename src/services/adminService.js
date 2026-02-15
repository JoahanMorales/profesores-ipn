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

    console.log('📢 Reporte creado:', data.id);
    return handleSupabaseSuccess(data, 'Reporte enviado correctamente');
  } catch (error) {
    return handleSupabaseError(error, 'crearReporte');
  }
};

/**
 * Obtener todos los reportes (solo admin)
 */
export const obtenerReportes = async (estado = null) => {
  try {
    let query = supabase
      .from('vista_reportes_admin')
      .select('*')
      .order('fecha_reporte', { ascending: false });

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log('📋 Reportes obtenidos:', data?.length || 0);
    return handleSupabaseSuccess(data, 'Reportes cargados');
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

    console.log(`👁️ Evaluación ${ocultar ? 'ocultada' : 'mostrada'}:`, evaluacionId);
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

    console.log('🗑️ Evaluación eliminada:', evaluacionId);
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

    console.log('✅ Reporte actualizado:', reporteId);
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
