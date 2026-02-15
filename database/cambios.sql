-- ============================================================
-- CAMBIOS DE SEGURIDAD + INTEGRACIÓN EXTENSIÓN ↔ SUPABASE
-- 
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Pega TODO este archivo y haz clic en "Run"
-- 
-- Fecha: 2026-02-15
-- 
-- ⚠️ EJECUTAR ANTES DE DEPLOYAR LA WEB O RECARGAR LA EXTENSIÓN
-- 
-- Qué hace:
--   1. Restringe permisos de tabla (quita GRANT ALL de anon)
--   2. Endurece RLS policies (quita USING(true) en UPDATE/DELETE)
--   3. Crea funciones RPC seguras (SECURITY DEFINER) para TODO
--      lo que modifica datos: monedas, evaluaciones, admin ops
--   4. Revoca funciones admin peligrosas del rol anon
-- ============================================================


-- ************************************************************
-- PARTE 1: RESTRINGIR GRANTS DE TABLA PARA anon
-- Actualmente: GRANT ALL → cualquiera puede UPDATE/DELETE
-- Después: solo SELECT + INSERT donde necesario
-- ************************************************************

-- ── escuelas: solo lectura ──
REVOKE ALL ON TABLE public.escuelas FROM anon;
GRANT SELECT ON TABLE public.escuelas TO anon;

-- ── carreras: solo lectura ──
REVOKE ALL ON TABLE public.carreras FROM anon;
GRANT SELECT ON TABLE public.carreras TO anon;

-- ── profesores: solo lectura (insert via RPC crear_evaluacion_segura) ──
REVOKE ALL ON TABLE public.profesores FROM anon;
GRANT SELECT ON TABLE public.profesores TO anon;

-- ── usuarios: lectura + insertar nuevos (registrarse) ──
-- UPDATE/DELETE solo via funciones SECURITY DEFINER
REVOKE ALL ON TABLE public.usuarios FROM anon;
GRANT SELECT, INSERT ON TABLE public.usuarios TO anon;

-- ── evaluaciones: solo lectura (insert via RPC crear_evaluacion_segura) ──
-- UPDATE (ocultar) y DELETE solo via RPC admin
REVOKE ALL ON TABLE public.evaluaciones FROM anon;
GRANT SELECT ON TABLE public.evaluaciones TO anon;

-- ── reportes: insertar (crear reporte) + lectura via vista admin ──
REVOKE ALL ON TABLE public.reportes FROM anon;
GRANT SELECT, INSERT ON TABLE public.reportes TO anon;

-- ── vistas: solo lectura ──
REVOKE ALL ON TABLE public.ranking_profesores FROM anon;
GRANT SELECT ON TABLE public.ranking_profesores TO anon;

REVOKE ALL ON TABLE public.actividad_reciente FROM anon;
GRANT SELECT ON TABLE public.actividad_reciente TO anon;

REVOKE ALL ON TABLE public.estadisticas_globales FROM anon;
GRANT SELECT ON TABLE public.estadisticas_globales TO anon;

REVOKE ALL ON TABLE public.vista_reportes_admin FROM anon;
GRANT SELECT ON TABLE public.vista_reportes_admin TO anon;


-- ************************************************************
-- PARTE 2: ENDURECER RLS POLICIES
-- Quitar UPDATE/DELETE con USING(true) — ahora solo via RPC
-- ************************************************************

-- ── usuarios: quitar UPDATE/DELETE abiertos ──
DROP POLICY IF EXISTS "Usuarios pueden actualizar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_actualizar_sesion" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_eliminar_inactivos" ON public.usuarios;

-- ── evaluaciones: quitar UPDATE abierto ──
DROP POLICY IF EXISTS "Admin puede ocultar evaluaciones" ON public.evaluaciones;

-- ── profesores: quitar UPDATE abierto ──
DROP POLICY IF EXISTS "Usuarios pueden actualizar profesores" ON public.profesores;

