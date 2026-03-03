import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import CoinAnimation from './CoinAnimation';
import SearchableSelect from './SearchableSelect';
import Turnstile, { isTurnstileEnabled } from './Turnstile';
import { 
  obtenerEscuelas, 
  obtenerCarrerasPorEscuela, 
  autocompletarProfesores,
  crearEvaluacionSegura,
  obtenerProfesorPorSlug
} from '../services/supabaseService';
import { buscarDuplicados } from '../services/adminService';
import { checkRateLimit } from '../lib/rateLimiter';
import { verificarContenido } from '../lib/contentFilter';
import { useSEO } from '../hooks/useSEO';

const EvaluationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout, monedas, updateMonedas } = useAuth();
  
  const [formData, setFormData] = useState({
    nombreProfesor: '',
    escuelaId: '',
    carreraId: '',
    materia: '',
    calificacion: 5,
    recomendado: true,
    asistenciaObligatoria: false,
    calificacionObtenida: '',
    opinion: ''
  });

  const [errors, setErrors] = useState({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(5);
  const [nombreBloqueado, setNombreBloqueado] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [showContentModal, setShowContentModal] = useState(false);
  const [flaggedWords, setFlaggedWords] = useState([]);

  // Estados para datos de Supabase
  const [escuelas, setEscuelas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [profesoresSugeridos, setProfesoresSugeridos] = useState([]);
  const [duplicadosPotenciales, setDuplicadosPotenciales] = useState([]);
  const [mostrarAlertaDuplicados, setMostrarAlertaDuplicados] = useState(false);

  // SEO dinámico
  useSEO(
    'Evaluar Profesor | ip - Comparte tu experiencia',
    'Evalúa a un profesor del IPN de forma anónima. Comparte tu experiencia y ayuda a otros estudiantes a elegir a los mejores profesores.',
    'evaluar profesor IPN, opiniones profesores, calificar docente, evaluación anónima'
  );

  // Cargar datos del profesor desde URL params o location.state
  useEffect(() => {
    const autocompletarDatos = async () => {
      // Intentar desde URL params
      const nombreParam = searchParams.get('nombre');
      const slugParam = searchParams.get('slug');
      
      // O desde location.state
      const profesorState = location.state?.profesor;
      
      if (nombreParam) {
        setFormData(prev => ({
          ...prev,
          nombreProfesor: nombreParam
        }));
        // Bloquear el input si viene de la URL
        setNombreBloqueado(true);
      } else if (profesorState) {
        setFormData(prev => ({
          ...prev,
          nombreProfesor: profesorState.nombre_completo || profesorState.nombre
        }));
        // Bloquear el input si viene del state
        setNombreBloqueado(true);
      }
    };

    autocompletarDatos();
  }, [searchParams, location.state]);

  // Cargar escuelas al montar y restaurar selección previa
  useEffect(() => {
    const inicializar = async () => {
      await cargarEscuelas();

      // Restaurar escuela y carrera de la evaluación anterior
      const lastEscuela = localStorage.getItem('ipn_last_escuela');
      const lastCarrera = localStorage.getItem('ipn_last_carrera');

      if (lastEscuela) {
        setFormData(prev => ({ ...prev, escuelaId: lastEscuela }));
        // Cargar carreras de esa escuela y luego setear la carrera guardada
        const res = await obtenerCarrerasPorEscuela(lastEscuela);
        if (res.success) {
          setCarreras(res.data);
          if (lastCarrera && res.data.some(c => c.id === lastCarrera)) {
            setFormData(prev => ({ ...prev, carreraId: lastCarrera }));
          }
        }
      }
    };
    inicializar();
  }, []);

  // Cargar carreras cuando cambia la escuela
  useEffect(() => {
    if (formData.escuelaId) {
      cargarCarreras(formData.escuelaId);
    } else {
      setCarreras([]);
    }
  }, [formData.escuelaId]);

  // Autocompletar profesores
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.nombreProfesor.length >= 2) {
        buscarProfesoresAutocomplete(formData.nombreProfesor);
      } else {
        setProfesoresSugeridos([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.nombreProfesor]);

  const cargarEscuelas = async () => {
    setLoading(true);
    const resultado = await obtenerEscuelas();
    if (resultado.success) {
      setEscuelas(resultado.data);
    }
    setLoading(false);
  };

  const cargarCarreras = async (escuelaId) => {
    const resultado = await obtenerCarrerasPorEscuela(escuelaId);
    if (resultado.success) {
      setCarreras(resultado.data);
    }
  };

  const buscarProfesoresAutocomplete = async (query) => {
    const resultado = await autocompletarProfesores(query);
    if (resultado.success) {
      setProfesoresSugeridos(resultado.data);
      setShowAutocomplete(resultado.data.length > 0);
    }
    
    // Buscar duplicados potenciales
    if (query.length >= 3) {
      const duplicados = await buscarDuplicados(query);
      if (duplicados.success && duplicados.data.length > 0) {
        setDuplicadosPotenciales(duplicados.data.filter(d => d.similitud > 0.3));
        setMostrarAlertaDuplicados(duplicados.data.some(d => d.similitud > 0.3));
      } else {
        setDuplicadosPotenciales([]);
        setMostrarAlertaDuplicados(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Reset carrera si cambia la escuela
      if (name === 'escuelaId') {
        newData.carreraId = '';
      }

      return newData;
    });

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Mostrar autocomplete para nombre de profesor
    if (name === 'nombreProfesor') {
      setShowAutocomplete(value.length >= 2);
    }
  };

  // Manejar cambios numéricos para calificacionObtenida (solo números entre 1 y 10)
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    // Normalizar coma a punto y eliminar caracteres inválidos
    let cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '');
    // Evitar múltiples puntos
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    if (cleaned === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
      return;
    }

    const num = parseFloat(cleaned);
    if (isNaN(num)) return;

    // Limitar entre 1 y 10
    const clamped = Math.max(1, Math.min(10, num));

    // Mantener valor como cadena para controlar el input
    setFormData(prev => ({ ...prev, [name]: String(clamped) }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleProfesorSelect = (profesor) => {
    setFormData(prev => ({
      ...prev,
      nombreProfesor: profesor.nombre_completo
    }));
    setShowAutocomplete(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombreProfesor.trim()) {
      newErrors.nombreProfesor = 'El nombre del profesor es obligatorio';
    }

    if (!formData.escuelaId) {
      newErrors.escuelaId = 'Debes seleccionar una escuela';
    }

    if (!formData.carreraId) {
      newErrors.carreraId = 'Debes seleccionar una carrera';
    }

    if (!formData.materia.trim()) {
      newErrors.materia = 'La materia es obligatoria';
    } else if (formData.materia.trim().length < 3) {
      newErrors.materia = 'La materia debe tener al menos 3 caracteres';
    }

    if (!formData.calificacionObtenida || formData.calificacionObtenida === '') {
      newErrors.calificacionObtenida = 'La calificación obtenida es obligatoria';
    } else {
      const calificacion = parseFloat(formData.calificacionObtenida);
      if (isNaN(calificacion) || calificacion < 1 || calificacion > 10) {
        newErrors.calificacionObtenida = 'Debe ser un número entre 1 y 10';
      }
    }

    if (!formData.opinion.trim()) {
      newErrors.opinion = 'La opinión es obligatoria';
    } else if (formData.opinion.trim().length < 20) {
      newErrors.opinion = 'La opinión debe tener al menos 20 caracteres';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ⏱️ RATE LIMITING: Máximo 2 evaluaciones por minuto
    const rateLimitKey = `evaluacion_${user.username}_${user.deviceId}`;
    const rateLimit = checkRateLimit(rateLimitKey, 2, 60000); // 2 intentos por 60 segundos

    if (!rateLimit.allowed) {
      const segundosRestantes = Math.ceil(rateLimit.resetIn / 1000);
      alert(`⏱️ Límite de evaluaciones alcanzado.\n\nPara prevenir spam, solo puedes enviar 2 evaluaciones por minuto.\n\nEspera ${segundosRestantes} segundos e intenta nuevamente.`);
      return;
    }

    // Verificar CAPTCHA si está habilitado
    if (isTurnstileEnabled() && !captchaToken) {
      alert('Completa la verificación de seguridad antes de enviar.');
      return;
    }

    // 🛡️ FILTRO DE CONTENIDO: Verificar que la opinión no tenga lenguaje ofensivo
    const filtro = verificarContenido(formData.opinion);
    if (filtro.flagged) {
      setFlaggedWords(filtro.palabras);
      setShowContentModal(true);
      return;
    }

    setSubmitting(true);

    try {
      // Crear evaluación via RPC seguro (maneja usuario, profesor, monedas y eval count atómicamente)
      const evaluacionResult = await crearEvaluacionSegura(user.username, user.favoriteSong, formData, captchaToken || undefined);

      if (!evaluacionResult.success) {
        alert('Error al guardar la evaluación: ' + evaluacionResult.error);
        setSubmitting(false);
        return;
      }

      // Actualizar monedas desde la respuesta del RPC (ya incluye el nuevo balance)
      if (evaluacionResult.data?.monedas != null) {
        updateMonedas(evaluacionResult.data.monedas);
      }

      // Usar diamantes ganados del servidor (5 nuevo, 3 existente)
      const diamantesGanados = evaluacionResult.data?.diamantes_ganados || 5;
      setCoinsEarned(diamantesGanados);

      // Guardar escuela y carrera para autocompletar la próxima vez
      if (formData.escuelaId) localStorage.setItem('ipn_last_escuela', formData.escuelaId);
      if (formData.carreraId) localStorage.setItem('ipn_last_carrera', formData.carreraId);

      // Mostrar animación de monedas
      setShowCoinAnimation(true);
      
      // Reset form después de la animación (mantener escuela y carrera)
      const savedEscuela = formData.escuelaId;
      const savedCarrera = formData.carreraId;
      setTimeout(() => {
        setFormData({
          nombreProfesor: '',
          escuelaId: savedEscuela,
          carreraId: savedCarrera,
          materia: '',
          calificacion: 5,
          recomendado: true,
          asistenciaObligatoria: false,
          calificacionObtenida: '',
          opinion: ''
        });
      }, 2500);

      // Navigate to search después de la animación
      setTimeout(() => {
        navigate('/buscar');
      }, 3000);

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      alert('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/buscar')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Volver</span>
        </button>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-2">
              Evaluar Profesor
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comparte tu experiencia para ayudar a otros estudiantes
            </p>
            
            {/* Mensaje de monedas y privacidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="bg-gradient-to-r from-slate-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💎</span>
                  <div className="text-xs">
                    <p className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Gana Diamantes Premium</p>
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold">5 💎</span> si agregas un profesor nuevo · <span className="font-semibold">3 💎</span> si ya existe. Úsalos para funciones exclusivas como generación automática de horarios.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🔒</span>
                  <div className="text-xs">
                    <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Tu Privacidad es Sagrada</p>
                    <p className="text-gray-600 dark:text-gray-400">Tus datos están protegidos. Respetamos completamente la integridad y privacidad de tu información.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre del Profesor con Autocomplete */}
            <div className="relative">
              <label htmlFor="nombreProfesor" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Nombre del Profesor *
              </label>
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 rounded">
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                  💡 Para búsquedas más efectivas:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 ml-4">
                  <li>• Escribe <span className="font-semibold">apellidos primero, luego nombre</span></li>
                  <li>• Ejemplo: <span className="font-mono bg-white dark:bg-gray-800 px-1 rounded">PÉREZ GARCÍA JUAN</span></li>
                  <li>• Tal como aparece en el <span className="font-semibold">SAES</span></li>
                </ul>
              </div>
              <div className="relative flex items-center gap-2">
                <input
                  id="nombreProfesor"
                  name="nombreProfesor"
                  type="text"
                  maxLength="100"
                  value={formData.nombreProfesor}
                  onChange={handleChange}
                  onFocus={() => !nombreBloqueado && setShowAutocomplete(formData.nombreProfesor.length > 0)}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                  disabled={nombreBloqueado}
                  className={`flex-1 px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-colors ${
                    errors.nombreProfesor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${nombreBloqueado ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                  placeholder="Ej: PEREZ GARCIA JUAN"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                />
                {nombreBloqueado && (
                  <button
                    type="button"
                    onClick={() => setNombreBloqueado(false)}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-600 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-300 dark:border-gray-500 rounded-md transition-colors"
                    title="Desbloquear para editar el nombre"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {errors.nombreProfesor && (
                <p className="mt-1 text-xs text-red-600">{errors.nombreProfesor}</p>
              )}

              {/* Alerta de duplicados potenciales */}
              {mostrarAlertaDuplicados && duplicadosPotenciales.length > 0 && (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        ⚠️ ¿Te refieres a alguno de estos profesores?
                      </p>
                      <p className="text-xs text-yellow-700 mb-2">
                        Encontramos profesores con nombres similares. Evita crear duplicados:
                      </p>
                      <div className="space-y-1">
                        {duplicadosPotenciales.slice(0, 3).map((profesor) => (
                          <button
                            key={profesor.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, nombreProfesor: profesor.nombre_completo }));
                              setMostrarAlertaDuplicados(false);
                              setDuplicadosPotenciales([]);
                            }}
                            className="block w-full text-left px-3 py-2 bg-white border border-yellow-300 rounded text-sm hover:bg-yellow-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900">{profesor.nombre_completo}</span>
                            <span className="text-xs text-gray-600 ml-2">
                              ({profesor.total_evaluaciones} evaluaciones, {profesor.calificacion_promedio?.toFixed(1)}/5)
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarAlertaDuplicados(false)}
                        className="text-xs text-yellow-700 hover:text-yellow-900 mt-2 underline"
                      >
                        No, es un profesor diferente
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Autocomplete Dropdown */}
              {showAutocomplete && profesoresSugeridos.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {profesoresSugeridos.map((profesor) => (
                    <button
                      key={profesor.id}
                      type="button"
                      onClick={() => handleProfesorSelect(profesor)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{profesor.nombre_completo}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Escuela con buscador */}
            <div>
              <label htmlFor="escuelaId" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Escuela *
              </label>
              <SearchableSelect
                options={escuelas}
                value={formData.escuelaId}
                onChange={(value) => handleChange({ target: { name: 'escuelaId', value } })}
                valueKey="id"
                labelKey="nombre"
                secondaryKey="abreviatura"
                placeholder="Buscar escuela..."
                disabled={loading}
                error={errors.escuelaId}
              />
              {errors.escuelaId && (
                <p className="mt-1 text-xs text-red-600">{errors.escuelaId}</p>
              )}
            </div>

            {/* Carrera (Dinámico basado en Escuela) */}
            <div>
              <label htmlFor="carreraId" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Carrera *
              </label>
              <select
                id="carreraId"
                name="carreraId"
                value={formData.carreraId}
                onChange={handleChange}
                disabled={!formData.escuelaId}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed ${
                  errors.carreraId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">
                  {formData.escuelaId ? 'Selecciona una carrera' : 'Primero selecciona una escuela'}
                </option>
                {carreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>
                    {carrera.nombre}
                  </option>
                ))}
              </select>
              {errors.carreraId && (
                <p className="mt-1 text-xs text-red-600">{errors.carreraId}</p>
              )}
            </div>

            {/* Materia */}
            <div>
              <label htmlFor="materia" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Materia *
              </label>
              <input
                id="materia"
                name="materia"
                type="text"
                maxLength="150"
                value={formData.materia}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-colors ${
                  errors.materia ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Ej: Estructura de Datos"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck="false"
              />
              {errors.materia && (
                <p className="mt-1 text-xs text-red-600">{errors.materia}</p>
              )}
            </div>

            {/* Calificación (Slider) */}
            <div>
              <label htmlFor="calificacion" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Calificación del Profesor: <span className="text-2xl font-bold">{formData.calificacion}</span>/10
              </label>
              <input
                id="calificacion"
                name="calificacion"
                type="range"
                min="1"
                max="10"
                step="1"
                value={formData.calificacion}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-gray-400 transition-all duration-150 ease-linear"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1 (Muy malo)</span>
                <span>10 (Excelente)</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <label htmlFor="recomendado" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ¿Recomendarías este profesor?
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, recomendado: !prev.recomendado }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.recomendado ? 'bg-ipn-guinda-900 dark:bg-ipn-guinda-700' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.recomendado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="asistenciaObligatoria" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ¿La asistencia es obligatoria?
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, asistenciaObligatoria: !prev.asistenciaObligatoria }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.asistenciaObligatoria ? 'bg-ipn-guinda-900 dark:bg-ipn-guinda-700' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.asistenciaObligatoria ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Calificación Obtenida */}
            <div>
              <label htmlFor="calificacionObtenida" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Calificación que obtuviste * (1-10)
              </label>
              <input
                id="calificacionObtenida"
                name="calificacionObtenida"
                type="text"
                inputMode="decimal"
                pattern="^[0-9]+(\.[0-9]+)?$"
                min="1"
                max="10"
                step="0.1"
                value={formData.calificacionObtenida}
                onChange={handleNumericChange}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-colors ${
                  errors.calificacionObtenida ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Ej: 9, 10, 8.5"
                autoComplete="off"
              />
              {errors.calificacionObtenida && (
                <p className="mt-1 text-xs text-red-600">{errors.calificacionObtenida}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Solo valores numéricos entre 1 y 10</p>
            </div>

            {/* Opinión */}
            <div>
              <label htmlFor="opinion" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tu opinión * (mínimo 20 caracteres, máximo 2000)
              </label>
              <textarea
                id="opinion"
                name="opinion"
                rows={5}
                maxLength="2000"
                value={formData.opinion}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-colors resize-y ${
                  errors.opinion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Comparte tu experiencia con este profesor: metodología, exámenes, tareas, etc."
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck="true"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.opinion ? (
                  <p className="text-xs text-red-600">{errors.opinion}</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.opinion.length} / 2000 caracteres
                  </p>
                )}
              </div>
            </div>

            {/* CAPTCHA Widget */}
            <Turnstile
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken('')}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <button
                disabled={submitting || (isTurnstileEnabled() && !captchaToken)}
                className="w-full py-3 px-4 bg-ipn-guinda-900 text-white text-base font-medium rounded-md hover:bg-ipn-guinda-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ipn-guinda-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  'Enviar Evaluación'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal de contenido ofensivo */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              {/* Icono de corazón */}
              <div className="mx-auto w-16 h-16 rounded-full bg-ipn-guinda-900/10 dark:bg-ipn-guinda-400/20 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-ipn-guinda-900 dark:text-ipn-guinda-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Espera un momento...
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                Tu evaluación contiene lenguaje que podría ser ofensivo. Las palabras detectadas están resaltadas:
              </p>

              {/* Texto con palabras resaltadas */}
              {flaggedWords.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 mb-4 text-left max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                    {(() => {
                      let texto = formData.opinion;
                      // Crear regex con todas las palabras flaggeadas
                      const escaped = flaggedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                      const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
                      const parts = texto.split(regex);
                      return parts.map((part, i) => {
                        const isMatch = flaggedWords.some(w => part.toLowerCase() === w.toLowerCase());
                        return isMatch ? (
                          <span key={i} className="bg-ipn-guinda-900 text-white font-bold px-1 rounded">
                            {part}
                          </span>
                        ) : (
                          <span key={i}>{part}</span>
                        );
                      });
                    })()}
                  </p>
                </div>
              )}

              <div className="bg-ipn-guinda-900/5 dark:bg-ipn-guinda-400/10 border border-ipn-guinda-900/15 dark:border-ipn-guinda-400/20 rounded-xl p-4 mb-6">
                <p className="text-ipn-guinda-900 dark:text-ipn-guinda-400 text-sm leading-relaxed">
                  Recuerda que los profesores también son personas que se esfuerzan día a día. 
                  Tu opinión es valiosa y puede ayudar a mejorar la educación, pero el respeto 
                  siempre debe ser la base.
                  <br /><br />
                  Puedes expresar críticas constructivas sin necesidad de usar palabras hirientes. 
                  ¡Tu voz tiene más peso cuando es respetuosa! 👊
                </p>
              </div>

              <button
                onClick={() => setShowContentModal(false)}
                className="w-full py-3 px-4 bg-ipn-guinda-900 text-white font-medium rounded-xl hover:bg-ipn-guinda-800 transition-colors text-base"
              >
                Entendido, voy a corregirla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animación de monedas */}
      {showCoinAnimation && (
        <CoinAnimation 
          amount={coinsEarned} 
          onComplete={() => setShowCoinAnimation(false)}
        />
      )}
    </div>
  );
};

export default EvaluationForm;
