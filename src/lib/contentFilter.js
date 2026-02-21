/**
 * Filtro de contenido ofensivo para evaluaciones.
 * Solo detecta insultos fuertes y lenguaje de odio real.
 * Palabras como "cabrón", "chingón", "verga", "mierda" son
 * de uso coloquial en México y NO se filtran.
 */

// Solo palabras/frases realmente ofensivas dirigidas a una persona
const PALABRAS_PROHIBIDAS = [
  // Insultos directos fuertes
  'pendejo', 'pendeja', 'pendejos', 'pendejas', 'pendejada', 'pendejadas',
  'puto', 'puta', 'putos', 'putas', 'putisima', 'putisimo',
  'culero', 'culera', 'culeros', 'culeras',
  'ojete', 'ojetes',
  'zorra', 'zorras',

  // Amenazas y violencia
  'madrazo', 'madrazos',
  'putazo', 'putazos',
  'chingazo', 'chingazos',

  // Discriminación
  'naco', 'naca', 'nacos', 'nacas',

  // Acoso sexual
  'violador', 'violadora',
  'degenerado', 'degenerada',

  // Expresiones compuestas graves
  'hijo de puta', 'hija de puta',
  'hijo de perra', 'hija de perra',
  'vete a la verga',
  'que se muera', 'ojala se muera',
];

/**
 * Normaliza texto para comparación:
 * - Minúsculas
 * - Sin acentos
 * - Sin caracteres repetidos (p.ej. "pendejoooo" → "pendejo")
 * - Sin sustituciones comunes (@ → a, 3 → e, etc.)
 */
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5\$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/(.)\1{2,}/g, '$1$1') // reducir repeticiones (aaaa → aa)
    .replace(/[_\-.*+]/g, '') // quitar separadores usados para evadir
    .trim();
}

/**
 * Verifica si un texto contiene contenido ofensivo.
 * @param {string} texto - El texto a verificar
 * @returns {{ flagged: boolean, palabras: string[] }} - Resultado de la verificación
 */
export function verificarContenido(texto) {
  if (!texto || typeof texto !== 'string') {
    return { flagged: false, palabras: [] };
  }

  const textoNormalizado = normalizar(texto);
  const palabrasEncontradas = [];

  for (const palabra of PALABRAS_PROHIBIDAS) {
    const palabraNorm = normalizar(palabra);

    // Para expresiones de múltiples palabras, buscar directamente
    if (palabra.includes(' ')) {
      if (textoNormalizado.includes(palabraNorm)) {
        palabrasEncontradas.push(palabra);
      }
    } else {
      // Para palabras sueltas, usar word boundary con regex
      const regex = new RegExp(`(?:^|\\s|[^a-z])${palabraNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s|[^a-z])`, 'i');
      if (regex.test(' ' + textoNormalizado + ' ')) {
        palabrasEncontradas.push(palabra);
      }
    }
  }

  return {
    flagged: palabrasEncontradas.length > 0,
    palabras: [...new Set(palabrasEncontradas)], // sin duplicados
  };
}

/**
 * Exporta la lista de palabras prohibidas para usar en el SQL de PostgreSQL.
 * Solo para referencia/documentación.
 */
export const LISTA_PALABRAS = PALABRAS_PROHIBIDAS;
