// Constantes del Sistema IPN
export const IPN_DATA = {
  ESCOM: {
    nombre: 'ESCOM',
    nombreCompleto: 'Escuela Superior de Cómputo',
    carreras: [
      { id: 'isc', nombre: 'ISC', nombreCompleto: 'Ingeniería en Sistemas Computacionales' },
      { id: 'lcd', nombre: 'LCD', nombreCompleto: 'Licenciatura en Ciencia de Datos' },
      { id: 'iia', nombre: 'IIA', nombreCompleto: 'Ingeniería en Inteligencia Artificial' }
    ]
  },
  UPIICSA: {
    nombre: 'UPIICSA',
    nombreCompleto: 'Unidad Profesional Interdisciplinaria de Ingeniería y Ciencias Sociales y Administrativas',
    carreras: [
      { id: 'ing-industrial', nombre: 'Ing. Industrial', nombreCompleto: 'Ingeniería Industrial' },
      { id: 'ing-transporte', nombre: 'Ing. en Transporte', nombreCompleto: 'Ingeniería en Transporte' },
      { id: 'ing-informatica', nombre: 'Ing. en Informática', nombreCompleto: 'Ingeniería en Informática' },
      { id: 'lic-ciencias-informatica', nombre: 'Lic. en Ciencias de la Informática', nombreCompleto: 'Licenciatura en Ciencias de la Informática' },
      { id: 'ing-ferroviaria', nombre: 'Ing. Ferroviaria', nombreCompleto: 'Ingeniería Ferroviaria' }
    ]
  }
};

export const ESCUELAS = Object.keys(IPN_DATA);

export const getCarrerasByEscuela = (escuela) => {
  return IPN_DATA[escuela]?.carreras || [];
};

// Mock data para profesores (para desarrollo)
export const MOCK_PROFESORES = [
  {
    id: 1,
    nombre: 'Dr. Juan Pérez García',
    escuela: 'ESCOM',
    carrera: 'ISC',
    materia: 'Estructura de Datos',
    calificacion: 9.2,
    numEvaluaciones: 45
  },
  {
    id: 2,
    nombre: 'M.C. María López Hernández',
    escuela: 'ESCOM',
    carrera: 'ISC',
    materia: 'Análisis de Algoritmos',
    calificacion: 8.7,
    numEvaluaciones: 38
  },
  {
    id: 3,
    nombre: 'Ing. Carlos Ramírez Torres',
    escuela: 'UPIICSA',
    carrera: 'Ing. Industrial',
    materia: 'Control de Calidad',
    calificacion: 7.8,
    numEvaluaciones: 52
  },
  {
    id: 4,
    nombre: 'Dra. Ana Martínez Sánchez',
    escuela: 'ESCOM',
    carrera: 'LCD',
    materia: 'Minería de Datos',
    calificacion: 9.5,
    numEvaluaciones: 29
  },
  {
    id: 5,
    nombre: 'M.C. Roberto González Díaz',
    escuela: 'UPIICSA',
    carrera: 'Ing. en Informática',
    materia: 'Redes de Computadoras',
    calificacion: 8.3,
    numEvaluaciones: 41
  }
];
