// ============================================
// SISTEMA DE CACHÉ CON LOCALSTORAGE
// ============================================

// Incrementar esta versión cada vez que cambien datos de escuelas/carreras
// para invalidar automáticamente el caché de todos los usuarios
const CACHE_VERSION = 2;
const CACHE_PREFIX = `ipn_v${CACHE_VERSION}_`;

// Regex que detecta claves de caché versionadas: ipn_v1_, ipn_v2_, etc.
const VERSIONED_CACHE_REGEX = /^ipn_v\d+_/;

// Keys que NO son caché y nunca deben limpiarse automáticamente
const PROTECTED_KEYS = ['ipn_user', 'ipn_device_id'];

const CACHE_KEYS = {
  ESCUELAS: `${CACHE_PREFIX}escuelas`,
  CARRERAS: `${CACHE_PREFIX}carreras`,
  PROFESORES_POPULARES: `${CACHE_PREFIX}profesores_populares`,
  SEARCH_RESULTS: `${CACHE_PREFIX}search_`,
  PROFESOR_PROFILE: `${CACHE_PREFIX}profesor_`,
  SEARCH_QUERY: `${CACHE_PREFIX}search_query_`,
  STATS_GLOBALES: `${CACHE_PREFIX}stats_globales`,
  TODOS_PROFESORES: `${CACHE_PREFIX}todos_profesores`,
  EVENTOS: `${CACHE_PREFIX}eventos`,
  ARTICULOS: `${CACHE_PREFIX}articulos`,
};

const CACHE_EXPIRATION = {
  ESCUELAS: 7 * 24 * 60 * 60 * 1000, // 7 días (rara vez cambian)
  CARRERAS: 7 * 24 * 60 * 60 * 1000, // 7 días
  PROFESORES_POPULARES: 1 * 60 * 60 * 1000, // 1 hora
  SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutos
  PROFESOR_PROFILE: 10 * 60 * 1000, // 10 minutos
  SEARCH_QUERY: 15 * 60 * 1000, // 15 minutos para búsquedas específicas
  STATS_GLOBALES: 1 * 60 * 60 * 1000, // 1 hora (no cambian rápido)
  TODOS_PROFESORES: 30 * 60 * 1000, // 30 minutos
  EVENTOS: 15 * 60 * 1000, // 15 minutos
  ARTICULOS: 15 * 60 * 1000, // 15 minutos
};

class CacheManager {
  /**
   * Guardar datos en caché con timestamp
   */
  static set(key, data, expirationMs = null) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiration: expirationMs
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      console.warn('⚠️ Error al guardar en caché:', error);
      // Si el localStorage está lleno, limpiar caché antiguo
      this.clearExpired();
      return false;
    }
  }

  /**
   * Obtener datos del caché si no han expirado
   */
  static get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();

      // Verificar expiración
      if (cacheItem.expiration && (now - cacheItem.timestamp) > cacheItem.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('⚠️ Error al leer caché:', error);
      return null;
    }
  }

  /**
   * Verificar si existe un dato en caché y no ha expirado
   */
  static has(key) {
    return this.get(key) !== null;
  }

  /**
   * Eliminar un item específico del caché
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('⚠️ Error al eliminar del caché:', error);
      return false;
    }
  }

  /**
   * Limpiar todo el caché de la aplicación
   */
  static clearAll() {
    try {
      // Limpiar claves de la versión actual
      Object.values(CACHE_KEYS).forEach(keyPrefix => {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(keyPrefix)) {
            localStorage.removeItem(key);
          }
        });
      });
      // También limpiar claves de versiones anteriores de caché (ipn_v1_, ipn_v3_, etc.)
      Object.keys(localStorage).forEach(key => {
        if (VERSIONED_CACHE_REGEX.test(key) && !key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('Caché limpiado completamente');
      return true;
    } catch (error) {
      console.warn('⚠️ Error al limpiar caché:', error);
      return false;
    }
  }

  /**
   * Limpiar solo elementos expirados
   */
  static clearExpired() {
    try {
      let cleared = 0;
      Object.keys(localStorage).forEach(key => {
        if (VERSIONED_CACHE_REGEX.test(key)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              const cacheItem = JSON.parse(cached);
              const now = Date.now();
              if (cacheItem.expiration && (now - cacheItem.timestamp) > cacheItem.expiration) {
                localStorage.removeItem(key);
                cleared++;
              }
            } catch (e) {
              // Si no se puede parsear, eliminarlo
              localStorage.removeItem(key);
              cleared++;
            }
          }
        }
      });
      if (cleared > 0) {
        console.log(`🗑️ ${cleared} items expirados eliminados del caché`);
      }
      return cleared;
    } catch (error) {
      console.warn('⚠️ Error al limpiar caché expirado:', error);
      return 0;
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  static getStats() {
    try {
      const stats = {
        totalItems: 0,
        totalSize: 0,
        byType: {}
      };

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ipn_')) {
          stats.totalItems++;
          const value = localStorage.getItem(key);
          stats.totalSize += value.length;

          // Categorizar por tipo
          const type = Object.entries(CACHE_KEYS).find(([_, prefix]) => 
            key.startsWith(prefix)
          )?.[0] || 'OTHER';

          if (!stats.byType[type]) {
            stats.byType[type] = { count: 0, size: 0 };
          }
          stats.byType[type].count++;
          stats.byType[type].size += value.length;
        }
      });

      // Convertir tamaño a KB
      stats.totalSizeKB = (stats.totalSize / 1024).toFixed(2);
      Object.keys(stats.byType).forEach(type => {
        stats.byType[type].sizeKB = (stats.byType[type].size / 1024).toFixed(2);
      });

      return stats;
    } catch (error) {
      console.warn('⚠️ Error al obtener estadísticas:', error);
      return null;
    }
  }

  /**
   * Invalidar caché relacionado con un profesor específico
   */
  static invalidateProfesor(profesorSlug) {
    this.remove(`${CACHE_KEYS.PROFESOR_PROFILE}${profesorSlug}`);
    // También invalidar resultados de búsqueda que puedan contenerlo
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEYS.SEARCH_RESULTS)) {
        localStorage.removeItem(key);
      }
    });
    this.remove(CACHE_KEYS.PROFESORES_POPULARES);
  }

  /**
   * Invalidar caché después de una nueva evaluación
   */
  static invalidateAfterEvaluation(profesorSlug) {
    console.log('🔄 Invalidando caché después de evaluación');
    this.invalidateProfesor(profesorSlug);
  }
}

// Al cargar: limpiar caché expirado + purgar claves de versiones anteriores
if (typeof window !== 'undefined') {
  CacheManager.clearExpired();
  // Eliminar claves de caché de versiones anteriores (ipn_v1_, etc.) para liberar espacio
  Object.keys(localStorage).forEach(key => {
    if (VERSIONED_CACHE_REGEX.test(key) && !key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

export { CacheManager, CACHE_KEYS, CACHE_EXPIRATION };