-- Las policies de SELECT e INSERT se conservan (ya existen):
--   "Todos pueden leer escuelas" → SELECT USING (true) ✓
--   "Todos pueden leer carreras" → SELECT USING (true) ✓
--   "Todos pueden leer profesores" → SELECT USING (true) ✓
--   "Todos pueden leer evaluaciones" → SELECT USING (true) ✓
--   "Todos pueden leer usuarios" → SELECT USING (true) ✓
--   "usuarios_leer_propio_device" → SELECT USING (true) ✓
--   "Cualquier usuario puede crear evaluaciones" → INSERT ✓
--   "Cualquier usuario puede registrar profesores" → INSERT ✓
--   "Usuarios ven sus reportes" → SELECT USING (true) ✓
--   "Cualquiera puede crear reportes" → INSERT ✓


-- ************************************************************
-- PARTE 3: FUNCIONES RPC SEGURAS
-- Todas usan SECURITY DEFINER = se ejecutan con permisos del
-- owner (postgres), no del caller (anon). Así el código interno
-- puede hacer UPDATE/DELETE aunque anon no tenga permiso directo.
-- ************************************************************

-- ============================================================
-- 3A. Obtener profesor por slug (para la extensión)
--     Reemplaza la llamada a Vercel /api/profesor/[slug]
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
-- 3B. Agregar monedas de forma segura
--     Usada por la web después de crear una evaluación
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
  IF p_cantidad <= 0 OR p_cantidad > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Cantidad inválida');
  END IF;

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

  RETURN json_build_object('success', true, 'monedas', v_monedas_nuevas);
END;
$$;


