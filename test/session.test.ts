/**
 * ============================================================================
 * SESSION HOOKS TEST - Manual Testing for useSesion
 * ============================================================================
 * 
 * This test file validates the session management hooks.
 * 
 * Run with: npx tsx test/session.test.ts
 * 
 * @module tests/session.test
 */

import { crearSesionVacia, crearSesionDemo } from '@/src/models/utils/generadores';
import { clonarSesion } from '@/src/models/utils/transformadores';
import { obtenerEstadisticasDeSesion } from '@/src/lib/state/SessionContext';

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
  console.log('RESUMEN DE PRUEBAS - SESSION HOOKS');
  console.log('='.repeat(60));
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log(`✅ Pasadas: ${testsPassed}`);
  console.log(`❌ Fallidas: ${testsFailed}`);
  console.log('='.repeat(60));
  
  if (testsFailed === 0) {
    console.log('🎉 ¡Todas las pruebas de sesión pasaron!');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }
}

// ============================================================================
// TEST 1: SESSION FACTORY FUNCTIONS
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 1: SESSION FACTORY FUNCTIONS');
console.log('='.repeat(60));

// Test 1.1: crearSesionVacia
console.log('\n--- crearSesionVacia ---');

const sesionVacia = crearSesionVacia();
assert(
  sesionVacia.id.length > 0 &&
  sesionVacia.analisis.length === 0 &&
  sesionVacia.hallazgos.length === 0 &&
  sesionVacia.relaciones.length === 0,
  'crearSesionVacia: Crea sesión vacía con ID válido'
);

assert(
  sesionVacia.imagenActual === '/diagrams/default-plant.png' &&
  sesionVacia.filtrosActivos.length === 4 &&
  sesionVacia.vistaActiva === 'mapa',
  'crearSesionVacia: Valores por defecto correctos'
);

// Test 1.2: crearSesionVacia with custom image
const sesionCustom = crearSesionVacia('/diagrams/planta-01.png');
assert(
  sesionCustom.imagenActual === '/diagrams/planta-01.png',
  'crearSesionVacia: Acepta imagen personalizada'
);

// Test 1.3: crearSesionDemo
console.log('\n--- crearSesionDemo ---');

const sesionDemo = crearSesionDemo();
assert(
  sesionDemo.analisis.length === 1 &&
  sesionDemo.hallazgos.length === 2,
  'crearSesionDemo: Crea sesión con datos de ejemplo'
);

assert(
  sesionDemo.analisis[0].base.tipo === 'HAZOP' &&
  sesionDemo.hallazgos.some(h => h.tipo === 'Peligro') &&
  sesionDemo.hallazgos.some(h => h.tipo === 'Barrera'),
  'crearSesionDemo: Datos de ejemplo incluyen HAZOP, Peligro y Barrera'
);

// ============================================================================
// TEST 2: SESSION CLONING
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 2: SESSION CLONING');
console.log('='.repeat(60));

// Test 2.1: clonarSesion
const sesionOriginal = crearSesionDemo();
const sesionClonada = clonarSesion(sesionOriginal);

assert(
  sesionClonada.id === sesionOriginal.id &&
  sesionClonada.analisis.length === sesionOriginal.analisis.length,
  'clonarSesion: Clona sesión correctamente'
);

// Test 2.2: Verify deep clone (independence)
sesionClonada.vistaActiva = 'tabla';
assert(
  sesionOriginal.vistaActiva === 'mapa' &&
  sesionClonada.vistaActiva === 'tabla',
  'clonarSesion: Clon es independiente del original (deep clone)'
);

