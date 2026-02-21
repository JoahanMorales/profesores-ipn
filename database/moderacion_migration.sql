-- ============================================
-- MIGRACIÓN: Moderación de contenido con OpenAI
-- ============================================
-- Fecha: 2026-02-20
-- Descripción:
--   1. Agregar columna `moderacion_score` a `evaluaciones`
--      para guardar el score máximo de moderación (0 a 1).
--   2. Actualizar RPC `crear_evaluacion_segura` para aceptar
--      el score de moderación y guardarlo.
-- ============================================

-- ─────────────────────────────────────────────
-- 1. Agregar columna moderacion_score
-- ─────────────────────────────────────────────
ALTER TABLE public.evaluaciones
ADD COLUMN IF NOT EXISTS moderacion_score REAL DEFAULT NULL;

COMMENT ON COLUMN public.evaluaciones.moderacion_score IS
  'Score de moderación OpenAI (0-1). NULL = no evaluado. >0.5 = flagged.';

-- ─────────────────────────────────────────────
-- 2. Eliminar versión anterior del RPC (12 params, sin moderacion_score)
--    para evitar ambigüedad de overload en PostgreSQL
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.crear_evaluacion_segura(TEXT, TEXT, TEXT, UUID, UUID, TEXT, INT, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT);

-- ─────────────────────────────────────────────
-- 3. Crear RPC con el nuevo parámetro p_moderacion_score
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.crear_evaluacion_segura(
  p_username TEXT,
  p_cancion_favorita TEXT,
  p_nombre_profesor TEXT,
  p_escuela_id UUID,
  p_carrera_id UUID,
  p_materia TEXT,
  p_calificacion INT,
  p_recomendado BOOLEAN DEFAULT true,
  p_asistencia_obligatoria BOOLEAN DEFAULT false,
  p_calificacion_obtenida TEXT DEFAULT NULL,
  p_opinion TEXT DEFAULT '',
  p_captcha_token TEXT DEFAULT NULL,
  p_moderacion_score REAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_profesor RECORD;
  v_evaluacion RECORD;
  v_slug TEXT;
  v_monedas_nuevas INT;
  v_total_evals INT;
  v_last_eval TIMESTAMPTZ;
BEGIN
  -- ── 1. Validar credenciales ──
  SELECT id, username, cancion_favorita, monedas, total_evaluaciones
  INTO v_user
  FROM usuarios
  WHERE username = p_username
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  IF v_user.cancion_favorita != p_cancion_favorita THEN
    RETURN json_build_object('success', false, 'error', 'Credenciales inválidas');
  END IF;

  -- ── 1b. Rate limiting server-side: 1 evaluación por 30 segundos ──
  SELECT MAX(created_at) INTO v_last_eval
  FROM evaluaciones
  WHERE usuario_id = v_user.id;

  IF v_last_eval IS NOT NULL AND (now() - v_last_eval) < INTERVAL '30 seconds' THEN
    RETURN json_build_object('success', false, 'error', 'Espera al menos 30 segundos entre evaluaciones');
  END IF;

  -- ── 2. Validar datos de la evaluación ──
  IF p_calificacion < 1 OR p_calificacion > 10 THEN
    RETURN json_build_object('success', false, 'error', 'Calificación debe ser entre 1 y 10');
  END IF;

  IF char_length(p_opinion) < 20 THEN
    RETURN json_build_object('success', false, 'error', 'La opinión debe tener al menos 20 caracteres');
  END IF;

  IF char_length(p_materia) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Materia inválida');
  END IF;

  IF char_length(p_nombre_profesor) < 5 THEN
    RETURN json_build_object('success', false, 'error', 'Nombre de profesor inválido');
  END IF;

  -- ── 3. Crear o obtener profesor ──
  SELECT id, nombre_completo, slug
  INTO v_profesor
  FROM profesores
  WHERE nombre_completo = p_nombre_profesor;

  IF NOT FOUND THEN
    v_slug := lower(
      regexp_replace(
        regexp_replace(
          translate(p_nombre_profesor,
            'ÁÉÍÓÚáéíóúÑñÜü',
            'AEIOUaeiouNnUu'),
          '[^a-zA-Z0-9]+', '-', 'g'),
        '(^-|-$)', '', 'g')
    );

    INSERT INTO profesores (nombre_completo, slug)
    VALUES (p_nombre_profesor, v_slug)
    RETURNING id, nombre_completo, slug INTO v_profesor;
  END IF;

  -- ── 4. Crear evaluación (con score de moderación) ──
  INSERT INTO evaluaciones (
    profesor_id, escuela_id, carrera_id, usuario_id, usuario_nombre,
    materia, calificacion, recomendado, asistencia_obligatoria,
    calificacion_obtenida, opinion, moderacion_score
  ) VALUES (
    v_profesor.id, p_escuela_id, p_carrera_id, v_user.id, v_user.username,
    p_materia, p_calificacion, p_recomendado, p_asistencia_obligatoria,
    p_calificacion_obtenida, p_opinion, p_moderacion_score
  )
  RETURNING * INTO v_evaluacion;

  -- ── 5. Incrementar evaluaciones + sumar 5 monedas ──
  v_total_evals := COALESCE(v_user.total_evaluaciones, 0) + 1;
  v_monedas_nuevas := COALESCE(v_user.monedas, 0) + 5;

  UPDATE usuarios
  SET total_evaluaciones = v_total_evals,
      monedas = v_monedas_nuevas
  WHERE id = v_user.id;

  RETURN json_build_object(
    'success', true,
    'evaluacion_id', v_evaluacion.id,
    'profesor', json_build_object(
      'id', v_profesor.id,
      'nombre', v_profesor.nombre_completo,
      'slug', v_profesor.slug
    ),
    'monedas', v_monedas_nuevas,
    'total_evaluaciones', v_total_evals
  );
END;
$$;

-- Reasignar permisos (re-grant porque cambiamos la firma con el nuevo parámetro)
GRANT EXECUTE ON FUNCTION public.crear_evaluacion_segura(TEXT, TEXT, TEXT, UUID, UUID, TEXT, INT, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT, REAL) TO anon, authenticated, service_role;
