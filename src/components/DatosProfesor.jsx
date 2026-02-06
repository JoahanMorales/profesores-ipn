import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Página pública que muestra los datos de UN profesor específico en formato JSON.
 * Ruta: /datos/profesor/:slug
 */
export default function DatosProfesor() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProfesor = async () => {
      try {
        // Obtener el profesor por slug
        const { data: profesor, error: dbError } = await supabase
          .from('ranking_profesores')
          .select('nombre_completo, slug, calificacion_promedio, total_evaluaciones')
          .eq('slug', slug)
          .single();

        if (dbError) throw dbError;

        const resultado = {
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
        };

        setData(resultado);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarProfesor();
  }, [slug]);

  if (loading) {
    return (
      <pre id="profesor-data" style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px' }}>
        {JSON.stringify({ ok: false, loading: true }, null, 2)}
      </pre>
    );
  }

  if (error) {
    return (
      <pre id="profesor-data" style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px' }}>
        {JSON.stringify({ ok: false, error }, null, 2)}
      </pre>
    );
  }

  return (
    <pre id="profesor-data" style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px', background: '#1e1e1e', color: '#d4d4d4', minHeight: '100vh' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
