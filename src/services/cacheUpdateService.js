import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { CacheManager, CACHE_KEYS, CACHE_EXPIRATION } from '../lib/cacheManager';

/**
 * Obtener profesores nuevos (últimos agregados) - sin caché para data fresca
 * Se usa para actualizar la lista de profesores populares
 */
export const obtenerProfesoresNuevos = async (limite = 20) => {
  try {
    const { data, error } = await supabase
      .from('ranking_profesores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw error;

    console.log('🆕 Profesores nuevos:', data?.length || 0);
    return handleSupabaseSuccess(data, 'Profesores nuevos obtenidos');
  } catch (error) {
    return handleSupabaseError(error, 'obtenerProfesoresNuevos');
  }
};

/**
 * Actualizar caché con profesores recientes (llamar periódicamente)
 */
export const actualizarCacheProfesores = async () => {
  try {
    // Obtener profesores populares frescos
    const { data, error } = await supabase
      .from('ranking_profesores')
      .select('*')
      .order('total_evaluaciones', { ascending: false })
      .order('calificacion_promedio', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Actualizar caché
    CacheManager.set(CACHE_KEYS.PROFESORES_POPULARES, data, CACHE_EXPIRATION.PROFESORES_POPULARES);
    
    console.log('🔄 Caché de profesores actualizado:', data?.length || 0);
    return handleSupabaseSuccess(data, 'Caché actualizado');
  } catch (error) {
    return handleSupabaseError(error, 'actualizarCacheProfesores');
  }
};
