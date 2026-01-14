// ============================================
// BROWSER FINGERPRINTING - Tracking Anónimo
// ============================================
// Genera un ID único basado en características del navegador
// No requiere permisos del usuario

/**
 * Genera un hash simple a partir de un string
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Obtiene información del navegador sin permisos
 */
export function getBrowserFingerprint() {
  const data = {
    // User Agent (navegador, OS, versión)
    userAgent: navigator.userAgent || 'unknown',
    
    // Idioma del navegador
    language: navigator.language || navigator.userLanguage || 'unknown',
    
    // Zona horaria
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Resolución de pantalla
    screenResolution: `${screen.width}x${screen.height}`,
    screenColorDepth: screen.colorDepth,
    
    // Tamaño de viewport
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    
    // Plataforma
    platform: navigator.platform || 'unknown',
    
    // Hardware Concurrency (núcleos de CPU)
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    
    // Device Memory (GB de RAM) - si está disponible
    deviceMemory: navigator.deviceMemory || 0,
    
    // Touch support
    touchSupport: navigator.maxTouchPoints > 0,
    
    // Canvas fingerprint (más único)
    canvas: getCanvasFingerprint(),
    
    // WebGL fingerprint
    webgl: getWebGLFingerprint(),
    
    // Fonts instaladas (aproximación)
    fonts: getInstalledFonts(),
    
    // Plugins instalados
    plugins: getPlugins(),
    
    // Session/Local Storage disponible
    storageAvailable: isStorageAvailable(),
    
    // Cookies habilitadas
    cookiesEnabled: navigator.cookieEnabled,
  };

  // Generar hash único
  const fingerprint = generateFingerprint(data);
  
  console.log('🔐 Browser Fingerprint generado:', fingerprint.substring(0, 12) + '...');
  
  return {
    id: fingerprint,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Genera fingerprint único combinando todos los datos
 */
function generateFingerprint(data) {
  const combinedString = JSON.stringify(data);
  return simpleHash(combinedString);
}

/**
 * Canvas fingerprinting (muy único por dispositivo)
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Dibujar texto con diferentes estilos
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Hello, World! 🌍', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint Test', 4, 17);
    
    // Obtener data URL
    const dataURL = canvas.toDataURL();
    return simpleHash(dataURL);
  } catch (e) {
    return 'canvas-unavailable';
  }
}

/**
 * WebGL fingerprinting
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'webgl-unavailable';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'webgl-no-debug';
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return simpleHash(`${vendor}|${renderer}`);
  } catch (e) {
    return 'webgl-error';
  }
}

/**
 * Detectar fonts instaladas (aproximación)
 */
function getInstalledFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New',
    'Georgia', 'Palatino', 'Garamond', 'Bookman',
    'Comic Sans MS', 'Trebuchet MS', 'Impact'
  ];
  
  const installedFonts = [];
  
  for (const font of testFonts) {
    if (isFontInstalled(font, baseFonts)) {
      installedFonts.push(font);
    }
  }
  
  return simpleHash(installedFonts.join(','));
}

function isFontInstalled(fontName, baseFonts) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  
  ctx.font = testSize + ' ' + baseFonts[0];
  const baselineWidth = ctx.measureText(testString).width;
  
  ctx.font = testSize + ' ' + fontName + ', ' + baseFonts[0];
  const testWidth = ctx.measureText(testString).width;
  
  return baselineWidth !== testWidth;
}

/**
 * Obtener plugins del navegador
 */
function getPlugins() {
  if (!navigator.plugins || navigator.plugins.length === 0) {
    return 'no-plugins';
  }
  
  const plugins = Array.from(navigator.plugins).map(p => p.name).sort();
  return simpleHash(plugins.join(','));
}

/**
 * Verificar si storage está disponible
 */
function isStorageAvailable() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generar ID de sesión único (cambia cada vez)
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Obtener o crear device ID persistente
 */
export function getDeviceId() {
  const STORAGE_KEY = 'ipn_device_id';
  
  // Intentar obtener del localStorage
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    // Si no existe, crear uno nuevo basado en fingerprint
    const fingerprint = getBrowserFingerprint();
    deviceId = `device_${fingerprint.id}`;
    
    try {
      localStorage.setItem(STORAGE_KEY, deviceId);
      console.log('💾 Device ID guardado:', deviceId.substring(0, 20) + '...');
    } catch (e) {
      console.warn('⚠️ No se pudo guardar device ID en localStorage');
    }
  } else {
    console.log('✅ Device ID existente:', deviceId.substring(0, 20) + '...');
  }
  
  return deviceId;
}

/**
 * Obtener información completa del usuario anónimo
 */
export function getAnonymousUserInfo() {
  const deviceId = getDeviceId();
  const sessionId = generateSessionId();
  const fingerprint = getBrowserFingerprint();
  
  return {
    deviceId,
    sessionId,
    fingerprint: fingerprint.id,
    browser: {
      name: getBrowserName(),
      version: getBrowserVersion(),
      os: getOS(),
      isMobile: isMobile(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Detectar nombre del navegador
 */
function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

/**
 * Detectar versión del navegador
 */
function getBrowserVersion() {
  const ua = navigator.userAgent;
  const match = ua.match(/(Firefox|Chrome|Safari|Edg|Opera|OPR)\/(\d+)/);
  return match ? match[2] : 'Unknown';
}

/**
 * Detectar sistema operativo
 */
function getOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

/**
 * Detectar si es móvil
 */
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