-- ============================================================
-- 3C. Incrementar evaluaciones de forma segura
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
-- 3D. Descontar monedas (para la extensión)
--     Valida credenciales ANTES de descontar
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
  IF p_cantidad <= 0 OR p_cantidad > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Cantidad inválida');
  END IF;

  SELECT id, username, cancion_favorita, monedas
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

  IF COALESCE(v_user.monedas, 0) < p_cantidad THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Monedas insuficientes',
      'monedas_actuales', COALESCE(v_user.monedas, 0)
    );
  END IF;

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
-- 3E. ADMIN: Ocultar/mostrar evaluación
--     Verifica que el caller sea el admin (username='Yojan')
--     antes de permitir la operación
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_toggle_ocultar_evaluacion(
  p_admin_username TEXT,
  p_admin_cancion TEXT,
  p_evaluacion_id UUID,
  p_ocultar BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  -- Verificar credenciales de admin
  SELECT id, username FROM usuarios
  WHERE username = p_admin_username
    AND cancion_favorita = p_admin_cancion
  INTO v_admin;

  IF NOT FOUND OR v_admin.username != 'Yojan' THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  UPDATE evaluaciones
  SET oculto = p_ocultar
  WHERE id = p_evaluacion_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Evaluación no encontrada');
  END IF;

  RETURN json_build_object('success', true, 'oculto', p_ocultar);
END;
$$;


-- ============================================================
-- 3F. ADMIN: Eliminar evaluación permanentemente
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_eliminar_evaluacion(
  p_admin_username TEXT,
  p_admin_cancion TEXT,
  p_evaluacion_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT id, username FROM usuarios
  WHERE username = p_admin_username
    AND cancion_favorita = p_admin_cancion
  INTO v_admin;

  IF NOT FOUND OR v_admin.username != 'Yojan' THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  DELETE FROM evaluaciones WHERE id = p_evaluacion_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Evaluación no encontrada');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;


-- ============================================================
-- 3G. ADMIN: Actualizar estado de reporte
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_actualizar_reporte(
  p_admin_username TEXT,
  p_admin_cancion TEXT,
  p_reporte_id UUID,
  p_estado TEXT,
  p_notas_admin TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT id, username FROM usuarios
  WHERE username = p_admin_username
    AND cancion_favorita = p_admin_cancion
  INTO v_admin;

  IF NOT FOUND OR v_admin.username != 'Yojan' THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  UPDATE reportes
  SET estado = p_estado,
      revisado_at = now(),
      notas_admin = COALESCE(p_notas_admin, notas_admin)
  WHERE id = p_reporte_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reporte no encontrado');
  END IF;

  RETURN json_build_object('success', true, 'estado', p_estado);
END;
$$;


-- ============================================================
-- 3H. Crear evaluación de forma segura (ATÓMICA)
--     Valida credenciales → crea profesor si no existe →
--     crea evaluación → incrementa contador → suma monedas
--     Todo en una sola transacción.
--     Así no se puede insertar evaluaciones sin credenciales.
-- ============================================================
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
  p_opinion TEXT DEFAULT ''
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

  -- ── 4. Crear evaluación ──
  INSERT INTO evaluaciones (
    profesor_id, escuela_id, carrera_id, usuario_id, usuario_nombre,
    materia, calificacion, recomendado, asistencia_obligatoria,
    calificacion_obtenida, opinion
  ) VALUES (
    v_profesor.id, p_escuela_id, p_carrera_id, v_user.id, v_user.username,
    p_materia, p_calificacion, p_recomendado, p_asistencia_obligatoria,
    p_calificacion_obtenida, p_opinion
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


-- ************************************************************
-- PARTE 4: PERMISOS DE EJECUCIÓN PARA LAS FUNCIONES
-- ************************************************************
GRANT EXECUTE ON FUNCTION public.obtener_profesor_por_slug(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agregar_monedas_seguro(UUID, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_evaluaciones_seguro(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.descontar_monedas(TEXT, TEXT, INT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_toggle_ocultar_evaluacion(TEXT, TEXT, UUID, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_eliminar_evaluacion(TEXT, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_actualizar_reporte(TEXT, TEXT, UUID, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crear_evaluacion_segura(TEXT, TEXT, TEXT, UUID, UUID, TEXT, INT, BOOLEAN, BOOLEAN, TEXT, TEXT) TO anon, authenticated, service_role;


-- ************************************************************
-- PARTE 5: REVOCAR FUNCIONES ADMIN PELIGROSAS ANTIGUAS
-- Estas funciones no tienen verificación de credenciales,
-- cualquiera con la anon key podía llamarlas.
-- ************************************************************
REVOKE EXECUTE ON FUNCTION public.eliminar_evaluacion_admin(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limpiar_profesores_huerfanos() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limpiar_usuarios_inactivos(INT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.detectar_anomalias_usuario(TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.buscar_usuario_por_device(TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_estadisticas() FROM anon, authenticated;

-- ── Funciones que modifican datos sin verificar quién llama ──
REVOKE EXECUTE ON FUNCTION public.ocultar_evaluacion(UUID, BOOLEAN) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_sesion(INT, TEXT, JSONB) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_sesion(TEXT, TEXT, TEXT, TEXT, JSONB) FROM anon, authenticated;


-- ************************************************************
-- PARTE 6: VISTAS DE ADMIN — solo lectura para service_role
-- stats_navegadores y stats_tracking exponen datos de tracking
-- de usuarios (device_id, fingerprint, browser_info).
-- No deben ser accesibles con la anon key.
-- ************************************************************
REVOKE ALL ON TABLE public.stats_navegadores FROM anon, authenticated;
REVOKE ALL ON TABLE public.stats_tracking FROM anon, authenticated;


-- ************************************************************
-- PARTE 7: QUITAR INSERT POLICIES REDUNDANTES
-- Si INSERT va por RPC (SECURITY DEFINER), las INSERT policies
-- de RLS en evaluaciones y profesores ya no se necesitan para
-- anon directo. Pero las dejamos porque las funciones
-- SECURITY DEFINER ejecutan como postgres (bypasan RLS).
-- Solo nos aseguramos de que GRANT no dé INSERT.
-- (Ya hecho en Parte 1 arriba)
-- ************************************************************

-- ── Quitar policy "Admin puede actualizar reportes" (ya no necesaria, usamos RPC) ──
DROP POLICY IF EXISTS "Admin puede actualizar reportes" ON public.reportes;


-- ************************************************************
-- PARTE 8: DEFAULT PRIVILEGES — CRÍTICO
-- Supabase por defecto otorga ALL a anon en tablas/funciones
-- futuras. Esto significa que si creas una tabla o función
-- nueva, anon automáticamente tiene acceso total.
-- Quitamos eso para que siempre tengas que dar permisos
-- explícitamente.
-- ************************************************************
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon;

-- Mantener SELECT por defecto para que nuevas vistas sean legibles
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;


-- ************************************************************
-- PARTE 9: CHECK CONSTRAINTS + RATE LIMITING SERVER-SIDE
-- Previene valores fuera de rango y abuso por spam
-- ************************************************************

-- ── Constraint para validar calificaciones entre 1 y 10 ──
DO $$ BEGIN
  ALTER TABLE public.evaluaciones
    ADD CONSTRAINT chk_calificacion CHECK (calificacion BETWEEN 1 AND 10);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Rate limiting en la función crear_evaluacion_segura ──
-- Reemplazar la función para incluir verificación de tiempo
-- entre evaluaciones (máximo 1 por minuto por usuario)
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
  p_opinion TEXT DEFAULT ''
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

  -- ── 4. Crear evaluación ──
  INSERT INTO evaluaciones (
    profesor_id, escuela_id, carrera_id, usuario_id, usuario_nombre,
    materia, calificacion, recomendado, asistencia_obligatoria,
    calificacion_obtenida, opinion
  ) VALUES (
    v_profesor.id, p_escuela_id, p_carrera_id, v_user.id, v_user.username,
    p_materia, p_calificacion, p_recomendado, p_asistencia_obligatoria,
    p_calificacion_obtenida, p_opinion
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


-- ************************************************************
-- PARTE 10: RATE LIMITING SERVER-SIDE PARA obtener_profesor_por_slug
-- Solo la extensión usa este RPC. Limitamos a 60 llamadas/minuto
-- por IP para evitar abuso/scraping.
-- ************************************************************

-- ── Tabla para trackear llamadas RPC ──
CREATE TABLE IF NOT EXISTS public.rpc_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  client_ip TEXT NOT NULL,
  function_name TEXT NOT NULL,
  called_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rpc_rate_ip_fn
  ON public.rpc_rate_limits(client_ip, function_name, called_at);

-- RLS habilitado pero sin policies = nadie accede directo
ALTER TABLE public.rpc_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rpc_rate_limits FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.rpc_rate_limits_id_seq FROM anon, authenticated;

-- ── Función de limpieza automática (elimina registros > 5 min) ──
CREATE OR REPLACE FUNCTION public.limpiar_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rpc_rate_limits
  WHERE called_at < now() - INTERVAL '5 minutes';
END;
$$;

-- Solo service_role puede ejecutar limpieza
REVOKE EXECUTE ON FUNCTION public.limpiar_rate_limits() FROM anon, authenticated;

-- ── Reemplazar obtener_profesor_por_slug con rate limiting ──
CREATE OR REPLACE FUNCTION public.obtener_profesor_por_slug(p_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profesor RECORD;
  v_client_ip TEXT;
  v_call_count INT;
BEGIN
  IF p_slug IS NULL OR p_slug = '' THEN
    RETURN json_build_object('ok', false, 'error', 'Slug requerido');
  END IF;

  -- ── Rate limiting: 60 llamadas/minuto por IP ──
  v_client_ip := coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    'unknown'
  );
  -- Tomar solo la primera IP si hay múltiples (proxy chain)
  v_client_ip := split_part(v_client_ip, ',', 1);

  SELECT count(*) INTO v_call_count
  FROM rpc_rate_limits
  WHERE client_ip = v_client_ip
    AND function_name = 'obtener_profesor_por_slug'
    AND called_at > now() - INTERVAL '1 minute';

  IF v_call_count >= 60 THEN
    RETURN json_build_object('ok', false, 'error', 'Demasiadas solicitudes. Intenta en 1 minuto.');
  END IF;

  -- Registrar esta llamada
  INSERT INTO rpc_rate_limits (client_ip, function_name)
  VALUES (v_client_ip, 'obtener_profesor_por_slug');

  -- Limpieza oportunista (~1% de las llamadas)
  IF random() < 0.01 THEN
    PERFORM limpiar_rate_limits();
  END IF;

  -- ── Consulta normal ──
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
