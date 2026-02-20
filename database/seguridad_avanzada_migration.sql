-- ============================================================
-- SEGURIDAD AVANZADA — Rate limiting + CAPTCHA + Origen
-- 
-- EJECUTAR EN: Supabase Dashboard → SQL Editor → New Query
-- Pega TODO este archivo y haz clic en "Run"
--
-- EJECUTAR ANTES de desplegar el nuevo código frontend.
-- Requiere haber ejecutado seguridad_migration.sql ANTES.
--
-- Fecha: 2026-02-19
--
-- Qué hace:
--   1. Habilita extensión http (para verificar CAPTCHA server-side)
--   2. Función de validación de origen (bloquea Postman/curl)
--   3. Función de verificación CAPTCHA (Cloudflare Turnstile)
--   4. Rate limiting por IP para verificar_usuario (5/min)
--   5. Rate limiting por IP para crear_evaluacion_segura (10/hora)
--   6. Actualiza ambas funciones con captcha + origin + rate limit
--
-- DESPUÉS de ejecutar este SQL:
--   1. Ve a Cloudflare → Turnstile → Crear widget
--   2. Dominio: ipnprofes.com
--   3. Copia el SECRET KEY y ejecuta:
--      ALTER DATABASE postgres SET app.turnstile_secret = 'tu-secret-key';
--   4. El SITE KEY va en tu .env de Vercel:
--      VITE_TURNSTILE_SITE_KEY=tu-site-key
-- ============================================================


-- ************************************************************
-- PARTE 1: EXTENSIÓN HTTP PARA VERIFICAR CAPTCHA
-- ************************************************************

CREATE EXTENSION IF NOT EXISTS http;


-- ************************************************************
-- PARTE 2: HELPER — Verificar origen de la petición
--
-- Solo permite peticiones desde ipnprofes.com o localhost (dev).
-- Postman, curl, y scripts no envían Origin header válido.
-- ************************************************************

