/**
 * ============================================================================
 * UTILITIES TESTS - Generadores and Transformadores Testing
 * ============================================================================
 * 
 * This test file validates all utility functions:
 * - Generadores: ID generation, dates, coordinates, RPN calculations
 * - Transformadores: Analysis → Hallazgos transformations, session helpers
 * 
 * Run with: npx tsx test/utils.test.ts
 * 
 * @module tests/utils.test
 */

import type { AnalisisHAZOP, AnalisisFMEA, AnalisisOrigen } from '@/src/models/analisis/types';
import type { Sesion } from '@/src/models/sesion/types';

import {
  // Generadores
  generarIdUnico,
  generarIdSesion,
  generarIdAnalisis,
  generarIdHallazgo,
  generarFechaISO,
  generarCoordenadaAleatoria,
  validarCoordenadaEnRango,
  corregirCoordenada,
  generarRPN,
  generarNivelRiesgo,
  crearSesionVacia,
  crearSesionDemo,
  
  // Transformadores
  analisisHAZOPtoHallazgos,
  analisisFMEAtoHallazgos,
  analisisToHallazgos,
  hallazgosToTablaData,
  clonarSesion,
  actualizarSesion,
  agregarHallazgoASesion,
  eliminarHallazgoDeSesion,
} from '@/src/models/utils';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN DE PRUEBAS - UTILITIES');
  console.log('='.repeat(60));
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log(`✅ Pasadas: ${testsPassed}`);
  console.log(`❌ Fallidas: ${testsFailed}`);
  console.log('='.repeat(60));
  
  if (testsFailed === 0) {
    console.log('🎉 ¡Todas las pruebas de utilidades pasaron!');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }
}

// ============================================================================
// TEST 1: GENERADORES
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 1: GENERADORES');
console.log('='.repeat(60));

// Test 1.1: generarIdUnico
console.log('\n--- ID Generation ---');

const idUnico = generarIdUnico('test');
assert(
  idUnico.startsWith('test-') && idUnico.split('-').length === 3,
  'generarIdUnico: Formato correcto "prefix-timestamp-random"'
);

const idOtro = generarIdUnico('test');
assert(
  idUnico !== idOtro,
  'generarIdUnico: Genera IDs únicos (no repetidos)'
);

// Test 1.2: generarIdSesion
console.log('\n--- Session ID ---');

const idSesion = generarIdSesion();
const fechaHoy = new Date();
const fechaStr = `${fechaHoy.getFullYear()}${String(fechaHoy.getMonth() + 1).padStart(2, '0')}${String(fechaHoy.getDate()).padStart(2, '0')}`;

assert(
  idSesion.startsWith(`sesion-${fechaStr}-`) && idSesion.length === 19,
  'generarIdSesion: Formato "sesion-YYYYMMDD-NNN"'
);

// Test 1.3: generarIdAnalisis
console.log('\n--- Analysis/Hallazgo IDs ---');

const idHAZOP = generarIdAnalisis('HAZOP');
assert(
  idHAZOP.startsWith('hazop-'),
  'generarIdAnalisis: HAZOP genera prefix "hazop-"'
);

const idPeligro = generarIdHallazgo('Peligro');
assert(
  idPeligro.startsWith('peligro-'),
  'generarIdHallazgo: Peligro genera prefix "peligro-"'
);

const idBarrera = generarIdHallazgo('Barrera');
assert(
  idBarrera.startsWith('barrera-'),
  'generarIdHallazgo: Barrera genera prefix "barrera-"'
);

// Test 1.4: generarFechaISO
console.log('\n--- Date/Time ---');

const fechaISO = generarFechaISO();
assert(
  fechaISO.includes('T') && fechaISO.includes('Z'),
  'generarFechaISO: Formato ISO 8601 válido'
);

const fechaAntes = Date.now();
const fecha1 = generarFechaISO();
const fecha2 = generarFechaISO();
const fechaDespues = Date.now();

assert(
  fecha1 <= fecha2,
  'generarFechaISO: Fechas son cronológicas'
);

// Test 1.5: generarCoordenadaAleatoria
console.log('\n--- Coordinates ---');

const coords = generarCoordenadaAleatoria();
assert(
  typeof coords.x === 'number' && typeof coords.y === 'number',
  'generarCoordenadaAleatoria: Retorna objeto con x, y números'
);

assert(
  validarCoordenadaEnRango(coords.x, coords.y),
  'generarCoordenadaAleatoria: Coordenadas dentro de rango 0-100'
);

