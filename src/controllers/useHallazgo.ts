/**
 * ============================================================================
 * USE HALLAZGO - Finding Management Controller Hook
 * ============================================================================
 * 
 * This hook provides CRUD operations for all finding types:
 * Peligro (Hazard), Barrera (Barrier), POE (SOP), and SOL (Protection Layer).
 * 
 * Features:
 * - Create findings directly (intuición) or from analysis
 * - Update finding data and location (for map positioning)
 * - Delete findings
 * - Filter and query findings
 * - Detect orphan findings (no relationships)
 * - Immutable state updates
 * 
 * @module controllers/useHallazgo
 */

'use client';

import { useCallback, useMemo } from 'react';
import type {
  Hallazgo,
  Peligro,
  Barrera,
  POE,
  SOL,
  TipoHallazgo,
  Ubicacion,
  Severidad,
  Efectividad,
  TipoBarrera,
} from '../models/hallazgo/types';

import {
  validarPeligro,
  validarBarrera,
  validarPOE,
  validarSOL,
} from '../models/hallazgo/validators';

import {
  generarIdHallazgo,
  generarFechaISO,
  generarCoordenadaAleatoria,
  validarCoordenadaEnRango,
  corregirCoordenada,
} from '../models/utils/generadores';

import { useSesionContext } from '../lib/state/SessionContext';
import { analisisToHallazgos } from '../models/utils/transformadores';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Operation result for hallazgo CRUD operations.
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
 * Operation result for multiple hallazgos.
 */
export interface ResultadoOperacionMultiple {
  /** Whether the operation succeeded */
  exito: boolean;

  /** List of errors */
  errores: string[];

  /** IDs of created hallazgos */
  idsCreados: string[];

  /** Warnings (non-blocking issues) */
  advertencias?: string[];
}

/**
 * DTO for creating Peligro directly.
 */
export interface CrearPeligroDTO {
  titulo: string;
  descripcion: string;
  tipoPeligro: 'Inherente' | 'Diseño';
  consecuencia: string;
  severidad: Severidad;
  causaRaiz: string;
  analisisOrigenIds?: string[];
  hallazgosRelacionadosIds?: string[];
}

/**
 * DTO for creating Barrera directly.
 */
export interface CrearBarreraDTO {
  titulo: string;
  descripcion: string;
  tipoBarrera: TipoBarrera;
  tipoBarreraFuncion: 'Preventiva' | 'Detectiva' | 'Mitigativa';
  efectividadEstimada: Efectividad;
  elementoProtegido: string;
  analisisOrigenIds?: string[];
  hallazgosRelacionadosIds?: string[];
}

/**
 * DTO for creating POE directly.
 */
export interface CrearPOEDTO {
  titulo: string;
  descripcion: string;
  procedimientoReferencia: string;
  frecuenciaAplicacion: string;
  responsable: string;
  analisisOrigenIds?: string[];
  hallazgosRelacionadosIds?: string[];
}

/**
 * DTO for creating SOL directly.
 */
export interface CrearSOLDTO {
  titulo: string;
  descripcion: string;
  capaNumero: number;
  independiente: boolean;
  tipoTecnologia: string;
  parametro: string;
  valorMinimo?: number;
  valorMaximo?: number;
  unidad: string;
  analisisOrigenIds?: string[];
  hallazgosRelacionadosIds?: string[];
}

/**
 * Filter options for hallazgo queries.
 */
export interface FiltroHallazgo {
  /** Filter by finding type */
  tipo?: TipoHallazgo;

  /** Filter by originating analysis ID */
  analisisOrigenId?: string;

  /** Filter by location range (for map queries) */
  ubicacionRango?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };

  /** Search in titulo, descripcion, etc. */
  busqueda?: string;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useHallazgo hook.
 */
export interface UseHallazgoReturn {
  // Estado
  /** All findings in session */
  hallazgos: Hallazgo[];

  /** Get finding by ID */
  obtenerHallazgoPorId: (id: string) => Hallazgo | undefined;

  /** Get findings by type */
  obtenerHallazgosPorTipo: (tipo: TipoHallazgo) => Hallazgo[];

  // Crear (Directo - Intuición)
  /** Create Peligro directly */
  crearPeligro: (
    datos: CrearPeligroDTO,
    ubicacion?: Ubicacion
  ) => ResultadoOperacion;

