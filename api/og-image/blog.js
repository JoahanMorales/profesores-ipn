import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);

    const titulo = searchParams.get('titulo') || 'Artículo';
    const resumen = searchParams.get('resumen') || '';
    const categoria = searchParams.get('categoria') || 'General';
    const autor = searchParams.get('autor') || 'IPNProfes';
    const tiempo = searchParams.get('tiempo') || '5 min';

    const resumenCorto = resumen.length > 140 ? resumen.slice(0, 137) + '...' : resumen;

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter, sans-serif',
          },
          children: [
            // Left guinda accent bar
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  width: '10px',
                  height: '100%',
                  backgroundColor: '#6C1458',
                  flexShrink: 0,
                },
              },
            },
            // Main content
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  padding: '50px 65px',
                  justifyContent: 'space-between',
                },
                children: [
                  // Top: brand + category pill
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: '28px',
                              fontWeight: 800,
                              color: '#6C1458',
                              letterSpacing: '-0.5px',
                            },
                            children: 'ipnprofes',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#6C1458',
                              backgroundColor: '#fdf4f7',
                              padding: '8px 20px',
                              borderRadius: '999px',
                              border: '1.5px solid #fad1e3',
                            },
                            children: categoria,
                          },
                        },
                      ],
                    },
                  },

                  // Center: title + resumen
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        flex: 1,
                        justifyContent: 'center',
                      },
                      children: [
                        // Title — BIG
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: titulo.length > 50 ? '44px' : '56px',
                              fontWeight: 800,
                              color: '#111827',
                              lineHeight: 1.15,
                              letterSpacing: '-2px',
                            },
                            children: titulo,
                          },
                        },
                        // Resumen
                        ...(resumenCorto
                          ? [
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    fontSize: '22px',
                                    fontWeight: 400,
                                    color: '#6b7280',
                                    lineHeight: 1.5,
                                  },
                                  children: resumenCorto,
                                },
                              },
                            ]
                          : []),
                      ],
                    },
                  },

                  // Footer: autor + tiempo
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1.5px solid #e5e7eb',
                        paddingTop: '18px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#374151',
                            },
                            children: `Por ${autor}`,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: '18px',
                              fontWeight: 500,
                              color: '#9ca3af',
                            },
                            children: `${tiempo} de lectura · ipnprofes.com`,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      { width: 1200, height: 630 }
    );
  } catch (err) {
    return new Response('Error generando imagen', { status: 500 });
  }
}
