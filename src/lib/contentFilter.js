/**
 * Filtro de contenido ofensivo para evaluaciones.
 * Detecta groserías, insultos y lenguaje de odio en español.
 * Se usa client-side para UX inmediata + server-side en PostgreSQL como respaldo.
 */

const PALABRAS_PROHIBIDAS = [
  // Insultos directos
  'pendejo', 'pendeja', 'pendejos', 'pendejas',
  'estupido', 'estupida', 'estupidos', 'estupidas',
  'idiota', 'idiotas',
  'imbecil', 'imbeciles',
  'tarado', 'tarada', 'tarados', 'taradas',
  'retrasado', 'retrasada', 'retrasados', 'retrasadas',
  'baboso', 'babosa', 'babosos', 'babosas',
  'menso', 'mensa', 'mensos', 'mensas',
  'tonto', 'tonta', 'tontos', 'tontas',
  'bruto', 'bruta', 'brutos', 'brutas',
  'inutil', 'inutiles',
  'mediocre', 'mediocres',
  'incompetente', 'incompetentes',
  'ignorante', 'ignorantes',

  // Groserías fuertes
  'puto', 'puta', 'putos', 'putas', 'putisima', 'putisimo',
  'chingar', 'chingada', 'chingado', 'chingados', 'chingadazo',
  'chingadera', 'chingaderas', 'chingue', 'chingas', 'chingo',
  'verga', 'vergas', 'vergudo',
  'pinche', 'pinches',
  'cabron', 'cabrona', 'cabrones', 'cabronas',
  'culero', 'culera', 'culeros', 'culeras',
  'mamada', 'mamadas', 'mamon', 'mamona', 'mamones',
  'mierda', 'mierdas', 'mierdero',
  'joder', 'jodido', 'jodida', 'jodidos', 'jodidas',
  'carajo', 'carajos',
  'culo', 'culos',
  'coger', 'cogida', 'cogido',
  'nalgas', 'nalgon', 'nalgona',
  'huevon', 'huevona', 'huevones',
  'ojete', 'ojetes',
  'bastardo', 'bastarda', 'bastardos',
  'zorra', 'zorras',
  'perra', 'perras', 'perro', 'perros',
  'pendejada', 'pendejadas',

  // Amenazas y violencia
  'matar', 'matarte', 'matarlo', 'matarla',
  'golpear', 'golpearte', 'golpearlo',
  'madrazo', 'madrazos', 'madrear',
  'putazo', 'putazos',
  'chingazo', 'chingazos',

  // Discriminación
  'naco', 'naca', 'nacos', 'nacas',
  'indio', 'india', 'indios',
  'prieto', 'prieta', 'prietos', 'prietas',
  'gato', 'gata', 'gatos', 'gatas',
  'muerto de hambre', 'muertos de hambre',

  // Acoso sexual
  'violar', 'violador', 'violadora',
  'acosador', 'acosadora',
  'pervertido', 'pervertida',
  'degenerado', 'degenerada',

  // Expresiones compuestas ofensivas
  'hijo de puta', 'hija de puta',
  'hijo de perra', 'hija de perra',
  'a la verga', 'vete a la verga',
  'que se muera', 'ojala se muera',
  'hijo de su', 'hijos de su',
  'vete al diablo', 'vete al carajo',
  'me vale verga', 'me vale madres',
  'no vale verga', 'no vale madre',
  'da asco', 'das asco', 'dan asco',
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
