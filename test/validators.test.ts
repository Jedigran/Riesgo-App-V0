/**
 * ============================================================================
 * VALIDATOR TESTS - Comprehensive Validation Function Testing
 * ============================================================================
 * 
 * This test file validates all validation functions from the models:
 * - Analisis validators (HAZOP, FMEA, LOPA, OCA, Intuicion)
 * - Hallazgo validators (Peligro, Barrera, POE, SOL, Ubicacion)
 * - Relaciones utils (RelacionHallazgo, RelacionAnalisis)
 * 
 * Run with: npx tsx test/validators.test.ts
 * 
 * @module tests/validators.test
 */

import type { Sesion } from '@/src/models/sesion/types';
import type { AnalisisHAZOP, AnalisisFMEA } from '@/src/models/analisis/types';
import type { Peligro, Barrera, POE, SOL, Severidad } from '@/src/models/hallazgo/types';
import type { RelacionHallazgo, RelacionAnalisis } from '@/src/models/relaciones/types';

// Import validators
import {
  validarAnalisisHAZOP,
  validarAnalisisFMEA,
  validarAnalisisLOPA,
  validarAnalisisOCA,
  validarAnalisisIntuicion,
  validarAnalisisBase,
  validarAnalisisGenerico,
} from '@/src/models/analisis/validators';

import {
  validarUbicacion,
  validarPeligro,
  validarBarrera,
  validarPOE,
  validarSOL,
  validarHallazgoGenerico,
  validarHallazgoCompleto,
} from '@/src/models/hallazgo/validators';

import {
  validarRelacionHallazgo,
  validarRelacionAnalisis,
  validarRelacion,
  validarTodasLasRelaciones,
  encontrarHallazgosHuerfanos,
  encontrarAnalisisHuerfanos,
} from '@/src/models/relaciones/utils';

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
  console.log('RESUMEN DE PRUEBAS - VALIDATORS');
  console.log('='.repeat(60));
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log(`✅ Pasadas: ${testsPassed}`);
  console.log(`❌ Fallidas: ${testsFailed}`);
  console.log('='.repeat(60));
  
  if (testsFailed === 0) {
    console.log('🎉 ¡Todas las pruebas de validación pasaron!');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }
}

// ============================================================================
// HELPER: CREATE SAMPLE SESSION
// ============================================================================

/**
 * Creates a sample session with valid data for relationship testing.
 */
function crearSesionEjemplo(): Sesion {
  const fechaISO = new Date().toISOString();
  
  return {
    id: 'sesion-test-001',
    analisis: [
      {
        base: {
          id: 'hazop-001',
          tipo: 'HAZOP',
          fechaCreacion: fechaISO,
          estado: 'completado',
          analisisRelacionadosIds: ['fmea-001'],
        },
        datos: {
          nodo: 'Reactor R-101',
          parametro: 'Presión',
          palabraGuia: 'Más de',
          causa: 'Falla en válvula',
          consecuencia: 'Sobrepresión',
          salvaguardasExistentes: ['PSV-101'],
          recomendaciones: ['Instalar manómetro'],
        } as AnalisisHAZOP,
      },
      {
        base: {
          id: 'fmea-001',
          tipo: 'FMEA',
          fechaCreacion: fechaISO,
          estado: 'completado',
          analisisRelacionadosIds: ['hazop-001'],
        },
        datos: {
          equipo: 'Bomba P-201',
          funcion: 'Evacuar agua',
          modoFalla: 'Fuga',
          efecto: 'Pérdida de producto',
          causa: 'Desgaste',
          barrerasExistentes: ['Inspección'],
          S: 7, O: 4, D: 3, RPN: 84,
          accionesRecomendadas: ['Lubricación'],
        } as AnalisisFMEA,
      },
    ],
    hallazgos: [
      {
        id: 'peligro-001',
        tipo: 'Peligro',
        titulo: 'Sobrepresión en Reactor',
        descripcion: 'Riesgo de sobrepresión',
        ubicacion: { x: 45, y: 30 },
        fechaCreacion: fechaISO,
        analisisOrigenIds: ['hazop-001'],
        hallazgosRelacionadosIds: ['barrera-001'],
        consecuencia: 'Ruptura del reactor',
        severidad: 5,
        causaRaiz: 'Diseño inadecuado',
      } as Peligro,
      {
        id: 'barrera-001',
        tipo: 'Barrera',
        titulo: 'Válvula de Alivio PSV-101',
        descripcion: 'Alivia presión',
        ubicacion: { x: 47, y: 32 },
        fechaCreacion: fechaISO,
        analisisOrigenIds: ['hazop-001'],
        hallazgosRelacionadosIds: ['peligro-001'],
        tipoBarrera: 'Fisica',
        efectividadEstimada: 4,
        elementoProtegido: 'Reactor R-101',
      } as Barrera,
    ],
    relaciones: [
      {
        id: 'rel-001',
        tipo: 'mitiga',
        origenId: 'barrera-001',
        destinoId: 'peligro-001',
        fechaCreacion: fechaISO,
      } as RelacionHallazgo,
    ],
    gruposProteccion: [],
    imagenActual: '/diagrams/test.png',
    filtrosActivos: ['Peligro', 'Barrera', 'POE', 'SOL'],
    vistaActiva: 'mapa',
  };
}

