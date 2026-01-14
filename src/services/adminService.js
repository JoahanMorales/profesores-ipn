import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';

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
 * Ocultar/mostrar evaluación
 */
export const toggleOcultarEvaluacion = async (evaluacionId, ocultar = true) => {
  try {
    const { error } = await supabase
      .from('evaluaciones')
      .update({ oculto: ocultar })
      .eq('id', evaluacionId);

    if (error) throw error;

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
 * Eliminar evaluación permanentemente
 */
export const eliminarEvaluacion = async (evaluacionId) => {
  try {
    // Eliminar directamente en lugar de usar RPC
    const { error } = await supabase
      .from('evaluaciones')
      .delete()
      .eq('id', evaluacionId);

    if (error) throw error;

    console.log('🗑️ Evaluación eliminada:', evaluacionId);
    return handleSupabaseSuccess(null, 'Evaluación eliminada permanentemente');
  } catch (error) {
    return handleSupabaseError(error, 'eliminarEvaluacion');
  }
};

/**
 * Actualizar estado del reporte
 */
export const actualizarReporte = async (reporteId, estado, notasAdmin = null) => {
  try {
    const updateData = {
      estado: estado,
      revisado_at: new Date().toISOString()
    };

    if (notasAdmin) {
      updateData.notas_admin = notasAdmin;
    }

    const { error } = await supabase
      .from('reportes')
      .update(updateData)
      .eq('id', reporteId);

    if (error) throw error;

    console.log('✅ Reporte actualizado:', reporteId);
    return handleSupabaseSuccess(null, 'Reporte actualizado');
  } catch (error) {
    return handleSupabaseError(error, 'actualizarReporte');
  }
};

/**
 * Buscar profesores duplicados
 */
export const buscarDuplicados = async (nombreProfesor) => {
  try {
    // Búsqueda directa sin RPC - buscar por nombre similar
    const { data, error } = await supabase
      .from('profesores')
      .select('id, nombre_completo, escuela_id, total_evaluaciones')
      .ilike('nombre_completo', `%${nombreProfesor}%`)
      .limit(20);

    if (error) throw error;

    console.log('🔍 Posibles duplicados encontrados:', data?.length || 0);
    return handleSupabaseSuccess(data || [], 'Búsqueda completada');
  } catch (error) {
    return handleSupabaseError(error, 'buscarDuplicados');
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