  /** Create Barrera directly */
  crearBarrera: (
    datos: CrearBarreraDTO,
    ubicacion?: Ubicacion
  ) => ResultadoOperacion;

  /** Create POE directly */
  crearPOE: (datos: CrearPOEDTO, ubicacion?: Ubicacion) => ResultadoOperacion;

  /** Create SOL directly */
  crearSOL: (datos: CrearSOLDTO, ubicacion?: Ubicacion) => ResultadoOperacion;

  // Crear desde Análisis
  /** Create findings from analysis */
  crearHallazgosDesdeAnalisis: (analisisId: string) => ResultadoOperacionMultiple;

  // Actualizar
  /** Update finding data */
  actualizarHallazgo: (
    id: string,
    datos: Partial<Hallazgo>
  ) => ResultadoOperacion;

  /** Update finding location */
  actualizarUbicacion: (id: string, x: number, y: number) => ResultadoOperacion;

  // Eliminar
  /** Delete finding */
  eliminarHallazgo: (id: string) => ResultadoOperacion;

  // Filtrar
  /** Filter findings */
  filtrarHallazgos: (filtro: FiltroHallazgo) => Hallazgo[];

  /** Get orphan findings (no relationships) */
  hallazgosHuerfanos: () => Hallazgo[];
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Finding management controller hook.
 * Provides CRUD operations for all finding types.
 * 
 * @returns Finding state and management functions
 * 
 * @example
 * // Basic usage
 * function HallazgoForm() {
 *   const {
 *     hallazgos,
 *     crearPeligro,
 *     actualizarUbicacion,
 *     eliminarHallazgo
 *   } = useHallazgo();
 * 
 *   const handleCrear = () => {
 *     const resultado = crearPeligro({
 *       titulo: 'Sobrepresión en Reactor',
 *       descripcion: 'Riesgo de sobrepresión',
 *       consecuencia: 'Ruptura del reactor',
 *       severidad: 5,
 *       causaRaiz: 'Diseño inadecuado'
 *     });
 * 
 *     if (resultado.exito) {
 *       console.log('Peligro creado:', resultado.id);
 *     }
 *   };
 * 
 *   return <button onClick={handleCrear}>Crear Peligro</button>;
 * }
 */
export function useHallazgo(): UseHallazgoReturn {
  // Get session context
  const { sesion, dispatch } = useSesionContext();

  // ============================================================================
  // STATE ACCESSORS
  // ============================================================================

  /**
   * Get all findings in session.
   */
  const hallazgos = useMemo((): Hallazgo[] => {
    return sesion?.hallazgos || [];
  }, [sesion?.hallazgos]);

  /**
   * Get finding by ID.
   * 
   * @param id - Finding ID to find
   * @returns Finding or undefined if not found
   * 
   * @example
   * const peligro = obtenerHallazgoPorId('peligro-001');
   */
  const obtenerHallazgoPorId = useCallback(
    (id: string): Hallazgo | undefined => {
      return hallazgos.find((h) => h.id === id);
    },
    [hallazgos]
  );

  /**
   * Get findings by type.
   * 
   * @param tipo - Finding type to filter
   * @returns Array of matching findings
   * 
   * @example
   * const peligros = obtenerHallazgosPorTipo('Peligro');
   */
  const obtenerHallazgosPorTipo = useCallback(
    (tipo: TipoHallazgo): Hallazgo[] => {
      return hallazgos.filter((h) => h.tipo === tipo);
    },
    [hallazgos]
  );

  // ============================================================================
  // CREATE FUNCTIONS (DIRECT - INTUICIÓN)
  // ============================================================================

  /**
   * Create Peligro directly (not from analysis).
   * 
   * @param datos - Peligro data (DTO)
   * @param ubicacion - Optional location (defaults to random)
   * @returns Operation result with ID if successful
   */
  const crearPeligro = useCallback(
    (datos: CrearPeligroDTO, ubicacion?: Ubicacion): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Generate location (random if not provided)
      const ubicacionFinal = ubicacion || generarCoordenadaAleatoria();

      // 3. Create Peligro object
      const id = generarIdHallazgo('Peligro');
      const fechaISO = generarFechaISO();

      const peligro: Peligro = {
        id,
        tipo: 'Peligro',
        tipoPeligro: datos.tipoPeligro || 'Inherente',
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        ubicacion: ubicacionFinal,
        fechaCreacion: fechaISO,
        analisisOrigenIds: datos.analisisOrigenIds || [],
        hallazgosRelacionadosIds: datos.hallazgosRelacionadosIds || [],
        consecuencia: datos.consecuencia,
        severidad: datos.severidad,
        causaRaiz: datos.causaRaiz,
      };

      // 4. Validate
      const validacion = validarPeligro(peligro);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 5. Dispatch create action
      dispatch({
        type: 'AGREGAR_HALLAZGO',
        payload: peligro,
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
   * Create Barrera directly (not from analysis).
   * 
   * @param datos - Barrera data (DTO)
   * @param ubicacion - Optional location (defaults to random)
   * @returns Operation result with ID if successful
   */
  const crearBarrera = useCallback(
    (datos: CrearBarreraDTO, ubicacion?: Ubicacion): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Generate location (random if not provided)
      const ubicacionFinal = ubicacion || generarCoordenadaAleatoria();

      // 3. Create Barrera object
      const id = generarIdHallazgo('Barrera');
      const fechaISO = generarFechaISO();

      const barrera: Barrera = {
        id,
        tipo: 'Barrera',
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        ubicacion: ubicacionFinal,
        fechaCreacion: fechaISO,
        analisisOrigenIds: datos.analisisOrigenIds || [],
        hallazgosRelacionadosIds: datos.hallazgosRelacionadosIds || [],
        tipoBarrera: datos.tipoBarrera,
        tipoBarreraFuncion: datos.tipoBarreraFuncion || 'Preventiva',
        efectividadEstimada: datos.efectividadEstimada,
        elementoProtegido: datos.elementoProtegido,
      };

      // 4. Validate
      const validacion = validarBarrera(barrera);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 5. Dispatch create action
      dispatch({
        type: 'AGREGAR_HALLAZGO',
        payload: barrera,
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
   * Create POE directly (not from analysis).
   * 
   * @param datos - POE data (DTO)
   * @param ubicacion - Optional location (defaults to random)
   * @returns Operation result with ID if successful
   */
  const crearPOE = useCallback(
    (datos: CrearPOEDTO, ubicacion?: Ubicacion): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Generate location (random if not provided)
      const ubicacionFinal = ubicacion || generarCoordenadaAleatoria();

      // 3. Create POE object
      const id = generarIdHallazgo('POE');
      const fechaISO = generarFechaISO();

      const poe: POE = {
        id,
        tipo: 'POE',
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        ubicacion: ubicacionFinal,
        fechaCreacion: fechaISO,
        analisisOrigenIds: datos.analisisOrigenIds || [],
        hallazgosRelacionadosIds: datos.hallazgosRelacionadosIds || [],
        procedimientoReferencia: datos.procedimientoReferencia,
        frecuenciaAplicacion: datos.frecuenciaAplicacion,
        responsable: datos.responsable,
      };

      // 4. Validate
      const validacion = validarPOE(poe);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 5. Dispatch create action
      dispatch({
        type: 'AGREGAR_HALLAZGO',
        payload: poe,
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
   * Create SOL directly (not from analysis).
   * 
   * @param datos - SOL data (DTO)
   * @param ubicacion - Optional location (defaults to random)
   * @returns Operation result with ID if successful
   */
  const crearSOL = useCallback(
    (datos: CrearSOLDTO, ubicacion?: Ubicacion): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Generate location (random if not provided)
      const ubicacionFinal = ubicacion || generarCoordenadaAleatoria();

      // 3. Create SOL object
      const id = generarIdHallazgo('SOL');
      const fechaISO = generarFechaISO();

      const sol: SOL = {
        id,
        tipo: 'SOL',
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        ubicacion: ubicacionFinal,
        fechaCreacion: fechaISO,
        analisisOrigenIds: datos.analisisOrigenIds || [],
        hallazgosRelacionadosIds: datos.hallazgosRelacionadosIds || [],
        capaNumero: datos.capaNumero,
        independiente: datos.independiente,
        tipoTecnologia: datos.tipoTecnologia,
        parametro: datos.parametro || '',
        valorMinimo: datos.valorMinimo,
        valorMaximo: datos.valorMaximo,
        unidad: datos.unidad || '',
      };

      // 4. Validate
      const validacion = validarSOL(sol);

      if (!validacion.valido) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 5. Dispatch create action
      dispatch({
        type: 'AGREGAR_HALLAZGO',
        payload: sol,
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
  // CREATE FROM ANALYSIS
  // ============================================================================

  /**
   * Create findings from analysis.
   * Transforms analysis data into hallazgos automatically.
   * 
   * @param analisisId - Analysis ID to transform
   * @returns Operation result with created IDs
   * 
   * @example
   * const resultado = crearHallazgosDesdeAnalisis('hazop-001');
   * if (resultado.exito) {
   *   console.log('Hallazgos creados:', resultado.idsCreados);
   * }
   */
  const crearHallazgosDesdeAnalisis = useCallback(
    (analisisId: string): ResultadoOperacionMultiple => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
          idsCreados: [],
        };
      }

      // 2. Find analysis
      const analisis = sesion.analisis.find((a) => a.base.id === analisisId);

      if (!analisis) {
        return {
          exito: false,
          errores: [`Análisis con ID '${analisisId}' no encontrado`],
          idsCreados: [],
        };
      }

      // 3. Transform analysis to hallazgos
      const transformResult = analisisToHallazgos(analisis);

      if (!transformResult.exito) {
        return {
          exito: false,
          errores: transformResult.errores,
          idsCreados: [],
        };
      }

      // 4. Update hallazgos with analysis origin ID
      const hallazgosConOrigen = transformResult.datos.map((h) => ({
        ...h,
        analisisOrigenIds: [...(h.analisisOrigenIds || []), analisisId],
      }));

      // 5. Dispatch all hallazgos
      const idsCreados: string[] = [];
      for (const hallazgo of hallazgosConOrigen) {
        dispatch({
          type: 'AGREGAR_HALLAZGO',
          payload: hallazgo,
        });
        idsCreados.push(hallazgo.id);
      }

      return {
        exito: true,
        errores: [],
        idsCreados,
      };
    },
    [sesion, dispatch]
  );

  // ============================================================================
  // UPDATE FUNCTIONS
  // ============================================================================

  /**
   * Update finding data.
   * 
   * @param id - Finding ID to update
   * @param datos - Data to update (partial)
   * @returns Operation result
   * 
   * @example
   * actualizarHallazgo('peligro-001', {
   *   titulo: 'Nuevo título',
   *   severidad: 4
   * });
   */
  const actualizarHallazgo = useCallback(
    (id: string, datos: Partial<Hallazgo>): ResultadoOperacion => {
      // 1. Check if finding exists
      const hallazgoExistente = obtenerHallazgoPorId(id);

      if (!hallazgoExistente) {
        return {
          exito: false,
          errores: [`Hallazgo con ID '${id}' no encontrado`],
        };
      }

      // 2. Dispatch update action
      dispatch({
        type: 'ACTUALIZAR_HALLAZGO',
        payload: { id, datos },
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [obtenerHallazgoPorId, dispatch]
  );

  /**
   * Update finding location (for map positioning).
   * 
   * @param id - Finding ID to update
   * @param x - X coordinate (0-100)
   * @param y - Y coordinate (0-100)
   * @returns Operation result
   * 
   * @example
   * actualizarUbicacion('peligro-001', 45, 30);
   */
  const actualizarUbicacion = useCallback(
    (id: string, x: number, y: number): ResultadoOperacion => {
      // 1. Check if finding exists
      const hallazgoExistente = obtenerHallazgoPorId(id);

      if (!hallazgoExistente) {
        return {
          exito: false,
          errores: [`Hallazgo con ID '${id}' no encontrado`],
        };
      }

      // 2. Validate and correct coordinates
      if (!validarCoordenadaEnRango(x, y)) {
        // Auto-correct coordinates to valid range
        const corregida = corregirCoordenada(x, y);
        x = corregida.x;
        y = corregida.y;
      }

      // 3. Dispatch update action
      dispatch({
        type: 'ACTUALIZAR_HALLAZGO',
        payload: {
          id,
          datos: {
            ubicacion: { x, y },
          },
        },
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [obtenerHallazgoPorId, dispatch]
  );

  // ============================================================================
  // DELETE FUNCTION
  // ============================================================================

  /**
   * Delete finding.
   * 
   * @param id - Finding ID to delete
   * @returns Operation result
   * 
   * @example
   * const resultado = eliminarHallazgo('peligro-001');
   * if (resultado.exito) {
   *   console.log('Hallazgo eliminado');
   * }
   */
  const eliminarHallazgo = useCallback(
    (id: string): ResultadoOperacion => {
      // 1. Check if finding exists
      const hallazgoExistente = obtenerHallazgoPorId(id);

      if (!hallazgoExistente) {
        return {
          exito: false,
          errores: [`Hallazgo con ID '${id}' no encontrado`],
        };
      }

      // 2. Dispatch delete action
      dispatch({
        type: 'ELIMINAR_HALLAZGO',
        payload: id,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [obtenerHallazgoPorId, dispatch]
  );

  // ============================================================================
  // FILTER FUNCTION
  // ============================================================================

  /**
   * Filter findings by various criteria.
   * 
   * @param filtro - Filter options
   * @returns Filtered findings array
   * 
   * @example
   * // Filter by type
   * const peligros = filtrarHallazgos({ tipo: 'Peligro' });
   * 
   * @example
   * // Filter by location range (map viewport)
   * const enVista = filtrarHallazgos({
   *   ubicacionRango: {
   *     xMin: 0, xMax: 50,
   *     yMin: 0, yMax: 50
   *   }
   * });
   */
  const filtrarHallazgos = useCallback(
    (filtro: FiltroHallazgo): Hallazgo[] => {
      return hallazgos.filter((h) => {
        // Filter by type
        if (filtro.tipo && h.tipo !== filtro.tipo) {
          return false;
        }

        // Filter by originating analysis
        if (
          filtro.analisisOrigenId &&
          !h.analisisOrigenIds.includes(filtro.analisisOrigenId)
        ) {
          return false;
        }

        // Filter by location range
        if (filtro.ubicacionRango) {
          const { xMin, xMax, yMin, yMax } = filtro.ubicacionRango;
          if (
            h.ubicacion.x < xMin ||
            h.ubicacion.x > xMax ||
            h.ubicacion.y < yMin ||
            h.ubicacion.y > yMax
          ) {
            return false;
          }
        }

        // Filter by search term
        if (filtro.busqueda) {
          const busqueda = filtro.busqueda.toLowerCase();
          const coincide =
            h.titulo.toLowerCase().includes(busqueda) ||
            h.descripcion.toLowerCase().includes(busqueda) ||
            (h.tipo === 'Peligro' &&
              (h as Peligro).consecuencia.toLowerCase().includes(busqueda)) ||
            (h.tipo === 'Barrera' &&
              (h as Barrera).elementoProtegido.toLowerCase().includes(busqueda));

          if (!coincide) {
            return false;
          }
        }

        return true;
      });
    },
    [hallazgos]
  );

  /**
   * Get orphan findings (no relationships).
   * 
   * @returns Array of findings without relationships
   * 
   * @example
   * const huerfanos = hallazgosHuerfanos();
   * console.log(`Hallazgos sin relaciones: ${huerfanos.length}`);
   */
  const hallazgosHuerfanos = useCallback((): Hallazgo[] => {
    // Collect all hallazgo IDs that appear in relationships
    const hallazgosConRelaciones = new Set<string>();

    sesion?.relaciones.forEach((r) => {
      if ('origenId' in r) {
        hallazgosConRelaciones.add(r.origenId);
        hallazgosConRelaciones.add(r.destinoId);
      }
    });

    // Find hallazgos not in the set
    return hallazgos.filter((h) => !hallazgosConRelaciones.has(h.id));
  }, [hallazgos, sesion?.relaciones]);

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // Estado
      hallazgos,
      obtenerHallazgoPorId,
      obtenerHallazgosPorTipo,

      // Crear (Directo)
      crearPeligro,
      crearBarrera,
      crearPOE,
      crearSOL,

      // Crear desde Análisis
      crearHallazgosDesdeAnalisis,

      // Actualizar
      actualizarHallazgo,
      actualizarUbicacion,

      // Eliminar
      eliminarHallazgo,

      // Filtrar
      filtrarHallazgos,
      hallazgosHuerfanos,
    }),
    [
      hallazgos,
      obtenerHallazgoPorId,
      obtenerHallazgosPorTipo,
      crearPeligro,
      crearBarrera,
      crearPOE,
      crearSOL,
      crearHallazgosDesdeAnalisis,
      actualizarHallazgo,
      actualizarUbicacion,
      eliminarHallazgo,
      filtrarHallazgos,
      hallazgosHuerfanos,
    ]
  );
}
