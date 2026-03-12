/**
 * ============================================================================
 * RELACIONES (RELATIONSHIPS) TYPES - Domain Models for Entity Relationships
 * ============================================================================
 * 
 * This module defines TypeScript interfaces for relationships between:
 * 1. Hallazgos (Findings) - How hazards, barriers, SOPs, and protection layers relate
 * 2. Analisis (Analyses) - How different analysis methodologies support each other
 * 
 * Relationships are first-class entities with their own IDs and metadata,
 * enabling traceability and graph-based analysis of the risk model.
 * 
 * @module models/relaciones/types
 */

// ============================================================================
// TYPE ENUMERATIONS - HALLAZGO RELATIONSHIPS
// ============================================================================

/**
 * Types of relationships between Hallazgos (Findings).
 * 
 * These define how different findings relate to each other in the risk model:
 * - mitiga: A Barrier reduces the risk of a Hazard
 * - controla: A SOP controls or manages a Hazard
 * - protege: A Barrier protects a specific Element
 * - requiere: A Hazard requires a Barrier for protection
 */
export type TipoRelacionHallazgo =
  | 'mitiga'     // Barrier → Hazard (most common)
  | 'controla'   // SOP → Hazard
  | 'protege'    // Barrier → Element
  | 'requiere';  // Hazard → Barrier

// ============================================================================
// TYPE ENUMERATIONS - ANALYSIS RELATIONSHIPS
// ============================================================================

/**
 * Types of relationships between Analisis (Analyses).
 * 
 * These define how different analysis methodologies support each other:
 * - sustenta: One analysis provides foundation/data for another
 * - complementa: One analysis adds information to another
 * - deriva: One analysis is derived from another (parent-child)
 */
export type TipoRelacionAnalisis =
  | 'sustenta'    // Supporting → Supported (e.g., FMEA sustenta HAZOP)
  | 'complementa' // Complementary analysis
  | 'deriva';     // Derived from parent analysis

// ============================================================================
// HALLAZGO RELATIONSHIP INTERFACE
// ============================================================================

/**
 * Relationship between two Hallazgos (Findings).
 * 
 * Used to establish connections between hazards, barriers, SOPs, and protection
 * layers. These relationships form the risk graph that students visualize
 * on the plant diagram.
 * 
 * @example
 * // A barrier mitigates a hazard
 * {
 *   id: "rel-001",
 *   tipo: "mitiga",
 *   origenId: "barrera-123",  // Source: Barrier
 *   destinoId: "peligro-456", // Target: Hazard
 *   descripcion: "Pressure relief valve prevents overpressure scenario"
 * }
 */
export interface RelacionHallazgo {
  /** Unique identifier for this relationship */
  id: string;

  /** Type of relationship */
  tipo: TipoRelacionHallazgo;

  /** ID of the source hallazgo (origin of the relationship) */
  origenId: string;

  /** ID of the target hallazgo (destination of the relationship) */
  destinoId: string;

  /** Optional notes describing the relationship context */
  descripcion?: string;

  /** Creation timestamp in ISO 8601 format */
  fechaCreacion: string;
}

// ============================================================================
// ANALYSIS RELATIONSHIP INTERFACE
// ============================================================================

/**
 * Relationship between two Analisis (Analyses).
 * 
 * Used to establish traceability between different analysis methodologies.
 * For example, an FMEA might support (sustenta) a HAZOP study, or a LOPA
 * might be derived from (deriva) a HAZOP.
 * 
 * @example
 * // FMEA supports HAZOP
 * {
 *   id: "rel-analysis-001",
 *   tipo: "sustenta",
 *   analisisSustentoId: "fmea-123",      // Supporting: FMEA
 *   analisisSustentadoId: "hazop-456",   // Supported: HAZOP
 *   descripcion: "FMEA component failures inform HAZOP deviations"
 * }
 */
export interface RelacionAnalisis {
  /** Unique identifier for this relationship */
  id: string;

  /** Type of relationship */
  tipo: TipoRelacionAnalisis;

  /** ID of the supporting analysis (provides foundation) */
  analisisSustentoId: string;

  /** ID of the supported analysis (receives support) */
  analisisSustentadoId: string;

  /** Description of how the analyses relate */
  descripcion: string;

  /** Creation timestamp in ISO 8601 format */
  fechaCreacion: string;
}

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * Union type of all relationship types.
 * Used for type-safe handling of any relationship entity.
 */
export type Relacion = RelacionHallazgo | RelacionAnalisis;

// ============================================================================
// TYPE GUARDS (Helper Functions)
// ============================================================================

/**
 * Type guard to check if a relationship is between Hallazgos.
 * @param relacion - The relationship to check
 * @returns True if the relationship is RelacionHallazgo type
 */
export function isRelacionHallazgo(relacion: Relacion): relacion is RelacionHallazgo {
  return 'origenId' in relacion && 'destinoId' in relacion;
}

/**
 * Type guard to check if a relationship is between Analisis.
 * @param relacion - The relationship to check
 * @returns True if the relationship is RelacionAnalisis type
 */
export function isRelacionAnalisis(relacion: Relacion): relacion is RelacionAnalisis {
  return 'analisisSustentoId' in relacion && 'analisisSustentadoId' in relacion;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Directional relationship metadata.
 * Used for graph traversal and visualization.
 */
export interface RelacionDirectional {
  /** Source entity ID */
  from: string;

  /** Target entity ID */
  to: string;

  /** Relationship type/label for edge */
  label: string;
}

/**
 * Graph node representation for visualization.
 * Generic type allows both Hallazgo and Analisis nodes.
 */
export interface GraphNode<T = unknown> {
  /** Unique identifier */
  id: string;

  /** Node type for rendering */
  nodeType: string;

  /** Display label */
  label: string;

  /** Original entity data */
  data: T;
}

/**
 * Graph edge representation for visualization.
 */
export interface GraphEdge {
  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Edge label (relationship type) */
  label: string;

  /** Optional edge metadata */
  metadata?: {
    descripcion?: string;
    fechaCreacion?: string;
  };
}

/**
 * Complete relationship graph structure.
 * Used for network visualization and graph algorithms.
 */
export interface RelacionGraph {
  /** All nodes in the graph */
  nodes: GraphNode[];

  /** All edges (relationships) in the graph */
  edges: GraphEdge[];
}

// ============================================================================
// RELATIONSHIP VALIDATION TYPES
// ============================================================================

/**
 * Validation result for a relationship.
 */
export interface RelacionValidationResult {
  /** Whether the relationship is valid */
  isValid: boolean;

  /** List of validation errors (empty if valid) */
  errors: string[];

  /** List of validation warnings (non-blocking issues) */
  warnings: string[];
}

/**
 * Valid source-target type combinations for Hallazgo relationships.
 * Defines the allowed relationship patterns in the risk model.
 */
export type RelacionHallazgoPattern =
  | { origen: 'Barrera'; destino: 'Peligro'; tipo: 'mitiga' }
  | { origen: 'POE'; destino: 'Peligro'; tipo: 'controla' }
  | { origen: 'Barrera'; destino: 'Barrera'; tipo: 'protege' }
  | { origen: 'Peligro'; destino: 'Barrera'; tipo: 'requiere' };
