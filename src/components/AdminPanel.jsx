import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerReportes, 
  toggleOcultarEvaluacion, 
  eliminarEvaluacion,
  actualizarReporte,
  obtenerEventosAdmin,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  obtenerArticulosAdmin,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo
} from '../services/adminService';

// ⚠️ Admin configurado para username: Yojan
const ADMIN_USERNAME = 'Yojan';

// ── Helpers ──────────────────────────────────────────────
const slugify = (text) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const EVENTO_VACIO = {
  titulo: '', slug: '', descripcion: '', contenido: '',
  fecha_inicio: '', fecha_fin: '', hora: '', lugar: '',
  categoria: 'Académico', link_externo: '', destacado: false, publicado: true,
  nombre_contribuidor: '', instagram_contribuidor: '', escuela_contribuidor: '',
};

const ARTICULO_VACIO = {
  titulo: '', slug: '', resumen: '', contenido: '',
  categoria: 'Noticias', tiempo_lectura: '5 min', publicado: true,
  nombre_contribuidor: '', instagram_contribuidor: '', escuela_contribuidor: '',
};

const CATEGORIAS_EVENTO = ['Académico', 'Cultural', 'Deportivo', 'Tecnología', 'Social', 'Institucional'];
const CATEGORIAS_BLOG = ['Noticias', 'Tecnología', 'Guías', 'Comunidad', 'Opinión'];

// ── Sub-components ───────────────────────────────────────

