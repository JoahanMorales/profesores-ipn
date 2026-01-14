import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerReportes, 
  toggleOcultarEvaluacion, 
  eliminarEvaluacion,
  actualizarReporte
} from '../services/adminService';

// ⚠️ Admin configurado para username: Yojan
const ADMIN_USERNAME = 'Yojan';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [esAdmin, setEsAdmin] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    verificarAcceso();
  }, [user]);

  useEffect(() => {
    if (esAdmin) {
      cargarReportes();
    }
  }, [filtroEstado, esAdmin]);

  const verificarAcceso = () => {
    // Verificar si el usuario está logueado y tiene username 'Yojan'
    if (!user || user.username !== ADMIN_USERNAME) {
      setEsAdmin(false);
      setVerificando(false);
      setTimeout(() => navigate('/'), 2000);
    } else {
      setEsAdmin(true);
      setVerificando(false);
    }
  };

  const cargarReportes = async () => {
    setLoading(true);
    const result = await obtenerReportes(filtroEstado === 'todos' ? null : filtroEstado);
    if (result.success) {
      setReportes(result.data);
    }
    setLoading(false);
  };

  const handleOcultarEvaluacion = async (evaluacionId, ocultar) => {
    if (!confirm(`¿${ocultar ? 'Ocultar' : 'Mostrar'} esta evaluación?`)) return;
    
    const result = await toggleOcultarEvaluacion(evaluacionId, ocultar);
    if (result.success) {
      cargarReportes();
    }
  };

  const handleEliminarEvaluacion = async (evaluacionId, reporteId) => {
    if (!confirm('⚠️ ¿ELIMINAR PERMANENTEMENTE esta evaluación? Esta acción NO se puede deshacer.')) return;
    
    const result = await eliminarEvaluacion(evaluacionId);
    if (result.success) {
      await actualizarReporte(reporteId, 'revisado', 'Evaluación eliminada');
      cargarReportes();
    }
  };

  const handleMarcarRevisado = async (reporteId, estado) => {
    const result = await actualizarReporte(reporteId, estado);
    if (result.success) {
      cargarReportes();
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ipn-guinda-900"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg border-2 border-red-500">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder al panel de administración.</p>
          <p className="text-sm text-gray-500">Serás redirigido en unos momentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/buscar')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Volver</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            
            {/* Filtros */}
            <div className="flex items-center gap-2">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-ipn-guinda-900 focus:border-transparent"
              >
                <option value="pendiente">Pendientes</option>
                <option value="revisado">Revisados</option>
                <option value="rechazado">Rechazados</option>
                <option value="todos">Todos</option>
              </select>
              
              <button
                onClick={cargarReportes}
                className="px-4 py-2 bg-ipn-guinda-900 text-white rounded-md hover:bg-ipn-guinda-800 transition-colors text-sm font-medium"
              >
                Actualizar
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ipn-guinda-900"></div>
          </div>
        ) : reportes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay reportes {filtroEstado !== 'todos' && filtroEstado}</h3>
            <p className="text-gray-600">¡Excelente! No hay contenido reportado en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportes.map((reporte) => (
              <div key={reporte.reporte_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reporte.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        reporte.estado === 'revisado' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reporte.estado.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {reporte.tipo_reporte}
                      </span>
                      {reporte.evaluacion_oculta && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          👁️ OCULTA
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Reportado por:</strong> {reporte.reportado_por || 'Anónimo'}
                      <span className="mx-2">•</span>
                      <strong>Fecha:</strong> {new Date(reporte.fecha_reporte).toLocaleDateString('es-MX', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                    
                    <p className="text-gray-700 mb-3">
                      <strong>Motivo:</strong> {reporte.descripcion}
                    </p>
                  </div>
                </div>

                {/* Información de la evaluación */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Evaluación Reportada:</h4>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Profesor:</strong> {reporte.profesor_nombre}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Materia:</strong> {reporte.materia}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Calificación:</strong> {reporte.calificacion}/5 • 
                      {reporte.recomendado ? ' ✓ Recomendado' : ' ✗ No recomendado'} • 
                      {reporte.asistencia_obligatoria ? ' Asistencia obligatoria' : ' Sin asistencia obligatoria'}
                    </p>
                    {reporte.calificacion_obtenida && (
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Calificación obtenida:</strong> {reporte.calificacion_obtenida}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <strong>Opinión:</strong> {reporte.opinion}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  {reporte.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleOcultarEvaluacion(reporte.evaluacion_id, !reporte.evaluacion_oculta)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          reporte.evaluacion_oculta
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {reporte.evaluacion_oculta ? '👁️ Mostrar' : '🙈 Ocultar'}
                      </button>
                      
                      <button
                        onClick={() => handleEliminarEvaluacion(reporte.evaluacion_id, reporte.reporte_id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        🗑️ Eliminar Permanentemente
                      </button>
                      
                      <button
                        onClick={() => handleMarcarRevisado(reporte.reporte_id, 'revisado')}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        ✅ Marcar Revisado
                      </button>
                      
                      <button
                        onClick={() => handleMarcarRevisado(reporte.reporte_id, 'rechazado')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        ❌ Rechazar Reporte
                      </button>
                    </>
                  )}
                  
                  {reporte.estado !== 'pendiente' && (
                    <div className="text-sm text-gray-600">
                      <strong>Notas:</strong> {reporte.notas_admin || 'Sin notas'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