// ============================================================================
// TEST 1: ANALISIS VALIDATORS
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 1: ANALISIS VALIDATORS');
console.log('='.repeat(60));

// Test 1.1: validarAnalisisHAZOP with valid data
console.log('\n--- validarAnalisisHAZOP ---');

const hazopValido: AnalisisHAZOP = {
  nodo: 'Reactor R-101',
  parametro: 'Presión',
  palabraGuia: 'Más de',
  causa: 'Falla en válvula de control PV-101',
  consecuencia: 'Sobrepresión en el reactor con posible ruptura',
  salvaguardasExistentes: ['Válvula de alivio PSV-101', 'SIS-101'],
  recomendaciones: ['Instalar manómetro local', 'Revisar procedimiento'],
};

const resultHAZOPValido = validarAnalisisHAZOP(hazopValido);
assert(
  resultHAZOPValido.valido === true && resultHAZOPValido.errores.length === 0,
  'HAZOP válido: Todos los campos requeridos presentes'
);

// Test 1.2: validarAnalisisHAZOP with missing required field
const hazopInvalido: AnalisisHAZOP = {
  nodo: 'Reactor R-101',
  parametro: '', // Missing required field
  palabraGuia: 'Más de',
  causa: 'Falla en válvula',
  consecuencia: 'Sobrepresión',
  salvaguardasExistentes: ['PSV-101'],
  recomendaciones: ['Instalar manómetro'],
};

const resultHAZOPInvalido = validarAnalisisHAZOP(hazopInvalido);
assert(
  resultHAZOPInvalido.valido === false && 
  resultHAZOPInvalido.errores.some(e => e.includes('parametro')),
  'HAZOP inválido: Detecta campo "parametro" vacío'
);

// Test 1.3: validarAnalisisHAZOP with empty arrays
const hazopSinArrays: AnalisisHAZOP = {
  nodo: 'Reactor R-101',
  parametro: 'Presión',
  palabraGuia: 'Más de',
  causa: 'Falla',
  consecuencia: 'Sobrepresión',
  salvaguardasExistentes: [], // Empty array
  recomendaciones: [], // Empty array
};

const resultHAZOPSinArrays = validarAnalisisHAZOP(hazopSinArrays);
assert(
  resultHAZOPSinArrays.valido === false &&
  resultHAZOPSinArrays.errores.some(e => e.includes('salvaguardasExistentes')) &&
  resultHAZOPSinArrays.errores.some(e => e.includes('recomendaciones')),
  'HAZOP inválido: Detecta arrays vacíos'
);

// Test 1.4: validarAnalisisFMEA with S/O/D in range 1-10
console.log('\n--- validarAnalisisFMEA ---');

const fmeaValido: AnalisisFMEA = {
  equipo: 'Bomba centrífuga P-201',
  funcion: 'Evacuar agua acumulada',
  modoFalla: 'Pérdida de sello mecánico',
  efecto: 'Fuga de producto químico',
  causa: 'Desgaste por operación sin lubricación',
  barrerasExistentes: ['Inspección visual semanal', 'Sensor de vibración'],
  S: 7, // Valid: 1-10
  O: 4, // Valid: 1-10
  D: 3, // Valid: 1-10
  RPN: 84, // 7 × 4 × 3 = 84
  accionesRecomendadas: ['Implementar programa de lubricación'],
};

const resultFMEAValido = validarAnalisisFMEA(fmeaValido);
assert(
  resultFMEAValido.valido === true && resultFMEAValido.errores.length === 0,
  'FMEA válido: S/O/D en rango 1-10, RPN correcto'
);

