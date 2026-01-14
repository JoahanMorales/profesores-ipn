import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos de Servicio</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar esta plataforma, aceptas estar sujeto a estos Términos de Servicio y a nuestra Política de Privacidad. 
                Si no estás de acuerdo con alguna parte de estos términos, no debes usar el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del Servicio</h2>
              <p>
                Esta plataforma permite a estudiantes evaluar y compartir opiniones sobre profesores del IPN. 
                Es un proyecto estudiantil independiente que <strong>NO está afiliado, respaldado ni aprobado por el Instituto Politécnico Nacional</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Uso Responsable</h2>
              <p className="mb-2">Al usar esta plataforma, te comprometes a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar información veraz y basada en tu experiencia académica real</li>
                <li>No publicar contenido ofensivo, difamatorio, discriminatorio o que viole derechos de terceros</li>
                <li>No utilizar el servicio para acosar, intimidar o amenazar a personas</li>
                <li>Respetar la privacidad de profesores y otros usuarios</li>
                <li>No intentar manipular las calificaciones o el sistema de evaluación</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Contenido del Usuario</h2>
              <p>
                Eres responsable del contenido que publicas. Nos reservamos el derecho de eliminar cualquier contenido que viole estos términos 
                o que consideremos inapropiado, sin previo aviso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Limitación de Responsabilidad</h2>
              <p>
                Las opiniones expresadas en esta plataforma son de los usuarios y no reflejan la posición de Axocode ni del IPN. 
                No garantizamos la exactitud, completitud o utilidad de las evaluaciones publicadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Privacidad</h2>
              <p>
                Tu privacidad es importante. Consulta nuestra <a href="/privacidad" className="text-ipn-guinda-900 hover:underline font-medium">Política de Privacidad</a> para 
                entender cómo recopilamos, usamos y protegemos tu información.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Modificaciones</h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Los cambios significativos serán notificados en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contacto</h2>
              <p>
                Si tienes preguntas sobre estos términos o necesitas reportar contenido inapropiado, 
                visita nuestra página de <a href="/reportar" className="text-ipn-guinda-900 hover:underline font-medium">reportes</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
