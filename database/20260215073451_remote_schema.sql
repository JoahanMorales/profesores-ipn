


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."actualizar_last_seen"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Actualizar timestamp de última actividad
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."actualizar_last_seen"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buscar_duplicados_profesores"("nombre_buscar" "text") RETURNS TABLE("id" "uuid", "nombre_completo" "text", "nombre_normalizado" "text", "total_evaluaciones" bigint, "calificacion_promedio" numeric, "similitud" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nombre_completo,
    p.nombre_normalizado,
    p.total_evaluaciones,
    p.calificacion_promedio,
    similarity(p.nombre_normalizado, normalizar_nombre(nombre_buscar)) as similitud
  FROM profesores p
  WHERE 
    p.nombre_normalizado % normalizar_nombre(nombre_buscar)
    OR p.nombre_normalizado ILIKE '%' || normalizar_nombre(nombre_buscar) || '%'
  ORDER BY similitud DESC, p.total_evaluaciones DESC
  LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."buscar_duplicados_profesores"("nombre_buscar" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buscar_profesores"("termino_busqueda" "text") RETURNS TABLE("id" "uuid", "nombre_completo" "text", "slug" "text", "calificacion_promedio" numeric, "total_evaluaciones" bigint, "total_evaluadores" bigint, "porcentaje_recomendacion" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si el término está vacío, devolver todos los profesores ordenados
    IF termino_busqueda = '' OR termino_busqueda IS NULL THEN
        RETURN QUERY
        SELECT 
            rp.id,
            rp.nombre_completo,
            rp.slug,
            rp.calificacion_promedio,
            rp.total_evaluaciones,
            rp.total_evaluadores,
            rp.porcentaje_recomendacion
        FROM ranking_profesores rp
        ORDER BY rp.total_evaluaciones DESC, rp.calificacion_promedio DESC
        LIMIT 100;
    ELSE
        -- Buscar en nombre de profesor O en materias
        RETURN QUERY
        SELECT DISTINCT
            rp.id,
            rp.nombre_completo,
            rp.slug,
            rp.calificacion_promedio,
            rp.total_evaluaciones,
            rp.total_evaluadores,
            rp.porcentaje_recomendacion
        FROM ranking_profesores rp
        LEFT JOIN evaluaciones e ON rp.id = e.profesor_id
        WHERE 
            rp.nombre_completo ILIKE '%' || termino_busqueda || '%'
            OR e.materia ILIKE '%' || termino_busqueda || '%'
        ORDER BY 
            rp.total_evaluaciones DESC, 
            rp.calificacion_promedio DESC
        LIMIT 50;
    END IF;
END;
$$;


ALTER FUNCTION "public"."buscar_profesores"("termino_busqueda" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buscar_usuario_por_device"("p_device_id" "text") RETURNS TABLE("id" integer, "username" "text", "device_id" "text", "fingerprint_id" "text", "session_id" "text", "escuela_id" integer, "carrera_id" integer, "total_evaluaciones" integer, "monedas" integer, "total_sessions" integer, "last_seen" timestamp with time zone, "first_seen" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.device_id,
    u.fingerprint_id,
    u.session_id,
    u.escuela_id,
    u.carrera_id,
    u.total_evaluaciones,
    COALESCE(u.monedas, 0) as monedas,
    COALESCE(u.total_sessions, 1) as total_sessions,
    u.last_seen,
    u.first_seen
  FROM usuarios u
  WHERE u.device_id = p_device_id
  ORDER BY u.last_seen DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."buscar_usuario_por_device"("p_device_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detectar_anomalias_usuario"("p_device_id" "text") RETURNS TABLE("tipo_anomalia" "text", "descripcion" "text", "nivel_riesgo" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_total_sessions INTEGER;
  v_first_seen TIMESTAMPTZ;
  v_last_seen TIMESTAMPTZ;
  v_dias_activo INTEGER;
  v_sesiones_por_dia NUMERIC;
BEGIN
  -- Obtener datos del usuario
  SELECT 
    total_sessions,
    first_seen,
    last_seen,
    EXTRACT(DAY FROM last_seen - first_seen) + 1
  INTO v_total_sessions, v_first_seen, v_last_seen, v_dias_activo
  FROM usuarios
  WHERE device_id = p_device_id
  LIMIT 1;
  
  IF v_total_sessions IS NULL THEN
    RETURN QUERY SELECT 
      'NO_ENCONTRADO'::TEXT,
      'Usuario no encontrado'::TEXT,
      'INFO'::TEXT;
    RETURN;
  END IF;
  
  -- Calcular sesiones por día
  v_sesiones_por_dia := v_total_sessions::NUMERIC / NULLIF(v_dias_activo, 0);
  
  -- Detectar actividad excesiva (> 20 sesiones/día)
  IF v_sesiones_por_dia > 20 THEN
    RETURN QUERY SELECT 
      'ACTIVIDAD_EXCESIVA'::TEXT,
      format('%.1f sesiones por día (promedio)', v_sesiones_por_dia),
      'ALTO'::TEXT;
  END IF;
  
  -- Detectar sesiones rápidas (> 10 en 1 hora)
  IF v_total_sessions > 10 AND 
     EXTRACT(EPOCH FROM (v_last_seen - v_first_seen))/3600 < 1 THEN
    RETURN QUERY SELECT 
      'SESIONES_RAPIDAS'::TEXT,
      format('%s sesiones en menos de 1 hora', v_total_sessions),
      'MEDIO'::TEXT;
  END IF;
  
  -- Si no hay anomalías
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'NORMAL'::TEXT,
      'No se detectaron anomalías'::TEXT,
      'BAJO'::TEXT;
  END IF;
END;
$$;


ALTER FUNCTION "public"."detectar_anomalias_usuario"("p_device_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."eliminar_evaluacion_admin"("eval_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  prof_id UUID;
BEGIN
  -- Obtener profesor_id antes de eliminar
  SELECT profesor_id INTO prof_id FROM evaluaciones WHERE id = eval_id;
  
  IF prof_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Eliminar evaluación
  DELETE FROM evaluaciones WHERE id = eval_id;
  
  -- Actualizar ranking del profesor
  PERFORM actualizar_ranking_profesor(prof_id);
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."eliminar_evaluacion_admin"("eval_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generar_slug_profesor"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Solo generar slug si no existe o si el nombre cambió
    IF NEW.slug IS NULL OR NEW.nombre_completo != OLD.nombre_completo THEN
        NEW.slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        TRANSLATE(
                            NEW.nombre_completo,
                            'áéíóúÁÉÍÓÚñÑ',
                            'aeiouAEIOUnN'
                        ),
                        '[^a-zA-Z0-9\s-]', '', 'g'
                    ),
                    '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
            )
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generar_slug_profesor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limpiar_profesores_huerfanos"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM profesores p
        WHERE NOT EXISTS (
            SELECT 1 FROM evaluaciones e WHERE e.profesor_id = p.id
        )
        AND p.created_at < NOW() - INTERVAL '30 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."limpiar_profesores_huerfanos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limpiar_usuarios_inactivos"("dias_inactividad" integer DEFAULT 90) RETURNS TABLE("usuarios_eliminados" integer, "usuarios_anonimizados" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_eliminados INTEGER := 0;
  v_anonimizados INTEGER := 0;
  v_fecha_limite TIMESTAMPTZ;
BEGIN
  v_fecha_limite := NOW() - (dias_inactividad || ' days')::INTERVAL;
  
  -- Anonimizar usuarios con 0 evaluaciones y muy inactivos
  UPDATE usuarios SET
    username = 'Usuario_' || LEFT(device_id, 8),
    cancion_favorita = NULL,
    browser_info = '{}'::jsonb
  WHERE last_seen < v_fecha_limite
    AND total_evaluaciones = 0
    AND username NOT LIKE 'Usuario_%';
    
  GET DIAGNOSTICS v_anonimizados = ROW_COUNT;
  
  -- Eliminar solo sesiones fantasma (sin evaluaciones, sin monedas, muy antiguos)
  DELETE FROM usuarios
  WHERE last_seen < NOW() - INTERVAL '180 days'
    AND total_evaluaciones = 0
    AND COALESCE(monedas, 0) = 0
    AND total_sessions = 1;
    
  GET DIAGNOSTICS v_eliminados = ROW_COUNT;
  
  RETURN QUERY SELECT v_eliminados, v_anonimizados;
END;
$$;


ALTER FUNCTION "public"."limpiar_usuarios_inactivos"("dias_inactividad" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalizar_nombre"("nombre" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        TRANSLATE(
          nombre,
          'áéíóúÁÉÍÓÚñÑ',
          'aeiouAEIOUnN'
        ),
        '\s+', ' ', 'g'
      )
    )
  );
END;
$$;


ALTER FUNCTION "public"."normalizar_nombre"("nombre" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obtener_profesores_populares"("limite" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "nombre_completo" "text", "slug" "text", "calificacion_promedio" numeric, "total_evaluaciones" bigint, "total_evaluadores" bigint, "porcentaje_recomendacion" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.id,
        rp.nombre_completo,
        rp.slug,
        rp.calificacion_promedio,
        rp.total_evaluaciones,
        rp.total_evaluadores,
        rp.porcentaje_recomendacion
    FROM ranking_profesores rp
    WHERE rp.total_evaluaciones > 0
    ORDER BY rp.total_evaluaciones DESC, rp.calificacion_promedio DESC
    LIMIT limite;
END;
$$;


ALTER FUNCTION "public"."obtener_profesores_populares"("limite" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ocultar_evaluacion"("eval_id" "uuid", "ocultar" boolean DEFAULT true) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE evaluaciones 
  SET oculto = ocultar 
  WHERE id = eval_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."ocultar_evaluacion"("eval_id" "uuid", "ocultar" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."proteger_first_seen"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- No permitir cambiar first_seen en UPDATE
  IF TG_OP = 'UPDATE' THEN
    NEW.first_seen = OLD.first_seen;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."proteger_first_seen"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_estadisticas"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY estadisticas_globales;
END;
$$;


ALTER FUNCTION "public"."refresh_estadisticas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_sesion"("p_user_id" integer, "p_session_id" "text", "p_browser_info" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE usuarios
  SET 
    session_id = p_session_id,
    browser_info = p_browser_info,
    last_seen = NOW(),
    total_sessions = COALESCE(total_sessions, 0) + 1
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."registrar_sesion"("p_user_id" integer, "p_session_id" "text", "p_browser_info" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_sesion"("p_username" "text", "p_device_id" "text", "p_fingerprint_id" "text", "p_session_id" "text", "p_browser_info" "jsonb") RETURNS TABLE("usuario_id" "uuid", "es_nuevo" boolean, "sesion_numero" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_usuario_id UUID;
  v_existe BOOLEAN;
  v_sesiones INTEGER;
BEGIN
  -- Buscar usuario por device_id
  SELECT id, total_sessions 
  INTO v_usuario_id, v_sesiones
  FROM usuarios
  WHERE device_id = p_device_id
  LIMIT 1;
  
  IF v_usuario_id IS NOT NULL THEN
    -- Usuario existente: actualizar datos
    UPDATE usuarios SET
      session_id = p_session_id,
      fingerprint_id = p_fingerprint_id,
      browser_info = p_browser_info,
      last_seen = NOW(),
      total_sessions = total_sessions + 1
    WHERE id = v_usuario_id;
    
    RETURN QUERY SELECT v_usuario_id, FALSE, v_sesiones + 1;
  ELSE
    -- Usuario nuevo: crear registro
    INSERT INTO usuarios (
      username,
      device_id,
      fingerprint_id,
      session_id,
      browser_info,
      first_seen,
      last_seen,
      total_sessions,
      total_evaluaciones,
      monedas
    ) VALUES (
      p_username,
      p_device_id,
      p_fingerprint_id,
      p_session_id,
      p_browser_info,
      NOW(),
      NOW(),
      1,
      0,
      0
    )
    RETURNING id INTO v_usuario_id;
    
    RETURN QUERY SELECT v_usuario_id, TRUE, 1;
  END IF;
END;
$$;


ALTER FUNCTION "public"."registrar_sesion"("p_username" "text", "p_device_id" "text", "p_fingerprint_id" "text", "p_session_id" "text", "p_browser_info" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_normalizar_nombre_profesor"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.nombre_normalizado := normalizar_nombre(NEW.nombre_completo);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_normalizar_nombre_profesor"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" NOT NULL,
    "cancion_favorita" "text" NOT NULL,
    "total_evaluaciones" integer DEFAULT 0,
    "monedas" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "device_id" "text",
    "fingerprint_id" "text",
    "session_id" "text",
    "browser_info" "jsonb" DEFAULT '{}'::"jsonb",
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "first_seen" timestamp with time zone DEFAULT "now"(),
    "total_sessions" integer DEFAULT 1,
    CONSTRAINT "cancion_favorita_length" CHECK ((("char_length"("cancion_favorita") >= 3) AND ("char_length"("cancion_favorita") <= 100))),
    CONSTRAINT "cancion_no_espacios" CHECK (("cancion_favorita" !~ '\s'::"text")),
    CONSTRAINT "check_fingerprint_integrity" CHECK (((("device_id" IS NULL) AND ("fingerprint_id" IS NULL)) OR (("device_id" IS NOT NULL) AND ("fingerprint_id" IS NOT NULL)))),
    CONSTRAINT "check_seen_dates_order" CHECK (("last_seen" >= "first_seen")),
    CONSTRAINT "check_total_sessions_positive" CHECK (("total_sessions" > 0)),
    CONSTRAINT "monedas_no_negativas" CHECK (("monedas" >= 0)),
    CONSTRAINT "total_evaluaciones_no_negativas" CHECK (("total_evaluaciones" >= 0)),
    CONSTRAINT "username_format" CHECK (("username" ~ '^[a-zA-Z0-9_-]+$'::"text")),
    CONSTRAINT "username_length" CHECK ((("char_length"("username") >= 3) AND ("char_length"("username") <= 50)))
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


COMMENT ON COLUMN "public"."usuarios"."device_id" IS 'Hash único del dispositivo (persistente entre sesiones)';



COMMENT ON COLUMN "public"."usuarios"."fingerprint_id" IS 'Hash del navegador completo (canvas, webGL, fonts)';



COMMENT ON COLUMN "public"."usuarios"."session_id" IS 'ID único de sesión (cambia cada login)';



COMMENT ON COLUMN "public"."usuarios"."browser_info" IS 'JSON con: {name, version, os, isMobile, screen, timezone}';



COMMENT ON COLUMN "public"."usuarios"."last_seen" IS 'Última actividad detectada del usuario';



COMMENT ON COLUMN "public"."usuarios"."first_seen" IS 'Primera vez que se detectó este dispositivo';



COMMENT ON COLUMN "public"."usuarios"."total_sessions" IS 'Número total de sesiones del dispositivo';



CREATE OR REPLACE VIEW "public"."actividad_reciente" AS
 SELECT "id",
    "username",
    "device_id",
    ("browser_info" ->> 'name'::"text") AS "navegador",
    ("browser_info" ->> 'os'::"text") AS "sistema_operativo",
    "last_seen",
    "total_evaluaciones",
    COALESCE("monedas", 0) AS "total_monedas",
    "total_sessions",
    (EXTRACT(epoch FROM ("now"() - "last_seen")) / (60)::numeric) AS "minutos_desde_actividad"
   FROM "public"."usuarios" "u"
  WHERE ("device_id" IS NOT NULL)
  ORDER BY "last_seen" DESC
 LIMIT 100;


ALTER VIEW "public"."actividad_reciente" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carreras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "escuela_id" "uuid",
    "nombre" "text" NOT NULL,
    "abreviatura" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "abreviatura_carrera_length" CHECK (("char_length"("abreviatura") <= 50)),
    CONSTRAINT "nombre_carrera_length" CHECK ((("char_length"("nombre") >= 5) AND ("char_length"("nombre") <= 200)))
);


ALTER TABLE "public"."carreras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."escuelas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "abreviatura" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "abreviatura_escuela_length" CHECK ((("char_length"("abreviatura") >= 2) AND ("char_length"("abreviatura") <= 20))),
    CONSTRAINT "nombre_escuela_length" CHECK ((("char_length"("nombre") >= 3) AND ("char_length"("nombre") <= 200)))
);


ALTER TABLE "public"."escuelas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluaciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesor_id" "uuid",
    "escuela_id" "uuid",
    "carrera_id" "uuid",
    "usuario_id" "uuid",
    "usuario_nombre" "text" NOT NULL,
    "materia" "text" NOT NULL,
    "calificacion" integer,
    "recomendado" boolean DEFAULT true,
    "asistencia_obligatoria" boolean DEFAULT false,
    "calificacion_obtenida" "text",
    "opinion" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "oculto" boolean DEFAULT false,
    CONSTRAINT "calificacion_obtenida_length" CHECK (("char_length"("calificacion_obtenida") <= 10)),
    CONSTRAINT "evaluaciones_calificacion_check" CHECK ((("calificacion" >= 1) AND ("calificacion" <= 10))),
    CONSTRAINT "materia_length" CHECK ((("char_length"("materia") >= 3) AND ("char_length"("materia") <= 200))),
    CONSTRAINT "opinion_length" CHECK ((("char_length"("opinion") >= 20) AND ("char_length"("opinion") <= 2000))),
    CONSTRAINT "usuario_nombre_length" CHECK ((("char_length"("usuario_nombre") >= 3) AND ("char_length"("usuario_nombre") <= 50)))
);


ALTER TABLE "public"."evaluaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profesores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre_completo" "text" NOT NULL,
    "slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "nombre_normalizado" "text",
    CONSTRAINT "nombre_completo_length" CHECK ((("char_length"("nombre_completo") >= 5) AND ("char_length"("nombre_completo") <= 150))),
    CONSTRAINT "slug_format" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text")),
    CONSTRAINT "slug_length" CHECK ((("char_length"("slug") >= 3) AND ("char_length"("slug") <= 200)))
);


ALTER TABLE "public"."profesores" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."estadisticas_globales" AS
 SELECT "count"(DISTINCT "p"."id") AS "total_profesores",
    "count"(DISTINCT "u"."id") AS "total_usuarios",
    "count"("e"."id") AS "total_evaluaciones",
    "round"("avg"("e"."calificacion"), 2) AS "promedio_general",
    "count"(DISTINCT "e"."materia") AS "total_materias_unicas"
   FROM (("public"."profesores" "p"
     LEFT JOIN "public"."evaluaciones" "e" ON (("p"."id" = "e"."profesor_id")))
     LEFT JOIN "public"."usuarios" "u" ON (("u"."id" = "e"."usuario_id")))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."estadisticas_globales" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ranking_profesores" AS
 SELECT "p"."id",
    "p"."nombre_completo",
    "p"."slug",
    "count"("e"."id") AS "total_evaluaciones",
    "count"(DISTINCT "e"."usuario_id") AS "total_evaluadores",
    "round"("avg"("e"."calificacion"), 1) AS "calificacion_promedio",
    "round"(((("count"(
        CASE
            WHEN "e"."recomendado" THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF("count"("e"."id"), 0))::numeric) * (100)::numeric), 0) AS "porcentaje_recomendacion",
    "p"."created_at"
   FROM ("public"."profesores" "p"
     LEFT JOIN "public"."evaluaciones" "e" ON (("p"."id" = "e"."profesor_id")))
  GROUP BY "p"."id", "p"."nombre_completo", "p"."slug", "p"."created_at";


ALTER VIEW "public"."ranking_profesores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reportes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "evaluacion_id" "uuid" NOT NULL,
    "usuario_id" "uuid",
    "tipo_reporte" "text" NOT NULL,
    "descripcion" "text" NOT NULL,
    "estado" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "notas_admin" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revisado_at" timestamp with time zone,
    "fingerprint" "text",
    CONSTRAINT "reportes_estado_check" CHECK (("estado" = ANY (ARRAY['pendiente'::"text", 'revisado'::"text", 'rechazado'::"text"]))),
    CONSTRAINT "reportes_tipo_reporte_check" CHECK (("tipo_reporte" = ANY (ARRAY['contenido-ofensivo'::"text", 'informacion-falsa'::"text", 'spam'::"text", 'acoso'::"text", 'privacidad'::"text", 'otro'::"text"])))
);


ALTER TABLE "public"."reportes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."stats_navegadores" AS
 SELECT ("browser_info" ->> 'name'::"text") AS "navegador",
    ("browser_info" ->> 'version'::"text") AS "version",
    ("browser_info" ->> 'os'::"text") AS "sistema_operativo",
    (("browser_info" ->> 'isMobile'::"text"))::boolean AS "es_movil",
    "count"(*) AS "total_usuarios",
    "count"(DISTINCT "device_id") AS "dispositivos_unicos",
    "max"("last_seen") AS "ultima_actividad"
   FROM "public"."usuarios"
  WHERE ("browser_info" IS NOT NULL)
  GROUP BY ("browser_info" ->> 'name'::"text"), ("browser_info" ->> 'version'::"text"), ("browser_info" ->> 'os'::"text"), ("browser_info" ->> 'isMobile'::"text")
  ORDER BY ("count"(*)) DESC;


ALTER VIEW "public"."stats_navegadores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."stats_tracking" AS
 SELECT "count"(DISTINCT "device_id") AS "dispositivos_unicos",
    "count"(DISTINCT "fingerprint_id") AS "navegadores_unicos",
    "count"(*) AS "total_usuarios",
    "count"(*) FILTER (WHERE ("last_seen" > ("now"() - '1 day'::interval))) AS "activos_24h",
    "count"(*) FILTER (WHERE ("last_seen" > ("now"() - '7 days'::interval))) AS "activos_7d",
    "count"(*) FILTER (WHERE ("last_seen" > ("now"() - '30 days'::interval))) AS "activos_30d",
    "sum"("total_sessions") AS "sesiones_totales",
    "avg"("total_sessions") AS "promedio_sesiones_por_usuario",
    "max"("last_seen") AS "ultima_actividad",
    "min"("first_seen") AS "primer_registro"
   FROM "public"."usuarios"
  WHERE ("device_id" IS NOT NULL);


ALTER VIEW "public"."stats_tracking" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_reportes_admin" AS
 SELECT "r"."id" AS "reporte_id",
    "r"."tipo_reporte",
    "r"."descripcion",
    "r"."estado",
    "r"."notas_admin",
    "r"."created_at" AS "fecha_reporte",
    "r"."revisado_at",
    "e"."id" AS "evaluacion_id",
    "e"."calificacion",
    "e"."recomendado",
    "e"."asistencia_obligatoria",
    "e"."calificacion_obtenida",
    "e"."opinion",
    "e"."materia",
    "e"."oculto" AS "evaluacion_oculta",
    "p"."id" AS "profesor_id",
    "p"."nombre_completo" AS "profesor_nombre",
    "u"."username" AS "reportado_por"
   FROM ((("public"."reportes" "r"
     JOIN "public"."evaluaciones" "e" ON (("r"."evaluacion_id" = "e"."id")))
     JOIN "public"."profesores" "p" ON (("e"."profesor_id" = "p"."id")))
     LEFT JOIN "public"."usuarios" "u" ON (("r"."usuario_id" = "u"."id")))
  ORDER BY "r"."created_at" DESC;


ALTER VIEW "public"."vista_reportes_admin" OWNER TO "postgres";


ALTER TABLE ONLY "public"."carreras"
    ADD CONSTRAINT "carreras_escuela_id_nombre_key" UNIQUE ("escuela_id", "nombre");



ALTER TABLE ONLY "public"."carreras"
    ADD CONSTRAINT "carreras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."escuelas"
    ADD CONSTRAINT "escuelas_abreviatura_key" UNIQUE ("abreviatura");



ALTER TABLE ONLY "public"."escuelas"
    ADD CONSTRAINT "escuelas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluaciones"
    ADD CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profesores"
    ADD CONSTRAINT "profesores_nombre_completo_key" UNIQUE ("nombre_completo");



ALTER TABLE ONLY "public"."profesores"
    ADD CONSTRAINT "profesores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profesores"
    ADD CONSTRAINT "profesores_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_username_key" UNIQUE ("username");



CREATE INDEX "idx_carreras_escuela" ON "public"."carreras" USING "btree" ("escuela_id");



CREATE UNIQUE INDEX "idx_estadisticas_globales" ON "public"."estadisticas_globales" USING "btree" ((1));



CREATE INDEX "idx_evaluaciones_materia" ON "public"."evaluaciones" USING "gin" ("to_tsvector"('"spanish"'::"regconfig", "materia"));



CREATE INDEX "idx_evaluaciones_profesor" ON "public"."evaluaciones" USING "btree" ("profesor_id");



CREATE INDEX "idx_evaluaciones_profesor_fecha" ON "public"."evaluaciones" USING "btree" ("profesor_id", "created_at" DESC);



CREATE INDEX "idx_evaluaciones_usuario" ON "public"."evaluaciones" USING "btree" ("usuario_id");



CREATE INDEX "idx_profesores_nombre" ON "public"."profesores" USING "gin" ("to_tsvector"('"spanish"'::"regconfig", "nombre_completo"));



CREATE INDEX "idx_profesores_nombre_normalizado" ON "public"."profesores" USING "btree" ("nombre_normalizado");



CREATE INDEX "idx_profesores_nombre_normalizado_trgm" ON "public"."profesores" USING "gin" ("nombre_normalizado" "public"."gin_trgm_ops");



CREATE INDEX "idx_profesores_slug" ON "public"."profesores" USING "btree" ("slug");



CREATE INDEX "idx_reportes_created_at" ON "public"."reportes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reportes_estado" ON "public"."reportes" USING "btree" ("estado");



CREATE INDEX "idx_reportes_evaluacion" ON "public"."reportes" USING "btree" ("evaluacion_id");



CREATE INDEX "idx_usuarios_device_id" ON "public"."usuarios" USING "btree" ("device_id");



CREATE INDEX "idx_usuarios_device_last_seen" ON "public"."usuarios" USING "btree" ("device_id", "last_seen" DESC);



CREATE INDEX "idx_usuarios_fingerprint_id" ON "public"."usuarios" USING "btree" ("fingerprint_id");



CREATE INDEX "idx_usuarios_last_seen" ON "public"."usuarios" USING "btree" ("last_seen" DESC);



CREATE INDEX "idx_usuarios_monedas" ON "public"."usuarios" USING "btree" ("monedas" DESC);



CREATE INDEX "idx_usuarios_total_eval" ON "public"."usuarios" USING "btree" ("total_evaluaciones" DESC);



CREATE INDEX "idx_usuarios_username" ON "public"."usuarios" USING "btree" ("username");



CREATE INDEX "idx_usuarios_username_lookup" ON "public"."usuarios" USING "btree" ("lower"("username"));



CREATE OR REPLACE TRIGGER "set_nombre_normalizado" BEFORE INSERT OR UPDATE OF "nombre_completo" ON "public"."profesores" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_normalizar_nombre_profesor"();



CREATE OR REPLACE TRIGGER "trigger_actualizar_last_seen" BEFORE UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."actualizar_last_seen"();



CREATE OR REPLACE TRIGGER "trigger_generar_slug" BEFORE INSERT ON "public"."profesores" FOR EACH ROW EXECUTE FUNCTION "public"."generar_slug_profesor"();



CREATE OR REPLACE TRIGGER "trigger_proteger_first_seen" BEFORE UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."proteger_first_seen"();



ALTER TABLE ONLY "public"."carreras"
    ADD CONSTRAINT "carreras_escuela_id_fkey" FOREIGN KEY ("escuela_id") REFERENCES "public"."escuelas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluaciones"
    ADD CONSTRAINT "evaluaciones_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "public"."carreras"("id");



ALTER TABLE ONLY "public"."evaluaciones"
    ADD CONSTRAINT "evaluaciones_escuela_id_fkey" FOREIGN KEY ("escuela_id") REFERENCES "public"."escuelas"("id");



ALTER TABLE ONLY "public"."evaluaciones"
    ADD CONSTRAINT "evaluaciones_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "public"."profesores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluaciones"
    ADD CONSTRAINT "evaluaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "public"."evaluaciones"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;



CREATE POLICY "Admin puede actualizar reportes" ON "public"."reportes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."usuarios"
  WHERE ("usuarios"."username" = 'Yojan'::"text"))));