// Test 1.5: validarAnalisisFMEA with S out of range
const fmeaSInvalido: AnalisisFMEA = {
  ...fmeaValido,
  S: 15, // Invalid: > 10
  RPN: 60, // Would be 15 × 4 × 3 = 180, but S is invalid anyway
};

const resultFMEASInvalido = validarAnalisisFMEA(fmeaSInvalido);
assert(
  resultFMEASInvalido.valido === false &&
  resultFMEASInvalido.errores.some(e => e.includes('Severidad')) &&
  resultFMEASInvalido.errores.some(e => e.includes('1 y 10')),
  'FMEA inválido: Detecta S fuera de rango (15 > 10)'
);

// Test 1.6: validarAnalisisFMEA with O = 0 (out of range)
const fmeaOInvalido: AnalisisFMEA = {
  ...fmeaValido,
  O: 0, // Invalid: < 1
  RPN: 0,
};

const resultFMEAOInvalido = validarAnalisisFMEA(fmeaOInvalido);
assert(
  resultFMEAOInvalido.valido === false &&
  resultFMEAOInvalido.errores.some(e => e.includes('Ocurrencia')),
  'FMEA inválido: Detecta O fuera de rango (0 < 1)'
);

// Test 1.7: validarAnalisisFMEA RPN auto-calculation
const fmeaRPNIncorrecto: AnalisisFMEA = {
  ...fmeaValido,
  S: 8, O: 5, D: 4,
  RPN: 100, // Incorrect: should be 8 × 5 × 4 = 160
};

const resultFMEARPNIncorrecto = validarAnalisisFMEA(fmeaRPNIncorrecto);
assert(
  resultFMEARPNIncorrecto.valido === false &&
  resultFMEARPNIncorrecto.errores.some(e => e.includes('RPN')) &&
  resultFMEARPNIncorrecto.errores.some(e => e.includes('160')),
  'FMEA inválido: Detecta RPN incorrecto (esperado 160, obtenido 100)'
);

// Test 1.8: validarAnalisisFMEA with high RPN warning
const fmeaRPNAlto: AnalisisFMEA = {
  ...fmeaValido,
  S: 9, O: 8, D: 7,
  RPN: 504, // 9 × 8 × 7 = 504 (high risk)
};

const resultFMEARPNAlto = validarAnalisisFMEA(fmeaRPNAlto);
assert(
  resultFMEARPNAlto.valido === true &&
  (resultFMEARPNAlto.advertencias ?? []).some(a => a.includes('RPN alto')),
  'FMEA válido: Genera advertencia para RPN alto (≥400)'
);

// Test 1.9: validarAnalisisLOPA
console.log('\n--- validarAnalisisLOPA ---');

const lopaValido = {
  escenario: 'Sobrepresión en separador V-301',
  frecuenciaInicial: 0.1,
  consecuencia: 'Ruptura de recipiente',
  capasIPL: [
    { nombre: 'BPCS - Alarma', pfd: 0.1 },
    { nombre: 'SIS - Parada', pfd: 0.01 },
  ],
  frecuenciaFinal: 0.0001, // 0.1 × 0.1 × 0.01
  objetivoRiesgo: 0.00001,
};

const resultLOPAValido = validarAnalisisLOPA(lopaValido as any);
assert(
  resultLOPAValido.valido === true,
  'LOPA válido: Frecuencias y IPLs correctos'
);

// Test 1.10: validarAnalisisLOPA with invalid PFD
const lopaPFDInvalido = {
  ...lopaValido,
  capasIPL: [
    { nombre: 'BPCS', pfd: 1.5 }, // Invalid: PFD > 1
  ],
};

const resultLOPAPFDInvalido = validarAnalisisLOPA(lopaPFDInvalido as any);
assert(
  resultLOPAPFDInvalido.valido === false &&
  resultLOPAPFDInvalido.errores.some(e => e.includes('pfd')) &&
  resultLOPAPFDInvalido.errores.some(e => e.includes('0 y 1')),
  'LOPA inválido: Detecta PFD fuera de rango (> 1)'
);

// Test 1.11: validarAnalisisOCA
console.log('\n--- validarAnalisisOCA ---');

const ocaValido = {
  eventoIniciador: 'Pérdida de energía',
  consecuencia: 'Parada no controlada',
  barrerasExistentes: ['UPS', 'Generador'],
  gaps: ['UPS capacidad insuficiente'],
  recomendaciones: ['Ampliar UPS'],
};

const resultOCAValido = validarAnalisisOCA(ocaValido as any);
assert(
  resultOCAValido.valido === true,
  'OCA válido: Todos los campos requeridos presentes'
);

