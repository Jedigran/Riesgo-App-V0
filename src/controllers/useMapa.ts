/**
 * ============================================================================
 * USE MAPA - Plant Diagram Map Management Hook
 * ============================================================================
 * 
 * This hook provides management operations for the interactive plant diagram
 * map with hallazgo locations.
 * 
 * Features:
 * - Map state management (image, zoom, pan)
 * - Hallazgo location updates
 * - View controls (zoom, pan, center, reset)
 * - Drag & drop support (future-ready)
 * - Find hallazgos at position
 * - Filter visible hallazgos
 * - Immutable state updates
 * 
 * @module controllers/useMapa
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Hallazgo, Ubicacion, TipoHallazgo } from '../models/hallazgo/types';

import { useSesionContext } from '../lib/state/SessionContext';

import { validarCoordenadaEnRango, corregirCoordenada } from '../models/utils/generadores';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Operation result for map operations.
 */
export interface ResultadoOperacion {
  /** Whether the operation succeeded */
  exito: boolean;

  /** List of errors (empty if successful) */
  errores: string[];
}

/**
 * Map configuration options.
 */
export interface MapaConfig {
  /** Default image path */
  imagenPorDefecto: string;

  /** Minimum zoom level */
  zoomMin: number;

  /** Maximum zoom level */
  zoomMax: number;

  /** Click tolerance in pixels */
  toleranciaClick: number;
}

/**
 * Pan position for map viewport.
 */
export interface PanPosition {
  /** Horizontal offset */
  x: number;

  /** Vertical offset */
  y: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: MapaConfig = {
  imagenPorDefecto: '/diagrams/default-plant.png',
  zoomMin: 0.5,
  zoomMax: 3,
  toleranciaClick: 5, // pixels
};

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useMapa hook.
 */
export interface UseMapaReturn {
  // Map State
  /** Current image path */
  imagenActual: string;

  /** Current zoom level (0.5 - 3) */
  zoom: number;

  /** Current pan position */
  pan: PanPosition;

  // Hallazgo Location Functions
  /** Update hallazgo location */
  actualizarUbicacionHallazgo: (
    id: string,
    x: number,
    y: number
  ) => ResultadoOperacion;

  /** Get hallazgos at specific position */
  obtenerHallazgoEnPosicion: (
    x: number,
    y: number,
    tolerancia?: number
  ) => Hallazgo[];

  /** Get visible hallazgos (within viewport) */
  hallazgosVisibles: () => Hallazgo[];

  // View Controls
  /** Change map image */
  cambiarImagen: (ruta: string) => void;

  /** Update zoom level */
  actualizarZoom: (zoom: number) => void;

  /** Update pan position */
  actualizarPan: (pan: PanPosition) => void;

  /** Center view on specific hallazgo */
  centrarEnHallazgo: (hallazgoId: string) => void;

  /** Reset view to defaults */
  resetearVista: () => void;

  // Drag & Drop (Future-ready)
  /** Start drag operation */
  iniciarDrag: (hallazgoId: string) => void;

  /** Update drag position */
  actualizarDrag: (x: number, y: number) => void;

