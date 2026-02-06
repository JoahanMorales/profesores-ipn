-- ============================================
-- SCHEMA COMPLETO - PROFESORES IPN
-- ============================================
-- Este archivo contiene el schema completo de la base de datos
-- Última actualización: 2026-02-05

-- TABLA: escuelas
-- Almacena las escuelas del IPN (ESCOM, UPIICSA, ESIME, etc.)
CREATE TABLE public.escuelas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (char_length(nombre) >= 3 AND char_length(nombre) <= 200),
  abreviatura text NOT NULL UNIQUE CHECK (char_length(abreviatura) >= 2 AND char_length(abreviatura) <= 20),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT escuelas_pkey PRIMARY KEY (id)
);

-- TABLA: carreras
-- Almacena las carreras por escuela
CREATE TABLE public.carreras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  escuela_id uuid,
  nombre text NOT NULL CHECK (char_length(nombre) >= 5 AND char_length(nombre) <= 200),
  abreviatura text CHECK (char_length(abreviatura) <= 50),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carreras_pkey PRIMARY KEY (id),
  CONSTRAINT carreras_escuela_id_fkey FOREIGN KEY (escuela_id) REFERENCES public.escuelas(id)
);

-- TABLA: profesores
-- Almacena información de los profesores
CREATE TABLE public.profesores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL UNIQUE CHECK (char_length(nombre_completo) >= 5 AND char_length(nombre_completo) <= 150),
  slug text UNIQUE CHECK (char_length(slug) >= 3 AND char_length(slug) <= 200),
  created_at timestamp with time zone DEFAULT now(),
  nombre_normalizado text,
  CONSTRAINT profesores_pkey PRIMARY KEY (id)
);

-- TABLA: usuarios
-- Almacena usuarios anónimos que dejan evaluaciones
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
  cancion_favorita text NOT NULL CHECK (char_length(cancion_favorita) >= 3 AND char_length(cancion_favorita) <= 100),
  total_evaluaciones integer DEFAULT 0 CHECK (total_evaluaciones >= 0),
  monedas integer DEFAULT 0 CHECK (monedas >= 0),
  created_at timestamp with time zone DEFAULT now(),
  device_id text,
  fingerprint_id text,
  session_id text,
  browser_info jsonb DEFAULT '{}'::jsonb,
  last_seen timestamp with time zone DEFAULT now(),
  first_seen timestamp with time zone DEFAULT now(),
  total_sessions integer DEFAULT 1 CHECK (total_sessions > 0),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

-- TABLA: evaluaciones
-- Almacena las evaluaciones/opiniones sobre profesores
CREATE TABLE public.evaluaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profesor_id uuid,
  escuela_id uuid,
  carrera_id uuid,
  usuario_id uuid,
  usuario_nombre text NOT NULL CHECK (char_length(usuario_nombre) >= 3 AND char_length(usuario_nombre) <= 50),
  materia text NOT NULL CHECK (char_length(materia) >= 3 AND char_length(materia) <= 200),
  calificacion integer CHECK (calificacion >= 1 AND calificacion <= 10),
  recomendado boolean DEFAULT true,
  asistencia_obligatoria boolean DEFAULT false,
  calificacion_obtenida text CHECK (char_length(calificacion_obtenida) <= 10),
  opinion text NOT NULL CHECK (char_length(opinion) >= 20 AND char_length(opinion) <= 2000),
  created_at timestamp with time zone DEFAULT now(),
  oculto boolean DEFAULT false,
  CONSTRAINT evaluaciones_pkey PRIMARY KEY (id),
  CONSTRAINT evaluaciones_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.profesores(id),
  CONSTRAINT evaluaciones_escuela_id_fkey FOREIGN KEY (escuela_id) REFERENCES public.escuelas(id),
  CONSTRAINT evaluaciones_carrera_id_fkey FOREIGN KEY (carrera_id) REFERENCES public.carreras(id),
  CONSTRAINT evaluaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- TABLA: reportes
-- Sistema para reportar evaluaciones inapropiadas
CREATE TABLE public.reportes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  evaluacion_id uuid NOT NULL,
  usuario_id uuid,
  tipo_reporte text NOT NULL CHECK (tipo_reporte = ANY (ARRAY['contenido-ofensivo'::text, 'informacion-falsa'::text, 'spam'::text, 'acoso'::text, 'privacidad'::text, 'otro'::text])),
  descripcion text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'revisado'::text, 'rechazado'::text])),
  notas_admin text,
  created_at timestamp with time zone DEFAULT now(),
  revisado_at timestamp with time zone,
  fingerprint text,
  CONSTRAINT reportes_pkey PRIMARY KEY (id),
  CONSTRAINT reportes_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES public.evaluaciones(id),
  CONSTRAINT reportes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- ============================================
-- ÍNDICES
-- ============================================
-- TODO: Agregar índices necesarios para mejorar performance

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- TODO: Documentar políticas RLS cuando las copies desde Supabase
