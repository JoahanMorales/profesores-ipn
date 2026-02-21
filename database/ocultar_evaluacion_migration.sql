-- ============================================
-- MIGRACIÓN: Ocultar evaluación propia (soft delete)
-- ============================================
-- Fecha: 2026-02-20
-- Descripción:
--   1. Crear RPC `ocultar_evaluacion_propia` para que un usuario pueda
--      ocultar su propia evaluación (soft delete via columna `oculto`).
--   2. Actualizar vista `ranking_profesores` para excluir evaluaciones ocultas
--      del promedio y conteos.
--
-- NOTA: La columna `oculto BOOLEAN DEFAULT false` ya existe en `evaluaciones`.
-- ============================================

-- ─────────────────────────────────────────────
-- 1. RPC: ocultar_evaluacion_propia
-- ─────────────────────────────────────────────
-- Solo permite ocultar si la evaluación pertenece al usuario.
-- Ejecuta como SECURITY DEFINER (bypasa RLS, como las demás RPCs).

CREATE OR REPLACE FUNCTION public.ocultar_evaluacion_propia(
  p_evaluacion_id UUID,
  p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eval RECORD;
BEGIN
  -- Validar parámetros
  IF p_evaluacion_id IS NULL OR p_usuario_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parámetros inválidos');
  END IF;

  -- Buscar la evaluación
  SELECT id, usuario_id, oculto, profesor_id
  INTO v_eval
  FROM evaluaciones
  WHERE id = p_evaluacion_id;

  -- ¿Existe?
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Evaluación no encontrada');
  END IF;

  -- ¿Es del usuario?
  IF v_eval.usuario_id != p_usuario_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permiso para ocultar esta evaluación');
  END IF;

  -- ¿Ya está oculta?
  IF v_eval.oculto = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'La evaluación ya está oculta');
  END IF;

  -- Ocultar
  UPDATE evaluaciones
  SET oculto = true
  WHERE id = p_evaluacion_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Permisos: permitir a anon llamar esta función
GRANT EXECUTE ON FUNCTION public.ocultar_evaluacion_propia(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.ocultar_evaluacion_propia(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────
-- 2. Actualizar vista ranking_profesores
-- ─────────────────────────────────────────────
-- Excluir evaluaciones ocultas del cálculo de promedios y conteos.

CREATE OR REPLACE VIEW public.ranking_profesores AS
SELECT
  p.id,
  p.nombre_completo,
  p.slug,
  COUNT(e.id) AS total_evaluaciones,
  COUNT(DISTINCT e.usuario_id) AS total_evaluadores,
  ROUND(AVG(e.calificacion), 1) AS calificacion_promedio,
  ROUND(
    (COUNT(CASE WHEN e.recomendado THEN 1 ELSE NULL END)::numeric
     / NULLIF(COUNT(e.id), 0)::numeric) * 100, 0
  ) AS porcentaje_recomendacion,
  p.created_at
FROM profesores p
LEFT JOIN evaluaciones e
  ON p.id = e.profesor_id
  AND (e.oculto = false OR e.oculto IS NULL)
GROUP BY p.id, p.nombre_completo, p.slug, p.created_at;
