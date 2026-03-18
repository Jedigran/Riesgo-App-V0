/**
 * ============================================================================
 * USE RELACIONES HALLAZGO - Hallazgo Relationships Management Hook
 * ============================================================================
 * 
 * This hook provides management operations for relationships between hallazgos:
 * Peligro ↔ Barrera ↔ POE ↔ SOL
 * 
 * Features:
 * - Create relationships (mitiga, controla, protege, requiere)
 * - Delete relationships
 * - Query connected hallazgos
 * - Detect orphan hallazgos (no relationships)
 * - Validate relationships before creation
 * - Immutable state updates
 * 
 * @module controllers/useRelacionesHallazgo
 */

'use client';

import { useCallback, useMemo } from 'react';
import type {
  RelacionHallazgo,
  TipoRelacionHallazgo,
} from '../models/relaciones/types';

import type { Hallazgo, TipoHallazgo } from '../models/hallazgo/types';

import { useSesionContext } from '../lib/state/SessionContext';

import { generarIdUnico } from '../models/utils/generadores';

import {
  validarRelacionHallazgo as validarRelacionHallazgoUtil,
  encontrarHallazgosHuerfanos as encontrarHallazgosHuerfanosUtil,
  obtenerHallazgosConectados as obtenerHallazgosConectadosUtil,
} from '../models/relaciones/utils';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Operation result for relationship CRUD operations.
 */
export interface ResultadoOperacion {
  /** Whether the operation succeeded */
  exito: boolean;

  /** List of errors (empty if successful) */
  errores: string[];

  /** ID of created/deleted entity (if applicable) */
  id?: string;
}

/**
 * Validation result for relationship creation.
 */
export interface ValidacionRelacion {
  /** Whether the validation passed */
  valida: boolean;

  /** List of errors (blocking issues) */
  errores: string[];

  /** List of warnings (non-blocking issues) */
  advertencias: string[];
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useRelacionesHallazgo hook.
 */
export interface UseRelacionesHallazgoReturn {
  // State
  /** All relationships in session */
  relaciones: RelacionHallazgo[];

  /** Get relationships for specific hallazgo */
  obtenerRelacionesDeHallazgo: (
    hallazgoId: string
  ) => RelacionHallazgo[];

  /** Get hallazgos connected to specific hallazgo */
  hallazgosConectados: (hallazgoId: string) => Hallazgo[];

  // Create
  /** Create new relationship */
  crearRelacionHallazgo: (
    tipo: TipoRelacionHallazgo,
    origenId: string,
    destinoId: string,
    descripcion?: string
  ) => ResultadoOperacion;

  // Delete
  /** Delete relationship */
  eliminarRelacionHallazgo: (id: string) => ResultadoOperacion;

  // Query
  /** Get orphan hallazgos (no relationships) */
  hallazgosHuerfanos: () => Hallazgo[];

