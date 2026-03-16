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

import { useState, useMemo } from 'react';
import { useSesion } from '@/src/controllers/useSesion';
import { useRelacionesHallazgo } from '@/src/controllers/useRelacionesHallazgo';
import type { Hallazgo, TipoHallazgo } from '@/src/models/hallazgo/types';

interface FiltrosTabla {
  tipo: TipoHallazgo | 'todos';
  busqueda: string;
}

export default function TablaHallazgos() {
  const { sesion, sesionCargada } = useSesion();
  const { relaciones } = useRelacionesHallazgo();
  
  const [filtros, setFiltros] = useState<FiltrosTabla>({
    tipo: 'todos',
    busqueda: '',
  });

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

  // Contar relaciones por hallazgo
  const contarRelaciones = (hallazgoId: string) => {
    return relaciones.filter(r => 
      r.origenId === hallazgoId || r.destinoId === hallazgoId
    ).length;
  };

  // Contar por tipo
  const conteoPorTipo = useMemo(() => {
    if (!sesion) return { Peligro: 0, Barrera: 0, POE: 0, SOL: 0 };
    
    return sesion.hallazgos.reduce((acc, h) => {
      acc[h.tipo] = (acc[h.tipo] || 0) + 1;
      return acc;
    }, {} as Record<TipoHallazgo, number>);
  }, [sesion]);

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
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)' }}>Cargando hallazgos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-normal)', color: 'var(--text-primary)' }}>
            Total: {hallazgosFiltrados.length} hallazgos
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
          placeholder="Buscar hallazgos..."
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
              ? 'No hay hallazgos en la sesión. Cree un análisis para comenzar.'
              : 'No hay hallazgos que coincidan con los filtros.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--knar-charcoal)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--knar-dark)', borderBottom: '0.5px solid var(--border)' }}>
              <tr>
                {(['Tipo', 'Título', 'Descripción', 'Ubicación', 'Relaciones'] as const).map(col => (
                  <th key={col} className="px-4 py-2 text-left" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-light)', color: 'var(--text-muted)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hallazgosFiltrados.map((hallazgo, i) => (
                <tr
                  key={hallazgo.id}
                  style={{
                    borderTop: i > 0 ? '0.5px solid var(--border)' : undefined,
                    transition: 'background-color 150ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--knar-dark)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                >
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
                    {hallazgo.ubicacion ? (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-light)' }}>
                        ({hallazgo.ubicacion.x}, {hallazgo.ubicacion.y})
                      </span>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 'var(--weight-normal)' }}>
                        {contarRelaciones(hallazgo.id)}
                      </span>
                      {contarRelaciones(hallazgo.id) > 0 ? (
                        <svg width="12" height="12" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-label={`${contarRelaciones(hallazgo.id)} relaciones`}><title>{`${contarRelaciones(hallazgo.id)} relaciones`}</title><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
