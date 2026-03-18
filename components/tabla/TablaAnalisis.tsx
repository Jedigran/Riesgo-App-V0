/**
 * ============================================================================
 * TABLA ANÁLISIS - Tabla de Análisis (Read-Only)
 * ============================================================================
 * 
 * Muestra todos los análisis guardados en la sesión.
 * Incluye filtros por tipo de metodología, búsqueda, y estado.
 * 
 * @module components/tabla/TablaAnalisis
 */

'use client';

import { useState, useMemo, Fragment } from 'react';
import { useSesion } from '@/src/controllers/useSesion';
import { useAnalisis } from '@/src/controllers/useAnalisis';
import type { AnalisisOrigen, TipoAnalisis, EstadoAnalisis } from '@/src/models/analisis/types';

interface FiltrosTabla {
  tipo: TipoAnalisis | 'todos';
  estado: EstadoAnalisis | 'todos';
  busqueda: string;
}

export default function TablaAnalisis() {
  const { sesion, sesionCargada } = useSesion();
  const { eliminarAnalisis } = useAnalisis();

  const [filtros, setFiltros] = useState<FiltrosTabla>({
    tipo: 'todos',
    estado: 'todos',
    busqueda: '',
  });

  // Track which row is expanded
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Filtrar análisis
  const analisisFiltrados = useMemo(() => {
    if (!sesion) return [];

    return sesion.analisis.filter((a) => {
      // Filtro por tipo
      if (filtros.tipo !== 'todos' && a.base.tipo !== filtros.tipo) {
        return false;
      }

      // Filtro por estado
      if (filtros.estado !== 'todos' && a.base.estado !== filtros.estado) {
        return false;
      }

      // Filtro por búsqueda
      if (filtros.busqueda.trim()) {
        const busqueda = filtros.busqueda.toLowerCase();
        
        // Buscar en campos comunes
        const datos = a.datos as any;
        const coincideNombre = a.base.nombre?.toLowerCase().includes(busqueda);
        const coincideNodo = datos.nodo?.toLowerCase().includes(busqueda);
        const coincideComponente = datos.componente?.toLowerCase().includes(busqueda);
        const coincideEscenario = datos.escenario?.toLowerCase().includes(busqueda);
        const coincideEvento = datos.eventoIniciador?.toLowerCase().includes(busqueda);
        
        if (!coincideNombre && !coincideNodo && !coincideComponente && !coincideEscenario && 
            !coincideEvento) {
          return false;
        }
      }

      return true;
    });
  }, [sesion, filtros]);

  // Contar por tipo
  const conteoPorTipo = useMemo(() => {
    if (!sesion) return { HAZOP: 0, FMEA: 0, LOPA: 0, OCA: 0, Intuicion: 0 };
    
    return sesion.analisis.reduce((acc, a) => {
      acc[a.base.tipo] = (acc[a.base.tipo] || 0) + 1;
      return acc;
    }, {} as Record<TipoAnalisis, number>);
  }, [sesion]);

  // Obtener color por tipo
  const getColorPorTipo = (tipo: TipoAnalisis) => {
    switch (tipo) {
      case 'HAZOP': return 'bg-yellow-500';
      case 'FMEA': return 'bg-orange-500';
      case 'LOPA': return 'bg-blue-500';
      case 'OCA': return 'bg-green-500';
      case 'Intuicion': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Obtener icono por tipo
  const getIconoPorTipo = (tipo: TipoAnalisis) => {
    switch (tipo) {
      case 'HAZOP': return '🔍';
      case 'FMEA': return '⚙️';
      case 'LOPA': return '🛡️';
      case 'OCA': return '📊';
      case 'Intuicion': return '💡';
      default: return '📋';
    }
  };

  // Obtener datos específicos por tipo — if nombre is set, show it; otherwise fall back to type-derived fields
  const getDatosPrincipales = (analisis: AnalisisOrigen) => {
    if (analisis.base.nombre) return analisis.base.nombre;
    const datos = analisis.datos as any;
    
    switch (analisis.base.tipo) {
      case 'HAZOP':
        return `${datos.nodo || '—'} - ${datos.parametro || ''} ${datos.palabraGuia || ''}`;
      case 'FMEA':
        return `${datos.equipo || '—'} - ${datos.modoFalla || ''}`;
      case 'LOPA':
        return `${datos.escenario || '—'}`;
      case 'OCA':
        return `${datos.compuesto || '—'}${datos.cantidad ? ` - ${datos.cantidad} kg` : ''}`;
      case 'Intuicion':
        return datos.descripcion ? datos.descripcion.substring(0, 60) + (datos.descripcion.length > 60 ? '…' : '') : '—';
      default:
        return '—';
    }
  };

  // Contar hallazgos vinculados
  const contarHallazgosVinculados = (analisisId: string) => {
    if (!sesion) return 0;
    return sesion.hallazgos.filter(h =>
      h.analisisOrigenIds.includes(analisisId)
    ).length;
  };

  // Get hallazgos for an analysis
  const getHallazgosVinculados = (analisisId: string) => {
    if (!sesion) return [];
    return sesion.hallazgos.filter(h => h.analisisOrigenIds.includes(analisisId));
  };

  // Toggle expanded row
  const toggleExpand = (analisisId: string) => {
    setExpandedRowId(expandedRowId === analisisId ? null : analisisId);
  };

  if (!sesionCargada || !sesion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-knar-text-muted">
          <p className="text-sm">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ANALYSIS DETAILS CONTENT - Type-specific details
  // ============================================================================

  function AnalysisDetailsContent({ analisis }: { analisis: any }) {
    const datos = analisis.datos as any;

    switch (analisis.base.tipo) {
      case 'HAZOP':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <DetailRow label="Nodo" value={datos.nodo} />
              <DetailRow label="Subnodo" value={datos.subnodo} />
              <DetailRow label="Parámetro" value={datos.parametro} />
              <DetailRow label="Palabra Guía" value={datos.palabraGuia} />
              <DetailRow label="Causa" value={datos.causa} fullWidth />
              <DetailRow label="Consecuencia" value={datos.consecuencia} fullWidth />
              <DetailRow label="Receptor" value={datos.receptorImpacto} />
            </div>
            {datos.salvaguardasExistentes?.length > 0 && datos.salvaguardasExistentes[0] !== '' && (
              <div className="mt-3">
                <div className="text-knar-text-muted mb-2 text-xs">Salvaguardas Existentes:</div>
                <div className="flex flex-wrap gap-2">
                  {datos.salvaguardasExistentes.map((s: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 bg-knar-dark rounded border border-knar-border text-knar-text-secondary">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'FMEA':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <DetailRow label="Equipo" value={datos.equipo} fullWidth />
              <DetailRow label="Función" value={datos.funcion} fullWidth />
              <DetailRow label="Modo de Falla" value={datos.modoFalla} fullWidth />
              <DetailRow label="Efecto" value={datos.efecto} fullWidth />
              <DetailRow label="Causa" value={datos.causa} fullWidth />
            </div>
            
            <div className="mt-4 p-3 bg-knar-dark rounded border border-knar-border">
              <div className="text-knar-text-muted mb-3 text-xs font-medium">RPN Analysis:</div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <RPNBar label="Severidad (S)" value={datos.S} max={10} color="#ef4444" />
                <RPNBar label="Ocurrencia (O)" value={datos.O} max={10} color="#f59e0b" />
                <RPNBar label="Detección (D)" value={datos.D} max={10} color="#eab308" />
              </div>
              <div className="pt-3 border-t border-knar-border">
                <div className="text-knar-text-primary text-sm">
                  <strong>RPN = {datos.S} × {datos.O} × {datos.D} = <span className="text-lg">{datos.RPN}</span></strong>
                </div>
              </div>
            </div>
          </div>
        );

      case 'LOPA':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <DetailRow label="Escenario" value={datos.escenario} fullWidth />
              <DetailRow label="Consecuencia" value={datos.consecuencia} fullWidth />
              <DetailRow label="Receptor" value={datos.receptorImpacto} />
              <DetailRow label="Severidad (S)" value={datos.S?.toString()} />
              <DetailRow label="Riesgo Tolerable" value={datos.riesgoTolerable?.toString()} />
              <DetailRow label="Frec. Inicial" value={datos.frecuenciaInicial?.toString()} />
            </div>
            
            {datos.capasIPL?.length > 0 && (
              <div className="mt-4">
                <div className="text-knar-text-muted mb-2 text-xs font-medium">Capas de Protección (IPL):</div>
                <div className="bg-knar-dark rounded border border-knar-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-knar-charcoal">
                      <tr>
                        <th className="px-3 py-2 text-left text-knar-text-muted font-light">#</th>
                        <th className="px-3 py-2 text-left text-knar-text-muted font-light">Nombre</th>
                        <th className="px-3 py-2 text-left text-knar-text-muted font-light">PFD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.capasIPL.map((capa: any, i: number) => (
                        <tr key={i} className="border-t border-knar-border">
                          <td className="px-3 py-2 text-knar-text-secondary">{i + 1}</td>
                          <td className="px-3 py-2 text-knar-text-primary">{capa.nombre}</td>
                          <td className="px-3 py-2 text-knar-text-muted font-mono">{capa.pfd?.toString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <div className="text-knar-text-secondary">
                    PFD Total: <strong className="text-knar-text-primary">{datos.pfdTotal?.toString()}</strong>
                  </div>
                  <div className="text-knar-text-secondary">
                    Riesgo: <strong className="text-knar-text-primary">{datos.riesgoEscenario?.toString()}</strong>
                  </div>
                  <div className="text-knar-text-secondary">
                    ¿Cumple? {datos.cumpleCriterio ? <span className="text-green-400 font-medium">✓ SÍ</span> : <span className="text-red-400 font-medium">✗ NO</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'OCA':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-x-6 gap-y-2">
              <DetailRow label="Compuesto" value={datos.compuesto} />
              <DetailRow label="Cantidad" value={datos.cantidad ? `${datos.cantidad} kg` : undefined} />
              <DetailRow label="Viento" value={datos.viento ? `${datos.viento} m/s` : undefined} />
              <DetailRow label="Estabilidad" value={datos.estabilidad} />
              <DetailRow label="Topografía" value={datos.topografia} />
              <DetailRow label="Escenario" value={datos.tipoEscenario} />
            </div>
            
            <div className="mt-4 p-3 bg-knar-dark rounded border border-knar-border">
              <div className="text-knar-text-muted mb-3 text-xs font-medium">Resultados de Consecuencia:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-knar-text-muted text-xs mb-1">Tasa Liberación</div>
                  <div className="text-knar-text-primary text-sm">{datos.tasaLiberacion ? `${datos.tasaLiberacion} kg/s` : '—'}</div>
                </div>
                <div>
                  <div className="text-knar-text-muted text-xs mb-1">Distancia Endpoint</div>
                  <div className="text-knar-text-primary text-sm">{datos.distanciaEndpointMillas ? `${datos.distanciaEndpointMillas} millas` : '—'}</div>
                </div>
                <div>
                  <div className="text-knar-text-muted text-xs mb-1">Área Afectada</div>
                  <div className="text-knar-text-primary text-sm">{datos.areaAfectadaMillas2 ? `${datos.areaAfectadaMillas2} millas²` : '—'}</div>
                </div>
                <div>
                  <div className="text-knar-text-muted text-xs mb-1">Evaluación</div>
                  <div className={`text-sm font-medium ${
                    datos.evaluacion?.includes('ALTA') ? 'text-red-400' : 
                    datos.evaluacion?.includes('MODERADA') ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {datos.evaluacion}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Intuicion':
        return (
          <div className="space-y-3">
            <DetailRow label="Descripción" value={datos.descripcion} fullWidth />
          </div>
        );

      default:
        return <div className="text-knar-text-muted text-xs">Sin detalles disponibles</div>;
    }
  }

  // Helper component for detail rows
  function DetailRow({ label, value, fullWidth = false }: { label: string; value?: string | number; fullWidth?: boolean }) {
    if (!value) return null;
    return (
      <div className={fullWidth ? 'col-span-2' : ''}>
        <div className="flex gap-2">
          <span className="text-knar-text-muted w-32 flex-shrink-0 text-xs">{label}:</span>
          <span className="text-knar-text-primary text-xs flex-1 break-words">{value}</span>
        </div>
      </div>
    );
  }

  // Helper component for RPN bars
  function RPNBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const percentage = (value / max) * 100;
    return (
      <div>
        <div className="text-knar-text-muted text-xs mb-1.5">{label}</div>
        <div className="h-3 bg-knar-charcoal rounded overflow-hidden">
          <div 
            className="h-full" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <div className="text-knar-text-primary text-sm mt-1 text-center font-medium">{value}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-knar-text-primary">
            Total: {analisisFiltrados.length} elementos de análisis
          </h3>
          <p className="text-xs text-knar-text-muted">
            De {sesion.analisis.length} totales en sesión
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {(['HAZOP', 'FMEA', 'LOPA', 'OCA', 'Intuicion'] as TipoAnalisis[]).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltros({ ...filtros, tipo: filtros.tipo === tipo ? 'todos' : tipo })}
              className={`px-2 py-1 rounded text-xs font-light transition-colors flex items-center space-x-1 ${
                filtros.tipo === tipo
                  ? 'bg-knar-orange text-knar-text-primary'
                  : 'bg-knar-charcoal text-knar-text-secondary hover:text-knar-text-primary'
              }`}
            >
              <span>{getIconoPorTipo(tipo)}</span>
              <span>{tipo === 'Intuicion' ? 'Registro directo' : tipo}</span>
              <span className="text-knar-text-muted">({conteoPorTipo[tipo] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros adicionales */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
            placeholder="Buscar análisis..."
            className="w-full px-3 py-2 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
          />
          <svg
            className="absolute right-3 top-2.5 w-4 h-4 text-knar-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

      </div>

      {/* Tabla */}
      {analisisFiltrados.length === 0 ? (
        <div className="bg-knar-charcoal rounded-lg border border-knar-border p-8 text-center">
          <p className="text-xs text-knar-text-secondary">
            {sesion.analisis.length === 0
              ? 'No hay análisis en la sesión. Cree un análisis desde Censo para comenzar.'
              : 'No hay análisis que coincidan con los filtros.'}
          </p>
        </div>
      ) : (
        <div className="bg-knar-charcoal rounded-lg border border-knar-border overflow-hidden">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '30px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '400px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '100px' }} />
            </colgroup>
            <thead className="bg-knar-dark border-b border-knar-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary"></th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Elemento de Análisis</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Datos Principales</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Entidades</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-knar-border">
              {analisisFiltrados.map((analisis) => {
                const isExpanded = expandedRowId === analisis.base.id;
                const hallazgosVinculados = getHallazgosVinculados(analisis.base.id);

                return (
                  <Fragment key={analisis.base.id}>
                    {/* Main Row */}
                    <tr 
                      className={`hover:bg-knar-dark hover:bg-opacity-50 transition-colors ${isExpanded ? 'bg-knar-dark bg-opacity-50' : ''}`}
                      onClick={() => toggleExpand(analisis.base.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="px-4 py-3">
                        <svg 
                          width="12" 
                          height="12" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getColorPorTipo(analisis.base.tipo)}`} />
                          <span className="text-xs text-knar-text-primary font-medium">{analisis.base.tipo === 'Intuicion' ? 'Registro directo' : analisis.base.tipo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {analisis.base.nombre && (
                            <span className="text-xs font-medium text-knar-text-primary truncate">
                              {analisis.base.nombre}
                            </span>
                          )}
                          <span className={`truncate ${analisis.base.nombre ? 'text-[11px] text-knar-text-muted' : 'text-xs text-knar-text-secondary'}`} style={{ display: 'block' }}>
                            {getDatosPrincipales(analisis)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-knar-text-primary font-medium">
                          {contarHallazgosVinculados(analisis.base.id)} entidades
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-knar-text-muted font-mono">
                          {new Date(analisis.base.fechaCreacion).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-0 py-0">
                          <div 
                            className="bg-knar-charcoal border-b border-knar-border px-4 py-3"
                            style={{ 
                              maxHeight: '500px', 
                              overflowY: 'auto',
                              animation: 'slideDown 0.2s ease-out'
                            }}
                          >
                            {/* Centered content with max-width for better readability */}
                            <div className="max-w-5xl mx-auto space-y-4">
                              {/* Analysis Details */}
                              <div>
                                <h4 className="text-xs font-medium text-knar-text-primary mb-3 flex items-center gap-2 pb-2 border-b border-knar-border">
                                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Datos del Análisis
                                </h4>
                                <AnalysisDetailsContent analisis={analisis} />
                              </div>

                              {/* Linked Hallazgos */}
                              <div>
                                <h4 className="text-xs font-medium text-knar-text-primary mb-3 flex items-center gap-2 pb-2 border-b border-knar-border">
                                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Entidades Vinculadas ({hallazgosVinculados.length})
                                </h4>
                                {hallazgosVinculados.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {hallazgosVinculados.map((h) => (
                                      <div
                                        key={h.id}
                                        className="flex items-center gap-2 p-2 bg-knar-dark rounded border border-knar-border"
                                      >
                                        <div 
                                          className="w-2 h-2 rounded-full flex-shrink-0" 
                                          style={{ 
                                            backgroundColor: h.tipo === 'Peligro' ? '#ef4444' : h.tipo === 'Barrera' ? '#3b82f6' : h.tipo === 'POE' ? '#10b981' : '#8b5cf6' 
                                          }} 
                                        />
                                        <span className="text-xs text-knar-text-secondary flex-1 truncate" title={h.titulo}>{h.titulo}</span>
                                        <span className="text-xs text-knar-text-muted flex-shrink-0">{h.tipo}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-knar-text-muted italic">Sin entidades vinculadas</p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t border-knar-border flex items-center gap-3">

                              <button
                                className="px-3 py-1.5 bg-red-500 bg-opacity-20 text-red-400 rounded text-xs font-light hover:bg-opacity-30 transition-colors flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!confirm('¿Está seguro de eliminar este elemento de análisis?')) return;
                                  eliminarAnalisis(analisis.base.id);
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
