/**
 * ============================================================================
 * USE ANALISIS - Analysis Management Controller Hook
 * ============================================================================
 * 
 * This hook provides CRUD operations for all analysis types:
 * HAZOP, FMEA, LOPA, OCA, and Intuicion.
 * 
 * Features:
 * - Create analysis with validation
 * - Update analysis data and status
 * - Delete analysis
 * - Filter and query analysis
 * - Immutable state updates
 * 
 * @module controllers/useAnalisis
 */

'use client';

import { useCallback, useMemo } from 'react';
import type {
  AnalisisOrigen,
  AnalisisHAZOP,
  AnalisisFMEA,
  AnalisisLOPA,
  AnalisisOCA,
  AnalisisIntuicion,
  TipoAnalisis,
  EstadoAnalisis,
} from '../models/analisis/types';

import {
  validarAnalisisHAZOP,
  validarAnalisisFMEA,
  validarAnalisisLOPA,
  validarAnalisisOCA,
  validarAnalisisIntuicion,
} from '../models/analisis/validators';

import { generarIdAnalisis, generarFechaISO } from '../models/utils/generadores';
import { useSesionContext } from '../lib/state/SessionContext';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Operation result for analysis CRUD operations.
 */
export interface ResultadoOperacion {
  /** Whether the operation succeeded */
  exito: boolean;

  /** List of errors (empty if successful) */
  errores: string[];

  /** ID of created/updated entity (if applicable) */
  id?: string;
}

/**
 * Filter options for analysis queries.
 */
export interface FiltroAnalisis {
  /** Filter by analysis type */
  tipo?: TipoAnalisis;

  /** Filter by status */
  estado?: EstadoAnalisis;

  /** Filter by date range (ISO dates) */
  fechaDesde?: string;
  fechaHasta?: string;

  /** Search in nodo, parametro, componente, etc. */
  busqueda?: string;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useAnalisis hook.
 */
export interface UseAnalisisReturn {
  // Estado
  /** All analysis in session */
  analisis: AnalisisOrigen[];

  /** Get analysis by ID */
  obtenerAnalisisPorId: (id: string) => AnalisisOrigen | undefined;

  /** Get analysis by type */
  obtenerAnalisisPorTipo: (tipo: TipoAnalisis) => AnalisisOrigen[];

  // Crear
  /** Create HAZOP analysis */
  crearAnalisisHAZOP: (datos: AnalisisHAZOP, nombre?: string) => ResultadoOperacion;

  /** Create FMEA analysis */
  crearAnalisisFMEA: (datos: AnalisisFMEA, nombre?: string) => ResultadoOperacion;

  /** Create LOPA analysis */
  crearAnalisisLOPA: (datos: AnalisisLOPA, nombre?: string) => ResultadoOperacion;

  /** Create OCA analysis */
  crearAnalisisOCA: (datos: AnalisisOCA, nombre?: string) => ResultadoOperacion;

  /** Create Intuicion analysis */
  crearAnalisisIntuicion: (datos: AnalisisIntuicion, nombre?: string) => ResultadoOperacion;

  // Actualizar
  /** Update analysis data */
  actualizarAnalisis: (
    id: string,
    datos: Partial<AnalisisOrigen>
  ) => ResultadoOperacion;

  /** Update analysis status */
  actualizarEstadoAnalisis: (
    id: string,
    estado: EstadoAnalisis
  ) => void;

  // Eliminar
  /** Delete analysis */
  eliminarAnalisis: (id: string) => ResultadoOperacion;

