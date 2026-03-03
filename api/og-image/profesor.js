import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(request) {
  try {
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
                              fontSize: nombre.length > 30 ? '52px' : '64px',
                              fontWeight: 800,
                              color: '#111827',
                              lineHeight: 1.1,
                              letterSpacing: '-2px',
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
                                          fontSize: '54px',
                                          fontWeight: 800,
                                          color: ratingColor,
                                          lineHeight: 1,
                                          letterSpacing: '-1px',
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
                                                fontSize: '26px',
                                                fontWeight: 600,
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
                                          fontSize: '42px',
                                          fontWeight: 800,
                                          color: '#111827',
                                          lineHeight: 1,
                                          letterSpacing: '-0.5px',
                                        },
                                        children: String(evaluaciones),
                                      },
                                    },
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '16px',
                                          fontWeight: 500,
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
                                          fontSize: '42px',
                                          fontWeight: 800,
                                          color: '#6C1458',
                                          lineHeight: 1,
                                          letterSpacing: '-0.5px',
                                        },
                                        children: `${recomendacion}%`,
                                      },
                                    },
                                    {
                                      type: 'div',
                                      props: {
                                        style: {
                                          display: 'flex',
                                          fontSize: '16px',
                                          fontWeight: 500,
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
                        borderTop: '1.5px solid #e5e7eb',
                        paddingTop: '18px',
                        fontSize: '18px',
                        color: '#9ca3af',
                        fontWeight: 500,
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
      { width: 1200, height: 630 }
    );
  } catch (err) {
    return new Response('Error generando imagen', { status: 500 });
  }
}
