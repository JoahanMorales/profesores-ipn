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
                              fontSize: titulo.length > 50 ? '52px' : '68px',
                              fontWeight: 700,
                              color: '#111827',
                              lineHeight: 1.1,
                              letterSpacing: '-3px',
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
                                    fontSize: '26px',
                                    fontWeight: 400,
                                    color: '#6b7280',
                                    lineHeight: 1.45,
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
                        borderTop: '2px solid #e5e7eb',
                        paddingTop: '20px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: '24px',
                              fontWeight: 700,
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
                              fontSize: '24px',
                              fontWeight: 400,
                              color: '#6b7280',
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
