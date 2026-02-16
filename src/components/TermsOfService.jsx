import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
                Tu privacidad es importante. Consulta nuestra <a href="/privacy" className="text-ipn-guinda-900 hover:underline font-medium">Política de Privacidad</a> para
                entender cómo recopilamos, usamos y protegemos tu información.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Preámbulo</h2>
              <p>
                Todo el material contenido en este sitio Web y sus correspondientes subdirectorios se encuentran protegidos.
                Todas las marcas, logotipos e imágenes de terceros mencionadas o mostradas son propiedad de sus respectivos dueños.
              </p>
              <p className="mt-3">
                El contenido presente indica que bajo ninguna circunstancia se podrá distribuir, almacenar, transferir, reproducir, publicar o explotar total o parcialmente
                la información, imágenes, logotipos, textos, clips de audio, video, etc. que se encuentren almacenados en los servidores de esta plataforma sin el consentimiento
                del autor, licenciatario o titular del derecho patrimonial, así como de la autorización previa y por escrito de los responsables de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre el tipo de contenidos</h2>
              <p>
                Nos reservamos el derecho de eliminar o modificar contenidos y/o anuncios publicados por los usuarios que vayan en contra de los buenos valores y costumbres.
                Los contenidos inapropiados incluyen, pero no se limitan a:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Material pornográfico o desnudos totales o parciales</li>
                <li>Material violento o sádico</li>
                <li>Material que claramente viole derechos de autor</li>
                <li>Enlaces a sitios con contenido inapropiado o ilegal</li>
                <li>Programas o recursos que violen leyes locales o nacionales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Renuncia</h2>
              <p>
                Los materiales contenidos en esta plataforma se proveen "tal cual". No nos responsabilizamos del uso indebido que los usuarios puedan hacer de los contenidos publicados
                por los mismos, incluyendo la retransmisión total o parcial de contenidos con derechos de autor, vínculos a sitios transmisores de malware, o uso de materiales ofensivos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitaciones</h2>
              <p>
                En ningún caso la plataforma o sus proveedores serán responsables por cualquier daño (incluyendo pérdida de datos o beneficios, daños morales o de imagen pública)
                que surjan del uso o la imposibilidad de usar los materiales en este sitio, incluso si se ha notificado la posibilidad de tales daños.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Revisiones y Erratas</h2>
              <p>
                El contenido podría incluir errores técnicos, tipográficos o fotográficos. No garantizamos que cualquiera de los materiales sea preciso, completo o actualizado.
                Podemos hacer cambios en cualquier momento sin previo aviso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Vínculos</h2>
              <p>
                No hemos revisado todos los sitios vinculados ni el contenido publicado por usuarios en sitios ajenos; por ello no somos responsables por el contenido de dichos sitios.
                La inclusión de vínculos no implica aprobación y el uso de sitios vinculados es bajo el propio riesgo del usuario.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Términos de modificación</h2>
              <p>
                Nos reservamos el derecho a actualizar este documento en cualquier momento sin previo aviso. Es responsabilidad del usuario revisar periódicamente estos términos.
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