  // Validate
  /** Validate relationship before creation */
  validarRelacionAntesDeCrear: (
    tipo: TipoRelacionHallazgo,
    origenId: string,
    destinoId: string
  ) => ValidacionRelacion;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hallazgo relationships management controller hook.
 * Provides operations for managing relationships between findings.
 * 
 * @returns Relationships state and management functions
 * 
 * @example
 * // Basic usage
 * function RelationshipEditor() {
 *   const {
 *     relaciones,
 *     crearRelacionHallazgo,
 *     hallazgosConectados
 *   } = useRelacionesHallazgo();
 * 
 *   const handleCrear = () => {
 *     const resultado = crearRelacionHallazgo(
 *       'mitiga',
 *       'barrera-001',
 *       'peligro-001',
 *       'This barrier mitigates the hazard'
 *     );
 * 
 *     if (resultado.exito) {
 *       console.log('Relación creada:', resultado.id);
 *     } else {
 *       console.error('Errores:', resultado.errores);
 *     }
 *   };
 * 
 *   return <button onClick={handleCrear}>Crear Relación</button>;
 * }
 */
export function useRelacionesHallazgo(): UseRelacionesHallazgoReturn {
  // Get session context
  const { sesion, dispatch } = useSesionContext();

  // ============================================================================
  // STATE ACCESSORS
  // ============================================================================

  /**
   * Get all relationships in session.
   */
  const relaciones = useMemo((): RelacionHallazgo[] => {
    return (sesion?.relaciones.filter((r) => 'origenId' in r) ||
      []) as RelacionHallazgo[];
  }, [sesion?.relaciones]);

  /**
   * Get relationships for specific hallazgo.
   * 
   * @param hallazgoId - Hallazgo ID to query
   * @returns Array of relationships involving this hallazgo
   * 
   * @example
   * const relaciones = obtenerRelacionesDeHallazgo('peligro-001');
   */
  const obtenerRelacionesDeHallazgo = useCallback(
    (hallazgoId: string): RelacionHallazgo[] => {
      return relaciones.filter(
        (r) => r.origenId === hallazgoId || r.destinoId === hallazgoId
      );
    },
    [relaciones]
  );

  /**
   * Get hallazgos connected to specific hallazgo.
   * 
   * @param hallazgoId - Hallazgo ID to query
   * @returns Array of connected hallazgos with relationship info
   * 
   * @example
   * const conectados = hallazgosConectados('peligro-001');
   * conectados.forEach(c => {
   *   console.log(`${c.hallazgo.titulo} - ${c.relacion.tipo}`);
   * });
   */
  const hallazgosConectados = useCallback(
    (hallazgoId: string): Hallazgo[] => {
      if (!sesion) {
        return [];
      }

      const conectados = obtenerHallazgosConectadosUtil(sesion, hallazgoId);
      return conectados.map((c) => c.hallazgo);
    },
    [sesion]
  );

  // ============================================================================
  // CREATE FUNCTION
  // ============================================================================

  /**
   * Create new relationship between hallazgos.
   * 
   * @param tipo - Relationship type (mitiga, controla, protege, requiere)
   * @param origenId - Source hallazgo ID
   * @param destinoId - Target hallazgo ID
   * @param descripcion - Optional description
   * @returns Operation result
   * 
   * @example
   * // Create "mitiga" relationship (Barrier → Hazard)
   * const resultado = crearRelacionHallazgo(
   *   'mitiga',
   *   'barrera-001',
   *   'peligro-001',
   *   'PSV-101 mitigates overpressure risk'
   * );
   * 
   * if (resultado.exito) {
   *   console.log('Relación creada:', resultado.id);
   * } else {
   *   console.error('Errores:', resultado.errores);
   * }
   */
  const crearRelacionHallazgo = useCallback(
    (
      tipo: TipoRelacionHallazgo,
      origenId: string,
      destinoId: string,
      descripcion?: string
    ): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Validate relationship before creation
      const validacion = validarRelacionAntesDeCrear(
        tipo,
        origenId,
        destinoId
      );

      if (!validacion.valida) {
        return {
          exito: false,
          errores: validacion.errores,
        };
      }

      // 3. Check for duplicate relationships
      const existeDuplicada = relaciones.some(
        (r) =>
          r.origenId === origenId &&
          r.destinoId === destinoId &&
          r.tipo === tipo
      );

      if (existeDuplicada) {
        return {
          exito: false,
          errores: ['Ya existe una relación idéntica'],
        };
      }

      // 4. Generate ID and create relationship
      const id = generarIdUnico('rel');
      const nuevaRelacion: RelacionHallazgo = {
        id,
        tipo,
        origenId,
        destinoId,
        descripcion: descripcion || '',
        fechaCreacion: new Date().toISOString(),
      };

      // 5. Dispatch create action
      dispatch({
        type: 'AGREGAR_RELACION',
        payload: nuevaRelacion,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch, relaciones]
  );

  // ============================================================================
  // DELETE FUNCTION
  // ============================================================================

  /**
   * Delete relationship.
   * 
   * @param id - Relationship ID to delete
   * @returns Operation result
   * 
   * @example
   * const resultado = eliminarRelacionHallazgo('rel-001');
   * if (resultado.exito) {
   *   console.log('Relación eliminada');
   * }
   */
  const eliminarRelacionHallazgo = useCallback(
    (id: string): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Check if relationship exists
      const relacionExistente = relaciones.find((r) => r.id === id);

      if (!relacionExistente) {
        return {
          exito: false,
          errores: [`Relación con ID '${id}' no encontrada`],
        };
      }

      // 3. Dispatch delete action
      dispatch({
        type: 'ELIMINAR_RELACION',
        payload: id,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch, relaciones]
  );

  // ============================================================================
  // QUERY FUNCTIONS
  // ============================================================================

  /**
   * Get orphan hallazgos (no relationships).
   * 
   * @returns Array of hallazgos without any relationships
   * 
   * @example
   * const huerfanos = hallazgosHuerfanos();
   * console.log(`Hallazgos sin relaciones: ${huerfanos.length}`);
   */
  const hallazgosHuerfanos = useCallback((): Hallazgo[] => {
    if (!sesion) {
      return [];
    }

    // encontrarHallazgosHuerfanosUtil returns IDs, need to map to hallazgos
    const huerfanosIds = encontrarHallazgosHuerfanosUtil(sesion);
    return huerfanosIds
      .map((id) => sesion.hallazgos.find((h) => h.id === id))
      .filter((h): h is Hallazgo => h !== undefined);
  }, [sesion]);

  // ============================================================================
  // VALIDATE FUNCTION
  // ============================================================================

  /**
   * Validate relationship before creation.
   * 
   * @param tipo - Relationship type
   * @param origenId - Source hallazgo ID
   * @param destinoId - Target hallazgo ID
   * @returns Validation result
   * 
   * @example
   * const validacion = validarRelacionAntesDeCrear(
   *   'mitiga',
   *   'barrera-001',
   *   'peligro-001'
   * );
   * 
   * if (!validacion.valida) {
   *   console.error('Errores:', validacion.errores);
   * }
   * 
   * if (validacion.advertencias.length > 0) {
   *   console.warn('Advertencias:', validacion.advertencias);
   * }
   */
  const validarRelacionAntesDeCrear = useCallback(
    (
      tipo: TipoRelacionHallazgo,
      origenId: string,
      destinoId: string
    ): ValidacionRelacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          valida: false,
          errores: ['No hay sesión activa'],
          advertencias: [],
        };
      }

      // 2. Check if hallazgos exist
      const origenExiste = sesion.hallazgos.some((h) => h.id === origenId);
      const destinoExiste = sesion.hallazgos.some((h) => h.id === destinoId);

      if (!origenExiste) {
        return {
          valida: false,
          errores: [`Hallazgo de origen '${origenId}' no encontrado`],
          advertencias: [],
        };
      }

      if (!destinoExiste) {
        return {
          valida: false,
          errores: [`Hallazgo de destino '${destinoId}' no encontrado`],
          advertencias: [],
        };
      }

      // 3. Check for self-reference
      if (origenId === destinoId) {
        return {
          valida: false,
          errores: ['No se puede relacionar un hallazgo consigo mismo'],
          advertencias: [],
        };
      }

      // 4. Get hallazgo types for validation
      const origen = sesion.hallazgos.find((h) => h.id === origenId);
      const destino = sesion.hallazgos.find((h) => h.id === destinoId);

      if (!origen || !destino) {
        return {
          valida: false,
          errores: ['Error interno: no se encontraron los hallazgos'],
          advertencias: [],
        };
      }

      // 5. Validate relationship type matches entity types
      const errores: string[] = [];
      const advertencias: string[] = [];

      // Check valid combinations
      const combinacionesValidas: Record<
        TipoRelacionHallazgo,
        { origen: TipoHallazgo; destino: TipoHallazgo }[]
      > = {
        mitiga: [
          { origen: 'Barrera', destino: 'Peligro' },
          { origen: 'SOL', destino: 'Peligro' },  // SOL (Protection Layer) can mitigate hazards
        ],
        controla: [{ origen: 'POE', destino: 'Peligro' }],
        protege: [
          { origen: 'Barrera', destino: 'Barrera' },
          { origen: 'Barrera', destino: 'SOL' },
          { origen: 'SOL', destino: 'SOL' },  // SOL can protect other SOLs
        ],
        requiere: [
          { origen: 'Peligro', destino: 'Barrera' },
          { origen: 'Peligro', destino: 'SOL' },  // Hazard may require SOL
        ],
      };

      const combinaciones = combinacionesValidas[tipo];
      const esValida = combinaciones.some(
        (c) => c.origen === origen.tipo && c.destino === destino.tipo
      );

      if (!esValida) {
        errores.push(
          `Combinación inválida: ${tipo} no es válido para ${origen.tipo} → ${destino.tipo}`
        );
      }

      // Add warnings for unusual combinations
      if (tipo === 'protege' && destino.tipo === 'SOL') {
        advertencias.push(
          'Relación inusual: Barrera protegiendo SOL (verificar si es correcto)'
        );
      }

      // Check for circular relationships (simple check)
      const relacionesExistentes = obtenerRelacionesDeHallazgo(origenId);
      const tieneRelacionInversa = relacionesExistentes.some(
        (r) => r.origenId === destinoId && r.destinoId === origenId
      );

      if (tieneRelacionInversa) {
        advertencias.push(
          'Advertencia: Existe relación inversa (posible relación circular)'
        );
      }

      return {
        valida: errores.length === 0,
        errores,
        advertencias,
      };
    },
    [sesion, obtenerRelacionesDeHallazgo]
  );

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // State
      relaciones,
      obtenerRelacionesDeHallazgo,
      hallazgosConectados,

      // Create
      crearRelacionHallazgo,

      // Delete
      eliminarRelacionHallazgo,

      // Query
      hallazgosHuerfanos,

      // Validate
      validarRelacionAntesDeCrear,
    }),
    [
      relaciones,
      obtenerRelacionesDeHallazgo,
      hallazgosConectados,
      crearRelacionHallazgo,
      eliminarRelacionHallazgo,
      hallazgosHuerfanos,
      validarRelacionAntesDeCrear,
    ]
  );
}