CREATE POLICY "Admin puede ocultar evaluaciones" ON "public"."evaluaciones" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Todos pueden leer carreras" ON "public"."carreras" FOR SELECT USING (true);



CREATE POLICY "Todos pueden leer escuelas" ON "public"."escuelas" FOR SELECT USING (true);



CREATE POLICY "Todos pueden leer evaluaciones" ON "public"."evaluaciones" FOR SELECT USING (true);



CREATE POLICY "Todos pueden leer profesores" ON "public"."profesores" FOR SELECT USING (true);



CREATE POLICY "Todos pueden leer usuarios" ON "public"."usuarios" FOR SELECT USING (true);



CREATE POLICY "Usuarios pueden actualizar profesores" ON "public"."profesores" FOR UPDATE USING (true);



CREATE POLICY "Usuarios pueden actualizar usuarios" ON "public"."usuarios" FOR UPDATE USING (true);



CREATE POLICY "Usuarios pueden crear reportes" ON "public"."reportes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Usuarios pueden insertar evaluaciones" ON "public"."evaluaciones" FOR INSERT WITH CHECK (true);



CREATE POLICY "Usuarios pueden insertar profesores" ON "public"."profesores" FOR INSERT WITH CHECK (true);



CREATE POLICY "Usuarios pueden insertar usuarios" ON "public"."usuarios" FOR INSERT WITH CHECK (true);



