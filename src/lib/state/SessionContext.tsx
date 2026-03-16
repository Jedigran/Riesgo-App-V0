/**
 * ============================================================================
 * SESSION CONTEXT - React Context for Global Session State
 * ============================================================================
 * 
 * This module provides the React Context for managing the application's
 * session state. The session is the single source of truth for all in-memory
 * data and is accessible throughout the component tree.
 * 
 * Features:
 * - Global session state management
 * - Immutable updates via dispatcher pattern
 * - TypeScript strict type safety
 * - Spanish JSDoc comments for educational purposes
 * 
 * @module lib/state/SessionContext
 */

'use client';

import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';
import type { Sesion } from '../../models/sesion/types';
import type { GrupoProteccion } from '../../models/grupos/types';
import { crearSesionVacia, crearSesionDemo } from '../../models/utils/generadores';
import { clonarSesion } from '../../models/utils/transformadores';

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Union type of all possible session actions.
 * Uses discriminated union pattern for type safety.
 */
type SesionAction =
  | { type: 'INICIAR_SESION'; payload?: Partial<Sesion> }
  | { type: 'CERRAR_SESION' }
  | { type: 'REINICIAR_SESION' }
  | { type: 'ACTUALIZAR_SESION'; payload: Partial<Sesion> }
  | { type: 'AGREGAR_ANALISIS'; payload: any } // AnalisisOrigen
  | { type: 'ACTUALIZAR_ANALISIS'; payload: { id: string; datos: Partial<any> } }
  | { type: 'ELIMINAR_ANALISIS'; payload: string }
  | { type: 'AGREGAR_HALLAZGO'; payload: any } // Hallazgo
  | { type: 'ACTUALIZAR_HALLAZGO'; payload: { id: string; datos: Partial<any> } }
  | { type: 'ELIMINAR_HALLAZGO'; payload: string }
  | { type: 'AGREGAR_RELACION'; payload: any } // Relacion
  | { type: 'ELIMINAR_RELACION'; payload: string }
  | { type: 'AGREGAR_GRUPO'; payload: GrupoProteccion }
  | { type: 'ACTUALIZAR_GRUPO'; payload: { id: string; datos: Partial<GrupoProteccion> } }
  | { type: 'ELIMINAR_GRUPO'; payload: string };

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * Session context state interface.
 * Provides both the session data and dispatch function.
 */
interface SesionState {
  /** Current session (null if not initialized) */
  sesion: Sesion | null;

  /** Whether session has been loaded/initialized */
  sesionCargada: boolean;

  /** Dispatch function for session actions */
  dispatch: React.Dispatch<SesionAction>;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * Session context with default null value.
 * Will be initialized by SessionProvider.
 */
const SessionContext = createContext<SesionState | null>(null);

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Session reducer function.
 * Handles all state updates immutably.
 * 
 * @param state - Current state
 * @param action - Action to process
 * @returns New state
 */
function sesionReducer(state: SesionState, action: SesionAction): SesionState {
  switch (action.type) {
    case 'INICIAR_SESION': {
      const sesionNueva = crearSesionVacia();
      return {
        ...state,
        sesion: action.payload ? { ...sesionNueva, ...action.payload } : sesionNueva,
        sesionCargada: true,
      };
    }

    case 'CERRAR_SESION': {
      return {
        ...state,
        sesion: null,
        sesionCargada: false,
      };
    }

    case 'REINICIAR_SESION': {
      const sesionNueva = crearSesionVacia();
      return {
        ...state,
        sesion: sesionNueva,
        sesionCargada: true,
      };
    }

    case 'ACTUALIZAR_SESION': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: { ...state.sesion, ...action.payload },
      };
    }