const ocaInvalido = {
  eventoIniciador: '', // Missing
  consecuencia: 'Parada',
  barrerasExistentes: [], // Empty
  gaps: ['Gap 1'],
  recomendaciones: ['Rec 1'],
};

const resultOCAInvalido = validarAnalisisOCA(ocaInvalido as any);
assert(
  resultOCAInvalido.valido === false &&
  resultOCAInvalido.errores.some(e => e.includes('eventoIniciador')) &&
  resultOCAInvalido.errores.some(e => e.includes('barrerasExistentes')),
  'OCA inválido: Detecta campos faltantes y arrays vacíos'
);

// Test 1.12: validarAnalisisIntuicion
console.log('\n--- validarAnalisisIntuicion ---');

const intuicionValido = {
  titulo: 'Observación de corrosión',
  descripcion: 'Se observa corrosión en tubería de vapor',
  observaciones: ['15 años de servicio', 'Posible CUI'],
};

const resultIntuicionValido = validarAnalisisIntuicion(intuicionValido as any);
assert(
  resultIntuicionValido.valido === true,
  'Intuicion válido: Título, descripción y observaciones presentes'
);

const intuicionInvalido = {
  titulo: '', // Missing
  descripcion: '', // Missing
  observaciones: [], // Empty
};

const resultIntuicionInvalido = validarAnalisisIntuicion(intuicionInvalido as any);
assert(
  resultIntuicionInvalido.valido === false &&
  resultIntuicionInvalido.errores.length >= 2,
  'Intuicion inválido: Detecta múltiples campos faltantes'
);

// Test 1.13: validarAnalisisBase
console.log('\n--- validarAnalisisBase ---');

const baseValido = {
  id: 'hazop-001',
  tipo: 'HAZOP' as const,
  fechaCreacion: new Date().toISOString(),
  estado: 'completado' as const,
  analisisRelacionadosIds: ['fmea-001'],
};

const resultBaseValido = validarAnalisisBase(baseValido);
assert(
  resultBaseValido.valido === true,
  'AnalisisBase válido: Todos los campos comunes correctos'
);

const baseInvalido = {
  ...baseValido,
  tipo: 'INVALIDO' as any,
  estado: 'INVALIDO' as any,
};

const resultBaseInvalido = validarAnalisisBase(baseInvalido);
assert(
  resultBaseInvalido.valido === false &&
  resultBaseInvalido.errores.some(e => e.includes('Tipo')) &&
  resultBaseInvalido.errores.some(e => e.includes('Estado')),
  'AnalisisBase inválido: Detecta tipo y estado inválidos'
);

// ============================================================================
// TEST 2: HALLAZGO VALIDATORS
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 2: HALLAZGO VALIDATORS');
console.log('='.repeat(60));

// Test 2.1: validarUbicacion with valid coordinates (0-100)
console.log('\n--- validarUbicacion ---');

const ubicacionValida = validarUbicacion(50, 30);
assert(
  ubicacionValida.valido === true,
  'Ubicación válida: x=50, y=30 dentro de rango 0-100'
);

const ubicacionLimite = validarUbicacion(0, 100);
assert(
  ubicacionLimite.valido === true,
  'Ubicación válida: Límites 0 y 100 son aceptados'
);

// Test 2.2: validarUbicacion with values outside 0-100
const ubicacionInvalidaX = validarUbicacion(150, 50);
assert(
  ubicacionInvalidaX.valido === false &&
  ubicacionInvalidaX.errores.some(e => e.includes('x')),
  'Ubicación inválida: Detecta x=150 fuera de rango'
);

const ubicacionInvalidaY = validarUbicacion(50, -10);
assert(
  ubicacionInvalidaY.valido === false &&
  ubicacionInvalidaY.errores.some(e => e.includes('y')),
  'Ubicación inválida: Detecta y=-10 fuera de rango'
);

// Test 2.3: validarPeligro with severidad 1-5
console.log('\n--- validarPeligro ---');

