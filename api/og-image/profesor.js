import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// Load Inter Bold & Regular from Google Fonts
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

    const nombre = searchParams.get('nombre') || 'Profesor';
    const calificacion = searchParams.get('calificacion') || '0.0';
    const evaluaciones = searchParams.get('evaluaciones') || '0';
    const recomendacion = searchParams.get('recomendacion') || '0';

    const calNum = parseFloat(calificacion);
    const sinEvaluar = calificacion === 'Sin evaluar' || calNum === 0;
    const ratingColor = sinEvaluar ? '#9ca3af' : calNum >= 7 ? '#16a34a' : calNum >= 5 ? '#d97706' : '#dc2626';

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
            // Main content area
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
                  // Top: brand + badge
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
                              fontSize: '20px',
                              fontWeight: 700,
                              color: '#6C1458',
                              backgroundColor: '#fdf4f7',
                              padding: '10px 24px',
                              borderRadius: '999px',
                              border: '2px solid #fad1e3',
                            },
                            children: 'Perfil de Profesor',
                          },
                        },
                      ],
                    },
                  },

                  // Center: name + stats
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '28px',
                        flex: 1,
                        justifyContent: 'center',
                      },
                      children: [
                        // Professor name
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: nombre.length > 30 ? '60px' : '72px',
                              fontWeight: 700,
                              color: '#111827',
                              lineHeight: 1.05,
                              letterSpacing: '-3px',
                            },
                            children: nombre,
                          },
                        },

                        // Stats row
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              gap: '20px',
                              alignItems: 'center',
                            },
                            children: [
                              // Calificación
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '6px',
                                    backgroundColor: '#f9fafb',
                                    border: '1.5px solid #e5e7eb',
                                    borderRadius: '16px',
                                    padding: '16px 30px',
                                  },
                                  children: [
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '64px',
                                          fontWeight: 700,
                                          color: ratingColor,
                                          lineHeight: 1,
                                          letterSpacing: '-2px',
                                        },
                                        children: sinEvaluar ? '—' : calificacion,
                                      },
                                    },
                                    ...(sinEvaluar
                                      ? []
                                      : [
                                          {
                                            type: 'div',
                                            props: {
                                              style: {
                                                display: 'flex',
                                                fontSize: '32px',
                                                fontWeight: 400,
                                                color: '#9ca3af',
                                              },
                                              children: '/10',
                                            },
                                          },
                                        ]),
                                  ],
                                },
                              },

                              // Evaluaciones
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: '#f9fafb',
                                    border: '1.5px solid #e5e7eb',
                                    borderRadius: '16px',
                                    padding: '16px 30px',
                                  },
                                  children: [
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '52px',
                                          fontWeight: 700,
                                          color: '#111827',
                                          lineHeight: 1,
                                          letterSpacing: '-1px',
                                        },
                                        children: String(evaluaciones),
                                      },
                                    },
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '20px',
                                          fontWeight: 400,
                                          color: '#9ca3af',
                                          marginTop: '4px',
                                        },
                                        children: 'evaluaciones',
                                      },
                                    },
                                  ],
                                },
                              },

                              // Recomendación
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: '#f9fafb',
                                    border: '1.5px solid #e5e7eb',
                                    borderRadius: '16px',
                                    padding: '16px 30px',
                                  },
                                  children: [
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '52px',
                                          fontWeight: 700,
                                          color: '#6C1458',
                                          lineHeight: 1,
                                          letterSpacing: '-1px',
                                        },
                                        children: `${recomendacion}%`,
                                      },
                                    },
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '20px',
                                          fontWeight: 400,
                                          color: '#9ca3af',
                                          marginTop: '4px',
                                        },
                                        children: 'lo recomienda',
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
                      children: 'Evalúa profesores del IPN de forma 100% anónima · ipnprofes.com',
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