/* ---------- Reportes Tab ---------- */
const ReportesTab = ({ reportes, loading, filtroEstado, setFiltroEstado, cargarReportes,
  handleOcultarEvaluacion, handleEliminarEvaluacion, handleMarcarRevisado }) => (
  <>
    <div className="flex items-center gap-3 mb-6">
      <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-ipn-guinda-900">
        <option value="pendiente">Pendientes</option>
        <option value="revisado">Revisados</option>
        <option value="rechazado">Rechazados</option>
        <option value="todos">Todos</option>
      </select>
      <button onClick={cargarReportes}
        className="px-4 py-2 bg-ipn-guinda-900 text-white rounded-lg hover:bg-ipn-guinda-800 text-sm font-medium">
        Actualizar
      </button>
    </div>

    {loading ? <Spinner /> : reportes.length === 0 ? (
      <EmptyState icon="📋" title={`No hay reportes ${filtroEstado !== 'todos' ? filtroEstado : ''}`}
        desc="¡Excelente! No hay contenido reportado en este momento." />
    ) : (
      <div className="space-y-4">
        {reportes.map((r) => (
          <div key={r.reporte_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                r.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                r.estado === 'revisado' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>{r.estado.toUpperCase()}</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{r.tipo_reporte}</span>
              {r.evaluacion_oculta && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">👁️ OCULTA</span>}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong>Reportado por:</strong> {r.reportado_por || 'Anónimo'} <span className="mx-2">•</span>
              <strong>Fecha:</strong> {new Date(r.fecha_reporte).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-3"><strong>Motivo:</strong> {r.descripcion}</p>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Evaluación Reportada:</h4>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <p><strong>Profesor:</strong> {r.profesor_nombre}</p>
                <p><strong>Materia:</strong> {r.materia}</p>
                <p><strong>Calificación:</strong> {r.calificacion}/5 • {r.recomendado ? '✓ Recomendado' : '✗ No recomendado'} • {r.asistencia_obligatoria ? 'Asistencia obligatoria' : 'Sin asistencia obligatoria'}</p>
                {r.calificacion_obtenida && <p><strong>Calificación obtenida:</strong> {r.calificacion_obtenida}</p>}
                <p><strong>Opinión:</strong> {r.opinion}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {r.estado === 'pendiente' ? (
                <>
                  <button onClick={() => handleOcultarEvaluacion(r.evaluacion_id, !r.evaluacion_oculta)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${r.evaluacion_oculta ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                    {r.evaluacion_oculta ? '👁️ Mostrar' : '🙈 Ocultar'}
                  </button>
                  <button onClick={() => handleEliminarEvaluacion(r.evaluacion_id, r.reporte_id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 text-sm font-medium">
                    🗑️ Eliminar
                  </button>
                  <button onClick={() => handleMarcarRevisado(r.reporte_id, 'revisado')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 text-sm font-medium">
                    ✅ Revisado
                  </button>
                  <button onClick={() => handleMarcarRevisado(r.reporte_id, 'rechazado')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 text-sm font-medium">
                    ❌ Rechazar
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Notas:</strong> {r.notas_admin || 'Sin notas'}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </>
);

/* ---------- Evento Form ---------- */
const EventoForm = ({ data, onChange, onSubmit, onCancel, saving }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
      {data.id ? 'Editar Evento' : 'Nuevo Evento'}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Título" value={data.titulo} onChange={(v) => { onChange({ ...data, titulo: v, slug: data.id ? data.slug : slugify(v) }); }} />
      <Input label="Slug" value={data.slug} onChange={(v) => onChange({ ...data, slug: v })} />
      <Input label="Fecha inicio" type="date" value={data.fecha_inicio} onChange={(v) => onChange({ ...data, fecha_inicio: v })} />
      <Input label="Fecha fin" type="date" value={data.fecha_fin} onChange={(v) => onChange({ ...data, fecha_fin: v })} />
      <Input label="Hora" value={data.hora} onChange={(v) => onChange({ ...data, hora: v })} placeholder="10:00 - 14:00" />
      <Input label="Lugar" value={data.lugar} onChange={(v) => onChange({ ...data, lugar: v })} />
      <Select label="Categoría" value={data.categoria} onChange={(v) => onChange({ ...data, categoria: v })} options={CATEGORIAS_EVENTO} />
      <Input label="Link externo" value={data.link_externo} onChange={(v) => onChange({ ...data, link_externo: v })} placeholder="https://..." />
      <div className="md:col-span-2">
        <TextArea label="Descripción corta" value={data.descripcion} onChange={(v) => onChange({ ...data, descripcion: v })} rows={2} />
      </div>
      <div className="md:col-span-2">
        <TextArea label="Contenido (Markdown)" value={data.contenido} onChange={(v) => onChange({ ...data, contenido: v })} rows={8} />
      </div>
      <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Autor (dejar vacío si es de IPNProfes)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Nombre" value={data.nombre_contribuidor} onChange={(v) => onChange({ ...data, nombre_contribuidor: v })} placeholder="Se mostrará 'IPNProfes' si queda vacío" />
          <Input label="Instagram" value={data.instagram_contribuidor} onChange={(v) => onChange({ ...data, instagram_contribuidor: v })} placeholder="@usuario" />
          <Input label="Escuela" value={data.escuela_contribuidor} onChange={(v) => onChange({ ...data, escuela_contribuidor: v })} placeholder="ESCOM, UPIITA..." />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Checkbox label="Publicado" checked={data.publicado} onChange={(v) => onChange({ ...data, publicado: v })} />
        <Checkbox label="Destacado" checked={data.destacado} onChange={(v) => onChange({ ...data, destacado: v })} />
      </div>
    </div>
    <div className="flex gap-3 mt-6">
      <button onClick={onSubmit} disabled={saving}
        className="px-6 py-2 bg-ipn-guinda-900 text-white rounded-lg hover:bg-ipn-guinda-800 disabled:opacity-50 text-sm font-medium">
        {saving ? 'Guardando...' : data.id ? 'Actualizar' : 'Crear'}
      </button>
      <button onClick={onCancel} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium">
        Cancelar
      </button>
    </div>
  </div>
);

/* ---------- Eventos Tab ---------- */
const EventosTab = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // null=list, obj=form
  const [saving, setSaving] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    const r = await obtenerEventosAdmin();
    if (r.success) setEventos(r.data);
    setLoading(false);
  };

  const handleGuardar = async () => {
    if (!editando.titulo || !editando.slug) return alert('Título y slug son obligatorios');
    setSaving(true);
    const res = editando.id
      ? await actualizarEvento(editando.id, editando)
      : await crearEvento(editando);
    setSaving(false);
    if (res.success) { setEditando(null); cargar(); }
    else alert('Error: ' + (res.error || 'No se pudo guardar'));
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este evento permanentemente?')) return;
    const res = await eliminarEvento(id);
    if (res.success) cargar();
    else alert('Error al eliminar');
  };

  if (loading) return <Spinner />;
  if (editando) return <EventoForm data={editando} onChange={setEditando} onSubmit={handleGuardar} onCancel={() => setEditando(null)} saving={saving} />;

  return (
    <>
      <button onClick={() => setEditando({ ...EVENTO_VACIO })}
        className="mb-6 px-5 py-2.5 bg-ipn-guinda-900 text-white rounded-lg hover:bg-ipn-guinda-800 text-sm font-medium flex items-center gap-2">
        <span className="text-lg leading-none">+</span> Nuevo Evento
      </button>

      {eventos.length === 0 ? (
        <EmptyState icon="📅" title="Sin eventos" desc="Crea el primer evento desde el botón de arriba." />
      ) : (
        <div className="space-y-3">
          {eventos.map((e) => (
            <div key={e.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">{e.titulo}</h4>
                  {!e.publicado && <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Borrador</span>}
                  {e.destacado && <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">⭐ Destacado</span>}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {e.categoria} • {e.fecha_inicio ? new Date(e.fecha_inicio + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                  {e.lugar && ` • ${e.lugar}`}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => setEditando({ ...e })}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-medium">
                  Editar
                </button>
                <button onClick={() => handleEliminar(e.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 text-sm font-medium">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ---------- Articulo Form ---------- */
const ArticuloForm = ({ data, onChange, onSubmit, onCancel, saving }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
      {data.id ? 'Editar Artículo' : 'Nuevo Artículo'}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Título" value={data.titulo} onChange={(v) => { onChange({ ...data, titulo: v, slug: data.id ? data.slug : slugify(v) }); }} />
      <Input label="Slug" value={data.slug} onChange={(v) => onChange({ ...data, slug: v })} />
      <Select label="Categoría" value={data.categoria} onChange={(v) => onChange({ ...data, categoria: v })} options={CATEGORIAS_BLOG} />
      <Input label="Tiempo de lectura" value={data.tiempo_lectura} onChange={(v) => onChange({ ...data, tiempo_lectura: v })} placeholder="5 min" />
      <div className="flex items-center">
        <Checkbox label="Publicado" checked={data.publicado} onChange={(v) => onChange({ ...data, publicado: v })} />
      </div>
      <div className="md:col-span-2">
        <TextArea label="Resumen" value={data.resumen} onChange={(v) => onChange({ ...data, resumen: v })} rows={2} />
      </div>
      <div className="md:col-span-2">
        <TextArea label="Contenido (Markdown)" value={data.contenido} onChange={(v) => onChange({ ...data, contenido: v })} rows={10} />
      </div>
      <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Autor (dejar vacío si es de IPNProfes)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Nombre" value={data.nombre_contribuidor} onChange={(v) => onChange({ ...data, nombre_contribuidor: v })} placeholder="Se mostrará 'IPNProfes' si queda vacío" />
          <Input label="Instagram" value={data.instagram_contribuidor} onChange={(v) => onChange({ ...data, instagram_contribuidor: v })} placeholder="@usuario" />
          <Input label="Escuela" value={data.escuela_contribuidor} onChange={(v) => onChange({ ...data, escuela_contribuidor: v })} placeholder="ESCOM, UPIITA..." />
        </div>
      </div>
    </div>
    <div className="flex gap-3 mt-6">
      <button onClick={onSubmit} disabled={saving}
        className="px-6 py-2 bg-ipn-guinda-900 text-white rounded-lg hover:bg-ipn-guinda-800 disabled:opacity-50 text-sm font-medium">
        {saving ? 'Guardando...' : data.id ? 'Actualizar' : 'Crear'}
      </button>
      <button onClick={onCancel} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium">
        Cancelar
      </button>
    </div>
  </div>
);

/* ---------- Blog Tab ---------- */
const BlogTab = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    const r = await obtenerArticulosAdmin();
    if (r.success) setArticulos(r.data);
    setLoading(false);
  };

  const handleGuardar = async () => {
    if (!editando.titulo || !editando.slug) return alert('Título y slug son obligatorios');
    setSaving(true);
    const res = editando.id
      ? await actualizarArticulo(editando.id, editando)
      : await crearArticulo(editando);
    setSaving(false);
    if (res.success) { setEditando(null); cargar(); }
    else alert('Error: ' + (res.error || 'No se pudo guardar'));
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este artículo permanentemente?')) return;
    const res = await eliminarArticulo(id);
    if (res.success) cargar();
    else alert('Error al eliminar');
  };

  if (loading) return <Spinner />;
  if (editando) return <ArticuloForm data={editando} onChange={setEditando} onSubmit={handleGuardar} onCancel={() => setEditando(null)} saving={saving} />;

  return (
    <>
      <button onClick={() => setEditando({ ...ARTICULO_VACIO })}
        className="mb-6 px-5 py-2.5 bg-ipn-guinda-900 text-white rounded-lg hover:bg-ipn-guinda-800 text-sm font-medium flex items-center gap-2">
        <span className="text-lg leading-none">+</span> Nuevo Artículo
      </button>

      {articulos.length === 0 ? (
        <EmptyState icon="📝" title="Sin artículos" desc="Crea el primer artículo desde el botón de arriba." />
      ) : (
        <div className="space-y-3">
          {articulos.map((a) => (
            <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">{a.titulo}</h4>
                  {!a.publicado && <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Borrador</span>}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {a.categoria} • {a.autor} • {a.tiempo_lectura}
                  {a.created_at && ` • ${new Date(a.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => setEditando({ ...a })}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-medium">
                  Editar
                </button>
                <button onClick={() => handleEliminar(a.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 text-sm font-medium">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ---------- Shared form controls ---------- */
const Input = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-ipn-guinda-900 focus:border-transparent" />
  </div>
);

const TextArea = ({ label, value, onChange, rows = 4 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={rows}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-ipn-guinda-900 focus:border-transparent resize-y" />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-ipn-guinda-900 focus:border-transparent">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-ipn-guinda-900 focus:ring-ipn-guinda-900" />
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
  </label>
);

const Spinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ipn-guinda-900"></div>
  </div>
);

const EmptyState = ({ icon, title, desc }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <span className="text-5xl block mb-4">{icon}</span>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{desc}</p>
  </div>
);

// ── Main Component ───────────────────────────────────────
const TABS = [
  { key: 'reportes', label: 'Reportes', icon: '📋' },
  { key: 'eventos',  label: 'Eventos',  icon: '📅' },
  { key: 'blog',     label: 'Blog',     icon: '📝' },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('reportes');
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [esAdmin, setEsAdmin] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => { verificarAcceso(); }, [user]);
  useEffect(() => { if (esAdmin && tab === 'reportes') cargarReportes(); }, [filtroEstado, esAdmin, tab]);

  const verificarAcceso = () => {
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
    if (result.success) setReportes(result.data);
    setLoading(false);
  };

  const handleOcultarEvaluacion = async (evaluacionId, ocultar) => {
    if (!confirm(`¿${ocultar ? 'Ocultar' : 'Mostrar'} esta evaluación?`)) return;
    const result = await toggleOcultarEvaluacion(evaluacionId, ocultar);
    if (result.success) cargarReportes();
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
    if (result.success) cargarReportes();
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ipn-guinda-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border-2 border-red-500">
          <span className="text-5xl block mb-4">⛔</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No tienes permisos para acceder al panel de administración.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Serás redirigido en unos momentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/buscar')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Volver</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-ipn-guinda-900 text-ipn-guinda-900 dark:text-ipn-guinda-300 dark:border-ipn-guinda-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}>
                <span className="mr-2">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === 'reportes' && (
          <ReportesTab
            reportes={reportes} loading={loading}
            filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado}
            cargarReportes={cargarReportes}
            handleOcultarEvaluacion={handleOcultarEvaluacion}
            handleEliminarEvaluacion={handleEliminarEvaluacion}
            handleMarcarRevisado={handleMarcarRevisado}
          />
        )}
        {tab === 'eventos' && <EventosTab />}
        {tab === 'blog' && <BlogTab />}
      </main>
    </div>
  );
};

export default AdminPanel;
