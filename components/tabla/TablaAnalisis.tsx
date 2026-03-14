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

import { useState, useMemo } from 'react';
import { useSesion } from '@/src/controllers/useSesion';
import type { AnalisisOrigen, TipoAnalisis, EstadoAnalisis } from '@/src/models/analisis/types';

interface FiltrosTabla {
  tipo: TipoAnalisis | 'todos';
  estado: EstadoAnalisis | 'todos';
  busqueda: string;
}

export default function TablaAnalisis() {
  const { sesion, sesionCargada } = useSesion();
  
  const [filtros, setFiltros] = useState<FiltrosTabla>({
    tipo: 'todos',
    estado: 'todos',
    busqueda: '',
  });

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
        const coincideNodo = datos.nodo?.toLowerCase().includes(busqueda);
        const coincideComponente = datos.componente?.toLowerCase().includes(busqueda);
        const coincideEscenario = datos.escenario?.toLowerCase().includes(busqueda);
        const coincideEvento = datos.eventoIniciador?.toLowerCase().includes(busqueda);
        const coincideTitulo = datos.titulo?.toLowerCase().includes(busqueda);
        
        if (!coincideNodo && !coincideComponente && !coincideEscenario && 
            !coincideEvento && !coincideTitulo) {
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

  // Obtener datos específicos por tipo
  const getDatosPrincipales = (analisis: AnalisisOrigen) => {
    const datos = analisis.datos as any;
    
    switch (analisis.base.tipo) {
      case 'HAZOP':
        return `${datos.nodo || '—'} - ${datos.parametro || ''} ${datos.palabraGuia || ''}`;
      case 'FMEA':
        return `${datos.componente || '—'} - ${datos.modoFalla || ''}`;
      case 'LOPA':
        return `${datos.escenario || '—'}`;
      case 'OCA':
        return `${datos.eventoIniciador || '—'}`;
      case 'Intuicion':
        return `${datos.titulo || '—'}`;
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

  if (!sesionCargada || !sesion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-knar-text-muted">
          <p className="text-sm">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-knar-text-primary">
            Total: {analisisFiltrados.length} análisis
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
              <span>{tipo}</span>
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
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as EstadoAnalisis | 'todos' })}
          className="px-3 py-2 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          <option value="en_progreso">En progreso</option>
          <option value="completado">Completado</option>
        </select>
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
          <table className="w-full">
            <thead className="bg-knar-dark border-b border-knar-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Datos Principales</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Hallazgos</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-knar-border">
              {analisisFiltrados.map((analisis) => (
                <tr key={analisis.base.id} className="hover:bg-knar-dark hover:bg-opacity-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getColorPorTipo(analisis.base.tipo)}`} />
                      <span className="text-xs text-knar-text-primary font-medium">{analisis.base.tipo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-light ${
                      analisis.base.estado === 'completado'
                        ? 'bg-green-500 bg-opacity-20 text-green-400'
                        : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                    }`}>
                      {analisis.base.estado === 'completado' ? '✓ Completado' : '⏳ En progreso'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-knar-text-secondary max-w-xs block truncate">
                      {getDatosPrincipales(analisis)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-knar-text-primary font-medium">
                      {contarHallazgosVinculados(analisis.base.id)} hallazgos
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-knar-text-muted font-mono">
                      {new Date(analisis.base.fechaCreacion).toLocaleDateString('es-ES')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-knar-text-muted font-mono">
                      {analisis.base.id.substring(0, 12)}...
                    </span>
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