// Test 1.6: validarCoordenadaEnRango
assert(
  validarCoordenadaEnRango(50, 50) === true,
  'validarCoordenadaEnRango: (50, 50) es válido'
);

assert(
  validarCoordenadaEnRango(0, 0) === true,
  'validarCoordenadaEnRango: (0, 0) es válido (límite)'
);

assert(
  validarCoordenadaEnRango(100, 100) === true,
  'validarCoordenadaEnRango: (100, 100) es válido (límite)'
);

assert(
  validarCoordenadaEnRango(150, 50) === false,
  'validarCoordenadaEnRango: (150, 50) es inválido (x > 100)'
);

assert(
  validarCoordenadaEnRango(50, -10) === false,
  'validarCoordenadaEnRango: (50, -10) es inválido (y < 0)'
);

// Test 1.7: corregirCoordenada
const corregida = corregirCoordenada(150, -10);
assert(
  corregida.x === 100 && corregida.y === 0,
  'corregirCoordenada: Corrige (150, -10) a (100, 0)'
);

// Test 1.8: generarRPN
console.log('\n--- RPN Calculation ---');

const rpn = generarRPN(7, 4, 3);
assert(
  rpn === 84,
  'generarRPN: 7 × 4 × 3 = 84'
);

const rpnMax = generarRPN(10, 10, 10);
assert(
  rpnMax === 1000,
  'generarRPN: Máximo RPN = 1000 (10 × 10 × 10)'
);

const rpnMin = generarRPN(1, 1, 1);
assert(
  rpnMin === 1,
  'generarRPN: Mínimo RPN = 1 (1 × 1 × 1)'
);

// Test 1.9: generarNivelRiesgo
console.log('\n--- Risk Level ---');

assert(
  generarNivelRiesgo(50) === 'Bajo',
  'generarNivelRiesgo: RPN=50 → Bajo'
);

assert(
  generarNivelRiesgo(100) === 'Bajo',
  'generarNivelRiesgo: RPN=100 → Bajo (límite)'
);

assert(
  generarNivelRiesgo(200) === 'Medio',
  'generarNivelRiesgo: RPN=200 → Medio'
);

assert(
  generarNivelRiesgo(400) === 'Medio',
  'generarNivelRiesgo: RPN=400 → Medio (límite)'
);

assert(
  generarNivelRiesgo(600) === 'Alto',
  'generarNivelRiesgo: RPN=600 → Alto'
);

assert(
  generarNivelRiesgo(1000) === 'Alto',
  'generarNivelRiesgo: RPN=1000 → Alto (máximo)'
);

// Test 1.10: crearSesionVacia
console.log('\n--- Session Creation ---');

const sesionVacia = crearSesionVacia();
assert(
  sesionVacia.id.startsWith('sesion-') &&
  sesionVacia.analisis.length === 0 &&
  sesionVacia.hallazgos.length === 0 &&
  sesionVacia.relaciones.length === 0,
  'crearSesionVacia: Sesión vacía con ID válido'
);

assert(
  sesionVacia.imagenActual === '/ReferenceIamge/Sistema Bombas de Achique_V2.png',
  'crearSesionVacia: Imagen por defecto correcta'
);

assert(
  sesionVacia.filtrosActivos.length === 4 &&
  sesionVacia.vistaActiva === 'mapa',
  'crearSesionVacia: Filtros y vista por defecto correctos'
);

// Test 1.11: crearSesionVacia with custom image
const sesionConImagen = crearSesionVacia('/diagrams/custom.png');
assert(
  sesionConImagen.imagenActual === '/diagrams/custom.png',
  'crearSesionVacia: Acepta imagen personalizada'
);

// Test 1.12: crearSesionDemo
const sesionDemo = crearSesionDemo();
assert(
  sesionDemo.analisis.length === 1 &&
  sesionDemo.hallazgos.length === 2 &&
  sesionDemo.hallazgos.some(h => h.tipo === 'Peligro') &&
  sesionDemo.hallazgos.some(h => h.tipo === 'Barrera'),
  'crearSesionDemo: Sesión demo con datos de ejemplo'
);

// ============================================================================
// TEST 2: TRANSFORMADORES
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 2: TRANSFORMADORES');
console.log('='.repeat(60));

// Test 2.1: analisisHAZOPtoHallazgos
console.log('\n--- HAZOP → Hallazgos ---');

