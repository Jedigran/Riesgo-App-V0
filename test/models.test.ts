/**
 * ============================================================================
 * MODEL VALIDATION TESTS - TypeScript Type Structure Verification
 * ============================================================================
 * 
 * This test file validates that all TypeScript model interfaces are correctly
 * defined and can be instantiated with proper structure.
 * 
 * Run with: npx tsx test/models.test.ts
 * 
 * @module tests/models.test
 */

import type {
  AnalisisOrigen,
  AnalisisHAZOP,
  AnalisisFMEA,
  AnalisisLOPA,
  AnalisisOCA,
  AnalisisIntuicion,
  TipoAnalisis,
} from '@/src/models/analisis/types';

import type {
  Hallazgo,
  Peligro,
  Barrera,
  POE,
  SOL,
  TipoHallazgo,
  Ubicacion,
} from '@/src/models/hallazgo/types';

import type {
  Relacion,
  RelacionHallazgo,
  RelacionAnalisis,
  TipoRelacionHallazgo,
  TipoRelacionAnalisis,
} from '@/src/models/relaciones/types';

import type {
  Sesion,
  VistaActiva,
} from '@/src/models/sesion/types';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

/**
 * Assert function for test validation.
 * @param condition - Condition to evaluate
 * @param message - Test description
 */
function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

/**
 * Print test summary.
 */
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log(`✅ Pasadas: ${testsPassed}`);
  console.log(`❌ Fallidas: ${testsFailed}`);
  console.log('='.repeat(60));
  
  if (testsFailed === 0) {
    console.log('🎉 ¡Todas las pruebas pasaron!');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }
}

// ============================================================================
// TEST 1: ANALISIS TYPES
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 1: ANALISIS TYPES');
console.log('='.repeat(60));

// Test 1.1: AnalisisHAZOP
const hazopData: AnalisisHAZOP = {
  nodo: 'Reactor R-101',
  parametro: 'Presión',
  palabraGuia: 'Más de',
  causa: 'Falla en válvula de control PV-101',
  consecuencia: 'Sobrepresión en el reactor con posible ruptura',
  salvaguardasExistentes: [
    'Válvula de alivio PSV-101',
    'Sistema de parada de emergencia SIS-101',
  ],
  recomendaciones: [
    'Instalar manómetro local en reactor',
    'Revisar procedimiento de arranque',
  ],
};

assert(
  hazopData.nodo === 'Reactor R-101' &&
  hazopData.salvaguardasExistentes.length === 2,
  'AnalisisHAZOP: Estructura correcta con todos los campos requeridos'
);

// Test 1.2: AnalisisFMEA with RPN calculation
const fmeaData: AnalisisFMEA = {
  equipo: 'Bomba centrífuga P-201',
  funcion: 'Evacuar agua acumulada del sistema',
  modoFalla: 'Pérdida de sello mecánico',
  efecto: 'Fuga de producto químico al ambiente',
  causa: 'Desgaste por operación sin lubricación',
  barrerasExistentes: [
    'Inspección visual semanal',
    'Sensor de vibración',
  ],
  S: 7, // Severidad alta por riesgo ambiental
  O: 4, // Ocurrencia poco frecuente
  D: 3, // Detección moderada
  RPN: 84, // 7 × 4 × 3 = 84
  accionesRecomendadas: [
    'Implementar programa de lubricación preventiva',
    'Instalar sensor de fuga',
  ],
};

assert(
  fmeaData.RPN === fmeaData.S * fmeaData.O * fmeaData.D &&
  fmeaData.S >= 1 && fmeaData.S <= 10,
  'AnalisisFMEA: RPN calculado correctamente y Severity en rango 1-10'
);

// Test 1.3: AnalisisLOPA
const lopaData: AnalisisLOPA = {
  escenario: 'Sobrepresión en separador V-301 por bloqueo de salida',
  consecuencia: 'Ruptura de recipiente con proyección de fragmentos',
  receptorImpacto: 'Personal de operación',
  S: 5,
  riesgoTolerable: 0.00001, // 1E-5 eventos/año (tolerable)
  causa: 'Bloqueo de salida por válvula cerrada',
  frecuenciaInicial: 0.1, // 1 evento cada 10 años
  capasIPL: [
    { nombre: 'BPCS - Alarma de presión alta', pfd: 0.1 },
    { nombre: 'SIS - Parada de emergencia', pfd: 0.01 },
    { nombre: 'PSV - Válvula de alivio', pfd: 0.001 },
  ],
  pfdTotal: 0.000001,
  riesgoEscenario: 0.0000001,
  cumpleCriterio: true,
  recomendaciones: ['Revisar procedimiento de bloqueo'],
};

const frecuenciaCalculada = lopaData.frecuenciaInicial *
  lopaData.capasIPL.reduce((acc, capa) => acc * capa.pfd, 1);

