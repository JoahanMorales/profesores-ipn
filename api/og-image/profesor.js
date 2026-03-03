import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// VDOM helper — Satori only supports flexbox
const e = (type, style, ...children) => ({
  type,
  props: {
    style: { display: 'flex', ...style },
    children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children,
  },
});

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);

    const nombre = searchParams.get('nombre') || 'Profesor';
    const calificacion = searchParams.get('calificacion') || '0.0';
    const evaluaciones = searchParams.get('evaluaciones') || '0';
    const recomendacion = searchParams.get('recomendacion') || '0';

    const calNum = parseFloat(calificacion);
    const ratingColor = calNum >= 7 ? '#10b981' : calNum >= 5 ? '#f59e0b' : calNum > 0 ? '#ef4444' : '#9ca3af';

    const element = e('div', {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #6C1458 0%, #4a0938 50%, #2d0522 100%)',
      padding: '50px 60px',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'sans-serif',
    },
      // Header
      e('div', {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
      },
        e('div', { fontSize: '26px', fontWeight: '700', opacity: '0.9' }, 'ipnprofes.com'),
        e('div', {
          fontSize: '16px',
          background: 'rgba(255,255,255,0.15)',
          padding: '8px 24px',
          borderRadius: '20px',
          opacity: '0.85',
        }, 'Perfil de Profesor')
      ),

      // Main content
      e('div', {
        flex: '1',
        alignItems: 'center',
        gap: '50px',
      },
        // Rating circle
        e('div', {
          width: '180px',
          height: '180px',
          borderRadius: '90px',
          background: 'rgba(255,255,255,0.08)',
          border: `4px solid ${ratingColor}`,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: '0',
        },
          e('div', {
            fontSize: '64px',
            fontWeight: '700',
            color: ratingColor,
            lineHeight: '1',
          }, calificacion === 'Sin evaluar' ? '—' : calificacion),
          e('div', {
            fontSize: '18px',
            opacity: '0.6',
            marginTop: '4px',
          }, calificacion === 'Sin evaluar' ? '' : '/10')
        ),

        // Name and stats
        e('div', { flexDirection: 'column', flex: '1', gap: '20px' },
          // Professor name
          e('div', {
            fontSize: nombre.length > 35 ? '32px' : '40px',
            fontWeight: '700',
            lineHeight: '1.2',
          }, nombre),

          // Stats row
          e('div', { gap: '20px' },
            // Evaluaciones
            e('div', {
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.1)',
              padding: '14px 24px',
              borderRadius: '12px',
            },
              e('div', { fontSize: '30px', fontWeight: '700' }, String(evaluaciones)),
              e('div', { fontSize: '14px', opacity: '0.7' }, 'evaluaciones')
            ),
            // Recomendación
            e('div', {
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.1)',
              padding: '14px 24px',
              borderRadius: '12px',
            },
              e('div', { fontSize: '30px', fontWeight: '700' }, `${recomendacion}%`),
              e('div', { fontSize: '14px', opacity: '0.7' }, 'lo recomienda')
            )
          )
        )
      ),

      // Footer
      e('div', {
        borderTop: '1px solid rgba(255,255,255,0.15)',
        paddingTop: '16px',
        marginTop: '10px',
        fontSize: '16px',
        opacity: '0.55',
      }, 'Evalua profesores del IPN de forma 100% anonima')
    );

    return new ImageResponse(element, {
      width: 1200,
      height: 630,
    });
  } catch (err) {
    return new Response('Error generando imagen', { status: 500 });
  }
}
