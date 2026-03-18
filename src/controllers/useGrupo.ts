/**
 * ============================================================================
 * USE GRUPO - Protection Group Management Controller Hook
 * ============================================================================
 *
 * This hook provides CRUD operations for protection groups (GrupoProteccion).
 * Protection groups replace binary relationships for pedagogical clarity.
 *
 * Features:
 * - Create groups with validation
 * - Update group data and members
 * - Delete groups
 * - Query groups by hallazgo membership
 * - Detect orphan groups (no valid members)
 * - Immutable state updates
 *
 * Mental Model:
 * - Students create ONE group per "Protection System"
 * - Each group connects multiple hazards to multiple protectors
 * - This matches industrial practice (Bow-Tie, LOPA layers)
 *
 * @module controllers/useGrupo
 */

'use client';

import { useCallback, useMemo } from 'react';
import type { GrupoProteccion } from '../models/grupos/types';
import type { Hallazgo, Peligro, Barrera, POE, SOL } from '../models/hallazgo/types';

import {
  crearGrupoProteccion,
  validarGrupoProteccion,
  validarColorHex,
} from '../models/grupos/types';

import { useSesionContext } from '../lib/state/SessionContext';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Operation result for group CRUD operations.
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
 * DTO for creating a protection group.
 */
export interface CrearGrupoDTO {
  /** Group name (e.g., "Pressure Protection System") */
  nombre: string;

  /** Optional description */
  descripcion?: string;

  /** Visual color for UI grouping */
  color: string;

  /** IDs of Peligro hallazgos in this group */
  peligrosIds: string[];

  /** IDs of protector hallazgos (Barrera/POE/SOL) */
  protectoresIds: string[];

  /** Optional creator identifier */
  creadoPor?: string;
}

/**
 * DTO for updating a protection group.
 * All fields are optional.
 */
export interface ActualizarGrupoDTO {
  nombre?: string;
  descripcion?: string;
  color?: string;
  peligrosIds?: string[];
  protectoresIds?: string[];
}

/**
 * Filter options for group queries.
 */
export interface FiltroGrupo {
  /** Filter by hallazgo ID (groups containing this hallazgo) */
  hallazgoId?: string;

  /** Filter by group name (case-insensitive search) */
  busqueda?: string;

  /** Filter by color */
  color?: string;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useGrupo hook.
 */
export interface UseGrupoReturn {
  // Estado
  /** All protection groups in session */
  grupos: GrupoProteccion[];

  /** Get group by ID */
  obtenerGrupoPorId: (id: string) => GrupoProteccion | undefined;

  /** Get groups containing a specific hallazgo */
  obtenerGruposPorHallazgo: (hallazgoId: string) => GrupoProteccion[];

  /** Get groups containing a specific hallazgo as a hazard */
  obtenerGruposPorPeligro: (peligroId: string) => GrupoProteccion[];

  /** Get groups containing a specific hallazgo as a protector */
  obtenerGruposPorProtector: (protectorId: string) => GrupoProteccion[];

  // Crear
  /** Create a new protection group */
  crearGrupo: (datos: CrearGrupoDTO, skipValidation?: boolean) => ResultadoOperacion;

  // Actualizar
  /** Update group data */
  actualizarGrupo: (
    id: string,
    datos: ActualizarGrupoDTO
  ) => ResultadoOperacion;

  /** Add a hallazgo to a group */
  agregarHallazgoAGrupo: (
    grupoId: string,
    hallazgoId: string,
    tipo: 'peligro' | 'protector'
  ) => ResultadoOperacion;

  /** Remove a hallazgo from a group */
  eliminarHallazgoDeGrupo: (
    grupoId: string,
    hallazgoId: string
  ) => ResultadoOperacion;

  // Eliminar
  /** Delete a group */
  eliminarGrupo: (id: string) => ResultadoOperacion;

  // Filtrar
  /** Filter groups */
  filtrarGrupos: (filtro: FiltroGrupo) => GrupoProteccion[];

  // Utilidades
  /** Get groups with validation errors (empty members, etc.) */
  gruposInvalidos: () => GrupoProteccion[];

