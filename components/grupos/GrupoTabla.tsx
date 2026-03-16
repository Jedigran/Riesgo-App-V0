/**
 * ============================================================================
 * GRUPO TABLA - Table View for Protection Groups Integration
 * ============================================================================
 * 
 * Table component for displaying groups alongside hallazgos.
 * Shows group membership for each hallazgo.
 * 
 * @module components/grupos/GrupoTabla
 */

'use client';

import type { GrupoProteccion } from '@/src/models/grupos/types';
import type { Hallazgo } from '@/src/models/hallazgo/types';

// ============================================================================
// TYPES
// ============================================================================

export interface GrupoTablaProps {
  /** All groups */
  grupos: GrupoProteccion[];
  
  /** All hallazgos */
  hallazgos: Hallazgo[];
  
  /** Called when user clicks on a group */
  onGroupClick?: (grupoId: string) => void;
  
  /** Called when user clicks on a hallazgo */
  onHallazgoClick?: (hallazgoId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Table component showing groups and their members.
 * 
 * @example
 * <GrupoTabla
 *   grupos={grupos}
 *   hallazgos={todosLosHallazgos}
 *   onGroupClick={(id) => handleGroupSelect(id)}
 * />
 */
export default function GrupoTabla({
  grupos,
  hallazgos,
  onGroupClick,
  onHallazgoClick,
}: GrupoTablaProps) {
  // Helper to get hallazgo by ID
  const getHallazgo = (id: string) => hallazgos.find(h => h.id === id);
  
  // Helper to get group colors for a hallazgo
  const getGruposParaHallazgo = (hallazgoId: string) => {
    return grupos.filter(
      g => g.peligrosIds.includes(hallazgoId) || g.protectoresIds.includes(hallazgoId)
    );
  };
  
  if (grupos.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '11px',
            fontWeight: 300,
            color: 'var(--text-muted)',
          }}
        >
          No hay grupos de protección creados
        </p>
      </div>
    );
  }
  
  return (
    <div className="knar-card">
      <div className="knar-card-header">
        <div className="knar-icon-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="knar-card-title">Tabla de Grupos</h3>
      </div>
      
      <div className="knar-card-content" style={{ padding: 0, overflow: 'hidden' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '0.5px solid var(--border-8)',
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                Grupo
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                Peligros
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                Protectores
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  width: '120px',
                }}
              >
                Miembros
              </th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo, index) => {
              const peligros = grupo.peligrosIds.map(getHallazgo).filter(Boolean) as Hallazgo[];
              const protectores = grupo.protectoresIds.map(getHallazgo).filter(Boolean) as Hallazgo[];
              
              // Classify protectors by type
              const barreras = protectores.filter(p => p.tipo === 'Barrera');
              const poes = protectores.filter(p => p.tipo === 'POE');
              const sols = protectores.filter(p => p.tipo === 'SOL');
              
              return (
                <tr
                  key={grupo.id}
                  onClick={() => onGroupClick?.(grupo.id)}
                  style={{
                    borderBottom: index < grupos.length - 1 ? '0.5px solid var(--border-8)' : 'none',
                    cursor: onGroupClick ? 'pointer' : 'default',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (onGroupClick) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Group name */}
                  <td
                    style={{
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          background: grupo.color,
                          boxShadow: `0 0 6px ${grupo.color}60`,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 400,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {grupo.nombre}
                        </div>
                        {grupo.descripcion && (
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 300,
                              color: 'var(--text-muted)',
                              marginTop: '2px',
                            }}
                          >
                            {grupo.descripcion.length > 50
                              ? grupo.descripcion.substring(0, 50) + '...'
                              : grupo.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Peligros */}
                  <td
                    style={{
                      padding: '10px 12px',
                    }}
                  >
                    {peligros.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                        }}
                      >
                        {peligros.slice(0, 3).map((p) => (
                          <span
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onHallazgoClick?.(p.id);
                            }}
                            style={{
                              fontSize: '10px',
                              fontWeight: 300,
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '0.5px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '3px',
                              padding: '2px 6px',
                              cursor: onHallazgoClick ? 'pointer' : 'default',
                              transition: 'all 150ms ease',
                            }}
                            onMouseEnter={(e) => {
                              if (onHallazgoClick) {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            }}
                            title={p.descripcion}
                          >
                            {p.titulo.length > 20 ? p.titulo.substring(0, 20) + '...' : p.titulo}
                          </span>
                        ))}
                        {peligros.length > 3 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 300,
                              color: 'var(--text-muted)',
                              padding: '2px 4px',
                            }}
                          >
                            +{peligros.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 300,
                          color: 'var(--text-disabled)',
                          fontStyle: 'italic',
                        }}
                      >
                        Sin peligros
                      </span>
                    )}
                  </td>
                  
                  {/* Protectores - classified by type */}
                  <td
                    style={{
                      padding: '10px 12px',
                      verticalAlign: 'top',
                    }}
                  >
                    {protectores.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        {/* Barreras */}
                        {barreras.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: '8px',
                                fontWeight: 400,
                                color: '#3b82f6',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                marginBottom: '3px',
                              }}
                            >
                              Barreras ({barreras.length})
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '3px',
                              }}
                            >
                              {barreras.slice(0, 2).map((p) => (
                                <span
                                  key={p.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onHallazgoClick?.(p.id);
                                  }}
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 300,
                                    color: '#3b82f6',
                                    background: '#3b82f615',
                                    border: '0.5px solid #3b82f630',
                                    borderRadius: '3px',
                                    padding: '1px 4px',
                                    cursor: onHallazgoClick ? 'pointer' : 'default',
                                    transition: 'all 150ms ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (onHallazgoClick) {
                                      e.currentTarget.style.background = '#3b82f625';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#3b82f615';
                                  }}
                                  title={p.descripcion}
                                >
                                  {p.titulo.length > 18 ? p.titulo.substring(0, 18) + '...' : p.titulo}
                                </span>
                              ))}
                              {barreras.length > 2 && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 300,
                                    color: 'var(--text-muted)',
                                    padding: '1px 4px',
                                  }}
                                >
                                  +{barreras.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* POEs */}
                        {poes.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: '8px',
                                fontWeight: 400,
                                color: '#10b981',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                marginBottom: '3px',
                              }}
                            >
                              POEs ({poes.length})
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '3px',
                              }}
                            >
                              {poes.slice(0, 2).map((p) => (
                                <span
                                  key={p.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onHallazgoClick?.(p.id);
                                  }}
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 300,
                                    color: '#10b981',
                                    background: '#10b98115',
                                    border: '0.5px solid #10b98130',
                                    borderRadius: '3px',
                                    padding: '1px 4px',
                                    cursor: onHallazgoClick ? 'pointer' : 'default',
                                    transition: 'all 150ms ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (onHallazgoClick) {
                                      e.currentTarget.style.background = '#10b98125';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#10b98115';
                                  }}
                                  title={p.descripcion}
                                >
                                  {p.titulo.length > 18 ? p.titulo.substring(0, 18) + '...' : p.titulo}
                                </span>
                              ))}
                              {poes.length > 2 && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 300,
                                    color: 'var(--text-muted)',
                                    padding: '1px 4px',
                                  }}
                                >
                                  +{poes.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SOLs */}
                        {sols.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: '8px',
                                fontWeight: 400,
                                color: '#8b5cf6',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                marginBottom: '3px',
                              }}
                            >
                              SOLs ({sols.length})
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '3px',
                              }}
                            >
                              {sols.slice(0, 2).map((p) => (
                                <span
                                  key={p.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onHallazgoClick?.(p.id);
                                  }}
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 300,
                                    color: '#8b5cf6',
                                    background: '#8b5cf615',
                                    border: '0.5px solid #8b5cf630',
                                    borderRadius: '3px',
                                    padding: '1px 4px',
                                    cursor: onHallazgoClick ? 'pointer' : 'default',
                                    transition: 'all 150ms ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (onHallazgoClick) {
                                      e.currentTarget.style.background = '#8b5cf625';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#8b5cf615';
                                  }}
                                  title={p.descripcion}
                                >
                                  {p.titulo.length > 18 ? p.titulo.substring(0, 18) + '...' : p.titulo}
                                </span>
                              ))}
                              {sols.length > 2 && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 300,
                                    color: 'var(--text-muted)',
                                    padding: '1px 4px',
                                  }}
                                >
                                  +{sols.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 300,
                          color: 'var(--text-disabled)',
                          fontStyle: 'italic',
                        }}
                      >
                        Sin protectores
                      </span>
                    )}
                  </td>
                  
                  {/* Total members */}
                  <td
                    style={{
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 400,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {peligros.length + protectores.length}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 300,
                          color: 'var(--text-muted)',
                        }}
                      >
                        total
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