// Test 2.3: Verify arrays are cloned
sesionClonada.hallazgos.push({
  id: 'test',
  tipo: 'Peligro',
  tipoPeligro: 'Inherente',
  titulo: 'Test',
  descripcion: 'Test',
  ubicacion: { x: 0, y: 0 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: [],
  hallazgosRelacionadosIds: [],
  consecuencia: 'Test',
  severidad: 3,
  causaRaiz: 'Test',
});

assert(
  sesionOriginal.hallazgos.length === 2 &&
  sesionClonada.hallazgos.length === 3,
  'clonarSesion: Arrays son clonados (no referencias)'
);

// ============================================================================
// TEST 3: SESSION STATISTICS
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 3: SESSION STATISTICS');
console.log('='.repeat(60));

// Test 3.1: Empty session statistics
const statsVacias = obtenerEstadisticasDeSesion(null);
assert(
  statsVacias.totalAnalisis === 0 &&
  statsVacias.totalHallazgos === 0 &&
  statsVacias.totalRelaciones === 0,
  'obtenerEstadisticasDeSesion: Retorna ceros para sesión null'
);

// Test 3.2: Demo session statistics
const statsDemo = obtenerEstadisticasDeSesion(sesionDemo);
assert(
  statsDemo.totalAnalisis === 1 &&
  statsDemo.totalHallazgos === 2 &&
  statsDemo.totalRelaciones === 0,
  'obtenerEstadisticasDeSesion: Cuenta entidades correctamente'
);

// Test 3.3: Statistics by type
assert(
  statsDemo.porTipoAnalisis['HAZOP'] === 1 &&
  statsDemo.porTipoHallazgo['Peligro'] === 1 &&
  statsDemo.porTipoHallazgo['Barrera'] === 1,
  'obtenerEstadisticasDeSesion: Desglosa por tipo correctamente'
);

// Test 3.4: Orphan hallazgos
assert(
  statsDemo.hallazgosHuerfanos === 0,
  'obtenerEstadisticasDeSesion: Detecta hallazgos huerfanos (0 en demo)'
);

// Test 3.5: Session with orphan hallazgos
const sesionConHuerfano = crearSesionVacia();
sesionConHuerfano.hallazgos.push({
  id: 'huerfano-001',
  tipo: 'Peligro',
  tipoPeligro: 'Inherente',
  titulo: 'Peligro sin relaciones',
  descripcion: 'Este peligro no tiene relaciones',
  ubicacion: { x: 50, y: 50 },
  fechaCreacion: new Date().toISOString(),
  analisisOrigenIds: [],
  hallazgosRelacionadosIds: [],
  consecuencia: 'Test',
  severidad: 3,
  causaRaiz: 'Test',
});

const statsHuerfanos = obtenerEstadisticasDeSesion(sesionConHuerfano);
assert(
  statsHuerfanos.hallazgosHuerfanos === 1,
  'obtenerEstadisticasDeSesion: Detecta hallazgo huérfano (1)'
);

// ============================================================================
// TEST 4: SESSION ID FORMAT
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 4: SESSION ID FORMAT');
console.log('='.repeat(60));

const fechaHoy = new Date();
const fechaStr = `${fechaHoy.getFullYear()}${String(fechaHoy.getMonth() + 1).padStart(2, '0')}${String(fechaHoy.getDate()).padStart(2, '0')}`;

assert(
  sesionVacia.id.startsWith(`sesion-${fechaStr}-`),
  `crearSesionVacia: ID sigue formato "sesion-YYYYMMDD-NNN"`
);

assert(
  sesionVacia.id.length === 19, // "sesion-20240312-042" = 19 chars
  'crearSesionVacia: ID tiene longitud correcta (19 caracteres)'
);

// ============================================================================
// TEST SUMMARY
// ============================================================================

printSummary();

console.log('\n' + '='.repeat(60));
console.log('COBERTURA DE PRUEBAS - SESSION HOOKS');
console.log('='.repeat(60));
console.log('Factory Functions:');
console.log('  - crearSesionVacia: defaults, imagen personalizada');
console.log('  - crearSesionDemo: datos de ejemplo');
console.log('Session Cloning:');
console.log('  - clonarSesion: deep clone, independencia');
console.log('Statistics:');
console.log('  - obtenerEstadisticasDeSesion: conteos, desglose por tipo');
console.log('  - Detección de hallazgos huerfanos');
console.log('ID Format:');
console.log('  - Formato "sesion-YYYYMMDD-NNN"');
console.log('='.repeat(60));

// ============================================================================
// MANUAL TESTING GUIDE
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('GUÍA DE PRUEBAS MANUALES - Componentes React');
console.log('='.repeat(60));
console.log(`
Para probar los hooks en componentes React:

1. Envuelve tu aplicación con SessionProvider:

   import { SessionProvider } from '@/src/lib/state/SessionContext';
   
   export default function RootLayout({ children }) {
     return (
       <SessionProvider autoIniciar={true}>
         {children}
       </SessionProvider>
     );
   }

2. Usa el hook useSesion en tus componentes:

   import { useSesion } from '@/src/controllers/useSesion';
   
   function MiComponente() {
     const { 
       sesion, 
       sesionCargada, 
       iniciarSesion, 
       cerrarSesion,
       obtenerEstadisticas 
     } = useSesion();
     
     if (!sesionCargada) {
       return <button onClick={iniciarSesion}>Iniciar Sesión</button>;
     }
     
     const stats = obtenerEstadisticas();
     return (
       <div>
         <h1>Sesión {sesion.id}</h1>
         <p>Total Análisis: {stats.totalAnalisis}</p>
         <p>Total Hallazgos: {stats.totalHallazgos}</p>
         <button onClick={cerrarSesion}>Cerrar Sesión</button>
       </div>
     );
   }

3. Prueba las siguientes acciones:
   - Click en "Iniciar Sesión" → Debe crear nueva sesión
   - Verifica que sesionCargada cambia a true
   - Verifica que obtenerEstadisticas() retorna conteos correctos
   - Click en "Cerrar Sesión" → Debe limpiar sesión
   - Verifica que sesion se vuelve null

4. Para usar sesión de demo (testing):

   <SessionProvider sesionInicial={crearSesionDemo()}>
     <App />
   </SessionProvider>

5. Para reiniciar sesión:

   const { reiniciarSesion } = useSesion();
   reiniciarSesion(); // Limpia pero mantiene sesionCargada=true
`);
console.log('='.repeat(60));