assert(
  frecuenciaCalculada <= lopaData.riesgoTolerable,
  `AnalisisLOPA: Frecuencia final (${frecuenciaCalculada}) cumple objetivo de riesgo (${lopaData.riesgoTolerable})`
);

// Test 1.4: AnalisisOCA
const ocaData: AnalisisOCA = {
  compuesto: 'H2S',
  cantidad: 1000,
  viento: 1.5,
  factorViento: 1.0,
  estabilidad: 'F',
  factorEscalabilidad: 1.5,
  topografia: 'Urbana',
  factorTopografia: 0.85,
  tipoEscenario: 'Alternativo',
  endpoint: 0.0017,
  barrerasExistentes: [
    'Sistema de energía ininterrumpida (UPS)',
    'Generador de emergencia',
  ],
  gaps: [
    'UPS no tiene capacidad para todos los instrumentos críticos',
    'Generador tarda 30 segundos en arrancar',
  ],
  recomendaciones: [
    'Ampliar capacidad del UPS',
    'Instalar sistema de aire de instrumentación de respaldo',
  ],
};

assert(
  ocaData.gaps.length > 0 && ocaData.recomendaciones.length >= ocaData.gaps.length,
  'AnalisisOCA: Gaps identificados y recomendaciones proporcionadas'
);

// Test 1.5: AnalisisIntuicion
const intuicionData: AnalisisIntuicion = {
  titulo: 'Observación de corrosión en tubería',
  descripcion: 'Se observa corrosión externa en tubería de línea de vapor cerca de la válvula V-102',
  observaciones: [
    'La tubería tiene aproximadamente 15 años de servicio',
    'No hay registro de reemplazo en este tramo',
    'La corrosión parece ser por aislamiento húmedo (CUI)',
  ],
};

assert(
  intuicionData.observaciones.length >= 1 &&
  intuicionData.descripcion.length > 20,
  'AnalisisIntuicion: Descripción detallada y observaciones documentadas'
);

// Test 1.6: AnalisisOrigen wrapper
const hazopWrapper: AnalisisOrigen = {
  base: {
    id: 'hazop-001',
    tipo: 'HAZOP',
    fechaCreacion: new Date().toISOString(),
    estado: 'completado',
    analisisRelacionadosIds: ['fmea-001'],
  },
  datos: hazopData,
};

assert(
  hazopWrapper.base.tipo === 'HAZOP' &&
  hazopWrapper.base.analisisRelacionadosIds.includes('fmea-001'),
  'AnalisisOrigen: Wrapper contiene base y datos correctamente'
);

// ============================================================================
// TEST 2: HALLAZGO TYPES
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 2: HALLAZGO TYPES');
console.log('='.repeat(60));

// Test 2.1: Peligro (Hazard)
const peligro: Peligro = {
  id: 'peligro-001',
  tipo: 'Peligro',
  tipoPeligro: 'Inherente',
  titulo: 'Sobrepresión en Reactor R-101',
  descripcion: 'El reactor puede experimentar sobrepresión durante el llenado rápido',
  ubicacion: { x: 45, y: 30 }, // Position on plant diagram (percentages)
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['hazop-001'],
  hallazgosRelacionadosIds: ['barrera-001', 'poe-001'],
  consecuencia: 'Ruptura del reactor con liberación de material peligroso',
  severidad: 5, // Máxima severidad
  causaRaiz: 'Diseño del sistema de control no considera llenado rápido',
};

assert(
  peligro.tipo === 'Peligro' &&
  peligro.severidad >= 1 && peligro.severidad <= 5 &&
  peligro.ubicacion.x >= 0 && peligro.ubicacion.x <= 100,
  'Peligro: Tipo correcto, severidad 1-5, ubicación en porcentaje 0-100'
);