CREATE POLICY "Usuarios ven sus reportes" ON "public"."reportes" FOR SELECT USING (true);



ALTER TABLE "public"."carreras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."escuelas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluaciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profesores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reportes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios_actualizar_sesion" ON "public"."usuarios" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "usuarios_eliminar_inactivos" ON "public"."usuarios" FOR DELETE USING (true);



CREATE POLICY "usuarios_insertar_anonimo" ON "public"."usuarios" FOR INSERT WITH CHECK (true);



CREATE POLICY "usuarios_leer_propio_device" ON "public"."usuarios" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."actualizar_last_seen"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_last_seen"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_last_seen"() TO "service_role";



GRANT ALL ON FUNCTION "public"."buscar_duplicados_profesores"("nombre_buscar" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."buscar_duplicados_profesores"("nombre_buscar" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buscar_duplicados_profesores"("nombre_buscar" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."buscar_profesores"("termino_busqueda" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."buscar_profesores"("termino_busqueda" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buscar_profesores"("termino_busqueda" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."buscar_usuario_por_device"("p_device_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."buscar_usuario_por_device"("p_device_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buscar_usuario_por_device"("p_device_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."detectar_anomalias_usuario"("p_device_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."detectar_anomalias_usuario"("p_device_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."detectar_anomalias_usuario"("p_device_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."eliminar_evaluacion_admin"("eval_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."eliminar_evaluacion_admin"("eval_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."eliminar_evaluacion_admin"("eval_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generar_slug_profesor"() TO "anon";
GRANT ALL ON FUNCTION "public"."generar_slug_profesor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generar_slug_profesor"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."limpiar_profesores_huerfanos"() TO "anon";
GRANT ALL ON FUNCTION "public"."limpiar_profesores_huerfanos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."limpiar_profesores_huerfanos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."limpiar_usuarios_inactivos"("dias_inactividad" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."limpiar_usuarios_inactivos"("dias_inactividad" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."limpiar_usuarios_inactivos"("dias_inactividad" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."normalizar_nombre"("nombre" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalizar_nombre"("nombre" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalizar_nombre"("nombre" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."obtener_profesores_populares"("limite" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."obtener_profesores_populares"("limite" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."obtener_profesores_populares"("limite" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ocultar_evaluacion"("eval_id" "uuid", "ocultar" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."ocultar_evaluacion"("eval_id" "uuid", "ocultar" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ocultar_evaluacion"("eval_id" "uuid", "ocultar" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."proteger_first_seen"() TO "anon";
GRANT ALL ON FUNCTION "public"."proteger_first_seen"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."proteger_first_seen"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_estadisticas"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_estadisticas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_estadisticas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_sesion"("p_user_id" integer, "p_session_id" "text", "p_browser_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_sesion"("p_user_id" integer, "p_session_id" "text", "p_browser_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_sesion"("p_user_id" integer, "p_session_id" "text", "p_browser_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_sesion"("p_username" "text", "p_device_id" "text", "p_fingerprint_id" "text", "p_session_id" "text", "p_browser_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_sesion"("p_username" "text", "p_device_id" "text", "p_fingerprint_id" "text", "p_session_id" "text", "p_browser_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_sesion"("p_username" "text", "p_device_id" "text", "p_fingerprint_id" "text", "p_session_id" "text", "p_browser_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_normalizar_nombre_profesor"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_normalizar_nombre_profesor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_normalizar_nombre_profesor"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."actividad_reciente" TO "anon";
GRANT ALL ON TABLE "public"."actividad_reciente" TO "authenticated";
GRANT ALL ON TABLE "public"."actividad_reciente" TO "service_role";



GRANT ALL ON TABLE "public"."carreras" TO "anon";
GRANT ALL ON TABLE "public"."carreras" TO "authenticated";
GRANT ALL ON TABLE "public"."carreras" TO "service_role";



GRANT ALL ON TABLE "public"."escuelas" TO "anon";
GRANT ALL ON TABLE "public"."escuelas" TO "authenticated";
GRANT ALL ON TABLE "public"."escuelas" TO "service_role";



GRANT ALL ON TABLE "public"."evaluaciones" TO "anon";
GRANT ALL ON TABLE "public"."evaluaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluaciones" TO "service_role";



GRANT ALL ON TABLE "public"."profesores" TO "anon";
GRANT ALL ON TABLE "public"."profesores" TO "authenticated";
GRANT ALL ON TABLE "public"."profesores" TO "service_role";



GRANT ALL ON TABLE "public"."estadisticas_globales" TO "anon";
GRANT ALL ON TABLE "public"."estadisticas_globales" TO "authenticated";
GRANT ALL ON TABLE "public"."estadisticas_globales" TO "service_role";



GRANT ALL ON TABLE "public"."ranking_profesores" TO "anon";
GRANT ALL ON TABLE "public"."ranking_profesores" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_profesores" TO "service_role";



GRANT ALL ON TABLE "public"."reportes" TO "anon";
GRANT ALL ON TABLE "public"."reportes" TO "authenticated";
GRANT ALL ON TABLE "public"."reportes" TO "service_role";



GRANT ALL ON TABLE "public"."stats_navegadores" TO "anon";
GRANT ALL ON TABLE "public"."stats_navegadores" TO "authenticated";
GRANT ALL ON TABLE "public"."stats_navegadores" TO "service_role";



GRANT ALL ON TABLE "public"."stats_tracking" TO "anon";
GRANT ALL ON TABLE "public"."stats_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."stats_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."vista_reportes_admin" TO "anon";
GRANT ALL ON TABLE "public"."vista_reportes_admin" TO "authenticated";
GRANT ALL ON TABLE "public"."vista_reportes_admin" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