const peligroValido: Peligro = {
  id: 'peligro-001',
  tipo: 'Peligro',
  tipoPeligro: 'Inherente',
  titulo: 'Sobrepresión en Reactor',
  descripcion: 'Riesgo de sobrepresión durante llenado rápido',
  ubicacion: { x: 45, y: 30 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['hazop-001'],
  hallazgosRelacionadosIds: ['barrera-001'],
  consecuencia: 'Ruptura del reactor',
  severidad: 5, // Valid: 1-5
  causaRaiz: 'Diseño inadecuado del sistema de control',
};

const resultPeligroValido = validarPeligro(peligroValido);
assert(
  resultPeligroValido.valido === true,
  'Peligro válido: severidad=5 en rango 1-5'
);

// Test 2.4: validarPeligro with severidad out of range
const peligroSeveridadAlta = { ...peligroValido, severidad: 8 as any };
const resultPeligroSeveridadAlta = validarPeligro(peligroSeveridadAlta);
assert(
  resultPeligroSeveridadAlta.valido === false &&
  resultPeligroSeveridadAlta.errores.some(e => e.includes('severidad')) &&
  resultPeligroSeveridadAlta.errores.some(e => e.includes('1 y 5')),
  'Peligro inválido: Detecta severidad=8 fuera de rango'
);

const peligroSeveridadBaja = { ...peligroValido, severidad: 0 as any };
const resultPeligroSeveridadBaja = validarPeligro(peligroSeveridadBaja);
assert(
  resultPeligroSeveridadBaja.valido === false,
  'Peligro inválido: Detecta severidad=0 fuera de rango'
);

// Test 2.5: validarPeligro with high severity warning
const peligroSeveridad4 = { ...peligroValido, severidad: 4 as Severidad };
const resultPeligroSeveridad4 = validarPeligro(peligroSeveridad4);
assert(
  resultPeligroSeveridad4.valido === true &&
  (resultPeligroSeveridad4.advertencias ?? []).some(a => a.includes('Severidad alta')),
  'Peligro válido: Genera advertencia para severidad alta (≥4)'
);

// Test 2.6: validarBarrera with tipoBarrera válido
console.log('\n--- validarBarrera ---');

const barreraValida: Barrera = {
  id: 'barrera-001',
  tipo: 'Barrera',
  titulo: 'Válvula de Alivio PSV-101',
  descripcion: 'Válvula de seguridad',
  ubicacion: { x: 47, y: 32 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['hazop-001'],
  hallazgosRelacionadosIds: ['peligro-001'],
  tipoBarrera: 'Fisica', // Valid
  tipoBarreraFuncion: 'Mitigativa',
  efectividadEstimada: 4, // Valid: 1-5
  elementoProtegido: 'Reactor R-101',
};

const resultBarreraValida = validarBarrera(barreraValida);
assert(
  resultBarreraValida.valido === true,
  'Barrera válida: tipoBarrera="Fisica", efectividad=4'
);

// Test 2.7: validarBarrera with invalid tipoBarrera
const barreraTipoInvalido: Barrera = {
  ...barreraValida,
  tipoBarrera: 'Invalida' as any,
};

const resultBarreraTipoInvalido = validarBarrera(barreraTipoInvalido);
assert(
  resultBarreraTipoInvalido.valido === false &&
  resultBarreraTipoInvalido.errores.some(e => e.includes('tipoBarrera')),
  'Barrera inválida: Detecta tipoBarrera inválido'
);

// Test 2.8: validarBarrera with efectividad out of range
const barreraEfectividadInvalida: Barrera = {
  ...barreraValida,
  efectividadEstimada: 6 as any,
};

const resultBarreraEfectividadInvalida = validarBarrera(barreraEfectividadInvalida);
assert(
  resultBarreraEfectividadInvalida.valido === false &&
  resultBarreraEfectividadInvalida.errores.some(e => e.includes('efectividad')),
  'Barrera inválida: Detecta efectividad=6 fuera de rango'
);

// Test 2.9: validarBarrera with low effectiveness warning
const barreraBajaEfectividad: Barrera = {
  ...barreraValida,
  efectividadEstimada: 2,
};

const resultBarreraBajaEfectividad = validarBarrera(barreraBajaEfectividad);
assert(
  resultBarreraBajaEfectividad.valido === true &&
  (resultBarreraBajaEfectividad.advertencias ?? []).some(a => a.includes('Efectividad baja')),
  'Barrera válida: Genera advertencia para efectividad baja (≤2)'
);

// Test 2.10: validarPOE
console.log('\n--- validarPOE ---');

const poeValido: POE = {
  id: 'poe-001',
  tipo: 'POE',
  titulo: 'Procedimiento de Arranque',
  descripcion: 'Pasos para arranque seguro',
  ubicacion: { x: 50, y: 35 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['hazop-001'],
  hallazgosRelacionadosIds: ['peligro-001'],
  procedimientoReferencia: 'POE-R101-001',
  frecuenciaAplicacion: 'Cada arranque',
  responsable: 'Operador de Planta',
};

const resultPOEValido = validarPOE(poeValido);
assert(
  resultPOEValido.valido === true,
  'POE válido: procedimiento, frecuencia y responsable presentes'
);

const poeInvalido: POE = {
  ...poeValido,
  procedimientoReferencia: '', // Missing
  responsable: '', // Missing
};

const resultPOEInvalido = validarPOE(poeInvalido);
assert(
  resultPOEInvalido.valido === false &&
  resultPOEInvalido.errores.some(e => e.includes('procedimientoReferencia')) &&
  resultPOEInvalido.errores.some(e => e.includes('responsable')),
  'POE inválido: Detecta campos requeridos faltantes'
);

// Test 2.11: validarSOL
console.log('\n--- validarSOL ---');

const solValido: SOL = {
  id: 'sol-001',
  tipo: 'SOL',
  titulo: 'SIS-101',
  descripcion: 'Sistema de parada de emergencia',
  ubicacion: { x: 48, y: 33 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: ['lopa-001'],
  hallazgosRelacionadosIds: ['barrera-001'],
  capaNumero: 2,
  independiente: true,
  tipoTecnologia: 'Sistema lógico 1oo2',
  parametro: 'Presión',
  valorMinimo: 0,
  valorMaximo: 150,
  unidad: 'psi',
};

const resultSOLValido = validarSOL(solValido);
assert(
  resultSOLValido.valido === true,
  'SOL válido: capaNumero=2, independiente=true'
);

const solInvalido: SOL = {
  ...solValido,
  capaNumero: 0, // Invalid: must be >= 1
  independiente: false as any,
};

const resultSOLInvalido = validarSOL(solInvalido);
assert(
  resultSOLInvalido.valido === false &&
  resultSOLInvalido.errores.some(e => e.includes('capaNumero')),
  'SOL inválido: Detecta capaNumero=0 (debe ser >= 1)'
);

// Test 2.12: validarSOL with non-independent warning
const solNoIndependiente: SOL = {
  ...solValido,
  independiente: false,
};

const resultSOLNoIndependiente = validarSOL(solNoIndependiente);
assert(
  resultSOLNoIndependiente.valido === true &&
  (resultSOLNoIndependiente.advertencias ?? []).some(a => a.includes('NO independiente')),
  'SOL válido: Genera advertencia para capa no independiente'
);

// Test 2.13: validarHallazgoGenerico (dispatcher)
console.log('\n--- validarHallazgoGenerico ---');

const resultGenericoPeligro = validarHallazgoGenerico(peligroValido);
assert(
  resultGenericoPeligro.valido === true,
  'validarHallazgoGenerico: Dispatcha correctamente a validarPeligro'
);

const resultGenericoBarrera = validarHallazgoGenerico(barreraValida);
assert(
  resultGenericoBarrera.valido === true,
  'validarHallazgoGenerico: Dispatcha correctamente a validarBarrera'
);

// ============================================================================
// TEST 3: RELACIONES UTILS
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 3: RELACIONES UTILS');
console.log('='.repeat(60));

const sesion = crearSesionEjemplo();

// Test 3.1: validarRelacionHallazgo with existing IDs
console.log('\n--- validarRelacionHallazgo ---');

const relacionHallazgoValida: RelacionHallazgo = {
  id: 'rel-002',
  tipo: 'mitiga',
  origenId: 'barrera-001', // Exists in session
  destinoId: 'peligro-001', // Exists in session
  fechaCreacion: new Date().toISOString(),
};

const resultRelacionHallazgoValida = validarRelacionHallazgo(relacionHallazgoValida, sesion);
assert(
  resultRelacionHallazgoValida.valido === true && resultRelacionHallazgoValida.errores.length === 0,
  'RelacionHallazgo válida: origenId y destinoId existen en sesión'
);

// Test 3.2: validarRelacionHallazgo with non-existent ID
const relacionHallazgoInvalida: RelacionHallazgo = {
  id: 'rel-003',
  tipo: 'mitiga',
  origenId: 'barrera-inexistente', // Does NOT exist
  destinoId: 'peligro-001',
  fechaCreacion: new Date().toISOString(),
};

const resultRelacionHallazgoInvalida = validarRelacionHallazgo(relacionHallazgoInvalida, sesion);
assert(
  resultRelacionHallazgoInvalida.valido === false &&
  resultRelacionHallazgoInvalida.errores.some(e => e.includes('barrera-inexistente')),
  'RelacionHallazgo inválida: Detecta origenId inexistente'
);

// Test 3.3: validarRelacionHallazgo with self-reference
const relacionAutoReferencia: RelacionHallazgo = {
  id: 'rel-004',
  tipo: 'mitiga',
  origenId: 'barrera-001',
  destinoId: 'barrera-001', // Same as origen
  fechaCreacion: new Date().toISOString(),
};

const resultRelacionAutoReferencia = validarRelacionHallazgo(relacionAutoReferencia, sesion);
assert(
  resultRelacionAutoReferencia.valido === false &&
  resultRelacionAutoReferencia.errores.some(e => e.includes('mismo hallazgo')),
  'RelacionHallazgo inválida: Detecta auto-referencia (origen = destino)'
);

// Test 3.4: validarRelacionHallazgo with duplicate detection
const relacionDuplicada: RelacionHallazgo = {
  id: 'rel-005',
  tipo: 'mitiga',
  origenId: 'barrera-001',
  destinoId: 'peligro-001',
  fechaCreacion: new Date().toISOString(),
};

const resultRelacionDuplicada = validarRelacionHallazgo(relacionDuplicada, sesion);
assert(
  (resultRelacionDuplicada.advertencias ?? []).some(a => a.includes('duplicada')),
  'RelacionHallazgo: Genera advertencia por relación duplicada'
);

// Test 3.5: validarRelacionAnalisis with valid IDs
console.log('\n--- validarRelacionAnalisis ---');

const relacionAnalisisValida: RelacionAnalisis = {
  id: 'rel-analysis-001',
  tipo: 'sustenta',
  analisisSustentoId: 'fmea-001', // Exists
  analisisSustentadoId: 'hazop-001', // Exists
  descripcion: 'FMEA informa HAZOP',
  fechaCreacion: new Date().toISOString(),
};

const resultRelacionAnalisisValida = validarRelacionAnalisis(relacionAnalisisValida, sesion);
assert(
  resultRelacionAnalisisValida.valido === true && resultRelacionAnalisisValida.errores.length === 0,
  'RelacionAnalisis válida: ambos IDs existen en sesión'
);

// Test 3.6: validarRelacionAnalisis with non-existent ID
const relacionAnalisisInvalida: RelacionAnalisis = {
  id: 'rel-analysis-002',
  tipo: 'sustenta',
  analisisSustentoId: 'fmea-inexistente', // Does NOT exist
  analisisSustentadoId: 'hazop-001',
  descripcion: 'Test',
  fechaCreacion: new Date().toISOString(),
};

const resultRelacionAnalisisInvalida = validarRelacionAnalisis(relacionAnalisisInvalida, sesion);
assert(
  resultRelacionAnalisisInvalida.valido === false &&
  resultRelacionAnalisisInvalida.errores.some(e => e.includes('fmea-inexistente')),
  'RelacionAnalisis inválida: Detecta analisisSustentoId inexistente'
);

// Test 3.7: validarRelacionAnalisis with same ID
const relacionAnalisisMismoID: RelacionAnalisis = {
  id: 'rel-analysis-003',
  tipo: 'sustenta',
  analisisSustentoId: 'hazop-001',
  analisisSustentadoId: 'hazop-001', // Same as sustento
  descripcion: 'Auto-referencia',
  fechaCreacion: new Date().toISOString(),
};

const resultRelacionAnalisisMismoID = validarRelacionAnalisis(relacionAnalisisMismoID, sesion);
assert(
  resultRelacionAnalisisMismoID.valido === false &&
  resultRelacionAnalisisMismoID.errores.some(e => e.includes('mismo análisis')),
  'RelacionAnalisis inválida: Detecta mismo ID para sustento y sustentado'
);

// Test 3.8: validarRelacion (generic dispatcher)
console.log('\n--- validarRelacion (dispatcher) ---');

const resultDispatcherHallazgo = validarRelacion(relacionHallazgoValida, sesion);
assert(
  resultDispatcherHallazgo.valido === true,
  'validarRelacion: Dispatcha correctamente a validarRelacionHallazgo'
);

const resultDispatcherAnalisis = validarRelacion(relacionAnalisisValida, sesion);
assert(
  resultDispatcherAnalisis.valido === true,
  'validarRelacion: Dispatcha correctamente a validarRelacionAnalisis'
);

// Test 3.9: encontrarHallazgosHuerfanos
console.log('\n--- encontrarHallazgosHuerfanos ---');

const sesionConHuerfano: Sesion = {
  ...sesion,
  hallazgos: [
    ...sesion.hallazgos,
    {
      id: 'poe-huerfano',
      tipo: 'POE',
      titulo: 'POE sin relaciones',
      descripcion: 'Este POE no tiene relaciones',
      ubicacion: { x: 50, y: 50 },
      fechaCreacion: new Date().toISOString(),
      analisisOrigenIds: [],
      hallazgosRelacionadosIds: [], // No relationships
      procedimientoReferencia: 'POE-001',
      frecuenciaAplicacion: 'Diario',
      responsable: 'Operador',
    } as POE,
  ],
};

const huerfanos = encontrarHallazgosHuerfanos(sesionConHuerfano);
assert(
  huerfanos.includes('poe-huerfano'),
  'encontrarHallazgosHuerfanos: Detecta POE sin relaciones'
);

assert(
  !huerfanos.includes('peligro-001') && !huerfanos.includes('barrera-001'),
  'encontrarHallazgosHuerfanos: No marca hallazgos con relaciones como huerfanos'
);

// Test 3.10: encontrarAnalisisHuerfanos
console.log('\n--- encontrarAnalisisHuerfanos ---');

const sesionConAnalisisHuerfano: Sesion = {
  ...sesion,
  analisis: [
    ...sesion.analisis,
    {
      base: {
        id: 'lopa-huerfano',
        tipo: 'LOPA',
        fechaCreacion: new Date().toISOString(),
        estado: 'completado',
        analisisRelacionadosIds: [], // No relationships
      },
      datos: {
        escenario: 'Test',
        frecuenciaInicial: 0.1,
        consecuencia: 'Test',
        capasIPL: [],
        frecuenciaFinal: 0.01,
        objetivoRiesgo: 0.001,
      } as any,
    },
  ],
};

const analisisHuerfanos = encontrarAnalisisHuerfanos(sesionConAnalisisHuerfano);
assert(
  analisisHuerfanos.includes('lopa-huerfano'),
  'encontrarAnalisisHuerfanos: Detecta análisis sin relaciones'
);

// Test 3.11: validarTodasLasRelaciones (batch validation)
console.log('\n--- validarTodasLasRelaciones ---');

const sesionConRelacionInvalida: Sesion = {
  ...sesion,
  relaciones: [
    ...sesion.relaciones,
    {
      id: 'rel-invalida',
      tipo: 'mitiga',
      origenId: 'inexistente',
      destinoId: 'peligro-001',
      fechaCreacion: new Date().toISOString(),
    } as RelacionHallazgo,
  ],
};

const batchResult = validarTodasLasRelaciones(sesionConRelacionInvalida);
assert(
  batchResult.todosValidos === false,
  'validarTodasLasRelaciones: Detecta relación inválida en batch'
);
assert(
  batchResult.resultados.some(r => !r.resultado.valido),
  'validarTodasLasRelaciones: Identifica relación específica inválida'
);

// ============================================================================
// TEST SUMMARY
// ============================================================================

printSummary();

console.log('\n' + '='.repeat(60));
console.log('COBERTURA DE PRUEBAS');
console.log('='.repeat(60));
console.log('Analisis Validators:');
console.log('  - HAZOP: válido, campos faltantes, arrays vacíos');
console.log('  - FMEA: S/O/D 1-10, RPN cálculo, advertencias RPN alto');
console.log('  - LOPA: frecuencias, PFD válido/inválido');
console.log('  - OCA: campos requeridos, arrays');
console.log('  - Intuicion: título, descripción, observaciones');
console.log('  - Base: tipo, estado válidos/inválidos');
console.log('Hallazgo Validators:');
console.log('  - Ubicacion: 0-100 válido, fuera de rango');
console.log('  - Peligro: severidad 1-5, advertencias severidad alta');
console.log('  - Barrera: tipoBarrera, efectividad 1-5, advertencias');
console.log('  - POE: procedimiento, frecuencia, responsable');
console.log('  - SOL: capaNumero, independiente, tipoTecnologia');
console.log('Relaciones Utils:');
console.log('  - RelacionHallazgo: IDs existentes, inexistentes, auto-referencia');
console.log('  - RelacionAnalisis: IDs existentes, mismos IDs');
console.log('  - encontrarHallazgosHuerfanos / encontrarAnalisisHuerfanos');
console.log('  - validarTodasLasRelaciones: batch validation');
console.log('='.repeat(60));