CREATE OR REPLACE FUNCTION verificar_origen_web()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_origin TEXT;
BEGIN
  v_origin := coalesce(
    current_setting('request.headers', true)::json->>'origin',
    ''
  );

  -- Permitir en desarrollo y producción
  IF v_origin IN (
    'https://ipnprofes.com',
    'https://www.ipnprofes.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ) THEN
    RETURN;
  END IF;

  -- Bloquear todo lo demás (Postman, curl, scripts)
  RAISE EXCEPTION 'Origen no permitido'
    USING HINT = 'Esta API solo puede ser llamada desde ipnprofes.com';
END;
$$;


-- ************************************************************
-- PARTE 3: HELPER — Verificar CAPTCHA (Cloudflare Turnstile)
--
-- Si app.turnstile_secret está configurado, verifica el token.
-- Si NO está configurado, permite todo (para desarrollo).
-- Si Cloudflare falla (timeout/error), permite (no lockear).
-- ************************************************************

CREATE OR REPLACE FUNCTION verificar_captcha(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_response RECORD;
  v_success BOOLEAN;
BEGIN
  -- Obtener secret key (si existe)
  v_secret := current_setting('app.turnstile_secret', true);

  -- Si no hay secret configurado, skip (modo desarrollo)
  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN;
  END IF;

  -- Si hay secret pero no hay token, rechazar
  IF p_token IS NULL OR p_token = '' THEN
    RAISE EXCEPTION 'Verificación CAPTCHA requerida'
      USING HINT = 'Completa la verificación de seguridad';
  END IF;

  -- Verificar con Cloudflare Turnstile
  BEGIN
    SELECT *
    INTO v_response
    FROM http_post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      format('secret=%s&response=%s', v_secret, p_token),
      'application/x-www-form-urlencoded'
    );

    -- Verificar respuesta
    v_success := (v_response.content::json->>'success')::boolean;

    IF NOT v_success THEN
      RAISE EXCEPTION 'Verificación CAPTCHA fallida'
        USING HINT = 'Intenta de nuevo';
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay error de red/timeout, verificar si fue nuestro RAISE o un error de http
      IF SQLERRM LIKE 'Verificación CAPTCHA%' THEN
        RAISE; -- Re-lanzar el error de CAPTCHA
      END IF;
      -- Error de red → permitir (no bloquear usuarios si Cloudflare está caído)
      RETURN;
  END;
END;
$$;


-- ************************************************************
-- PARTE 4: HELPER — Rate limiting genérico por IP
--
-- Usa la tabla rpc_rate_limits que ya existe (de cambios.sql).
-- Retorna TRUE si el request es permitido, FALSE si excede límite.
-- ************************************************************

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_function_name TEXT,
  p_max_calls INT,
  p_window_interval INTERVAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_ip TEXT;
  v_call_count INT;
BEGIN
  -- Obtener IP del cliente
  v_client_ip := coalesce(
    split_part(
      coalesce(
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'x-real-ip',
        'unknown'
      ),
      ',', 1
    ),
    'unknown'
  );

  -- Contar llamadas recientes
  SELECT count(*) INTO v_call_count
  FROM rpc_rate_limits
  WHERE client_ip = v_client_ip
    AND function_name = p_function_name
    AND called_at > now() - p_window_interval;

  IF v_call_count >= p_max_calls THEN
    RAISE EXCEPTION 'Demasiadas solicitudes. Intenta más tarde.'
      USING HINT = format('Límite: %s solicitudes por %s', p_max_calls, p_window_interval);
  END IF;

  -- Registrar esta llamada
  INSERT INTO rpc_rate_limits (client_ip, function_name)
  VALUES (v_client_ip, p_function_name);

  -- Limpieza oportunista (~2% de las llamadas)
  IF random() < 0.02 THEN
    DELETE FROM rpc_rate_limits
    WHERE called_at < now() - INTERVAL '10 minutes';
  END IF;
END;
$$;


-- ************************************************************
-- PARTE 5: ACTUALIZAR verificar_usuario
-- Ahora incluye: origin check + rate limit + captcha
-- ************************************************************

CREATE OR REPLACE FUNCTION public.verificar_usuario(
  p_username TEXT,
  p_cancion_favorita TEXT,
  p_captcha_token TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario RECORD;
BEGIN
  -- ── Seguridad: verificar origen ──
  PERFORM verificar_origen_web();

  -- ── Seguridad: rate limiting (5 intentos/minuto por IP) ──
  PERFORM check_rate_limit('verificar_usuario', 5, INTERVAL '1 minute');

  -- ── Seguridad: CAPTCHA ──
  PERFORM verificar_captcha(p_captcha_token);

  -- Validar inputs
  IF p_username IS NULL OR length(trim(p_username)) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Username debe tener al menos 3 caracteres');
  END IF;

  IF p_cancion_favorita IS NULL OR length(trim(p_cancion_favorita)) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Cancion favorita debe tener al menos 3 caracteres');
  END IF;

  -- Buscar usuario existente
  SELECT id, username, cancion_favorita, monedas, total_evaluaciones
  INTO v_usuario
  FROM usuarios
  WHERE username = p_username;

  IF FOUND THEN
    -- Verificar credenciales
    IF v_usuario.cancion_favorita != lower(trim(p_cancion_favorita)) THEN
      RETURN json_build_object('success', false, 'error', 'Credenciales incorrectas');
    END IF;

    RETURN json_build_object(
      'success', true,
      'nuevo', false,
      'usuario', json_build_object(
        'id', v_usuario.id,
        'username', v_usuario.username,
        'monedas', COALESCE(v_usuario.monedas, 0),
        'total_evaluaciones', COALESCE(v_usuario.total_evaluaciones, 0)
      )
    );
  ELSE
    -- Crear usuario nuevo
    INSERT INTO usuarios (username, cancion_favorita, monedas, total_evaluaciones)
    VALUES (p_username, lower(trim(p_cancion_favorita)), 0, 0)
    RETURNING id, username, monedas, total_evaluaciones INTO v_usuario;

    RETURN json_build_object(
      'success', true,
      'nuevo', true,
      'usuario', json_build_object(
        'id', v_usuario.id,
        'username', v_usuario.username,
        'monedas', COALESCE(v_usuario.monedas, 0),
        'total_evaluaciones', COALESCE(v_usuario.total_evaluaciones, 0)
      )
    );
  END IF;
END;
$$;


-- ************************************************************
-- PARTE 6: ACTUALIZAR crear_evaluacion_segura
-- Ahora incluye: origin check + rate limit por IP + captcha
-- ************************************************************

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
  p_captcha_token TEXT DEFAULT NULL
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
  -- ── Seguridad: verificar origen ──
  PERFORM verificar_origen_web();

  -- ── Seguridad: rate limiting por IP (10 evaluaciones/hora por IP) ──
  PERFORM check_rate_limit('crear_evaluacion', 10, INTERVAL '1 hour');

  -- ── Seguridad: CAPTCHA ──
  PERFORM verificar_captcha(p_captcha_token);

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

  -- ── 1b. Rate limiting por usuario: 1 evaluación por 30 segundos ──
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
-- VERIFICACIÓN
-- ************************************************************
-- Ejecuta esto para confirmar:
--
-- SELECT extname FROM pg_extension WHERE extname = 'http';
-- Debe devolver 'http'
--
-- SELECT proname FROM pg_proc WHERE proname IN (
--   'verificar_origen_web', 'verificar_captcha', 'check_rate_limit'
-- );
-- Debe devolver las 3 funciones
