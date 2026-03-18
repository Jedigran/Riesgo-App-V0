# Controllers API Design Document


**RiesgoApp - Controladores para Gestión de Estado**

Versión: 1.0.0  
Fecha: 2024-03-12  
Estado: 🎯 Diseño (pre-implementación)

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura MVC](#2-arquitectura-mvc)
3. [Hooks por Área de Funcionalidad](#3-hooks-por-área-de-funcionalidad)
   - [Session Management](#31-session-management)
   - [Analysis Management](#32-analysis-management)
   - [Hallazgo Management](#33-hallazgo-management)
   - [Relationship Management](#34-relationship-management)
   - [Map/Visual Management](#35-mapvisual-management)
   - [UI State Management](#36-ui-state-management)
4. [Integration Points](#4-integration-points)
5. [Edge Cases & Error Handling](#5-edge-cases--error-handling)
6. [Future-Proofing](#6-future-proofing)
7. [API Summary Table](#7-api-summary-table)

---

## 1. Visión General

### Propósito

Este documento define la API completa de controladores (React Hooks) para la aplicación RiesgoApp. Los controladores actúan como intermediarios entre:

- **Modelos** (`src/models/`) - Datos y validaciones
- **Vistas** (`src/components/`) - UI components

### Alcance

- ✅ **Incluye**: Hooks para gestión de sesión, análisis, hallazgos, relaciones, mapa, y estado UI
- ❌ **No incluye**: Componentes UI, persistencia de datos, llamadas a APIs externas

### Principios de Diseño

1. **Inmutabilidad**: Todas las actualizaciones crean nuevo estado (no mutaciones)
2. **Validación primero**: Siempre validar antes de transformar/guardar
3. **Error handling explícito**: Retornar errores detallados, no excepciones
4. **Separación de concerns**: Cada hook tiene una responsabilidad única
5. **Type-safe**: TypeScript estricto en todos los hooks

---

## 2. Arquitectura MVC

```
┌─────────────────────────────────────────────────────────────────┐
│                         VIEW LAYER                              │
│  (Components: Forms, Tables, Maps, Cards, Modals)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ consumes
┌─────────────────────────────────────────────────────────────────┐
│                      CONTROLLER LAYER                           │
│  (React Hooks: useSesion, useAnalisis, useHallazgo, etc.)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ uses
┌─────────────────────────────────────────────────────────────────┐
│                        MODEL LAYER                              │
│  (Types, Validators, Utils: generadores, transformadores)      │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
User Action → View Component → Controller Hook → Model Functions
                ↑                                          ↓
                └────────── State Update ←─────────────────┘
```

---

## 3. Hooks por Área de Funcionalidad

### 3.1 Session Management

#### `useSesion()`

**Propósito**: Proporciona acceso al estado global de la sesión y funciones básicas.

**Modelos utilizados**:
- `Sesion` (types)
- `crearSesionVacia()`, `clonarSesion()` (utils)

**Retorna**:
```typescript
interface UseSesionReturn {
  // Estado
  sesion: Sesion | null;
  sesionCargada: boolean;
  
  // Funciones básicas
  iniciarSesion: () => void;
  cerrarSesion: () => void;
  reiniciarSesion: () => void;
  
  // Utilidades
  obtenerEstadisticas: () => SesionStats;
}
```

**Eventos que lo activan**:
- Mount de la aplicación
- Click en "Nueva Sesión"
- Click en "Cerrar Sesión"

**Consideraciones futuras**:
- 🔜 Exportar/importar sesión (JSON)
- 🔜 Persistencia en localStorage (opcional)
- ⚠️ NO debe manejar autenticación de usuarios (separar en `useAuth`)

---

#### `useSesionMetadata()`

**Propósito**: Gestiona metadatos de la sesión (ID, fecha, configuración).

**Modelos utilizados**:
- `Sesion`, `generarIdSesion()`, `generarFechaISO()`

**Retorna**:
```typescript
interface UseSesionMetadataReturn {
  sesionId: string | null;
  fechaCreacion: string | null;
  ultimaActualizacion: string | null;
  
  actualizarConfiguracion: (config: Partial<Sesion>) => void;
}
```

---

### 3.2 Analysis Management

#### `useAnalisis()`

**Propósito**: CRUD completo para análisis de cualquier tipo (HAZOP, FMEA, LOPA, OCA, Intuicion).

**Modelos utilizados**:
- `AnalisisOrigen`, `AnalisisBase`, `TipoAnalisis` (types)
- `validarAnalisisGenerico()` (validators)
- `generarIdAnalisis()`, `generarFechaISO()` (utils)

**Parámetros de entrada**:
```typescript
interface UseAnalisisParams {
  sesion: Sesion;
  dispatch: React.Dispatch<SesionAction>;
}
```

**Retorna**:
```typescript
interface UseAnalisisReturn {
  // Estado
  analisis: AnalisisOrigen[];
  analisisPorTipo: (tipo: TipoAnalisis) => AnalisisOrigen[];
  obtenerAnalisisPorId: (id: string) => AnalisisOrigen | undefined;
  
  // Crear
  crearAnalisisHAZOP: (datos: AnalisisHAZOP) => ResultadoOperacion;
  crearAnalisisFMEA: (datos: AnalisisFMEA) => ResultadoOperacion;
  crearAnalisisLOPA: (datos: AnalisisLOPA) => ResultadoOperacion;
  crearAnalisisOCA: (datos: AnalisisOCA) => ResultadoOperacion;
  crearAnalisisIntuicion: (datos: AnalisisIntuicion) => ResultadoOperacion;
  
  // Editar
  actualizarAnalisis: (id: string, datos: Partial<AnalisisOrigen>) => ResultadoOperacion;
  actualizarEstadoAnalisis: (id: string, estado: EstadoAnalisis) => void;
  
  // Eliminar
  eliminarAnalisis: (id: string) => ResultadoOperacion;
  
  // Filtrar
  filtrarAnalisis: (filtro: FiltroAnalisis) => AnalisisOrigen[];
}
```

**Detalle de `crearAnalisisHAZOP`**:
```typescript
/**
 * @param datos - Datos específicos de HAZOP (nodo, parametro, etc.)
 * @returns ResultadoOperacion { exito: boolean, errores: string[], id?: string }
 * 
 * Proceso interno:
 * 1. Generar ID único con generarIdAnalisis('HAZOP')
 * 2. Crear AnalisisBase con fecha actual
 * 3. Validar datos con validarAnalisisHAZOP()
 * 4. Si válido: crear AnalisisOrigen y dispatchar acción
 * 5. Si inválido: retornar errores
 */
```

**Eventos que lo activan**:
- Submit de formulario HAZOP/FMEA/LOPA/OCA
- Click en "Editar Análisis"
- Click en "Eliminar Análisis"
- Cambio de estado (completado/en_progreso)

**Consideraciones futuras**:
- 🔜 Historial de versiones de análisis
- 🔜 Colaboración múltiple (conflict resolution)
- ⚠️ NO debe transformar análisis a hallazgos (eso es `useTransformacionAnalisis`)

---

#### `useRelacionesAnalisis()`

**Propósito**: Gestiona relaciones entre análisis (sustenta, complementa, deriva).

**Modelos utilizados**:
- `RelacionAnalisis`, `TipoRelacionAnalisis` (types)
- `validarRelacionAnalisis()` (utils/relaciones)
- `generarIdUnico('rel-analysis')` (utils)

**Retorna**:
```typescript
interface UseRelacionesAnalisisReturn {
  // Estado
  relaciones: RelacionAnalisis[];
  
  // Crear
  crearRelacionAnalisis: (
    tipo: TipoRelacionAnalisis,
    analisisSustentoId: string,
    analisisSustentadoId: string,
    descripcion?: string
  ) => ResultadoOperacion;
  
  // Eliminar
  eliminarRelacionAnalisis: (id: string) => void;
  
  // Consultar
  obtenerRelacionesDeAnalisis: (analisisId: string) => RelacionAnalisis[];
  obtenerAnalisisSustentados: (analisisId: string) => AnalisisOrigen[];
  obtenerAnalisisSustento: (analisisId: string) => AnalisisOrigen[];
}
```

**Edge cases**:
- ❌ Evitar relaciones circulares (A sustenta B, B sustenta A)
- ❌ Evitar auto-relaciones (A sustenta A)
- ⚠️ Validar que ambos IDs existen antes de crear

---

### 3.3 Hallazgo Management

#### `useHallazgo()`

**Propósito**: CRUD completo para hallazgos (Peligro, Barrera, POE, SOL).

**Modelos utilizados**:
- `Hallazgo`, `Peligro`, `Barrera`, `POE`, `SOL` (types)
- `validarPeligro()`, `validarBarrera()`, `validarPOE()`, `validarSOL()` (validators)
- `generarIdHallazgo()`, `generarFechaISO()`, `generarCoordenadaAleatoria()` (utils)

**Retorna**:
```typescript
interface UseHallazgoReturn {
  // Estado
  hallazgos: Hallazgo[];
  hallazgosPorTipo: (tipo: TipoHallazgo) => Hallazgo[];
  obtenerHallazgoPorId: (id: string) => Hallazgo | undefined;
  
  // Crear directamente (no desde análisis)
  crearPeligro: (datos: CrearPeligroDTO) => ResultadoOperacion;
  crearBarrera: (datos: CrearBarreraDTO) => ResultadoOperacion;
  crearPOE: (datos: CrearPOEDTO) => ResultadoOperacion;
  crearSOL: (datos: CrearSOLDTO) => ResultadoOperacion;
  
  // Editar
  actualizarHallazgo: (id: string, datos: Partial<Hallazgo>) => ResultadoOperacion;
  actualizarUbicacion: (id: string, ubicacion: Ubicacion) => void;
  
  // Eliminar
  eliminarHallazgo: (id: string) => ResultadoOperacion;
  
  // Filtrar
  filtrarHallazgos: (filtro: FiltroHallazgo) => Hallazgo[];
  hallazgosHuerfanos: () => Hallazgo[];
}
```

**DTOs (Data Transfer Objects)**:
```typescript
interface CrearPeligroDTO {
  titulo: string;
  descripcion: string;
  consecuencia: string;
  severidad: Severidad;
  causaRaiz: string;
  ubicacion?: Ubicacion; // Opcional, default: aleatoria
}

interface CrearBarreraDTO {
  titulo: string;
  descripcion: string;
  tipoBarrera: TipoBarrera;
  efectividadEstimada: Efectividad;
  elementoProtegido: string;
  ubicacion?: Ubicacion;
}

// ... similar para POE y SOL
```

**Eventos que lo activan**:
- Creación manual de hallazgo (botón "Agregar Peligro")
- Drag-and-drop en el mapa (actualizar ubicación)
- Formulario de edición
- Click en "Eliminar"

**Consideraciones futuras**:
- 🔜 Bulk operations (crear/eliminar múltiples)
- 🔜 Duplicar hallazgo
- ⚠️ NO debe manejar relaciones (eso es `useRelacionesHallazgo`)

---

#### `useTransformacionAnalisis()`

**Propósito**: Convierte análisis completados en hallazgos automáticamente.

**Modelos utilizados**:
- `analisisToHallazgos()`, `analisisHAZOPtoHallazgos()`, etc. (transformadores)
- `validarAnalisisGenerico()` (validators)

**Retorna**:
```typescript
interface UseTransformacionAnalisisReturn {
  // Transformar
  transformarAnalisisAHallazgos: (analisisId: string) => ResultadoTransformacion;
  transformarTodosAnalisis: () => ResultadoTransformacionMultiple;
  
  // Estado de transformación
  analisisTransformables: () => AnalisisOrigen[];
  obtenerHallazgosDeAnalisis: (analisisId: string) => Hallazgo[];
}

interface ResultadoTransformacion {
  exito: boolean;
  hallazgosCreados: Hallazgo[];
  errores: string[];
  advertencias?: string[];
}
```

**Flujo de transformación**:
```
1. Usuario completa análisis (ej: HAZOP)
2. Usuario marca análisis como "completado"
3. Sistema pregunta: "¿Generar hallazgos automáticamente?"
4. Si sí → usar transformarAnalisisAHallazgos()
5. Hallazgos se agregan a la sesión con vínculos al análisis
```

**Edge cases**:
- ⚠️ Análisis inválido → retornar errores de validación
- ⚠️ Análisis ya transformado → preguntar si desea reemplazar
- ⚠️ Hallazgos existentes → mantener vínculos (analisisOrigenIds)

---

#### `useRelacionesHallazgo()`

**Propósito**: Gestiona relaciones entre hallazgos (mitiga, controla, protege, requiere).

**Modelos utilizados**:
- `RelacionHallazgo`, `TipoRelacionHallazgo` (types)
- `validarRelacionHallazgo()`, `encontrarHallazgosHuerfanos()` (utils/relaciones)
- `generarIdUnico('rel')` (utils)

**Retorna**:
```typescript
interface UseRelacionesHallazgoReturn {
  // Estado
  relaciones: RelacionHallazgo[];
  
  // Crear
  crearRelacionHallazgo: (
    tipo: TipoRelacionHallazgo,
    origenId: string,
    destinoId: string,
    descripcion?: string
  ) => ResultadoOperacion;
  
  // Eliminar
  eliminarRelacionHallazgo: (id: string) => void;
  
  // Consultar
  obtenerRelacionesDeHallazgo: (hallazgoId: string) => RelacionHallazgo[];
  hallazgosConectados: (hallazgoId: string) => Hallazgo[];
  hallazgosHuerfanos: () => Hallazgo[];
  
  // Validar
  validarRelacionAntesDeCrear: (
    tipo: TipoRelacionHallazgo,
    origenId: string,
    destinoId: string
  ) => ValidacionRelacion;
}

interface ValidacionRelacion {
  valida: boolean;
  errores: string[];
  advertencias: string[];
}
```

**Combinaciones válidas**:
| Tipo | Origen | Destino | Ejemplo |
|------|--------|---------|---------|
| `mitiga` | Barrera | Peligro | PSV-101 mitiga Sobrepresión |
| `controla` | POE | Peligro | Procedimiento controla Riesgo |
| `protege` | Barrera | Elemento | Pared protege Reactor |
| `requiere` | Peligro | Barrera | Riesgo requiere Barrera |

**Edge cases**:
- ❌ Auto-relación (A mitiga A) → error
- ❌ IDs inexistentes → error
- ⚠️ Relación duplicada → advertencia (permitir pero notificar)
- ⚠️ Relación circular → advertencia (permitir pero notificar)

---

### 3.4 Relationship Management

*(Nota: Ya cubierto parcialmente en `useRelacionesAnalisis` y `useRelacionesHallazgo`)*

#### `useGrafoRiesgo()`

**Propósito**: Proporciona datos para visualización del grafo de riesgo (network graph).

**Modelos utilizados**:
- `obtenerHallazgosConectados()`, `calcularConectividadHallazgos()` (utils/relaciones)

**Retorna**:
```typescript
interface UseGrafoRiesgoReturn {
  // Datos para visualización
  nodos: GrafoNodo[];
  aristas: GrafoArista[];
  
  // Métricas
  hallazgoMasConectado: () => Hallazgo | null;
  calcularMetricasConectividad: () => MetricasGrafo;
  
  // Filtrado
  filtrarPorTipo: (tipos: TipoHallazgo[]) => GrafoFiltrado;
  ocultarHuerfanos: () => GrafoFiltrado;
}

interface GrafoNodo {
  id: string;
  tipo: TipoHallazgo;
  label: string;
  x?: number;
  y?: number;
  size?: number; // Basado en conectividad
}

interface GrafoArista {
  source: string;
  target: string;
  tipo: TipoRelacionHallazgo;
  label?: string;
}
```

**Vistas que lo consumen**:
- Componente `RiskGraph` (visualización de red)
- Dashboard de estadísticas

---

### 3.5 Map/Visual Management

#### `useMapa()`

**Propósito**: Gestiona el estado del mapa de planta industrial y hallazgos visibles.

**Modelos utilizados**:
- `Sesion`, `Ubicacion`, `TipoHallazgo` (types)
- `validarCoordenadaEnRango()`, `corregirCoordenada()` (utils)

**Retorna**:
```typescript
interface UseMapaReturn {
  // Estado del mapa
  imagenActual: string;
  zoom: number;
  pan: { x: number; y: number };
  
  // Hallazgos visibles
  hallazgosVisibles: () => Hallazgo[];
  hallazgoEnPosicion: (x: number, y: number, tolerancia?: number) => Hallazgo[];
  
  // Actualizar
  cambiarImagen: (ruta: string) => void;
  actualizarZoom: (zoom: number) => void;
  actualizarPan: (pan: { x: number; y: number }) => void;
  
  // Drag & Drop
  iniciarDrag: (hallazgoId: string) => void;
  actualizarDrag: (x: number, y: number) => void;
  finalizarDrag: () => ResultadoOperacion;
  
  // Utilidades
  centrarEnHallazgo: (hallazgoId: string) => void;
  resetearVista: () => void;
}
```

**Eventos que lo activan**:
- Drag de hallazgo en el mapa
- Scroll/zoom del usuario
- Click en "Centrar en..."
- Cambio de imagen de planta

**Consideraciones futuras**:
- 🔜 Múltiples plantas/niveles
- 🔜 Heat maps de densidad de hallazgos
- ⚠️ NO debe manejar lógica de negocio (solo visualización)

---

#### `useFiltrosHallazgos()`

**Propósito**: Gestiona filtros de hallazgos por tipo, estado, etc.

**Modelos utilizados**:
- `TipoHallazgo`, `Sesion` (types)

**Retorna**:
```typescript
interface UseFiltrosHallazgosReturn {
  // Estado de filtros
  filtrosActivos: TipoHallazgo[];
  todosLosFiltros: TipoHallazgo[];
  
  // Acciones
  activarFiltro: (tipo: TipoHallazgo) => void;
  desactivarFiltro: (tipo: TipoHallazgo) => void;
  toggleFiltro: (tipo: TipoHallazgo) => void;
  activarTodos: () => void;
  desactivarTodos: () => void;
  
  // Consultar
  hallazgosFiltrados: () => Hallazgo[];
  contarPorTipo: () => Record<TipoHallazgo, number>;
}
```

---

### 3.6 UI State Management

#### `useUIEstado()`

**Propósito**: Gestiona estado de la interfaz (vista activa, loading, errores, notificaciones).

**Modelos utilizados**:
- `VistaActiva` (types)

**Retorna**:
```typescript
interface UseUIEstadoReturn {
  // Vista activa
  vistaActiva: VistaActiva;
  cambiarVista: (vista: VistaActiva) => void;
  toggleVista: () => void;
  
  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;
  conLoading: <T>(promesa: Promise<T>) => Promise<T>;
  
  // Errores
  errores: ErrorUI[];
  agregarError: (error: ErrorUI) => void;
  limpiarErrores: () => void;
  
  // Notificaciones (futuro)
  notificaciones: Notificacion[];
  agregarNotificacion: (notif: Notificacion) => void;
  eliminarNotificacion: (id: string) => void;
}

interface ErrorUI {
  id: string;
  mensaje: string;
  severidad: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}
```

**Eventos que lo activan**:
- Click en tabs "Mapa" / "Tabla"
- Inicio/fin de operaciones asíncronas
- Errores de validación
- Acciones exitosas (mostrar toast)

---

## 4. Integration Points

### Dependencias entre Hooks

```
useSesion (root)
    ↓
    ├── useAnalisis
    │       └── useRelacionesAnalisis
    │
    ├── useHallazgo
    │       ├── useTransformacionAnalisis
    │       └── useRelacionesHallazgo
    │
    ├── useMapa
    │       └── useFiltrosHallazgos
    │
    └── useUIEstado
```

### Funciones de Modelos por Hook

| Hook | Funciones de Modelos Utilizadas |
|------|--------------------------------|
| `useSesion` | `crearSesionVacia()`, `clonarSesion()`, `generarIdSesion()` |
| `useAnalisis` | `validarAnalisisGenerico()`, `generarIdAnalisis()`, `generarFechaISO()` |
| `useHallazgo` | `validarPeligro()`, `validarBarrera()`, `validarPOE()`, `validarSOL()`, `generarIdHallazgo()` |
| `useTransformacionAnalisis` | `analisisToHallazgos()`, `analisisHAZOPtoHallazgos()`, etc. |
| `useRelacionesHallazgo` | `validarRelacionHallazgo()`, `encontrarHallazgosHuerfanos()`, `generarIdUnico()` |
| `useMapa` | `validarCoordenadaEnRango()`, `corregirCoordenada()` |

### Vistas que Consumen Hooks

| Hook | Vistas Principales |
|------|-------------------|
| `useSesion` | `App`, `SessionProvider` |
| `useAnalisis` | `AnalisisForm`, `AnalisisList`, `AnalisisCard` |
| `useHallazgo` | `HallazgoForm`, `HallazgoTable`, `HallazgoMarker` |
| `useTransformacionAnalisis` | `AnalisisCompleteModal`, `TransformacionButton` |
| `useRelacionesHallazgo` | `RelationshipEditor`, `GraphView` |
| `useMapa` | `PlantMap`, `MapToolbar` |
| `useFiltrosHallazgos` | `FilterPanel`, `Legend` |
| `useUIEstado` | `ViewTabs`, `LoadingOverlay`, `ToastContainer` |

---

## 5. Edge Cases & Error Handling

### Estrategia de Manejo de Errores

```typescript
interface ResultadoOperacion {
  exito: boolean;
  errores: string[];
  datos?: T;
}

// Ejemplo de uso en hook
const crearAnalisisHAZOP = (datos: AnalisisHAZOP): ResultadoOperacion => {
  // 1. Validar
  const validacion = validarAnalisisHAZOP(datos);
  if (!validacion.valido) {
    return { exito: false, errores: validacion.errores };
  }
  
  // 2. Verificar sesión existe
  if (!sesion) {
    return { exito: false, errores: ['No hay sesión activa'] };
  }
  
  // 3. Verificar duplicados (opcional)
  const existe = sesion.analisis.some(a => 
    a.base.tipo === 'HAZOP' && 
    a.datos.nodo === datos.nodo &&
    a.datos.parametro === datos.parametro
  );
  
  if (existe) {
    return { 
      exito: false, 
      errores: ['Ya existe un HAZOP para este nodo/parámetro'] 
    };
  }
  
  // 4. Crear y dispatchar
  dispatch({ type: 'ANALISIS_CREAR', payload: nuevoAnalisis });
  return { exito: true, datos: { id: nuevoAnalisis.base.id } };
};
```

### Edge Cases por Hook

#### `useAnalisis`

| Situación | Comportamiento |
|-----------|---------------|
| Validación falla | Retornar `exito: false` con errores de validación |
| Sesión vacía/null | Retornar error "No hay sesión activa" |
| Eliminar ID inexistente | Retornar error "Análisis no encontrado" |
| Eliminar análisis con hallazgos vinculados | Advertir, pero permitir (hallazgos quedan huérfanos) |

#### `useHallazgo`

| Situación | Comportamiento |
|-----------|---------------|
| Coordenadas fuera de rango (0-100) | Corregir automáticamente con `corregirCoordenada()` |
| Eliminar hallazgo con relaciones | Eliminar relaciones asociadas automáticamente |
| Crear hallazgo sin análisis de origen | Permitir (caso intuición), pero agregar advertencia |

#### `useRelacionesHallazgo`

| Situación | Comportamiento |
|-----------|---------------|
| Auto-relación (A → A) | Error: "No se puede relacionar consigo mismo" |
| IDs inexistentes | Error: "Hallazgo no encontrado" |
| Relación duplicada | Advertencia, pero permitir |
| Relación circular (A → B → A) | Advertencia, pero permitir (puede ser válido) |
| Tipo incompatible (ej: Peligro mitiga Peligro) | Advertencia: "Combinación inusual" |

#### `useTransformacionAnalisis`

| Situación | Comportamiento |
|-----------|---------------|
| Análisis inválido | Error con detalles de validación |
| Análisis ya transformado | Preguntar: "¿Reemplazar hallazgos existentes?" |
| Análisis sin datos suficientes | Advertencia: "Algunos hallazgos pueden estar incompletos" |

#### `useMapa`

| Situación | Comportamiento |
|-----------|---------------|
| Drag fuera de límites | Corregir a límite más cercano |
| Múltiples hallazgos en misma posición | Mostrar todos con offset visual |
| Imagen no carga | Mostrar placeholder y error toast |

---

## 6. Future-Proofing

### Características Futuras y su Impacto

| Feature Futuro | Hooks Afectados | Cambios Requeridos |
|----------------|-----------------|-------------------|
| **Persistencia localStorage** | `useSesion` | Agregar `guardarSesion()`, `cargarSesion()` |
| **Exportar/Importar JSON** | `useSesion` | Agregar `exportarSesion()`, `importarSesion()` |
| **Colaboración en tiempo real** | Todos | Agregar sync layer, conflict resolution |
| **Historial de versiones** | `useAnalisis`, `useHallazgo` | Agregar `obtenerHistorial()`, `restaurarVersion()` |
| **Undo/Redo** | Todos | Agregar `deshacer()`, `rehacer()` con stack de estados |
| **Múltiples plantas** | `useMapa` | Agregar `cambiarPlanta()`, `listaPlantas()` |
| **Heat maps** | `useMapa`, `useGrafoRiesgo` | Agregar `generarHeatMap()` |
| **Notificaciones push** | `useUIEstado` | Agregar sistema de suscripción |

### Separación de Concerns

**Lo que NO debe estar en cada hook**:

| Hook | NO debe incluir | Razón |
|------|----------------|-------|
| `useSesion` | Lógica de negocio específica | Solo gestión de estado global |
| `useAnalisis` | Transformación a hallazgos | Separar en `useTransformacionAnalisis` |
| `useHallazgo` | Validación de relaciones | Separar en `useRelacionesHallazgo` |
| `useMapa` | Lógica de filtrado | Separar en `useFiltrosHallazgos` |
| `useUIEstado` | Errores de dominio específicos | Solo errores UI genéricos |

### Hooks que Podrían Extraerse

| Hook Potencial | Responsabilidad | Cuando extraer |
|----------------|-----------------|----------------|
| `useNotificaciones` | Toast system | Cuando haya 5+ tipos de notificaciones |
| `useHistorial` | Undo/redo | Cuando se implemente persistencia |
| `useExportacion` | Export/import | Cuando se agregue JSON/CSV export |
| `useBusqueda` | Search/filter | Cuando haya 50+ hallazgos por sesión |

---

## 7. API Summary Table

### Hooks Principales

| Hook | Propósito | Funciones Clave | Modelos Utilizados |
|------|-----------|-----------------|-------------------|
| `useSesion` | Estado global | `iniciarSesion()`, `cerrarSesion()` | `Sesion`, `crearSesionVacia()` |
| `useAnalisis` | CRUD análisis | `crearAnalisisHAZOP()`, `eliminarAnalisis()` | `AnalisisOrigen`, `validarAnalisisGenerico()` |
| `useHallazgo` | CRUD hallazgos | `crearPeligro()`, `actualizarUbicacion()` | `Hallazgo`, `validarPeligro()` |
| `useTransformacionAnalisis` | Análisis → Hallazgos | `transformarAnalisisAHallazgos()` | `analisisToHallazgos()` |
| `useRelacionesHallazgo` | Relaciones hallazgos | `crearRelacionHallazgo()` | `RelacionHallazgo`, `validarRelacionHallazgo()` |
| `useRelacionesAnalisis` | Relaciones análisis | `crearRelacionAnalisis()` | `RelacionAnalisis`, `validarRelacionAnalisis()` |
| `useMapa` | Gestión de mapa | `iniciarDrag()`, `cambiarImagen()` | `Ubicacion`, `validarCoordenadaEnRango()` |
| `useFiltrosHallazgos` | Filtros | `toggleFiltro()`, `hallazgosFiltrados()` | `TipoHallazgo` |
| `useUIEstado` | Estado UI | `cambiarVista()`, `agregarError()` | `VistaActiva` |
| `useGrafoRiesgo` | Grafo de riesgo | `nodos`, `aristas`, `metricas` | `obtenerHallazgosConectados()` |

### Tipos de Retorno Comunes

```typescript
interface ResultadoOperacion {
  exito: boolean;
  errores: string[];
  datos?: T;
}

interface ResultadoTransformacion {
  exito: boolean;
  hallazgosCreados: Hallazgo[];
  errores: string[];
  advertencias?: string[];
}

interface ValidacionRelacion {
  valida: boolean;
  errores: string[];
  advertencias: string[];
}
```

---

## Próximos Pasos

1. ✅ **Este documento**: Revisar y aprobar diseño
2. 🔜 **Implementación**: Crear hooks uno por uno
3. 🔜 **Tests**: Crear tests para cada hook
4. 🔜 **Vistas**: Implementar componentes UI que consumen hooks

---

**Documento creado**: 2024-03-12  
**Próxima revisión**: Después de implementación de primeros hooks  
**Responsable**: Equipo de desarrollo RiesgoApp