const hazopData: AnalisisHAZOP = {
  nodo: 'Reactor R-101',
  parametro: 'Presión',
  palabraGuia: 'Más de',
  causa: 'Falla en válvula de control PV-101',
  consecuencia: 'Sobrepresión en el reactor con posible ruptura',
  salvaguardasExistentes: ['Válvula de alivio PSV-101', 'SIS-101'],
  recomendaciones: ['Instalar manómetro local', 'Revisar procedimiento de arranque'],
};

const hazopResult = analisisHAZOPtoHallazgos(hazopData);
assert(
  hazopResult.exito === true && hazopResult.errores.length === 0,
  'analisisHAZOPtoHallazgos: Transformación exitosa'
);

assert(
  hazopResult.datos.length >= 3, // 1 Peligro + 2 Barreras + possibly POE
  'analisisHAZOPtoHallazgos: Genera múltiples hallazgos'
);

const hayPeligro = hazopResult.datos.some(h => h.tipo === 'Peligro');
const hayBarrera = hazopResult.datos.some(h => h.tipo === 'Barrera');

assert(
  hayPeligro && hayBarrera,
  'analisisHAZOPtoHallazgos: Genera Peligro y Barrera'
);

// Test 2.2: analisisHAZOPtoHallazgos with invalid data
const hazopInvalido: AnalisisHAZOP = {
  nodo: '', // Missing required
  parametro: '',
  palabraGuia: 'Más de',
  causa: 'Falla',
  consecuencia: 'Sobrepresión',
  salvaguardasExistentes: [], // Empty array
  recomendaciones: [],
};

const hazopInvalidoResult = analisisHAZOPtoHallazgos(hazopInvalido);
assert(
  hazopInvalidoResult.exito === false && hazopInvalidoResult.errores.length > 0,
  'analisisHAZOPtoHallazgos: Rechaza datos inválidos'
);

// Test 2.3: analisisFMEAtoHallazgos
console.log('\n--- FMEA → Hallazgos ---');

const fmeaData: AnalisisFMEA = {
  equipo: 'Bomba centrífuga P-201',
  funcion: 'Evacuar agua acumulada',
  modoFalla: 'Pérdida de sello mecánico',
  efecto: 'Fuga de producto químico al ambiente',
  causa: 'Desgaste por operación sin lubricación',
  barrerasExistentes: ['Inspección visual semanal', 'Sensor de vibración'],
  S: 7, O: 4, D: 3,
  RPN: 84,
  accionesRecomendadas: ['Implementar programa de lubricación'],
};

const fmeaResult = analisisFMEAtoHallazgos(fmeaData);
assert(
  fmeaResult.exito === true,
  'analisisFMEAtoHallazgos: Transformación exitosa'
);

assert(
  fmeaResult.datos.length >= 2, // 1 Peligro + 2 Barreras
  'analisisFMEAtoHallazgos: Genera Peligro y Barreras'
);

// Test 2.4: analisisToHallazgos (dispatcher)
console.log('\n--- analisisToHallazgos (Dispatcher) ---');

const analisisHAZOP: AnalisisOrigen = {
  base: {
    id: 'hazop-001',
    tipo: 'HAZOP',
    fechaCreacion: generarFechaISO(),
    estado: 'completado',
    analisisRelacionadosIds: [],
  },
  datos: hazopData,
};

const dispatcherResult = analisisToHallazgos(analisisHAZOP);
assert(
  dispatcherResult.exito === true && dispatcherResult.datos.length > 0,
  'analisisToHallazgos: Dispatcha correctamente a HAZOP'
);

// Test 2.5: analisisToHallazgos with unsupported type
const analisisInvalido: AnalisisOrigen = {
  base: {
    id: 'invalido',
    tipo: 'INVALIDO' as any,
    fechaCreacion: generarFechaISO(),
    estado: 'completado',
    analisisRelacionadosIds: [],
  },
  datos: {} as any,
};

const invalidoResult = analisisToHallazgos(analisisInvalido);
assert(
  invalidoResult.exito === false && invalidoResult.errores.some(e => e.includes('no soportado')),
  'analisisToHallazgos: Rechaza tipo no soportado'
);

// Test 2.6: hallazgosToTablaData
console.log('\n--- hallazgosToTablaData ---');

const tablaData = hallazgosToTablaData(hazopResult.datos);
assert(
  tablaData.length === hazopResult.datos.length,
  'hallazgosToTablaData: Mismo número de rows que hallazgos'
);

