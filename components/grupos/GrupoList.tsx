/**
 * ============================================================================
 * GRUPO LIST - List/Grid View of Protection Groups
 * ============================================================================
 * 
 * Displays a collection of protection groups with:
 * - Grid or list view toggle
 * - Search/filter functionality
 * - Empty state when no groups exist
 * - Integration with useGrupo hook
 * 
 * @module components/grupos/GrupoList
 */

'use client';

import { useState, useMemo } from 'react';
import type { GrupoProteccion } from '@/src/models/grupos/types';
import type { Hallazgo } from '@/src/models/hallazgo/types';
import GrupoCard from './GrupoCard';

// ============================================================================
// TYPES
// ============================================================================

export interface GrupoListProps {
  /** All groups to display */
  grupos: GrupoProteccion[];
  
  /** All hallazgos (for resolving names in cards) */
  hallazgos: Hallazgo[];
  
  /** Called when user clicks edit on a group */
  onEdit?: (grupo: GrupoProteccion) => void;
  
  /** Called when user clicks delete on a group */
  onDelete?: (grupoId: string) => void;
  
  /** Called when user clicks on a hallazgo member */
  onMemberClick?: (hallazgoId: string) => void;
  
  /** Currently selected group ID */
  selectedGroupId?: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * List/grid view component for displaying protection groups.
 * 
 * @example
 * <GrupoList
 *   grupos={grupos}
 *   hallazgos={todosLosHallazgos}
 *   onEdit={(g) => handleEdit(g)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 */
export default function GrupoList({
  grupos,
  hallazgos,
  onEdit,
  onDelete,
  onMemberClick,
  selectedGroupId,
}: GrupoListProps) {
  // View mode state
  const [vistaActual, setVistaActual] = useState<'grid' | 'lista'>('grid');
  
  // Search state
  const [busqueda, setBusqueda] = useState('');
  
  // Filter state
  const [filtroColor, setFiltroColor] = useState<string | null>(null);
  
  // Get unique colors from groups
  const coloresDisponibles = useMemo(() => {
    const colores = new Set(grupos.map(g => g.color));
    return Array.from(colores);
  }, [grupos]);
  
  // Filtered groups
  const gruposFiltrados = useMemo(() => {
    return grupos.filter((g) => {
      // Search filter
      if (busqueda.trim()) {
        const busquedaLower = busqueda.toLowerCase();
        const coincideNombre = g.nombre.toLowerCase().includes(busquedaLower);
        const coincideDescripcion = g.descripcion?.toLowerCase().includes(busquedaLower);
        if (!coincideNombre && !coincideDescripcion) return false;
      }
      
      // Color filter
      if (filtroColor && g.color !== filtroColor) return false;
      
      return true;
    });
  }, [grupos, busqueda, filtroColor]);
  
  // Group statistics
  const totalPeligros = gruposFiltrados.reduce(
    (acc, g) => acc + g.peligrosIds.length,
    0
  );
  const totalProtectores = gruposFiltrados.reduce(
    (acc, g) => acc + g.protectoresIds.length,
    0
  );
  
  return (
    <div className="knar-card flex flex-col" style={{ minHeight: '400px' }}>
      {/* Header */}
      <div className="knar-card-header flex-shrink-0">
        <div className="knar-icon-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="knar-card-title">Relaciones de Protección</h3>
        
        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginLeft: 'auto',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: 'var(--text-muted)',
            }}
          >
            {gruposFiltrados.length} relación{gruposFiltrados.length !== 1 ? 'es' : ''}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: 'var(--text-disabled)',
            }}
          >
            •
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: '#ef4444',
            }}
          >
            {totalPeligros} peligro{totalPeligros !== 1 ? 's' : ''}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: 'var(--text-disabled)',
            }}
          >
            •
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: '#10b981',
            }}
          >
            {totalProtectores} protector{totalProtectores !== 1 ? 'es' : ''}
          </span>
        </div>
        
        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginLeft: '12px',
          }}
        >
          <button
            onClick={() => setVistaActual('grid')}
            style={{
              padding: '4px 8px',
              background: vistaActual === 'grid' ? 'var(--accent)' : 'transparent',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            title="Vista de cuadrícula"
          >
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setVistaActual('lista')}
            style={{
              padding: '4px 8px',
              background: vistaActual === 'lista' ? 'var(--accent)' : 'transparent',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            title="Vista de lista"
          >
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Filter bar */}
      <div
        className="flex-shrink-0"
        style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 16px',
          borderBottom: '0.5px solid var(--border-8)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Search input */}
        <div className="relative" style={{ flex: 1, minWidth: '150px' }}>
          <svg
            className="absolute"
            style={{
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '12px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar relaciones..."
            style={{
              width: '100%',
              paddingLeft: '28px',
              paddingRight: '8px',
              paddingBlock: '4px',
              background: 'var(--knar-dark)',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 300,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
        
        {/* Color filters */}
        {coloresDisponibles.length > 0 && (
          <>
            <div
              style={{
                width: '0.5px',
                height: '16px',
                background: 'var(--border-8)',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 300,
                color: 'var(--text-muted)',
              }}
            >
              Color:
            </span>
            {coloresDisponibles.map((color) => (
              <button
                key={color}
                onClick={() => setFiltroColor(filtroColor === color ? null : color)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: color,
                  border: filtroColor === color
                    ? '1.5px solid white'
                    : '0.5px solid var(--border-8)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  opacity: filtroColor && filtroColor !== color ? 0.4 : 1,
                }}
                title={`Filtrar por color ${color}`}
              />
            ))}
            {filtroColor && (
              <button
                onClick={() => setFiltroColor(null)}
                style={{
                  fontSize: '10px',
                  fontWeight: 300,
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                Limpiar
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Content */}
      <div className="knar-card-content flex-1 overflow-y-auto">
        {/* Empty state */}
        {gruposFiltrados.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <svg
              style={{
                width: '48px',
                height: '48px',
                color: 'var(--text-disabled)',
                marginBottom: '16px',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              {grupos.length === 0
                ? 'No hay relaciones de protección'
                : 'No se encontraron relaciones'}
            </p>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 300,
                color: 'var(--text-disabled)',
              }}
            >
              {grupos.length === 0
                ? 'Crea una relación para organizar tus hallazgos'
                : 'Intenta con otros filtros'}
            </p>
          </div>
        ) : vistaActual === 'grid' ? (
          /* Grid view */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '12px',
            }}
          >
            {gruposFiltrados.map((grupo) => (
              <GrupoCard
                key={grupo.id}
                grupo={grupo}
                hallazgos={hallazgos}
                onEdit={onEdit}
                onDelete={onDelete}
                onMemberClick={onMemberClick}
                isSelected={selectedGroupId === grupo.id}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {gruposFiltrados.map((grupo) => (
              <div
                key={grupo.id}
                onClick={() => onMemberClick?.(grupo.peligrosIds[0] || grupo.protectoresIds[0])}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: selectedGroupId === grupo.id
                    ? `linear-gradient(135deg, ${grupo.color}15 0%, var(--knar-dark) 100%)`
                    : 'var(--knar-dark)',
                  border: selectedGroupId === grupo.id
                    ? `1px solid ${grupo.color}`
                    : '0.5px solid var(--border-8)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedGroupId !== grupo.id) {
                    e.currentTarget.style.borderColor = grupo.color;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedGroupId !== grupo.id) {
                    e.currentTarget.style.borderColor = 'var(--border-8)';
                    e.currentTarget.style.background = 'var(--knar-dark)';
                  }
                }}
              >
                {/* Color indicator */}
                <div
                  style={{
                    width: '4px',
                    height: '40px',
                    borderRadius: '2px',
                    background: grupo.color,
                    flexShrink: 0,
                  }}
                />
                
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 400,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {grupo.nombre}
                  </h4>
                  {grupo.descripcion && (
                    <p
                      style={{
                        fontSize: '10px',
                        fontWeight: 300,
                        color: 'var(--text-muted)',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {grupo.descripcion}
                    </p>
                  )}
                </div>
                
                {/* Member counts */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#ef4444',
                        lineHeight: 1,
                      }}
                    >
                      {grupo.peligrosIds.length}
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 300,
                        color: 'var(--text-disabled)',
                      }}
                    >
                      Peligros
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#10b981',
                        lineHeight: 1,
                      }}
                    >
                      {grupo.protectoresIds.length}
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 300,
                        color: 'var(--text-disabled)',
                      }}
                    >
                      Protectores
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(grupo);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      transition: 'color 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(grupo.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      transition: 'color 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