  // Filtrar
  /** Filter analysis */
  filtrarAnalisis: (filtro: FiltroAnalisis) => AnalisisOrigen[];
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Analysis management controller hook.
 * Provides CRUD operations for all analysis types.
 * 
 * @returns Analysis state and management functions
 * 
 * @example
 * // Basic usage
 * function AnalisisForm() {
 *   const {
 *     analisis,
 *     crearAnalisisHAZOP,
 *     eliminarAnalisis
 *   } = useAnalisis();
 * 
 *   const handleCrear = () => {
 *     const resultado = crearAnalisisHAZOP({
 *       nodo: 'Reactor R-101',
 *       parametro: 'Presión',
 *       palabraGuia: 'Más de',
 *       causa: 'Falla en válvula',
 *       consecuencia: 'Sobrepresión',
 *       salvaguardasExistentes: ['PSV-101'],
 *       recomendaciones: ['Instalar manómetro']
 *     });
 * 
 *     if (resultado.exito) {
 *       console.log('HAZOP creado:', resultado.id);
 *     } else {
 *       console.error('Errores:', resultado.errores);
 *     }
 *   };
 * 
 *   return <button onClick={handleCrear}>Crear HAZOP</button>;
 * }
 */
export function useAnalisis(): UseAnalisisReturn {
  // Get session context
  const { sesion, dispatch } = useSesionContext();

  // ============================================================================
  // STATE ACCESSORS
  // ============================================================================

  /**
   * Get all analysis in session.
   */
  const analisis = useMemo((): AnalisisOrigen[] => {
    return sesion?.analisis || [];
  }, [sesion?.analisis]);

  /**
   * Get analysis by ID.
   * 
   * @param id - Analysis ID to find
   * @returns Analysis or undefined if not found
   * 
   * @example
   * const analisis = obtenerAnalisisPorId('hazop-001');
   */
  const obtenerAnalisisPorId = useCallback(
    (id: string): AnalisisOrigen | undefined => {
      return analisis.find((a) => a.base.id === id);
    },
    [analisis]
  );

  /**
   * Get analysis by type.
   * 
   * @param tipo - Analysis type to filter
   * @returns Array of matching analysis
   * 
   * @example
   * const hazops = obtenerAnalisisPorTipo('HAZOP');
   */
  const obtenerAnalisisPorTipo = useCallback(
    (tipo: TipoAnalisis): AnalisisOrigen[] => {
      return analisis.filter((a) => a.base.tipo === tipo);
    },
    [analisis]
  );

  // ============================================================================
  // CREATE FUNCTIONS
  // ============================================================================

  /**
   * Create HAZOP analysis.
   * 
   * @param datos - HAZOP specific data
   * @returns Operation result with ID if successful
   */
  const crearAnalisisHAZOP = useCallback(
    (datos: AnalisisHAZOP, nombre?: string): ResultadoOperacion => {
      // 1. Validate data
      const validacion = validarAnalisisHAZOP(datos);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 2. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 3. Generate ID and create analysis
      const id = generarIdAnalisis('HAZOP');
      const fechaISO = generarFechaISO();

      const nuevoAnalisis: AnalisisOrigen = {
        base: {
          id,
          tipo: 'HAZOP',
          nombre: nombre?.trim() || undefined,
          fechaCreacion: fechaISO,
          estado: 'en_progreso',
          analisisRelacionadosIds: [],
        },
        datos,
      };

      // 4. Dispatch create action
      dispatch({
        type: 'AGREGAR_ANALISIS',
        payload: nuevoAnalisis,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch]
  );

  /**
   * Create FMEA analysis.
   * 
   * @param datos - FMEA specific data
   * @returns Operation result with ID if successful
   */
  const crearAnalisisFMEA = useCallback(
    (datos: AnalisisFMEA, nombre?: string): ResultadoOperacion => {
      // 1. Validate data
      const validacion = validarAnalisisFMEA(datos);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 2. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 3. Generate ID and create analysis
      const id = generarIdAnalisis('FMEA');
      const fechaISO = generarFechaISO();

      const nuevoAnalisis: AnalisisOrigen = {
        base: {
          id,
          tipo: 'FMEA',
          nombre: nombre?.trim() || undefined,
          fechaCreacion: fechaISO,
          estado: 'en_progreso',
          analisisRelacionadosIds: [],
        },
        datos,
      };

      // 4. Dispatch create action
      dispatch({
        type: 'AGREGAR_ANALISIS',
        payload: nuevoAnalisis,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch]
  );

  /**
   * Create LOPA analysis.
   * 
   * @param datos - LOPA specific data
   * @returns Operation result with ID if successful
   */
  const crearAnalisisLOPA = useCallback(
    (datos: AnalisisLOPA, nombre?: string): ResultadoOperacion => {
      // 1. Validate data
      const validacion = validarAnalisisLOPA(datos);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 2. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 3. Generate ID and create analysis
      const id = generarIdAnalisis('LOPA');
      const fechaISO = generarFechaISO();

      const nuevoAnalisis: AnalisisOrigen = {
        base: {
          id,
          tipo: 'LOPA',
          nombre: nombre?.trim() || undefined,
          fechaCreacion: fechaISO,
          estado: 'en_progreso',
          analisisRelacionadosIds: [],
        },
        datos,
      };

      // 4. Dispatch create action
      dispatch({
        type: 'AGREGAR_ANALISIS',
        payload: nuevoAnalisis,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch]
  );

  /**
   * Create OCA analysis.
   * 
   * @param datos - OCA specific data
   * @returns Operation result with ID if successful
   */
  const crearAnalisisOCA = useCallback(
    (datos: AnalisisOCA, nombre?: string): ResultadoOperacion => {
      // 1. Validate data
      const validacion = validarAnalisisOCA(datos);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 2. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 3. Generate ID and create analysis
      const id = generarIdAnalisis('OCA');
      const fechaISO = generarFechaISO();

      const nuevoAnalisis: AnalisisOrigen = {
        base: {
          id,
          tipo: 'OCA',
          nombre: nombre?.trim() || undefined,
          fechaCreacion: fechaISO,
          estado: 'en_progreso',
          analisisRelacionadosIds: [],
        },
        datos,
      };

      // 4. Dispatch create action
      dispatch({
        type: 'AGREGAR_ANALISIS',
        payload: nuevoAnalisis,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch]
  );

  /**
   * Create Intuicion analysis.
   * 
   * @param datos - Intuicion specific data
   * @returns Operation result with ID if successful
   */
  const crearAnalisisIntuicion = useCallback(
    (datos: AnalisisIntuicion, nombre?: string): ResultadoOperacion => {
      // 1. Validate data
      const validacion = validarAnalisisIntuicion(datos);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 2. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 3. Generate ID and create analysis
      const id = generarIdAnalisis('Intuicion');
      const fechaISO = generarFechaISO();

      const nuevoAnalisis: AnalisisOrigen = {
        base: {
          id,
          tipo: 'Intuicion',
          nombre: nombre?.trim() || undefined,
          fechaCreacion: fechaISO,
          estado: 'en_progreso',
          analisisRelacionadosIds: [],
        },
        datos,
      };

      // 4. Dispatch create action
      dispatch({
        type: 'AGREGAR_ANALISIS',
        payload: nuevoAnalisis,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch]
  );

  // ============================================================================
  // UPDATE FUNCTIONS
  // ============================================================================

  /**
   * Update analysis data.
   * 
   * @param id - Analysis ID to update
   * @param datos - Data to update (partial)
   * @returns Operation result
   * 
   * @example
   * actualizarAnalisis('hazop-001', {
   *   datos: { nodo: 'Nuevo nodo' }
   * });
   */
  const actualizarAnalisis = useCallback(
    (id: string, datos: Partial<AnalisisOrigen>): ResultadoOperacion => {
      // 1. Check if analysis exists
      const analisisExistente = obtenerAnalisisPorId(id);

      if (!analisisExistente) {
        return {
          exito: false,
          errores: [`Análisis con ID '${id}' no encontrado`],
        };
      }

      // 2. Dispatch update action
      dispatch({
        type: 'ACTUALIZAR_ANALISIS',
        payload: { id, datos },
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [obtenerAnalisisPorId, dispatch]
  );

  /**
   * Update analysis status.
   * 
   * @param id - Analysis ID to update
   * @param estado - New status ('completado' | 'en_progreso')
   * 
   * @example
   * actualizarEstadoAnalisis('hazop-001', 'completado');
   */
  const actualizarEstadoAnalisis = useCallback(
    (id: string, estado: EstadoAnalisis): void => {
      dispatch({
        type: 'ACTUALIZAR_ANALISIS',
        payload: {
          id,
          datos: {
            base: {
              estado,
            },
          },
        },
      });
    },
    [dispatch]
  );

  // ============================================================================
  // DELETE FUNCTION
  // ============================================================================

  /**
   * Delete analysis.
   * 
   * @param id - Analysis ID to delete
   * @returns Operation result
   * 
   * @example
   * const resultado = eliminarAnalisis('hazop-001');
   * if (resultado.exito) {
   *   console.log('Análisis eliminado');
   * }
   */
  const eliminarAnalisis = useCallback(
    (id: string): ResultadoOperacion => {
      // 1. Check if analysis exists
      const analisisExistente = obtenerAnalisisPorId(id);

      if (!analisisExistente) {
        return {
          exito: false,
          errores: [`Análisis con ID '${id}' no encontrado`],
        };
      }

      // 2. Dispatch delete action
      dispatch({
        type: 'ELIMINAR_ANALISIS',
        payload: id,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [obtenerAnalisisPorId, dispatch]
  );

  // ============================================================================
  // FILTER FUNCTION
  // ============================================================================

  /**
   * Filter analysis by various criteria.
   * 
   * @param filtro - Filter options
   * @returns Filtered analysis array
   * 
   * @example
   * // Filter by type
   * const hazops = filtrarAnalisis({ tipo: 'HAZOP' });
   * 
   * @example
   * // Filter by status and search
   * const completados = filtrarAnalisis({
   *   estado: 'completado',
   *   busqueda: 'reactor'
   * });
   */
  const filtrarAnalisis = useCallback(
    (filtro: FiltroAnalisis): AnalisisOrigen[] => {
      return analisis.filter((a) => {
        // Filter by type
        if (filtro.tipo && a.base.tipo !== filtro.tipo) {
          return false;
        }

        // Filter by status
        if (filtro.estado && a.base.estado !== filtro.estado) {
          return false;
        }

        // Filter by date range
        if (filtro.fechaDesde && a.base.fechaCreacion < filtro.fechaDesde) {
          return false;
        }
        if (filtro.fechaHasta && a.base.fechaCreacion > filtro.fechaHasta) {
          return false;
        }

        // Filter by search term
        if (filtro.busqueda) {
          const busqueda = filtro.busqueda.toLowerCase();
          const datosStr = JSON.stringify(a.datos).toLowerCase();
          const nodoStr = 'nodo' in a.datos ? (a.datos.nodo as string).toLowerCase() : '';
          const componenteStr = 'componente' in a.datos ? (a.datos.componente as string).toLowerCase() : '';
          const escenarioStr = 'escenario' in a.datos ? (a.datos.escenario as string).toLowerCase() : '';
          const eventoStr = 'eventoIniciador' in a.datos ? (a.datos.eventoIniciador as string).toLowerCase() : '';
          const tituloStr = 'titulo' in a.datos ? (a.datos.titulo as string).toLowerCase() : '';

          const coincide =
            datosStr.includes(busqueda) ||
            nodoStr.includes(busqueda) ||
            componenteStr.includes(busqueda) ||
            escenarioStr.includes(busqueda) ||
            eventoStr.includes(busqueda) ||
            tituloStr.includes(busqueda);

          if (!coincide) {
            return false;
          }
        }

        return true;
      });
    },
    [analisis]
  );

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // Estado
      analisis,
      obtenerAnalisisPorId,
      obtenerAnalisisPorTipo,

      // Crear
      crearAnalisisHAZOP,
      crearAnalisisFMEA,
      crearAnalisisLOPA,
      crearAnalisisOCA,
      crearAnalisisIntuicion,

      // Actualizar
      actualizarAnalisis,
      actualizarEstadoAnalisis,

      // Eliminar
      eliminarAnalisis,

      // Filtrar
      filtrarAnalisis,
    }),
    [
      analisis,
      obtenerAnalisisPorId,
      obtenerAnalisisPorTipo,
      crearAnalisisHAZOP,
      crearAnalisisFMEA,
      crearAnalisisLOPA,
      crearAnalisisOCA,
      crearAnalisisIntuicion,
      actualizarAnalisis,
      actualizarEstadoAnalisis,
      eliminarAnalisis,
      filtrarAnalisis,
    ]
  );
}