  /** Get hallazgos that are not in any group */
  hallazgosSinGrupo: () => Hallazgo[];
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Protection group management controller hook.
 * Provides CRUD operations for protection groups.
 *
 * @returns Group state and management functions
 *
 * @example
 * // Basic usage
 * function GrupoForm() {
 *   const {
 *     grupos,
 *     crearGrupo,
 *     eliminarGrupo
 *   } = useGrupo();
 *
 *   const handleCrear = () => {
 *     const resultado = crearGrupo({
 *       nombre: 'Sistema de Alivio',
 *       color: '#3B82F6',
 *       peligrosIds: ['peligro-001'],
 *       protectoresIds: ['barrera-001', 'poe-001']
 *     });
 *
 *     if (resultado.exito) {
 *       console.log('Grupo creado:', resultado.id);
 *     } else {
 *       console.error('Errores:', resultado.errores);
 *     }
 *   };
 *
 *   return <button onClick={handleCrear}>Crear Grupo</button>;
 * }
 */
export function useGrupo(): UseGrupoReturn {
  // Get session context
  const { sesion, dispatch } = useSesionContext();

  // ============================================================================
  // STATE ACCESSORS
  // ============================================================================

  /**
   * Get all protection groups in session.
   */
  const grupos = useMemo((): GrupoProteccion[] => {
    return sesion?.gruposProteccion || [];
  }, [sesion?.gruposProteccion]);

  /**
   * Get group by ID.
   *
   * @param id - Group ID to find
   * @returns Group or undefined if not found
   *
   * @example
   * const grupo = obtenerGrupoPorId('grp-001');
   */
  const obtenerGrupoPorId = useCallback(
    (id: string): GrupoProteccion | undefined => {
      return grupos.find((g) => g.id === id);
    },
    [grupos]
  );

  /**
   * Get groups containing a specific hallazgo.
   *
   * @param hallazgoId - Hallazgo ID to search for
   * @returns Array of groups containing this hallazgo
   *
   * @example
   * const gruposConPeligro = obtenerGruposPorHallazgo('peligro-001');
   */
  const obtenerGruposPorHallazgo = useCallback(
    (hallazgoId: string): GrupoProteccion[] => {
      return grupos.filter(
        (g) =>
          g.peligrosIds.includes(hallazgoId) ||
          g.protectoresIds.includes(hallazgoId)
      );
    },
    [grupos]
  );

  /**
   * Get groups containing a specific hallazgo as a hazard (Peligro).
   *
   * @param peligroId - Peligro ID to search for
   * @returns Array of groups where this hallazgo is a hazard
   *
   * @example
   * const grupos = obtenerGruposPorPeligro('peligro-001');
   */
  const obtenerGruposPorPeligro = useCallback(
    (peligroId: string): GrupoProteccion[] => {
      return grupos.filter((g) => g.peligrosIds.includes(peligroId));
    },
    [grupos]
  );

  /**
   * Get groups containing a specific hallazgo as a protector (Barrera/POE/SOL).
   *
   * @param protectorId - Protector ID to search for
   * @returns Array of groups where this hallazgo is a protector
   *
   * @example
   * const grupos = obtenerGruposPorProtector('barrera-001');
   */
  const obtenerGruposPorProtector = useCallback(
    (protectorId: string): GrupoProteccion[] => {
      return grupos.filter((g) => g.protectoresIds.includes(protectorId));
    },
    [grupos]
  );

  // ============================================================================
  // CREATE FUNCTION
  // ============================================================================

  /**
   * Create a new protection group.
   *
   * @param datos - Group data (DTO)
   * @returns Operation result with ID if successful
   *
   * @example
   * const resultado = crearGrupo({
   *   nombre: 'Sistema de Alivio de Presión',
   *   color: '#3B82F6',
   *   peligrosIds: ['peligro-001', 'peligro-002'],
   *   protectoresIds: ['barrera-001', 'poe-001']
   * });
   */
  const crearGrupo = useCallback(
    (datos: CrearGrupoDTO, skipValidation = false): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Create group object
      const grupo = crearGrupoProteccion({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        color: datos.color as any,
        peligrosIds: datos.peligrosIds,
        protectoresIds: datos.protectoresIds,
        creadoPor: datos.creadoPor,
      });

      // 3. Validate against existing hallazgos (unless skipped)
      // Skip validation only for programmatic/automated creation
      // Manual user creation should always be validated
      if (!skipValidation) {
        const hallazgos = sesion.hallazgos;
        const errores = validarGrupoProteccion(grupo, hallazgos);

        if (errores.length > 0) {
          return {
            exito: false,
            errores,
          };
        }
      }

      // 4. Dispatch create action
      dispatch({
        type: 'AGREGAR_GRUPO',
        payload: grupo,
      });

      return {
        exito: true,
        errores: [],
        id: grupo.id,
      };
    },
    [sesion, dispatch]
  );

  // ============================================================================
  // UPDATE FUNCTIONS
  // ============================================================================

