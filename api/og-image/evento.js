import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

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

    const titulo = searchParams.get('titulo') || 'Evento';
    const fecha = searchParams.get('fecha') || '';
    const lugar = searchParams.get('lugar') || '';
    const hora = searchParams.get('hora') || '';
    const categoria = searchParams.get('categoria') || 'General';
    const destacado = searchParams.get('destacado') === 'true';

    const element = e('div', {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #6C1458 0%, #4a0938 60%, #1a0412 100%)',
      padding: '50px 60px',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'sans-serif',
    },
      // Header
      e('div', {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      },
        e('div', { fontSize: '24px', fontWeight: '700', opacity: '0.9' }, 'ipnprofes.com/eventos'),
        e('div', { gap: '10px', alignItems: 'center' },
          destacado
            ? e('div', {
                fontSize: '13px',
                background: 'rgba(234,179,8,0.2)',
                color: '#fbbf24',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(234,179,8,0.3)',
                fontWeight: '600',
              }, 'DESTACADO')
            : undefined,
          e('div', {
            fontSize: '14px',
            background: 'rgba(255,255,255,0.15)',
            padding: '6px 18px',
            borderRadius: '20px',
            opacity: '0.85',
          }, categoria)
        )
      ),

      // Main content
      e('div', { flexDirection: 'column', flex: '1', justifyContent: 'center', gap: '30px' },
        // Title
        e('div', {
          fontSize: titulo.length > 50 ? '36px' : '46px',
          fontWeight: '700',
          lineHeight: '1.2',
        }, titulo),

        // Details grid
        e('div', { gap: '20px', flexWrap: 'wrap' },
          // Fecha
          fecha ? e('div', {
            background: 'rgba(255,255,255,0.1)',
            padding: '12px 24px',
            borderRadius: '12px',
            flexDirection: 'column',
            gap: '4px',
          },
            e('div', { fontSize: '13px', opacity: '0.6', textTransform: 'uppercase', letterSpacing: '1px' }, 'FECHA'),
            e('div', { fontSize: '18px', fontWeight: '600' }, fecha)
          ) : undefined,

          // Lugar
          lugar ? e('div', {
            background: 'rgba(255,255,255,0.1)',
            padding: '12px 24px',
            borderRadius: '12px',
            flexDirection: 'column',
            gap: '4px',
          },
            e('div', { fontSize: '13px', opacity: '0.6', textTransform: 'uppercase', letterSpacing: '1px' }, 'LUGAR'),
            e('div', { fontSize: '18px', fontWeight: '600' }, lugar.length > 30 ? lugar.slice(0, 27) + '...' : lugar)
          ) : undefined,

          // Hora
          hora ? e('div', {
            background: 'rgba(255,255,255,0.1)',
            padding: '12px 24px',
            borderRadius: '12px',
            flexDirection: 'column',
            gap: '4px',
          },
            e('div', { fontSize: '13px', opacity: '0.6', textTransform: 'uppercase', letterSpacing: '1px' }, 'HORA'),
            e('div', { fontSize: '18px', fontWeight: '600' }, hora)
          ) : undefined
        )
      ),

      // Footer
      e('div', {
        borderTop: '1px solid rgba(255,255,255,0.15)',
        paddingTop: '16px',
        marginTop: '10px',
        fontSize: '16px',
        opacity: '0.55',
      }, 'Descubre los eventos de la comunidad politecnica del IPN')
    );

    return new ImageResponse(element, {
      width: 1200,
      height: 630,
    });
  } catch (err) {
    return new Response('Error generando imagen', { status: 500 });
  }
}
