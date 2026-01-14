-- ============================================
-- SCRIPT RÁPIDO DE SETUP PARA PRODUCCIÓN
-- ============================================
-- Ejecutar en Supabase SQL Editor para configurar
-- el sistema de fingerprinting y tracking
-- ============================================

-- 1. AGREGAR COLUMNAS DE FINGERPRINTING
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS fingerprint_id TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS browser_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS first_seen TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 1;

-- 2. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_usuarios_device_id ON usuarios(device_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_fingerprint_id ON usuarios(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_last_seen ON usuarios(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_device_last_seen ON usuarios(device_id, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

-- 3. FUNCIÓN: Buscar usuario por device
CREATE OR REPLACE FUNCTION buscar_usuario_por_device(p_device_id TEXT)
RETURNS TABLE (
  id INTEGER,
  username TEXT,
  device_id TEXT,
  fingerprint_id TEXT,
  session_id TEXT,
  escuela_id INTEGER,
  carrera_id INTEGER,
  total_evaluaciones INTEGER,
  monedas INTEGER,
  total_sessions INTEGER,
  last_seen TIMESTAMPTZ,
  first_seen TIMESTAMPTZ
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCIÓN: Registrar nueva sesión
CREATE OR REPLACE FUNCTION registrar_sesion(
  p_user_id INTEGER,
  p_session_id TEXT,
  p_browser_info JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE usuarios
  SET 
    session_id = p_session_id,
    browser_info = p_browser_info,
    last_seen = NOW(),
    total_sessions = COALESCE(total_sessions, 0) + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar que todo está correcto:
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name IN ('device_id', 'fingerprint_id', 'session_id', 'browser_info', 'monedas', 'total_sessions')
ORDER BY column_name;
