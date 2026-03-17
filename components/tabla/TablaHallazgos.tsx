/**
 * ============================================================================
 * TABLA HALLAZGOS - Tabla de Hallazgos (Read-Only)
 * ============================================================================
 * 
 * Muestra todos los hallazgos guardados en la sesión.
 * Incluye filtros por tipo, búsqueda, y ordenamiento.
 * 
 * @module components/tabla/TablaHallazgos
 */

'use client';

import { useState, useMemo, Fragment } from 'react';
import { useSesion } from '@/src/controllers/useSesion';
import { useGrupo } from '@/src/controllers/useGrupo';
import { useHallazgo } from '@/src/controllers/useHallazgo';
import type { Hallazgo, TipoHallazgo, Peligro, Barrera, POE, SOL } from '@/src/models/hallazgo/types';

interface FiltrosTabla {
  tipo: TipoHallazgo | 'todos';
  busqueda: string;
}

// ============================================================================
// DETAIL FIELDS RENDERER
// ============================================================================

function CamposEspecificos({ hallazgo }: { hallazgo: Hallazgo }) {
  const fields: { label: string; value: string | number | boolean | undefined }[] = [];

  if (hallazgo.tipo === 'Peligro') {
    const h = hallazgo as Peligro;
    fields.push(
      { label: 'Tipo de Peligro', value: h.tipoPeligro },
      { label: 'Consecuencia', value: h.consecuencia },
      { label: 'Severidad', value: `${h.severidad} / 5` },
      { label: 'Causa Raíz', value: h.causaRaiz },
    );
  } else if (hallazgo.tipo === 'Barrera') {
    const h = hallazgo as Barrera;
    fields.push(
      { label: 'Tipo de Barrera', value: h.tipoBarrera },
      { label: 'Función', value: h.tipoBarreraFuncion },
      { label: 'Efectividad Estimada', value: `${h.efectividadEstimada} / 5` },
      { label: 'Elemento Protegido', value: h.elementoProtegido },
    );
  } else if (hallazgo.tipo === 'POE') {
    const h = hallazgo as POE;
    fields.push(
      { label: 'Procedimiento Referencia', value: h.procedimientoReferencia },
      { label: 'Frecuencia de Aplicación', value: h.frecuenciaAplicacion },
      { label: 'Responsable', value: h.responsable },
    );
  } else if (hallazgo.tipo === 'SOL') {
    const h = hallazgo as SOL;
    fields.push(
      { label: 'Capa N°', value: h.capaNumero },
      { label: 'Independiente', value: h.independiente ? 'Sí' : 'No' },
      { label: 'Tipo de Tecnología', value: h.tipoTecnologia },
      { label: 'Parámetro', value: h.parametro },
      { label: 'Valor Mínimo', value: h.valorMinimo !== undefined ? `${h.valorMinimo} ${h.unidad}` : '—' },
      { label: 'Valor Máximo', value: h.valorMaximo !== undefined ? `${h.valorMaximo} ${h.unidad}` : '—' },
      { label: 'Unidad', value: h.unidad },
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {/* Description — shown in full since it's truncated in the row */}
      <div className="flex flex-col gap-1 col-span-2">
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 300 }}>Descripción</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 300 }}>{hallazgo.descripcion}</span>
      </div>
      {/* Type-specific fields */}
      {fields.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1">
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 300 }}>{label}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 400 }}>{value ?? '—'}</span>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 300 }}>Creado</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {new Date(hallazgo.fechaCreacion).toLocaleDateString('es-ES')}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TablaHallazgos() {
  const { sesion, sesionCargada } = useSesion();
  const { grupos, obtenerGruposPorHallazgo } = useGrupo();
  const { eliminarHallazgo } = useHallazgo();

  const [filtros, setFiltros] = useState<FiltrosTabla>({
    tipo: 'todos',
    busqueda: '',
  });
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Filtrar hallazgos
  const hallazgosFiltrados = useMemo(() => {
    if (!sesion) return [];

    return sesion.hallazgos.filter((h) => {
      // Filtro por tipo
      if (filtros.tipo !== 'todos' && h.tipo !== filtros.tipo) {
        return false;
      }

      // Filtro por búsqueda
      if (filtros.busqueda.trim()) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincideTitulo = h.titulo.toLowerCase().includes(busqueda);
        const coincideDescripcion = h.descripcion.toLowerCase().includes(busqueda);
        
        // Buscar en campos específicos por tipo
        let coincideCampoEspecifico = false;
        if (h.tipo === 'Peligro') {
          const peligro = h as any;
          coincideCampoEspecifico = 
            (peligro.consecuencia?.toLowerCase().includes(busqueda) || false) ||
            (peligro.causaRaiz?.toLowerCase().includes(busqueda) || false);
        } else if (h.tipo === 'Barrera') {
          const barrera = h as any;
          coincideCampoEspecifico = 
            (barrera.tipoBarrera?.toLowerCase().includes(busqueda) || false) ||
            (barrera.elementoProtegido?.toLowerCase().includes(busqueda) || false);
        }

        if (!coincideTitulo && !coincideDescripcion && !coincideCampoEspecifico) {
          return false;
        }
      }

      return true;
    });
  }, [sesion, filtros]);

  // Contar por tipo
  const conteoPorTipo = useMemo(() => {
    if (!sesion) return { Peligro: 0, Barrera: 0, POE: 0, SOL: 0 };

    return sesion.hallazgos.reduce((acc, h) => {
      acc[h.tipo] = (acc[h.tipo] || 0) + 1;
      return acc;
    }, {} as Record<TipoHallazgo, number>);
  }, [sesion]);

  // Get groups for a hallazgo
  const getGruposParaHallazgo = (hallazgoId: string) => {
    return obtenerGruposPorHallazgo(hallazgoId);
  };

  // Obtener color por tipo
  const getColorPorTipo = (tipo: Hallazgo['tipo']): string => {
    switch (tipo) {
      case 'Peligro': return 'rgba(220,38,38,0.85)';
      case 'Barrera': return 'rgba(59,130,246,0.85)';
      case 'POE':     return 'rgba(22,163,74,0.85)';
      case 'SOL':     return 'rgba(139,92,246,0.85)';
      default:        return 'rgba(107,114,128,0.85)';
    }
  };

  const getLabelPorTipo = (tipo: Hallazgo['tipo']): string => {
    switch (tipo) {
      case 'Peligro': return 'P';
      case 'Barrera': return 'B';
      case 'POE':     return 'E';
      case 'SOL':     return 'S';
      default:        return '?';
    }
  };

  if (!sesionCargada || !sesion) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)' }}>Cargando entidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-normal)', color: 'var(--text-primary)' }}>
            Total: {hallazgosFiltrados.length} entidades
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)' }}>
            De {sesion.hallazgos.length} totales en sesión
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(['Peligro', 'Barrera', 'POE', 'SOL'] as TipoHallazgo[]).map((tipo) => {
            const isActive = filtros.tipo === tipo;
            const color = getColorPorTipo(tipo);
            return (
              <button
                key={tipo}
                onClick={() => setFiltros({ ...filtros, tipo: isActive ? 'todos' : tipo })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  border: `0.5px solid ${isActive ? color : 'var(--border)'}`,
                  backgroundColor: isActive ? `${color.replace('0.85', '0.15')}` : 'var(--knar-dark)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-light)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0, display: 'inline-block' }} />
                <span>{tipo}</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 16,
                  height: 16,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--knar-charcoal)',
                  border: '0.5px solid var(--border)',
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  fontWeight: 'var(--weight-light)',
                  padding: '0 3px',
                }}>
                  {conteoPorTipo[tipo] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={filtros.busqueda}
          onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
          placeholder="Buscar entidades..."
          className="knar-input"
          style={{ paddingRight: 32 }}
        />
        <svg
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Tabla */}
      {hallazgosFiltrados.length === 0 ? (
        <div style={{ backgroundColor: 'var(--knar-charcoal)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-light)' }}>
            {sesion.hallazgos.length === 0
              ? 'No hay entidades en la sesión. Cree un análisis para comenzar.'
              : 'No hay entidades que coincidan con los filtros.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--knar-charcoal)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--knar-dark)', borderBottom: '0.5px solid var(--border)' }}>
              <tr>
                <th className="px-4 py-2 text-left" style={{ width: 28 }} />
                {(['Tipo', 'Título', 'Descripción', 'Relaciones'] as const).map(col => (
                  <th key={col} className="px-4 py-2 text-left" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-light)', color: 'var(--text-muted)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hallazgosFiltrados.map((hallazgo, i) => {
                const gruposDelHallazgo = getGruposParaHallazgo(hallazgo.id);
                const tieneGrupos = gruposDelHallazgo.length > 0;
                const isExpanded = expandedRowId === hallazgo.id;

                return (
                  <Fragment key={hallazgo.id}>
                    <tr
                      style={{
                        borderTop: i > 0 ? '0.5px solid var(--border)' : undefined,
                        transition: 'background-color 150ms ease',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? 'var(--knar-dark)' : undefined,
                      }}
                      onClick={() => setExpandedRowId(isExpanded ? null : hallazgo.id)}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--knar-dark)'; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = ''; }}
                    >
                      {/* Expand chevron */}
                      <td className="px-4 py-2">
                        <svg
                          width="12" height="12"
                          fill="none" stroke="currentColor" strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          style={{ color: 'var(--text-muted)', transition: 'transform 200ms ease', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getColorPorTipo(hallazgo.tipo), flexShrink: 0 }} />
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 'var(--weight-light)' }}>{hallazgo.tipo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 'var(--weight-normal)' }}>{hallazgo.titulo}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-light)', display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {hallazgo.descripcion}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {tieneGrupos ? (
                          <div className="flex items-center gap-2">
                            {gruposDelHallazgo.slice(0, 2).map((grupo) => (
                              <span
                                key={grupo.id}
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 300,
                                  color: grupo.color,
                                  background: `${grupo.color}15`,
                                  border: `0.5px solid ${grupo.color}30`,
                                  borderRadius: '3px',
                                  padding: '2px 6px',
                                  cursor: 'default',
                                }}
                                title={grupo.nombre}
                              >
                                {grupo.nombre.length > 15 ? grupo.nombre.substring(0, 15) + '...' : grupo.nombre}
                              </span>
                            ))}
                            {gruposDelHallazgo.length > 2 && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 400,
                                  color: 'var(--text-muted)',
                                  background: 'var(--knar-charcoal)',
                                  border: '0.5px solid var(--border)',
                                  borderRadius: '9999px',
                                  padding: '2px 6px',
                                  minWidth: '24px',
                                  textAlign: 'center',
                                }}
                                title={gruposDelHallazgo.slice(2).map(g => g.nombre).join(', ')}
                              >
                                +{gruposDelHallazgo.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Sin relaciones
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-0 py-0">
                          <div
                            style={{
                              backgroundColor: 'var(--knar-charcoal)',
                              borderBottom: '0.5px solid var(--border)',
                              padding: '16px 20px',
                              animation: 'slideDown 0.2s ease-out',
                            }}
                          >
                            <div className="max-w-5xl mx-auto space-y-4">
                              {/* All fields */}
                              <CamposEspecificos hallazgo={hallazgo} />

                              {/* Relaciones badges */}
                              {tieneGrupos && (
                                <div>
                                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 300, marginBottom: 6 }}>Relaciones</p>
                                  <div className="flex flex-wrap gap-2">
                                    {gruposDelHallazgo.map((grupo) => (
                                      <span
                                        key={grupo.id}
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 300,
                                          color: grupo.color,
                                          background: `${grupo.color}15`,
                                          border: `0.5px solid ${grupo.color}30`,
                                          borderRadius: '3px',
                                          padding: '2px 8px',
                                        }}
                                      >
                                        {grupo.nombre}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '0.5px solid var(--border)' }}>
                              <button
                                className="px-3 py-1.5 rounded text-xs font-light flex items-center gap-2 transition-colors"
                                style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.25)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!confirm('¿Está seguro de eliminar esta entidad?')) return;
                                  eliminarHallazgo(hallazgo.id);
                                  setExpandedRowId(null);
                                }}
                              >
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
