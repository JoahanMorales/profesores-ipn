-- ============================================================
-- MIGRACIÓN DE SEGURIDAD — Proteger datos sensibles
-- 
-- EJECUTAR EN: Supabase Dashboard → SQL Editor → New Query
-- Pega TODO este archivo y haz clic en "Run"
-- 
-- EJECUTAR ANTES de desplegar el nuevo código frontend.
--
-- Fecha: 2026-02-19
--
-- Qué hace:
--   1. Crea RPC verificar_usuario para login seguro
--      (las credenciales se verifican server-side, NUNCA se
--       expone cancion_favorita al cliente)
--   2. Restringe SELECT en usuarios a columnas seguras
--      (oculta cancion_favorita, device_id, fingerprint, etc.)
--   3. Bloquea RPCs peligrosas (agregar_monedas, incrementar_evals)
--   4. Crea RPCs admin para leer reportes/eventos/blog
--      (antes se leían con SELECT directo sin verificación)
--   5. Revoca acceso a vista_reportes_admin desde anon
-- ============================================================


-- ************************************************************
-- PARTE 1: LOGIN SEGURO — verificar_usuario RPC
-- 
-- Reemplaza el SELECT directo a la tabla usuarios que exponía
-- cancion_favorita (la "contraseña") a cualquier persona.
-- Ahora las credenciales se verifican dentro de la función
-- SECURITY DEFINER y nunca salen del servidor.
-- ************************************************************

CREATE OR REPLACE FUNCTION public.verificar_usuario(
  p_username TEXT,
  p_cancion_favorita TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario RECORD;
BEGIN
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
    -- Verificar credenciales (comparar en lowercase/trim)
    IF v_usuario.cancion_favorita != lower(trim(p_cancion_favorita)) THEN
      RETURN json_build_object('success', false, 'error', 'Credenciales incorrectas');
    END IF;

    -- Login exitoso — NO devolver cancion_favorita
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

-- Permitir que anon ejecute esta función (es el nuevo login)
GRANT EXECUTE ON FUNCTION public.verificar_usuario(TEXT, TEXT) TO anon;


-- ************************************************************
-- PARTE 2: PROTEGER COLUMNAS SENSIBLES DE USUARIOS
--
-- Problema anterior: cualquier persona con la anon key podía
-- hacer SELECT cancion_favorita FROM usuarios WHERE username='Yojan'
-- y obtener la "contraseña" del admin.
--
-- Solución: column-level GRANT — solo permitir SELECT en
-- columnas públicas seguras. Las columnas sensibles
-- (cancion_favorita, device_id, fingerprint, etc.) quedan
-- inaccesibles para anon.
-- ************************************************************

-- Revocar todo acceso directo
REVOKE ALL ON TABLE public.usuarios FROM anon;

-- Permitir SELECT solo en columnas públicas
GRANT SELECT (id, username, monedas, total_evaluaciones, created_at) 
  ON TABLE public.usuarios TO anon;

-- Ya NO necesitamos INSERT directo — el login/registro va por
-- verificar_usuario RPC (SECURITY DEFINER lo hace internamente)


-- ************************************************************
-- PARTE 3: BLOQUEAR RPCs QUE NO REQUIEREN CREDENCIALES
--
-- agregar_monedas_seguro y incrementar_evaluaciones_seguro
-- solo verifican que el UUID del usuario exista, no credenciales.
-- Cualquiera que conozca un UUID puede inflar monedas/evals.
--
-- crear_evaluacion_segura ya maneja monedas + evaluaciones
-- internamente con verificación de credenciales, así que
-- estas funciones standalone ya no son necesarias para anon.
-- ************************************************************

REVOKE EXECUTE ON FUNCTION public.agregar_monedas_seguro(UUID, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.incrementar_evaluaciones_seguro(UUID) FROM anon;


-- ************************************************************
-- PARTE 4: PROTEGER DATOS DE ADMINISTRACIÓN
--
-- Problemas anteriores:
-- 1. vista_reportes_admin era legible por anon (SELECT *)
-- 2. obtenerEventosAdmin hacía SELECT * FROM eventos sin filtro
--    de publicado, exponiendo borradores
-- 3. obtenerArticulosAdmin hacía SELECT * FROM blog_posts sin
--    filtro, exponiendo borradores
--
-- Solución: RPCs con verificación admin para todas las lecturas
-- administrativas.
-- ************************************************************

-- Revocar acceso directo a la vista de reportes
REVOKE ALL ON public.vista_reportes_admin FROM anon;

-- RPC: Obtener reportes (solo admin)
CREATE OR REPLACE FUNCTION public.admin_obtener_reportes(
  p_username TEXT,
  p_cancion TEXT,
  p_estado TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM verificar_admin(p_username, p_cancion);

  RETURN (
    SELECT COALESCE(json_agg(t), '[]'::json)
    FROM (
      SELECT * FROM vista_reportes_admin
      WHERE (p_estado IS NULL OR estado = p_estado)
      ORDER BY fecha_reporte DESC
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_obtener_reportes(TEXT, TEXT, TEXT) TO anon;


-- RPC: Obtener TODOS los eventos incluyendo no publicados (solo admin)
CREATE OR REPLACE FUNCTION public.admin_obtener_eventos_todos(
  p_username TEXT,
  p_cancion TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM verificar_admin(p_username, p_cancion);

  RETURN (
    SELECT COALESCE(json_agg(t), '[]'::json)
    FROM (
      SELECT * FROM eventos
      ORDER BY created_at DESC
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_obtener_eventos_todos(TEXT, TEXT) TO anon;


-- RPC: Obtener TODOS los artículos incluyendo borradores (solo admin)
CREATE OR REPLACE FUNCTION public.admin_obtener_blog_todos(
  p_username TEXT,
  p_cancion TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM verificar_admin(p_username, p_cancion);

  RETURN (
    SELECT COALESCE(json_agg(t), '[]'::json)
    FROM (
      SELECT * FROM blog_posts
      ORDER BY created_at DESC
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_obtener_blog_todos(TEXT, TEXT) TO anon;


-- ************************************************************
-- VERIFICACIÓN: Ejecuta esto para confirmar que todo está ok
-- ************************************************************
-- SELECT 
--   'verificar_usuario' AS funcion,
--   has_function_privilege('anon', 'verificar_usuario(text, text)', 'EXECUTE') AS anon_puede;
-- 
-- SELECT 
--   'agregar_monedas_seguro' AS funcion,
--   has_function_privilege('anon', 'agregar_monedas_seguro(uuid, int)', 'EXECUTE') AS anon_puede;
-- Debe devolver false
--
-- SELECT 
--   has_table_privilege('anon', 'usuarios', 'SELECT') AS select_tabla;
-- Debe devolver false (column-level grant no aparece aquí)
--
-- SELECT 
--   has_column_privilege('anon', 'usuarios', 'username', 'SELECT') AS select_username,
--   has_column_privilege('anon', 'usuarios', 'cancion_favorita', 'SELECT') AS select_cancion;
-- username=true, cancion_favorita=false