    case 'AGREGAR_ANALISIS': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          analisis: [...state.sesion.analisis, action.payload],
        },
      };
    }

    case 'ACTUALIZAR_ANALISIS': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          analisis: state.sesion.analisis.map((a) =>
            a.base.id === action.payload.id
              ? { ...a, ...action.payload.datos }
              : a
          ),
        },
      };
    }

    case 'ELIMINAR_ANALISIS': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          analisis: state.sesion.analisis.filter((a) => a.base.id !== action.payload),
        },
      };
    }

    case 'AGREGAR_HALLAZGO': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          hallazgos: [...state.sesion.hallazgos, action.payload],
        },
      };
    }

    case 'ACTUALIZAR_HALLAZGO': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          hallazgos: state.sesion.hallazgos.map((h) =>
            h.id === action.payload.id
              ? { ...h, ...action.payload.datos }
              : h
          ),
        },
      };
    }

    case 'ELIMINAR_HALLAZGO': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          hallazgos: state.sesion.hallazgos.filter((h) => h.id !== action.payload),
        },
      };
    }

    case 'AGREGAR_RELACION': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          relaciones: [...state.sesion.relaciones, action.payload],
        },
      };
    }

    case 'ELIMINAR_RELACION': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          relaciones: state.sesion.relaciones.filter((r) => r.id !== action.payload),
        },
      };
    }

    case 'AGREGAR_GRUPO': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          gruposProteccion: [...state.sesion.gruposProteccion, action.payload],
        },
      };
    }

    case 'ACTUALIZAR_GRUPO': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          gruposProteccion: state.sesion.gruposProteccion.map((g) =>
            g.id === action.payload.id
              ? { ...g, ...action.payload.datos }
              : g
          ),
        },
      };
    }

    case 'ELIMINAR_GRUPO': {
      if (!state.sesion) return state;
      return {
        ...state,
        sesion: {
          ...state.sesion,
          gruposProteccion: state.sesion.gruposProteccion.filter((g) => g.id !== action.payload),
        },
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Props for SessionProvider component.
 */
interface SessionProviderProps {
  /** Child components */
  children: ReactNode;

  /** Optional initial session (for testing/demo) */
  sesionInicial?: Sesion;

  /** Auto-start session on mount (default: true) */
  autoIniciar?: boolean;
}

/**
 * SessionProvider component.
 * Wraps the application and provides session state to all descendants.
 * 
 * @param props - Component props
 * @returns Context provider with session state
 * 
 * @example
 * // Wrap your app
 * <SessionProvider autoIniciar={true}>
 *   <App />
 * </SessionProvider>
 * 
 * @example
 * // With demo session for testing
 * <SessionProvider sesionInicial={crearSesionDemo()}>
 *   <App />
 * </SessionProvider>
 */
export function SessionProvider({
  children,
  sesionInicial,
  autoIniciar = true,
}: SessionProviderProps) {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(sesionReducer, {
    sesion: sesionInicial || null,
    sesionCargada: !!sesionInicial,
    dispatch: () => {}, // Will be updated below
  });

  // Create stable dispatch reference
  const stableDispatch = useMemo(() => dispatch, []);

  // Auto-start session on mount if requested
  React.useEffect(() => {
    if (autoIniciar && !state.sesionCargada) {
      dispatch({ type: 'INICIAR_SESION' });
    }
  }, [autoIniciar, state.sesionCargada, dispatch]);

  // Memoize context value for performance
  const contextValue = useMemo(
    () => ({
      ...state,
      dispatch: stableDispatch,
    }),
    [state, stableDispatch]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access session context.
 * Must be used within SessionProvider.
 * 
 * @returns Session state and dispatch function
 * @throws Error if used outside SessionProvider
 * 
 * @example
 * // Basic usage
 * const { sesion, dispatch } = useSesionContext();
 * 
 * @example
 * // Dispatch action
 * dispatch({ type: 'AGREGAR_HALLAZGO', payload: nuevoHallazgo });
 */
export function useSesionContext(): SesionState {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error(
      'useSesionContext must be used within a SessionProvider. ' +
      'Wrap your component tree with <SessionProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to get session statistics.
 * 
 * @param sesion - Current session
 * @returns Statistics object
 */
function obtenerEstadisticasDeSesion(sesion: Sesion | null): {
  totalAnalisis: number;
  totalHallazgos: number;
  totalRelaciones: number;
  porTipoHallazgo: Record<string, number>;
  porTipoAnalisis: Record<string, number>;
  hallazgosHuerfanos: number;
} {
  if (!sesion) {
    return {
      totalAnalisis: 0,
      totalHallazgos: 0,
      totalRelaciones: 0,
      porTipoHallazgo: {},
      porTipoAnalisis: {},
      hallazgosHuerfanos: 0,
    };
  }

  // Count by hallazgo type
  const porTipoHallazgo: Record<string, number> = {};
  sesion.hallazgos.forEach((h) => {
    porTipoHallazgo[h.tipo] = (porTipoHallazgo[h.tipo] || 0) + 1;
  });

  // Count by analysis type
  const porTipoAnalisis: Record<string, number> = {};
  sesion.analisis.forEach((a) => {
    porTipoAnalisis[a.base.tipo] = (porTipoAnalisis[a.base.tipo] || 0) + 1;
  });

  // Count orphan hallazgos (no relationships)
  const hallazgosConRelaciones = new Set<string>();
  sesion.relaciones.forEach((r) => {
    if ('origenId' in r) {
      hallazgosConRelaciones.add(r.origenId);
      hallazgosConRelaciones.add(r.destinoId);
    }
  });
  const hallazgosHuerfanos = sesion.hallazgos.filter(
    (h) => !hallazgosConRelaciones.has(h.id)
  ).length;

  return {
    totalAnalisis: sesion.analisis.length,
    totalHallazgos: sesion.hallazgos.length,
    totalRelaciones: sesion.relaciones.length,
    porTipoHallazgo,
    porTipoAnalisis,
    hallazgosHuerfanos,
  };
}

// Export statistics function for use in controllers
export { obtenerEstadisticasDeSesion };
