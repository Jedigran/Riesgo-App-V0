/**
 * ============================================================================
 * GRUPO CARD - Visual Card for Protection Group
 * ============================================================================
 * 
 * Displays a single protection group with:
 * - Color-coded header
 * - Group name and description
 * - Member counts (hazards and protectors)
 * - Quick actions (edit, delete)
 * 
 * @module components/grupos/GrupoCard
 */

'use client';

import type { GrupoProteccion } from '@/src/models/grupos/types';
import type { Hallazgo } from '@/src/models/hallazgo/types';

// ============================================================================
// TYPES
// ============================================================================

export interface GrupoCardProps {
  /** Group data to display */
  grupo: GrupoProteccion;
  
  /** All hallazgos (for resolving names) */
  hallazgos: Hallazgo[];
  
  /** Called when user clicks edit button */
  onEdit?: (grupo: GrupoProteccion) => void;
  
  /** Called when user clicks delete button */
  onDelete?: (grupoId: string) => void;
  
  /** Called when user clicks on a member */
  onMemberClick?: (hallazgoId: string) => void;
  
  /** Whether the card is selected */
  isSelected?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Visual card component for displaying a protection group.
 * 
 * @example
 * <GrupoCard
 *   grupo={grupo}
 *   hallazgos={todosLosHallazgos}
 *   onEdit={(g) => handleEdit(g)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 */
export default function GrupoCard({
  grupo,
  hallazgos,
  onEdit,
  onDelete,
  onMemberClick,
  isSelected = false,
}: GrupoCardProps) {
  // Resolve hallazgo names from IDs
  const peligros = grupo.peligrosIds
    .map(id => hallazgos.find(h => h.id === id))
    .filter((h): h is Hallazgo => h !== undefined);
  
  const protectores = grupo.protectoresIds
    .map(id => hallazgos.find(h => h.id === id))
    .filter((h): h is Hallazgo => h !== undefined);
  
  // Format member list for display (show first 3, then "+X more")
  const formatMembers = (members: Hallazgo[], maxVisible = 3) => {
    const visible = members.slice(0, maxVisible);
    const remaining = members.length - maxVisible;
    
    return (
      <>
        {visible.map(m => (
          <span
            key={m.id}
            className="inline-block"
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid var(--border-6)',
              borderRadius: '3px',
              padding: '2px 6px',
              marginRight: '4px',
              marginBottom: '4px',
              cursor: onMemberClick ? 'pointer' : 'default',
              transition: 'all 150ms ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMemberClick?.(m.id);
            }}
            onMouseEnter={(e) => {
              if (onMemberClick) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = grupo.color;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'var(--border-6)';
            }}
            title={m.descripcion}
          >
            {m.titulo.length > 25 ? m.titulo.substring(0, 25) + '...' : m.titulo}
          </span>
        ))}
        {remaining > 0 && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: 'var(--text-muted)',
              padding: '2px 6px',
            }}
          >
            +{remaining} más
          </span>
        )}
      </>
    );
  };
  
  return (
    <div
      className="knar-card"
      style={{
        background: isSelected 
          ? `linear-gradient(135deg, ${grupo.color}15 0%, var(--knar-dark) 100%)`
          : 'var(--knar-dark)',
        border: isSelected 
          ? `1px solid ${grupo.color}`
          : '0.5px solid var(--border-8)',
        borderRadius: '6px',
        overflow: 'hidden',
        transition: 'all 200ms ease',
        position: 'relative',
      }}
    >
      {/* Color bar at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: grupo.color,
        }}
      />
      
      {/* Header */}
      <div className="knar-card-header" style={{ paddingBottom: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Color indicator dot */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '9999px',
              background: grupo.color,
              boxShadow: `0 0 8px ${grupo.color}60`,
            }}
          />
          
          {/* Group name */}
          <h4
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              margin: 0,
              flex: 1,
            }}
          >
            {grupo.nombre}
          </h4>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(grupo);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'color 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Editar grupo"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'color 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Eliminar grupo"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Description */}
        {grupo.descripcion && (
          <p
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: 'var(--text-muted)',
              margin: '6px 0 0 0',
              lineHeight: 1.4,
            }}
          >
            {grupo.descripcion}
          </p>
        )}
      </div>
      
      {/* Content */}
      <div className="knar-card-content" style={{ paddingTop: '8px' }}>
        {/* Peligros section */}
        <div
          style={{
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '9px',
                fontWeight: 400,
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              Peligros ({peligros.length})
            </span>
          </div>
          
          {peligros.length > 0 ? (
            <div>{formatMembers(peligros)}</div>
          ) : (
            <p
              style={{
                fontSize: '10px',
                fontWeight: 300,
                color: 'var(--text-disabled)',
                fontStyle: 'italic',
              }}
            >
              Sin peligros registrados
            </p>
          )}
        </div>
        
        {/* Protectores section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '9px',
                fontWeight: 400,
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              Protectores ({protectores.length})
            </span>
          </div>
          
          {protectores.length > 0 ? (
            <div>{formatMembers(protectores)}</div>
          ) : (
            <p
              style={{
                fontSize: '10px',
                fontWeight: 300,
                color: 'var(--text-disabled)',
                fontStyle: 'italic',
              }}
            >
              Sin protectores registrados
            </p>
          )}
        </div>
      </div>
      
      {/* Footer with metadata */}
      <div
        style={{
          borderTop: '0.5px solid var(--border-8)',
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 300,
            color: 'var(--text-disabled)',
          }}
        >
          {new Date(grupo.fechaCreacion).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        
        {grupo.creadoPor && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: 300,
              color: 'var(--text-disabled)',
            }}
          >
            por {grupo.creadoPor}
          </span>
        )}
      </div>
    </div>
  );
}
