-- ============================================================
-- CAMBIOS PARA INTEGRACIÓN EXTENSIÓN ↔ SUPABASE DIRECTO
-- 
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Pega TODO este archivo y haz clic en "Run"
-- 
-- Fecha: 2026-02-15
-- 
-- Qué hace:
--   1. Crea función RPC para que la extensión lea profesores
--      directamente desde Supabase (reemplaza Vercel)
--   2. Crea funciones seguras (SECURITY DEFINER) para manejar
--      monedas y evaluaciones — impide manipulación desde cliente
--   3. Crea función para descontar monedas desde la extensión
--      (valida credenciales antes de descontar)
--   4. Revoca funciones admin peligrosas del rol anon
-- ============================================================


-- ============================================================
-- 1. FUNCIÓN: Obtener profesor por slug (para la extensión)
--    Reemplaza la llamada a Vercel /api/profesor/[slug]
--    Devuelve el mismo formato JSON que devolvía la API de Vercel
-- ============================================================
CREATE OR REPLACE FUNCTION public.obtener_profesor_por_slug(p_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profesor RECORD;
BEGIN
  IF p_slug IS NULL OR p_slug = '' THEN
    RETURN json_build_object('ok', false, 'error', 'Slug requerido');
  END IF;

  SELECT 
    rp.nombre_completo,
    rp.slug,
    rp.calificacion_promedio,
    rp.total_evaluaciones
  INTO v_profesor
  FROM ranking_profesores rp
  WHERE rp.slug = p_slug;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Profesor no encontrado');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'timestamp', now()::text,
    'profesor', json_build_object(
      'nombre', v_profesor.nombre_completo,
      'slug', v_profesor.slug,
      'calificacion', CASE 
        WHEN v_profesor.calificacion_promedio IS NOT NULL 
        THEN round(v_profesor.calificacion_promedio, 1)::text
        ELSE 'Sin evaluar'
      END,
      'total_evaluaciones', COALESCE(v_profesor.total_evaluaciones, 0)
    )
  );
END;
$$;


-- ============================================================
-- 2. FUNCIÓN: Agregar monedas de forma segura
--    Usada por la web después de crear una evaluación
--    SECURITY DEFINER = se ejecuta con privilegios del owner,
--    así el cliente no puede manipular monedas directamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.agregar_monedas_seguro(
  p_usuario_id UUID,
  p_cantidad INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monedas_actuales INT;
  v_monedas_nuevas INT;
BEGIN
  -- Solo cantidades razonables de recompensa (1-50)
  IF p_cantidad <= 0 OR p_cantidad > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Cantidad inválida');
  END IF;

  -- Obtener monedas actuales con lock para evitar race conditions
  SELECT monedas INTO v_monedas_actuales
  FROM usuarios
  WHERE id = p_usuario_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  v_monedas_nuevas := COALESCE(v_monedas_actuales, 0) + p_cantidad;

  UPDATE usuarios
  SET monedas = v_monedas_nuevas
  WHERE id = p_usuario_id;

  RETURN json_build_object(
    'success', true,
    'monedas', v_monedas_nuevas
  );
END;
$$;


-- ============================================================
-- 3. FUNCIÓN: Incrementar evaluaciones de forma segura
--    Usada por la web después de crear una evaluación
-- ============================================================
CREATE OR REPLACE FUNCTION public.incrementar_evaluaciones_seguro(
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INT;
BEGIN
  UPDATE usuarios
  SET total_evaluaciones = COALESCE(total_evaluaciones, 0) + 1
  WHERE id = p_usuario_id
  RETURNING total_evaluaciones INTO v_total;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  RETURN json_build_object('success', true, 'total_evaluaciones', v_total);
END;
$$;


-- ============================================================
-- 4. FUNCIÓN: Descontar monedas (para la extensión)
--    Valida credenciales (username + canción) ANTES de descontar.
--    Así un atacante no puede descontar monedas de otro usuario.
-- ============================================================
CREATE OR REPLACE FUNCTION public.descontar_monedas(
  p_username TEXT,
  p_cancion_favorita TEXT,
  p_cantidad INT,
  p_concepto TEXT DEFAULT 'generacion_horario'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_monedas_nuevas INT;
BEGIN
  -- Validar cantidad
  IF p_cantidad <= 0 OR p_cantidad > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Cantidad inválida');
  END IF;

  -- Buscar usuario y verificar credenciales con lock
  SELECT id, username, cancion_favorita, monedas
  INTO v_user
  FROM usuarios
  WHERE username = p_username
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  -- Verificar contraseña (canción favorita)
  IF v_user.cancion_favorita != p_cancion_favorita THEN
    RETURN json_build_object('success', false, 'error', 'Credenciales inválidas');
  END IF;

  -- Verificar saldo suficiente
  IF COALESCE(v_user.monedas, 0) < p_cantidad THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Monedas insuficientes',
      'monedas_actuales', COALESCE(v_user.monedas, 0)
    );
  END IF;

  -- Descontar
  v_monedas_nuevas := v_user.monedas - p_cantidad;

  UPDATE usuarios
  SET monedas = v_monedas_nuevas
  WHERE id = v_user.id;

  RETURN json_build_object(
    'success', true,
    'monedas_anteriores', v_user.monedas,
    'monedas_descontadas', p_cantidad,
    'monedas_restantes', v_monedas_nuevas,
    'concepto', p_concepto
  );
END;
$$;


-- ============================================================
-- 5. PERMISOS: Otorgar ejecución de las nuevas funciones a anon
--    (anon es el rol que usa la anon key del cliente)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.obtener_profesor_por_slug(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.obtener_profesor_por_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_profesor_por_slug(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.agregar_monedas_seguro(UUID, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.agregar_monedas_seguro(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agregar_monedas_seguro(UUID, INT) TO service_role;

GRANT EXECUTE ON FUNCTION public.incrementar_evaluaciones_seguro(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.incrementar_evaluaciones_seguro(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.incrementar_evaluaciones_seguro(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION public.descontar_monedas(TEXT, TEXT, INT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.descontar_monedas(TEXT, TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.descontar_monedas(TEXT, TEXT, INT, TEXT) TO service_role;


-- ============================================================
-- 6. SEGURIDAD: Revocar funciones de admin peligrosas de anon
--    Estas funciones solo deben ejecutarse desde el dashboard
--    de Supabase o con la service_role key (servidor)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.eliminar_evaluacion_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.eliminar_evaluacion_admin(UUID) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.limpiar_profesores_huerfanos() FROM anon;
REVOKE EXECUTE ON FUNCTION public.limpiar_profesores_huerfanos() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.limpiar_usuarios_inactivos(INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.limpiar_usuarios_inactivos(INT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.detectar_anomalias_usuario(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.detectar_anomalias_usuario(TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.buscar_usuario_por_device(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.buscar_usuario_por_device(TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_estadisticas() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_estadisticas() FROM authenticated;
