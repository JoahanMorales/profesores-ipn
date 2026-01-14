// ============================================
// VALIDADORES DE FORMULARIOS
// ============================================

/**
 * Validadores reutilizables para toda la aplicación
 */

export const LIMITS = {
  USERNAME: {
    MIN: 3,
    MAX: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  FAVORITE_SONG: {
    MIN: 3,
    MAX: 100,
    PATTERN: /^[^\s]+$/ // Sin espacios
  },
  PROFESOR_NAME: {
    MIN: 5,
    MAX: 100
  },
  MATERIA: {
    MIN: 3,
    MAX: 200
  },
  OPINION: {
    MIN: 20,
    MAX: 2000
  },
  CALIFICACION_OBTENIDA: {
    MAX: 10
  }
};

export class Validator {
  /**
   * Validar username
   */
  static username(value) {
    const errors = [];
    
    if (!value || !value.trim()) {
      errors.push('El nombre de usuario es obligatorio');
      return errors;
    }

    const trimmed = value.trim();

    if (trimmed.length < LIMITS.USERNAME.MIN) {
      errors.push(`Mínimo ${LIMITS.USERNAME.MIN} caracteres`);
    }

    if (trimmed.length > LIMITS.USERNAME.MAX) {
      errors.push(`Máximo ${LIMITS.USERNAME.MAX} caracteres`);
    }

    if (!LIMITS.USERNAME.PATTERN.test(trimmed)) {
      errors.push('Solo letras, números, guiones y guión bajo');
    }

    return errors;
  }

  /**
   * Validar canción favorita
   */
  static favoriteSong(value) {
    const errors = [];
    
    if (!value || !value.trim()) {
      errors.push('La canción favorita es obligatoria');
      return errors;
    }

    const trimmed = value.trim();

    if (trimmed.length < LIMITS.FAVORITE_SONG.MIN) {
      errors.push(`Mínimo ${LIMITS.FAVORITE_SONG.MIN} caracteres`);
    }

    if (trimmed.length > LIMITS.FAVORITE_SONG.MAX) {
      errors.push(`Máximo ${LIMITS.FAVORITE_SONG.MAX} caracteres`);
    }

    if (!LIMITS.FAVORITE_SONG.PATTERN.test(trimmed)) {
      errors.push('No debe contener espacios');
    }

    return errors;
  }

  /**
   * Validar nombre de profesor
   */
  static profesorName(value) {
    const errors = [];
    
    if (!value || !value.trim()) {
      errors.push('El nombre del profesor es obligatorio');
      return errors;
    }

    const trimmed = value.trim();

    if (trimmed.length < LIMITS.PROFESOR_NAME.MIN) {
      errors.push(`Mínimo ${LIMITS.PROFESOR_NAME.MIN} caracteres`);
    }

    if (trimmed.length > LIMITS.PROFESOR_NAME.MAX) {
      errors.push(`Máximo ${LIMITS.PROFESOR_NAME.MAX} caracteres`);
    }

    return errors;
  }

  /**
   * Validar materia
   */
  static materia(value) {
    const errors = [];
    
    if (!value || !value.trim()) {
      errors.push('La materia es obligatoria');
      return errors;
    }

    const trimmed = value.trim();

    if (trimmed.length < LIMITS.MATERIA.MIN) {
      errors.push(`Mínimo ${LIMITS.MATERIA.MIN} caracteres`);
    }

    if (trimmed.length > LIMITS.MATERIA.MAX) {
      errors.push(`Máximo ${LIMITS.MATERIA.MAX} caracteres`);
    }

    return errors;
  }

  /**
   * Validar opinión
   */
  static opinion(value) {
    const errors = [];
    
    if (!value || !value.trim()) {
      errors.push('La opinión es obligatoria');
      return errors;
    }

    const trimmed = value.trim();

    if (trimmed.length < LIMITS.OPINION.MIN) {
      errors.push(`Mínimo ${LIMITS.OPINION.MIN} caracteres (${trimmed.length}/${LIMITS.OPINION.MIN})`);
    }

    if (trimmed.length > LIMITS.OPINION.MAX) {
      errors.push(`Máximo ${LIMITS.OPINION.MAX} caracteres`);
    }

    return errors;
  }

  /**
   * Validar calificación obtenida
   */
  static calificacionObtenida(value) {
    const errors = [];
    
    if (!value || !value.trim()) {
      errors.push('La calificación obtenida es obligatoria');
      return errors;
    }

    const trimmed = value.trim();

    if (trimmed.length > LIMITS.CALIFICACION_OBTENIDA.MAX) {
      errors.push(`Máximo ${LIMITS.CALIFICACION_OBTENIDA.MAX} caracteres`);
    }

    return errors;
  }

  /**
   * Validar que un campo select no esté vacío
   */
  static required(value, fieldName) {
    if (!value || value === '') {
      return [`Debes seleccionar ${fieldName}`];
    }
    return [];
  }

  /**
   * Sanitizar texto (remover caracteres peligrosos)
   */
  static sanitize(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remover < y > para evitar XSS
      .replace(/\s+/g, ' '); // Normalizar espacios múltiples
  }

  /**
   * Validar formulario de login completo
   */
  static loginForm(formData) {
    const errors = {};

    const usernameErrors = this.username(formData.username);
    if (usernameErrors.length > 0) {
      errors.username = usernameErrors[0];
    }

    const songErrors = this.favoriteSong(formData.favoriteSong);
    if (songErrors.length > 0) {
      errors.favoriteSong = songErrors[0];
    }

    return errors;
  }

  /**
   * Validar formulario de evaluación completo
   */
  static evaluationForm(formData) {
    const errors = {};

    // Validar nombre de profesor
    const profesorErrors = this.profesorName(formData.nombreProfesor);
    if (profesorErrors.length > 0) {
      errors.nombreProfesor = profesorErrors[0];
    }

    // Validar escuela
    const escuelaErrors = this.required(formData.escuelaId, 'una escuela');
    if (escuelaErrors.length > 0) {
      errors.escuelaId = escuelaErrors[0];
    }

    // Validar carrera
    const carreraErrors = this.required(formData.carreraId, 'una carrera');
    if (carreraErrors.length > 0) {
      errors.carreraId = carreraErrors[0];
    }

    // Validar materia
    const materiaErrors = this.materia(formData.materia);
    if (materiaErrors.length > 0) {
      errors.materia = materiaErrors[0];
    }

    // Validar calificación obtenida
    const calificacionErrors = this.calificacionObtenida(formData.calificacionObtenida);
    if (calificacionErrors.length > 0) {
      errors.calificacionObtenida = calificacionErrors[0];
    }

    // Validar opinión
    const opinionErrors = this.opinion(formData.opinion);
    if (opinionErrors.length > 0) {
      errors.opinion = opinionErrors[0];
    }

    return errors;
  }

  /**
   * Obtener contador de caracteres para mostrar al usuario
   */
  static getCharacterCount(value, max) {
    const length = value ? value.trim().length : 0;
    const remaining = max - length;
    const percentage = (length / max) * 100;

    return {
      current: length,
      max,
      remaining,
      percentage,
      isNearLimit: percentage >= 80,
      isOverLimit: length > max
    };
  }
}

/**
 * Hook personalizado para validación en tiempo real
 */
export const useFieldValidation = (value, validatorFunction) => {
  const [errors, setErrors] = React.useState([]);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (touched && value !== undefined) {
      const validationErrors = validatorFunction(value);
      setErrors(validationErrors);
    }
  }, [value, touched, validatorFunction]);

  const markAsTouched = () => setTouched(true);
  const reset = () => {
    setErrors([]);
    setTouched(false);
  };

  return {
    errors,
    hasErrors: errors.length > 0,
    touched,
    markAsTouched,
    reset
  };
};
