/**
 * ============================================================================
 * SESION (SESSION) TYPES - Application State Management
 * ============================================================================
 * 
 * This module defines the session state interface that holds all in-memory
 * data for the risk mapping application. The session is the single source
 * of truth for the current state and is managed via React Context.
 * 
 * IMPORTANT: This is in-memory only. No persistence to database or localStorage.
 * All data is lost when the session ends (page refresh/close).
 * 
 * @module models/sesion/types
 */

import type { AnalisisOrigen } from '../analisis/types';
import type { Hallazgo, TipoHallazgo } from '../hallazgo/types';
import type { Relacion } from '../relaciones/types';
import type { GrupoProteccion } from '../grupos/types';

// ============================================================================
// VIEW MODE ENUMERATIONS
// ============================================================================

/**
 * Active view mode for displaying risk data.
 * - 'mapa': Visual plant diagram with positioned findings
 * - 'tabla': Tabular list view of all findings
 */
export type VistaActiva = 'mapa' | 'tabla';

// ============================================================================
// SESSION STATE INTERFACE
// ============================================================================

/**
 * Main session state interface.
 * 
 * Contains all in-memory data for the risk mapping session. This interface
 * is used with React Context for state management throughout the application.
 * 
 * @example
 * // Initial empty session state
 * const emptySession: Sesion = {
 *   id: crypto.randomUUID(),
 *   analisis: [],
 *   hallazgos: [],
 *   relaciones: [],
 *   imagenActual: '/diagrams/default-plant.png',
 *   filtrosActivos: ['Peligro', 'Barrera', 'POE', 'SOL'],
 *   vistaActiva: 'mapa'
 * };
 */
export interface Sesion {
  /** Unique session identifier (generated on session start) */
  id: string;

  // ---- Project configuration metadata ----
  /** Project name */
  proyecto?: string;
  /** Company name */
  empresa?: string;
  /** Responsible person */
  responsable?: string;
  /** Validity date (ISO string) */
  validez?: string;
  /** Additional context text for the analysis */
  contexto?: string;

  /** All analysis forms created in this session */
  analisis: AnalisisOrigen[];

  /** All findings (hazards, barriers, SOPs, protection layers) */
  hallazgos: Hallazgo[];

  /** All relationships between findings and analyses */
  relaciones: Relacion[];

  /** All protection groups (relating hazards to protectors) */
  gruposProteccion: GrupoProteccion[];

  /** Path to the currently displayed plant diagram image */
  imagenActual: string;

  /** 
   * Active filters for the map view.
   * Only findings of these types will be displayed on the diagram.
   * Empty array = show all types.
   */
  filtrosActivos: TipoHallazgo[];

  /** Current view mode (map visualization or table list) */
  vistaActiva: VistaActiva;
}

// ============================================================================
// SESSION FACTORY TYPES
// ============================================================================

/**
 * Factory function type to create a new empty session.
 * 
 * @param imagenInicial - Optional initial plant diagram path
 * @returns A new session with default empty state
 */
export type SesionVacia = (imagenInicial?: string) => Sesion;

/**
 * Factory function to create a new empty session with default values.
 *
 * @param imagenInicial - Optional initial plant diagram path (default: '/ReferenceIamge/Sistema Bombas de Achique_V2.png')
 * @returns A new session with empty arrays and default values
 */
export function crearSesionVacia(imagenInicial?: string): Sesion {
  return {
    id: crypto.randomUUID(),
    analisis: [],
    hallazgos: [],
    relaciones: [],
    gruposProteccion: [],
    imagenActual: imagenInicial ?? '/ReferenceIamge/Sistema Bombas de Achique_V2.png',
    filtrosActivos: ['Peligro', 'Barrera', 'POE', 'SOL'],
    vistaActiva: 'mapa',
  };
}

// ============================================================================
// SESSION ACTION TYPES
// ============================================================================

/**
 * Base action interface for session state updates.
 * Used for Redux-style dispatch pattern in React Context.
 */
export interface SesionAction<T = unknown> {
  /** Action type identifier */
  type: string;

  /** Optional payload data */
  payload?: T;
}

/**
 * Session dispatch function type.
 * Used for type-safe action dispatching in React Context.
 */
export type SesionDispatch = (action: SesionAction) => void;

// ============================================================================
// SESSION CONTEXT TYPE
// ============================================================================

/**
 * Complete session context value type.
 * Combines state and dispatch for React Context provider.
 * 
 * @example
 * // Usage in React component
 * const { state, dispatch } = useSesion();
 * 
 * // Access state
 * const hallazgos = state.hallazgos;
 * 
 * // Dispatch action
 * dispatch({ type: 'ADD_HALLAZGO', payload: nuevoHallazgo });
 */
export interface SesionContextValue {
  /** Current session state */
  state: Sesion;

  /** Dispatch function for state updates */
  dispatch: SesionDispatch;
}

// ============================================================================
// SESSION SELECTOR TYPES
// ============================================================================

/**
 * Selector function type for deriving data from session state.
 * 
 * @example
 * // Select only hazards
 * const selectPeligros = (state: Sesion) => 
 *   state.hallazgos.filter(h => h.tipo === 'Peligro');
 */
export type SesionSelector<T> = (state: Sesion) => T;

/**
 * Pre-built selectors for common queries.
 */
export interface SesionSelectors {
  /** Get all hazards (Peligros) */
  selectPeligros: SesionSelector<Peligro[]>;

  /** Get all barriers (Barreras) */
  selectBarreras: SesionSelector<Barrera[]>;

  /** Get all SOPs (POEs) */
  selectPOEs: SesionSelector<POE[]>;

  /** Get all protection layers (SOLs) */
  selectSOLs: SesionSelector<SOL[]>;

  /** Get all findings of a specific type */
  selectByTipo: (tipo: TipoHallazgo) => SesionSelector<Hallazgo[]>;

  /** Get findings at a specific location */
  selectByUbicacion: (x: number, y: number, tolerance?: number) => SesionSelector<Hallazgo[]>;

  /** Get relationships for a specific finding */
  selectRelacionesByHallazgo: (hallazgoId: string) => SesionSelector<RelacionHallazgo[]>;

  /** Get related analyses for a specific analysis */
  selectRelacionesByAnalisis: (analisisId: string) => SesionSelector<RelacionAnalisis[]>;
}

// Import specific types for selectors
import type { Peligro, Barrera, POE, SOL } from '../hallazgo/types';
import type { RelacionHallazgo, RelacionAnalisis } from '../relaciones/types';

// ============================================================================
// SESSION STATISTICS TYPES
// ============================================================================

/**
 * Session statistics for dashboard/summary views.
 */
export interface SesionStats {
  /** Total number of analyses */
  totalAnalisis: number;

  /** Total number of findings */
  totalHallazgos: number;

  /** Total number of relationships */
  totalRelaciones: number;

  /** Total number of protection groups */
  totalGrupos: number;

  /** Count by finding type */
  porTipo: Record<TipoHallazgo, number>;

  /** Count by analysis type */
  porTipoAnalisis: Record<'HAZOP' | 'FMEA' | 'LOPA' | 'OCA' | 'Intuicion', number>;

  /** Findings with no relationships (orphans) */
  hallazgosHuerfanos: number;

  /** Most connected finding (by relationship count) */
  findingMasConectado?: {
    id: string;
    titulo: string;
    relacionCount: number;
  };
}
