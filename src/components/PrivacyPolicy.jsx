import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Volver</span>
          </button>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-500 mb-6">
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Información que Recopilamos
            </h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              1.1 Información Anónima
            </h3>
            <p className="text-gray-700 mb-4">
              <strong className="text-ipn-guinda-900">ip</strong> es una plataforma orientada al anonimato. NO recopilamos:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Nombres reales</li>
              <li>Correos electrónicos</li>
              <li>Números telefónicos</li>
              <li>Direcciones</li>
              <li>Información personal identificable</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">
              1.2 Información Técnica (Anónima)
            </h3>
            <p className="text-gray-700 mb-2">
              Para mejorar la seguridad y experiencia, recopilamos datos técnicos no identificables:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Huella digital del navegador (configuración técnica del dispositivo)</li>
              <li>Datos de sesión (timestamps de inicio/cierre)</li>
              <li>Estadísticas de uso (páginas visitadas, tiempo en el sitio)</li>
              <li>Información del dispositivo (tipo de navegador, sistema operativo)</li>
            </ul>
            <div className="bg-ipn-guinda-50 border-l-4 border-ipn-guinda-900 p-4 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Importante:</strong> Esta información NO puede vincularse a tu identidad real.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Cómo Usamos Tu Información
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>✅ Detectar y prevenir múltiples cuentas (sistema anti-spam)</li>
              <li>✅ Mejorar la experiencia del usuario</li>
              <li>✅ Analizar patrones de uso para optimizar la plataforma</li>
              <li>✅ Mantener la integridad de las evaluaciones</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Sistema de Monedas Premium
            </h2>
            <p className="text-gray-700">
              Las monedas ganadas se asocian a tu dispositivo (no a ti como persona). Podrás usar estas 
              monedas para funciones exclusivas futuras. El sistema respeta completamente tu anonimato.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Cookies y Tecnologías Similares
            </h2>
            <p className="text-gray-700 mb-2">
              Usamos <strong>localStorage</strong> para mantener tu sesión activa, guardar tu progreso 
              y cachear datos para mejorar velocidad.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Cookies de Terceros:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li><strong>Google Analytics:</strong> Analiza tráfico del sitio de forma anónima</li>
              <li><strong>Google AdSense:</strong> Muestra anuncios relevantes</li>
            </ul>
            <p className="text-sm text-gray-600">
              Puedes desactivar cookies en tu navegador, pero algunas funciones pueden no trabajar correctamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Compartir Información
            </h2>
            <p className="text-gray-700">
              <strong>NO vendemos, alquilamos ni compartimos tu información con terceros</strong>, excepto 
              con proveedores de servicios esenciales (hosting, base de datos) o cuando sea requerido por ley.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Seguridad de Datos
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Encriptación de datos en tránsito (HTTPS)</li>
              <li>Bases de datos protegidas con RLS (Row Level Security)</li>
              <li>Validación de datos en cliente y servidor</li>
              <li>Monitoreo de actividad anómala</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Tus Derechos
            </h2>
            <p className="text-gray-700 mb-2">Tienes derecho a:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Acceder:</strong> Ver qué información técnica almacenamos</li>
              <li><strong>Eliminar:</strong> Borrar tu cuenta y datos asociados</li>
              <li><strong>Rectificar:</strong> Corregir evaluaciones previas</li>
              <li><strong>Oponerte:</strong> Dejar de usar la plataforma en cualquier momento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Google AdSense
            </h2>
            <p className="text-gray-700 mb-2">
              Esta plataforma utiliza Google AdSense para mostrar anuncios. Google puede usar cookies para 
              mostrar anuncios basados en visitas previas y medir la efectividad de anuncios.
            </p>
            <p className="text-gray-700">
              Puedes optar por no recibir anuncios personalizados visitando{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ipn-guinda-900 hover:underline"
              >
                Configuración de Anuncios de Google
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Contacto
            </h2>
            <p className="text-gray-700 mb-2">Para dudas sobre esta política:</p>
            <ul className="list-none text-gray-700 space-y-1">
              <li>
                <strong>Instagram:</strong>{' '}
                <a
                  href="https://instagram.com/joahan_morap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ipn-guinda-900 hover:underline"
                >
                  @joahan_morap
                </a>
              </li>
              <li>
                <strong>LinkedIn:</strong>{' '}
                <a
                  href="https://linkedin.com/in/joahan-morales"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ipn-guinda-900 hover:underline"
                >
                  Joahan Morales
                </a>
              </li>
              <li><strong>Empresa:</strong> Axocode</li>
            </ul>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-center text-lg font-semibold text-ipn-guinda-900">
              Tu privacidad es sagrada. Tu anonimato es nuestra prioridad.
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Esta plataforma es independiente y no está afiliada oficialmente con el IPN.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-ipn-guinda-900 text-white rounded-md hover:bg-ipn-guinda-800 transition-colors"
          >
            Volver
          </button>
        </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