  /**
   * Update group data.
   *
   * @param id - Group ID to update
   * @param datos - Data to update (partial)
   * @returns Operation result
   *
   * @example
   * actualizarGrupo('grp-001', {
   *   nombre: 'Nuevo nombre',
   *   color: '#FF5733'
   * });
   */
  const actualizarGrupo = useCallback(
    (id: string, datos: ActualizarGrupoDTO): ResultadoOperacion => {
      // 1. Check if group exists
      const grupoExistente = obtenerGrupoPorId(id);

      if (!grupoExistente) {
        return {
          exito: false,
          errores: [`Grupo con ID '${id}' no encontrado`],
        };
      }

      // 2. Validate color format if provided
      if (datos.color && !validarColorHex(datos.color)) {
        return {
          exito: false,
          errores: [`Color inválido: ${datos.color}. Debe ser formato hexadecimal (#RRGGBB)`],
        };
      }

      // 3. Dispatch update action (cast color to ColorHex since we validated it)
      dispatch({
        type: 'ACTUALIZAR_GRUPO',
        payload: { id, datos: datos as Partial<GrupoProteccion> },
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [obtenerGrupoPorId, dispatch]
  );

  /**
   * Add a hallazgo to a group.
   *
   * @param grupoId - Group ID to update
   * @param hallazgoId - Hallazgo ID to add
   * @param tipo - Whether to add as 'peligro' or 'protector'
   * @returns Operation result
   *
   * @example
   * // Add a hazard to a group
   * agregarHallazgoAGrupo('grp-001', 'peligro-001', 'peligro');
   *
   * @example
   * // Add a barrier to a group
   * agregarHallazgoAGrupo('grp-001', 'barrera-001', 'protector');
   */
  const agregarHallazgoAGrupo = useCallback(
    (
      grupoId: string,
      hallazgoId: string,
      tipo: 'peligro' | 'protector'
    ): ResultadoOperacion => {
      // 1. Check if group exists
      const grupoExistente = obtenerGrupoPorId(grupoId);

      if (!grupoExistente) {
        return {
          exito: false,
          errores: [`Grupo con ID '${grupoId}' no encontrado`],
        };
      }

      // 2. Check if hallazgo already in group
      const yaEnPeligros = grupoExistente.peligrosIds.includes(hallazgoId);
      const yaEnProtectores = grupoExistente.protectoresIds.includes(hallazgoId);

      if (yaEnPeligros || yaEnProtectores) {
        return {
          exito: false,
          errores: [`El hallazgo '${hallazgoId}' ya está en este grupo`],
        };
      }

      // 3. Prepare update
      const campo = tipo === 'peligro' ? 'peligrosIds' : 'protectoresIds';
      const nuevosIds = [...grupoExistente[campo], hallazgoId];

      // 4. Dispatch update
      dispatch({
        type: 'ACTUALIZAR_GRUPO',
        payload: {
          id: grupoId,
          datos: {
            [campo]: nuevosIds,
          },
        },
      });

      return {
        exito: true,
        errores: [],
        id: grupoId,
      };
    },
    [obtenerGrupoPorId, dispatch]
  );

  /**
   * Remove a hallazgo from a group.
   *
   * @param grupoId - Group ID to update
   * @param hallazgoId - Hallazgo ID to remove
   * @returns Operation result
   *
   * @example
   * eliminarHallazgoDeGrupo('grp-001', 'peligro-001');
   */
  const eliminarHallazgoDeGrupo = useCallback(
    (grupoId: string, hallazgoId: string): ResultadoOperacion => {
      // 1. Check if group exists
      const grupoExistente = obtenerGrupoPorId(grupoId);

      if (!grupoExistente) {
        return {
          exito: false,
          errores: [`Grupo con ID '${grupoId}' no encontrado`],
        };
      }

      // 2. Remove from both arrays (in case it's in the wrong one)
      const nuevosPeligros = grupoExistente.peligrosIds.filter(
        (id) => id !== hallazgoId
      );
      const nuevosProtectores = grupoExistente.protectoresIds.filter(
        (id) => id !== hallazgoId
      );

      // 3. Dispatch update
      dispatch({
        type: 'ACTUALIZAR_GRUPO',
        payload: {
          id: grupoId,
          datos: {
            peligrosIds: nuevosPeligros,
            protectoresIds: nuevosProtectores,
          },
        },
      });

      return {
        exito: true,
        errores: [],
        id: grupoId,
      };
    },
    [obtenerGrupoPorId, dispatch]
  );

  // ============================================================================
  // DELETE FUNCTION
  // ============================================================================

  /**
   * Delete a group.
   *
   * @param id - Group ID to delete
   * @returns Operation result
   *
   * @example
   * const resultado = eliminarGrupo('grp-001');
   * if (resultado.exito) {
   *   console.log('Grupo eliminado');
   * }
   */
  const eliminarGrupo = useCallback(
    (id: string): ResultadoOperacion => {
      // 1. Check if group exists
      const grupoExistente = obtenerGrupoPorId(id);

      if (!grupoExistente) {
        return {
          exito: false,
          errores: [`Grupo con ID '${id}' no encontrado`],
        };
      }

      // 2. Dispatch delete action
      dispatch({
        type: 'ELIMINAR_GRUPO',
        payload: id,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [obtenerGrupoPorId, dispatch]
  );

  // ============================================================================
  // FILTER FUNCTION
  // ============================================================================

  /**
   * Filter groups by various criteria.
   *
   * @param filtro - Filter options
   * @returns Filtered groups array
   *
   * @example
   * // Filter by hallazgo membership
   * const grupos = filtrarGrupos({ hallazgoId: 'peligro-001' });
   *
   * @example
   * // Search by name
   * const grupos = filtrarGrupos({ busqueda: 'presión' });
   */
  const filtrarGrupos = useCallback(
    (filtro: FiltroGrupo): GrupoProteccion[] => {
      return grupos.filter((g) => {
        // Filter by hallazgo ID
        if (filtro.hallazgoId) {
          const estaEnGrupo =
            g.peligrosIds.includes(filtro.hallazgoId) ||
            g.protectoresIds.includes(filtro.hallazgoId);
          if (!estaEnGrupo) return false;
        }

        // Filter by search term
        if (filtro.busqueda) {
          const busqueda = filtro.busqueda.toLowerCase();
          const coincide =
            g.nombre.toLowerCase().includes(busqueda) ||
            (g.descripcion && g.descripcion.toLowerCase().includes(busqueda));
          if (!coincide) return false;
        }

        // Filter by color
        if (filtro.color && g.color !== filtro.color) {
          return false;
        }

        return true;
      });
    },
    [grupos]
  );

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get groups with validation errors (empty members, invalid references).
   *
   * @returns Array of invalid groups
   *
   * @example
   * const invalidos = gruposInvalidos();
   * if (invalidos.length > 0) {
   *   console.warn('Grupos inválidos:', invalidos.map(g => g.nombre));
   * }
   */
  const gruposInvalidos = useCallback((): GrupoProteccion[] => {
    if (!sesion) return [];

    const hallazgos = sesion.hallazgos;
    return grupos.filter((g) => {
      const errores = validarGrupoProteccion(g, hallazgos);
      return errores.length > 0;
    });
  }, [grupos, sesion]);

  /**
   * Get hallazgos that are not in any group.
   *
   * @returns Array of hallazgos without group membership
   *
   * @example
   * const huerfanos = hallazgosSinGrupo();
   * console.log(`Hallazgos sin grupo: ${huerfanos.length}`);
   */
  const hallazgosSinGrupo = useCallback((): Hallazgo[] => {
    if (!sesion) return [];

    // Collect all hallazgo IDs that appear in any group
    const hallazgosEnGrupos = new Set<string>();
    grupos.forEach((g) => {
      g.peligrosIds.forEach((id) => hallazgosEnGrupos.add(id));
      g.protectoresIds.forEach((id) => hallazgosEnGrupos.add(id));
    });

    // Find hallazgos not in any group
    return sesion.hallazgos.filter((h) => !hallazgosEnGrupos.has(h.id));
  }, [grupos, sesion]);

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // Estado
      grupos,
      obtenerGrupoPorId,
      obtenerGruposPorHallazgo,
      obtenerGruposPorPeligro,
      obtenerGruposPorProtector,

      // Crear
      crearGrupo,

      // Actualizar
      actualizarGrupo,
      agregarHallazgoAGrupo,
      eliminarHallazgoDeGrupo,

      // Eliminar
      eliminarGrupo,

      // Filtrar
      filtrarGrupos,

      // Utilidades
      gruposInvalidos,
      hallazgosSinGrupo,
    }),
    [
      grupos,
      obtenerGrupoPorId,
      obtenerGruposPorHallazgo,
      obtenerGruposPorPeligro,
      obtenerGruposPorProtector,
      crearGrupo,
      actualizarGrupo,
      agregarHallazgoAGrupo,
      eliminarHallazgoDeGrupo,
      eliminarGrupo,
      filtrarGrupos,
      gruposInvalidos,
      hallazgosSinGrupo,
    ]
  );
}
