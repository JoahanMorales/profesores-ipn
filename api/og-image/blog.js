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

    const titulo = searchParams.get('titulo') || 'Artículo';
    const resumen = searchParams.get('resumen') || '';
    const categoria = searchParams.get('categoria') || 'General';
    const autor = searchParams.get('autor') || 'IPNProfes';
    const tiempo = searchParams.get('tiempo') || '5 min';

    // Truncate resumen for display
    const resumenCorto = resumen.length > 120 ? resumen.slice(0, 117) + '...' : resumen;

    const element = e('div', {
      width: '100%',
      height: '100%',
      background: '#ffffff',
      flexDirection: 'row',
      fontFamily: 'sans-serif',
    },
      // Left guinda accent bar
      e('div', {
        width: '12px',
        height: '100%',
        background: 'linear-gradient(180deg, #6C1458 0%, #d42c69 100%)',
        flexShrink: '0',
      }),

      // Content
      e('div', {
        flex: '1',
        flexDirection: 'column',
        padding: '50px 60px',
        justifyContent: 'space-between',
      },
        // Top section
        e('div', { flexDirection: 'column', gap: '16px' },
          // Brand
          e('div', {
            justifyContent: 'space-between',
            alignItems: 'center',
          },
            e('div', { fontSize: '22px', fontWeight: '700', color: '#6C1458' }, 'ipnprofes.com/blog'),
            e('div', {
              fontSize: '14px',
              background: '#fdf4f7',
              color: '#6C1458',
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #fad1e3',
            }, categoria)
          ),

          // Separator
          e('div', {
            width: '100%',
            height: '1px',
            background: '#e5e7eb',
            marginTop: '8px',
          })
        ),

        // Main content
        e('div', { flexDirection: 'column', gap: '16px', flex: '1', justifyContent: 'center' },
          // Title
          e('div', {
            fontSize: titulo.length > 60 ? '32px' : '40px',
            fontWeight: '700',
            color: '#111827',
            lineHeight: '1.25',
          }, titulo),

          // Resumen
          resumenCorto ? e('div', {
            fontSize: '18px',
            color: '#6b7280',
            lineHeight: '1.5',
          }, resumenCorto) : undefined
        ),

        // Footer
        e('div', {
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '16px',
        },
          e('div', { fontSize: '16px', color: '#374151' },
            e('div', {}, `Por ${autor}`),
          ),
          e('div', {
            fontSize: '14px',
            color: '#9ca3af',
          }, `${tiempo} de lectura`)
        )
      )
    );

    return new ImageResponse(element, {
      width: 1200,
      height: 630,
    });
  } catch (err) {
    return new Response('Error generando imagen', { status: 500 });
  }
}