// Test 2.2: Barrera (Barrier)
const barrera: Barrera = {
  id: 'barrera-001',
  tipo: 'Barrera',
  titulo: 'Válvula de Alivio PSV-101',
  descripcion: 'Válvula de seguridad que alivia presión cuando excede el setpoint',
  ubicacion: { x: 47, y: 32 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['hazop-001'],
  hallazgosRelacionadosIds: ['peligro-001'],
  tipoBarrera: 'Fisica',
  tipoBarreraFuncion: 'Mitigativa',
  efectividadEstimada: 4, // Alta efectividad
  elementoProtegido: 'Reactor R-101',
};

assert(
  barrera.tipo === 'Barrera' &&
  (barrera.tipoBarrera === 'Fisica' || barrera.tipoBarrera === 'Administrativa' || barrera.tipoBarrera === 'Humana') &&
  barrera.efectividadEstimada >= 1 && barrera.efectividadEstimada <= 5,
  'Barrera: Tipo correcto, tipoBarrera válido, efectividad 1-5'
);

// Test 2.3: POE (SOP)
const poe: POE = {
  id: 'poe-001',
  tipo: 'POE',
  titulo: 'Procedimiento de Arranque de Reactor',
  descripcion: 'Pasos secuenciales para arranque seguro del reactor R-101',
  ubicacion: { x: 50, y: 35 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['hazop-001'],
  hallazgosRelacionadosIds: ['peligro-001'],
  procedimientoReferencia: 'POE-R101-001',
  frecuenciaAplicacion: 'Cada arranque de planta',
  responsable: 'Operador de Planta',
};

assert(
  poe.tipo === 'POE' &&
  poe.procedimientoReferencia.length > 0 &&
  poe.responsable.length > 0,
  'POE: Tipo correcto, procedimiento y responsable definidos'
);

// Test 2.4: SOL (Protection Layer)
const sol: SOL = {
  id: 'sol-001',
  tipo: 'SOL',
  titulo: 'Sistema Instrumentado de Seguridad SIS-101',
  descripcion: 'SIS que detecta sobrepresión y activa parada de emergencia',
  ubicacion: { x: 48, y: 33 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['lopa-001'],
  hallazgosRelacionadosIds: ['barrera-001'],
  capaNumero: 2,
  independiente: true,
  tipoTecnologia: 'Sistema lógico 1oo2 (1 out of 2)',
  parametro: 'Presión',
  valorMinimo: 0,
  valorMaximo: 150,
  unidad: 'psi',
};

assert(
  sol.tipo === 'SOL' &&
  sol.capaNumero >= 1 &&
  sol.independiente === true,
  'SOL: Tipo correcto, capa numerada, independencia verificada'
);

// Test 2.5: Ubicacion validation
const ubicacionValida: Ubicacion = { x: 50, y: 50 };
const ubicacionLimite: Ubicacion = { x: 100, y: 100 };

assert(
  ubicacionValida.x >= 0 && ubicacionValida.x <= 100 &&
  ubicacionValida.y >= 0 && ubicacionValida.y <= 100 &&
  ubicacionLimite.x === 100 && ubicacionLimite.y === 100,
  'Ubicacion: Coordenadas en rango 0-100 (porcentajes)'
);

// ============================================================================
// TEST 3: RELACIONES TYPES
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 3: RELACIONES TYPES');
console.log('='.repeat(60));

// Test 3.1: RelacionHallazgo - Mitiga
const relacionMitiga: RelacionHallazgo = {
  id: 'rel-001',
  tipo: 'mitiga',
  origenId: 'barrera-001', // Barrier
  destinoId: 'peligro-001', // Hazard
  descripcion: 'PSV-101 alivia presión previendo ruptura del reactor',
  fechaCreacion: new Date().toISOString(),
};

assert(
  relacionMitiga.tipo === 'mitiga' &&
  relacionMitiga.origenId.startsWith('barrera') &&
  relacionMitiga.destinoId.startsWith('peligro'),
  'RelacionHallazgo (mitiga): Barrera → Peligro correctamente vinculados'
);

// Test 3.2: RelacionHallazgo - Controla
const relacionControla: RelacionHallazgo = {
  id: 'rel-002',
  tipo: 'controla',
  origenId: 'poe-001', // SOP
  destinoId: 'peligro-001', // Hazard
  descripcion: 'Procedimiento de arranque controla riesgo de sobrepresión',
  fechaCreacion: new Date().toISOString(),
};

assert(
  relacionControla.tipo === 'controla' &&
  relacionControla.origenId.startsWith('poe'),
  'RelacionHallazgo (controla): POE → Peligro correctamente vinculado'
);

// Test 3.3: RelacionAnalisis - Sustenta
const relacionAnalisis: RelacionAnalisis = {
  id: 'rel-analysis-001',
  tipo: 'sustenta',
  analisisSustentoId: 'fmea-001', // Supporting analysis
  analisisSustentadoId: 'hazop-001', // Supported analysis
  descripcion: 'FMEA de componentes alimenta análisis de desviaciones HAZOP',
  fechaCreacion: new Date().toISOString(),
};

assert(
  relacionAnalisis.tipo === 'sustenta' &&
  relacionAnalisis.analisisSustentoId !== relacionAnalisis.analisisSustentadoId,
  'RelacionAnalisis (sustenta): IDs diferentes para sustento y sustentado'
);

// Test 3.4: Relacion union type
const relacionGeneric: Relacion = relacionMitiga;

assert(
  'origenId' in relacionGeneric || 'analisisSustentoId' in relacionGeneric,
  'Relacion: Union type acepta ambos tipos de relaciones'
);

// ============================================================================
// TEST 4: SESION TYPE
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 4: SESION TYPE');
console.log('='.repeat(60));

// Test 4.1: Sesion completa
const sesion: Sesion = {
  id: 'sesion-20240101-001',
  analisis: [
    {
      base: {
        id: 'hazop-001',
        tipo: 'HAZOP',
        fechaCreacion: new Date().toISOString(),
        estado: 'completado',
        analisisRelacionadosIds: ['fmea-001'],
      },
      datos: hazopData,
    },
  ],
  hallazgos: [peligro, barrera, poe, sol],
  relaciones: [relacionMitiga, relacionControla, relacionAnalisis],
  imagenActual: '/diagrams/planta-proceso-01.png',
  filtrosActivos: ['Peligro', 'Barrera', 'POE', 'SOL'],
  vistaActiva: 'mapa',
};

assert(
  sesion.id.length > 0 &&
  sesion.analisis.length === 1 &&
  sesion.hallazgos.length === 4 &&
  sesion.relaciones.length === 3,
  'Sesion: Estado completo con análisis, hallazgos y relaciones'
);

// Test 4.2: Sesion con filtros parciales
const sesionConFiltros: Sesion = {
  ...sesion,
  id: 'sesion-20240101-002',
  filtrosActivos: ['Peligro', 'Barrera'], // Solo mostrar peligros y barreras
  vistaActiva: 'tabla', // Vista de tabla en lugar de mapa
};

assert(
  sesionConFiltros.filtrosActivos.length === 2 &&
  sesionConFiltros.vistaActiva === 'tabla',
  'Sesion: Filtros parciales y vista de tabla configurados'
);

// Test 4.3: Sesion vacía (initial state)
const sesionVacia: Sesion = {
  id: 'sesion-nueva',
  analisis: [],
  hallazgos: [],
  relaciones: [],
  imagenActual: '/diagrams/default-plant.png',
  filtrosActivos: ['Peligro', 'Barrera', 'POE', 'SOL'],
  vistaActiva: 'mapa',
};

assert(
  sesionVacia.analisis.length === 0 &&
  sesionVacia.hallazgos.length === 0 &&
  sesionVacia.relaciones.length === 0,
  'Sesion: Estado inicial vacío correctamente definido'
);

// ============================================================================
// TEST 5: TYPE RELATIONSHIPS
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 5: TYPE RELATIONSHIPS');
console.log('='.repeat(60));

// Test 5.1: AnalisisOrigen → Hallazgo relationship
const hallazgoFromAnalisis: Peligro = {
  ...peligro,
  analisisOrigenIds: ['hazop-001', 'fmea-001'], // Multiple analyses created this
};

assert(
  hallazgoFromAnalisis.analisisOrigenIds.length === 2,
  'Relación 1:N: Un hallazgo puede ser creado por múltiples análisis'
);

// Test 5.2: Hallazgo → Hallazgo relationship (graph)
const hallazgosRelacionados: Hallazgo[] = [peligro, barrera, poe];
const relacionesEntreHallazgos: RelacionHallazgo[] = [
  {
    id: 'rel-graph-001',
    tipo: 'mitiga',
    origenId: 'barrera-001',
    destinoId: 'peligro-001',
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: 'rel-graph-002',
    tipo: 'controla',
    origenId: 'poe-001',
    destinoId: 'peligro-001',
    fechaCreacion: new Date().toISOString(),
  },
];

assert(
  hallazgosRelacionados.length === 3 &&
  relacionesEntreHallazgos.length === 2,
  'Relación N:N: Múltiples hallazgos con múltiples relaciones (grafo de riesgo)'
);

// Test 5.3: Ubicación consistency
const hallazgosConUbicacion = sesion.hallazgos.filter(h => 
  h.ubicacion.x >= 0 && h.ubicacion.x <= 100 &&
  h.ubicacion.y >= 0 && h.ubicacion.y <= 100
);

assert(
  hallazgosConUbicacion.length === sesion.hallazgos.length,
  'Todos los hallazgos tienen ubicación válida en el diagrama (0-100%)'
);

// ============================================================================
// TEST SUMMARY
// ============================================================================

printSummary();

console.log('\n' + '='.repeat(60));
console.log('INFORMACIÓN DE DEPURACIÓN');
console.log('='.repeat(60));
console.log('Muestra de datos creados:');
console.log('- HAZOP Node:', hazopData.nodo);
console.log('- FMEA Equipo:', fmeaData.equipo);
console.log('- Peligro Title:', peligro.titulo);
console.log('- Barrera Type:', barrera.tipoBarrera);
console.log('- Session ID:', sesion.id);
console.log('- Total Hallazgos in Session:', sesion.hallazgos.length);
console.log('- Total Relaciones in Session:', sesion.relaciones.length);
console.log('='.repeat(60));
