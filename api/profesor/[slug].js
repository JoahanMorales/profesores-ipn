const { createClient } = require('@supabase/supabase-js');

// En Vercel serverless functions, las variables VITE_* NO están disponibles.
// Se usan SUPABASE_URL y SUPABASE_ANON_KEY (sin prefijo VITE_).
// Como fallback, también se intentan las VITE_* por si las configuraron así.
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Headers CORS comunes para todas las respuestas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Solo permitir GET
  if (req.method !== 'GET') {
    return res
      .status(405)
      .setHeader('Content-Type', 'application/json')
      .json({ ok: false, error: 'Método no permitido' });
  }

  // Aplicar headers CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ ok: false, error: 'Slug es requerido' });
  }

  try {
    const { data: profesor, error: dbError } = await supabase
      .from('ranking_profesores')
      .select('nombre_completo, slug, calificacion_promedio, total_evaluaciones')
      .eq('slug', slug)
      .single();

    if (dbError || !profesor) {
      return res.status(404).json({ ok: false, error: 'Profesor no encontrado' });
    }

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      profesor: {
        nombre: profesor.nombre_completo,
        slug: profesor.slug,
        calificacion: profesor.calificacion_promedio
          ? Number(profesor.calificacion_promedio).toFixed(1)
          : 'Sin evaluar',
        total_evaluaciones: profesor.total_evaluaciones || 0,
      },
    });
  } catch (err) {
    console.error('Error en API /api/profesor/[slug]:', err);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
}