  /** Finish drag operation */
  finalizarDrag: () => ResultadoOperacion;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Plant diagram map management controller hook.
 * Provides operations for managing the interactive map with hallazgo locations.
 * 
 * @param config - Optional map configuration
 * @returns Map state and management functions
 * 
 * @example
 * // Basic usage
 * function PlantMap() {
 *   const {
 *     imagenActual,
 *     zoom,
 *     pan,
 *     actualizarUbicacionHallazgo,
 *     hallazgosVisibles
 *   } = useMapa();
 * 
 *   const hallazgos = hallazgosVisibles();
 * 
 *   return (
 *     <div className="map-container">
 *       <img src={imagenActual} style={{ zoom }} />
 *       {hallazgos.map(h => (
 *         <HallazgoMarker
 *           key={h.id}
 *           hallazgo={h}
 *           onDragEnd={(x, y) => actualizarUbicacionHallazgo(h.id, x, y)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useMapa(config?: Partial<MapaConfig>): UseMapaReturn {
  // Merge config with defaults
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Get session context
  const { sesion, dispatch } = useSesionContext();

  // Map state (local, not in session)
  const [imagenActual, setImagenActual] = useState<string>(
    sesion?.imagenActual || mergedConfig.imagenPorDefecto
  );
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 });

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<Ubicacion | null>(null);

  // Update imagenActual when session changes
  useMemo(() => {
    if (sesion?.imagenActual && sesion.imagenActual !== imagenActual) {
      setImagenActual(sesion.imagenActual);
    }
  }, [sesion?.imagenActual, imagenActual]);

  // ============================================================================
  // HALLAZGO LOCATION FUNCTIONS
  // ============================================================================

  /**
   * Update hallazgo location on map.
   * 
   * @param id - Hallazgo ID to update
   * @param x - X coordinate (0-100, auto-corrected if out of range)
   * @param y - Y coordinate (0-100, auto-corrected if out of range)
   * @returns Operation result
   * 
   * @example
   * const resultado = actualizarUbicacionHallazgo('peligro-001', 45, 30);
   * if (resultado.exito) {
   *   console.log('Ubicación actualizada');
   * }
   */
  const actualizarUbicacionHallazgo = useCallback(
    (id: string, x: number, y: number): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Check if hallazgo exists
      const hallazgo = sesion.hallazgos.find((h) => h.id === id);

      if (!hallazgo) {
        return {
          exito: false,
          errores: [`Hallazgo con ID '${id}' no encontrado`],
        };
      }

      // 3. Validate and correct coordinates
      if (!validarCoordenadaEnRango(x, y)) {
        const corregida = corregirCoordenada(x, y);
        x = corregida.x;
        y = corregida.y;
      }

      // 4. Dispatch update action
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
      };
    },
    [sesion, dispatch]
  );

  /**
   * Get hallazgos at specific position.
   * 
   * @param x - X coordinate to check
   * @param y - Y coordinate to check
   * @param tolerancia - Tolerance in percentage (default: 2%)
   * @returns Array of hallazgos at or near this position
   * 
   * @example
   * const hallazgos = obtenerHallazgoEnPosicion(45, 30, 3);
   * // Returns hallazgos within 3% of position (45±3, 30±3)
   */
  const obtenerHallazgoEnPosicion = useCallback(
    (x: number, y: number, tolerancia: number = 2): Hallazgo[] => {
      if (!sesion) {
        return [];
      }

      return sesion.hallazgos.filter((h) => {
        const xDiff = Math.abs(h.ubicacion.x - x);
        const yDiff = Math.abs(h.ubicacion.y - y);
        return xDiff <= tolerancia && yDiff <= tolerancia;
      });
    },
    [sesion]
  );

  /**
   * Get visible hallazgos (within current viewport).
   * 
   * @returns Array of hallazgos visible in current view
   * 
   * @example
   * const visibles = hallazgosVisibles();
   * console.log(`Hallazgos visibles: ${visibles.length}`);
   */
  const hallazgosVisibles = useCallback((): Hallazgo[] => {
    if (!sesion) {
      return [];
    }

    // For now, return all hallazgos
    // Future: Filter based on pan/zoom viewport
    return sesion.hallazgos;
  }, [sesion]);

  // ============================================================================
  // VIEW CONTROLS
  // ============================================================================

  /**
   * Change map image.
   * 
   * @param ruta - New image path
   * 
   * @example
   * cambiarImagen('/diagrams/planta-nivel-2.png');
   */
  const cambiarImagen = useCallback((ruta: string): void => {
    // Revoke previous object URL to free memory (only object URLs, not path strings)
    if (imagenActual.startsWith('blob:')) {
      URL.revokeObjectURL(imagenActual);
    }
    setImagenActual(ruta);
    // Persist to session so the sync useMemo doesn't overwrite it
    dispatch({ type: 'ACTUALIZAR_SESION', payload: { imagenActual: ruta } });
  }, [imagenActual, dispatch]);

  /**
   * Update zoom level.
   * 
   * @param zoom - New zoom level (clamped to zoomMin-zoomMax)
   * 
   * @example
   * actualizarZoom(1.5); // 150% zoom
   */
  const actualizarZoom = useCallback(
    (nuevoZoom: number): void => {
      const zoomClamped = Math.max(
        mergedConfig.zoomMin,
        Math.min(mergedConfig.zoomMax, nuevoZoom)
      );
      setZoom(zoomClamped);
    },
    [mergedConfig.zoomMin, mergedConfig.zoomMax]
  );

  /**
   * Update pan position.
   * 
   * @param nuevoPan - New pan position
   * 
   * @example
   * actualizarPan({ x: 100, y: 50 });
   */
  const actualizarPan = useCallback((nuevoPan: PanPosition): void => {
    setPan(nuevoPan);
  }, []);

  /**
   * Center view on specific hallazgo.
   * 
   * @param hallazgoId - Hallazgo ID to center on
   * 
   * @example
   * centrarEnHallazgo('peligro-001');
   */
  const centrarEnHallazgo = useCallback(
    (hallazgoId: string): void => {
      if (!sesion) {
        return;
      }

      const hallazgo = sesion.hallazgos.find((h) => h.id === hallazgoId);

      if (!hallazgo) {
        return;
      }

      // Center pan on hallazgo position
      // Convert from percentage to pixel offset (assuming 1000x1000 viewport)
      const viewportSize = 1000;
      const centerX = (hallazgo.ubicacion.x / 100) * viewportSize;
      const centerY = (hallazgo.ubicacion.y / 100) * viewportSize;

      setPan({
        x: viewportSize / 2 - centerX,
        y: viewportSize / 2 - centerY,
      });

      // Ensure zoom is at least 1 to see the hallazgo clearly
      if (zoom < 1) {
        setZoom(1);
      }
    },
    [sesion, zoom]
  );

  /**
   * Reset view to defaults.
   * 
   * @example
   * resetearVista();
   */
  const resetearVista = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ============================================================================
  // DRAG & DROP (FUTURE-READY)
  // ============================================================================

  /**
   * Start drag operation.
   * 
   * @param hallazgoId - Hallazgo ID being dragged
   * 
   * @example
   * iniciarDrag('peligro-001');
   */
  const iniciarDrag = useCallback((hallazgoId: string): void => {
    setDraggingId(hallazgoId);
    setDragPosition(null);
  }, []);

  /**
   * Update drag position.
   * 
   * @param x - Current X position (0-100)
   * @param y - Current Y position (0-100)
   * 
   * @example
   * actualizarDrag(45, 30);
   */
  const actualizarDrag = useCallback((x: number, y: number): void => {
    // Validate and correct coordinates
    if (!validarCoordenadaEnRango(x, y)) {
      const corregida = corregirCoordenada(x, y);
      x = corregida.x;
      y = corregida.y;
    }

    setDragPosition({ x, y });
  }, []);

  /**
   * Finish drag operation.
   * 
   * @returns Operation result
   * 
   * @example
   * const resultado = finalizarDrag();
   * if (resultado.exito) {
   *   console.log('Ubicación actualizada');
   * }
   */
  const finalizarDrag = useCallback((): ResultadoOperacion => {
    // 1. Check if dragging
    if (!draggingId || !dragPosition) {
      return {
        exito: false,
        errores: ['No hay operación de arrastre en curso'],
      };
    }

    // 2. Update hallazgo location
    const resultado = actualizarUbicacionHallazgo(
      draggingId,
      dragPosition.x,
      dragPosition.y
    );

    // 3. Reset drag state
    setDraggingId(null);
    setDragPosition(null);

    return resultado;
  }, [draggingId, dragPosition, actualizarUbicacionHallazgo]);

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // Map State
      imagenActual,
      zoom,
      pan,

      // Hallazgo Location Functions
      actualizarUbicacionHallazgo,
      obtenerHallazgoEnPosicion,
      hallazgosVisibles,

      // View Controls
      cambiarImagen,
      actualizarZoom,
      actualizarPan,
      centrarEnHallazgo,
      resetearVista,

      // Drag & Drop
      iniciarDrag,
      actualizarDrag,
      finalizarDrag,
    }),
    [
      imagenActual,
      zoom,
      pan,
      actualizarUbicacionHallazgo,
      obtenerHallazgoEnPosicion,
      hallazgosVisibles,
      cambiarImagen,
      actualizarZoom,
      actualizarPan,
      centrarEnHallazgo,
      resetearVista,
      iniciarDrag,
      actualizarDrag,
      finalizarDrag,
      dispatch,
    ]
  );
}
