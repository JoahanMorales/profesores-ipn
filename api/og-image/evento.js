import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const interBold = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer());

const interRegular = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer());

export default async function handler(request) {
  try {
    const [boldFont, regularFont] = await Promise.all([interBold, interRegular]);
    const { searchParams } = new URL(request.url);

    const titulo = searchParams.get('titulo') || 'Evento';
    const fecha = searchParams.get('fecha') || '';
    const lugar = searchParams.get('lugar') || '';
    const hora = searchParams.get('hora') || '';
    const categoria = searchParams.get('categoria') || 'General';
    const destacado = searchParams.get('destacado') === 'true';

    // Build detail cards
    const detailCards = [
      fecha ? { label: 'FECHA', value: fecha } : null,
      lugar ? { label: 'LUGAR', value: lugar.length > 35 ? lugar.slice(0, 32) + '...' : lugar } : null,
      hora ? { label: 'HORA', value: hora } : null,
    ].filter(Boolean);

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter',
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
                  // Top: brand + pills
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
                              fontSize: '32px',
                              fontWeight: 700,
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
                              gap: '10px',
                              alignItems: 'center',
                            },
                            children: [
                              ...(destacado
                                ? [
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '18px',
                                          fontWeight: 700,
                                          color: '#d97706',
                                          backgroundColor: '#fffbeb',
                                          padding: '8px 18px',
                                          borderRadius: '999px',
                                          border: '1.5px solid #fde68a',
                                          letterSpacing: '0.5px',
                                        },
                                        children: 'DESTACADO',
                                      },
                                    },
                                  ]
                                : []),
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: '#6C1458',
                                    backgroundColor: '#fdf4f7',
                                    padding: '10px 24px',
                                    borderRadius: '999px',
                                    border: '2px solid #fad1e3',
                                  },
                                  children: categoria,
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },

                  // Center: title + details
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px',
                        flex: 1,
                        justifyContent: 'center',
                      },
                      children: [
                        // Event title — BIG
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: titulo.length > 45 ? '52px' : '68px',
                              fontWeight: 700,
                              color: '#111827',
                              lineHeight: 1.05,
                              letterSpacing: '-3px',
                            },
                            children: titulo,
                          },
                        },

                        // Detail cards row
                        ...(detailCards.length > 0
                          ? [
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    gap: '16px',
                                  },
                                  children: detailCards.map((card) => ({
                                    type: 'div',
                                    props: {
                                      style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: '#f9fafb',
                                        border: '1.5px solid #e5e7eb',
                                        borderRadius: '16px',
                                        padding: '14px 28px',
                                        gap: '4px',
                                      },
                                      children: [
                                        {
                                          type: 'div',
                                          props: {
                                            style: {
                                              display: 'flex',
                                              fontSize: '16px',
                                              fontWeight: 700,
                                              color: '#6C1458',
                                              letterSpacing: '1.5px',
                                            },
                                            children: card.label,
                                          },
                                        },
                                        {
                                          type: 'div',
                                          props: {
                                            style: {
                                              display: 'flex',
                                              fontSize: '24px',
                                              fontWeight: 700,
                                              color: '#374151',
                                            },
                                            children: card.value,
                                          },
                                        },
                                      ],
                                    },
                                  })),
                                },
                              },
                            ]
                          : []),
                      ],
                    },
                  },

                  // Footer
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        borderTop: '2px solid #e5e7eb',
                        paddingTop: '20px',
                        fontSize: '24px',
                        color: '#6b7280',
                        fontWeight: 400,
                      },
                      children: 'Eventos de la comunidad politécnica del IPN · ipnprofes.com',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Inter', data: boldFont, weight: 700, style: 'normal' },
          { name: 'Inter', data: regularFont, weight: 400, style: 'normal' },
        ],
      }
    );
  } catch (err) {
    return new Response('Error generando imagen', { status: 500 });
  }
}