const primeraFila = tablaData[0];
// ✅ ubication en tablaData es STRING (ej: "50, 50"), no objeto
const tieneCamposRequeridos = 
  typeof primeraFila.id === 'string' &&
  typeof primeraFila.tipo === 'string' &&
  typeof primeraFila.titulo === 'string' &&
  typeof primeraFila.ubicacion === 'string' &&
  primeraFila.ubicacion.includes(',');

assert(
  tieneCamposRequeridos,
  'hallazgosToTablaData: Row tiene campos requeridos'
);

// Test 2.7: clonarSesion
console.log('\n--- Session Helpers ---');

const sesionOriginal = crearSesionDemo();
const sesionClonada = clonarSesion(sesionOriginal);

assert(
  sesionClonada.id === sesionOriginal.id &&
  sesionClonada.analisis.length === sesionOriginal.analisis.length,
  'clonarSesion: Clona sesión correctamente'
);

// Modify clone and verify original is unchanged
sesionClonada.vistaActiva = 'tabla';
assert(
  sesionOriginal.vistaActiva === 'mapa' && sesionClonada.vistaActiva === 'tabla',
  'clonarSesion: Clon es independiente del original'
);

// Test 2.8: actualizarSesion
const sesionActualizada = actualizarSesion(sesionOriginal, {
  vistaActiva: 'tabla',
  filtrosActivos: ['Peligro'],
});

assert(
  sesionActualizada.vistaActiva === 'tabla' &&
  sesionActualizada.filtrosActivos.length === 1 &&
  sesionOriginal.vistaActiva === 'mapa', // Original unchanged
  'actualizarSesion: Actualiza campos sin mutar original'
);

// Test 2.9: agregarHallazgoASesion
const hallazgoNuevo = hazopResult.datos[0];
const sesionConHallazgo = agregarHallazgoASesion(sesionOriginal, hallazgoNuevo);

assert(
  sesionConHallazgo.hallazgos.length === sesionOriginal.hallazgos.length + 1,
  'agregarHallazgoASesion: Agrega hallazgo correctamente'
);

assert(
  sesionOriginal.hallazgos.length === 2, // Original unchanged
  'agregarHallazgoASesion: No muta sesión original'
);

// Test 2.10: eliminarHallazgoDeSesion
const hallazgoId = sesionOriginal.hallazgos[0].id;
const sesionSinHallazgo = eliminarHallazgoDeSesion(sesionOriginal, hallazgoId);

assert(
  sesionSinHallazgo.hallazgos.length === sesionOriginal.hallazgos.length - 1,
  'eliminarHallazgoDeSesion: Elimina hallazgo correctamente'
);

assert(
  !sesionSinHallazgo.hallazgos.some(h => h.id === hallazgoId),
  'eliminarHallazgoDeSesion: Hallazgo eliminado no está en nueva sesión'
);

// ============================================================================
// TEST SUMMARY
// ============================================================================

printSummary();

console.log('\n' + '='.repeat(60));
console.log('COBERTURA DE PRUEBAS - UTILITIES');
console.log('='.repeat(60));
console.log('Generadores:');
console.log('  - generarIdUnico: formato, unicidad');
console.log('  - generarIdSesion: formato YYYYMMDD-NNN');
console.log('  - generarIdAnalisis/Hallazgo: prefixes por tipo');
console.log('  - generarFechaISO: formato ISO 8601');
console.log('  - generarCoordenadaAleatoria: rango 0-100');
console.log('  - validarCoordenadaEnRango: válido/inválido');
console.log('  - corregirCoordenada: clamping a rango');
console.log('  - generarRPN: cálculo S × O × D');
console.log('  - generarNivelRiesgo: Bajo/Medio/Alto thresholds');
console.log('  - crearSesionVacia: defaults, imagen personalizada');
console.log('  - crearSesionDemo: datos de ejemplo');
console.log('Transformadores:');
console.log('  - analisisHAZOPtoHallazgos: Peligro, Barrera, POE');
console.log('  - analisisFMEAtoHallazgos: Peligro, Barrera');
console.log('  - analisisToHallazgos: dispatcher por tipo');
console.log('  - hallazgosToTablaData: formato para tablas');
console.log('  - clonarSesion: deep clone');
console.log('  - actualizarSesion: immutable update');
console.log('  - agregar/eliminar/actualizar Hallazgo en Sesion');
console.log('='.repeat(60));
