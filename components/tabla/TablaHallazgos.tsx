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
  const getColorPorTipo = (tipo: Hallazgo['tipo']) => {
    switch (tipo) {
      case 'Peligro': return 'bg-red-500';
      case 'Barrera': return 'bg-blue-500';
      case 'POE': return 'bg-green-500';
      case 'SOL': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Obtener icono por tipo
  const getIconoPorTipo = (tipo: Hallazgo['tipo']) => {
    switch (tipo) {
      case 'Peligro': return '🔴';
      case 'Barrera': return '🛡️';
      case 'POE': return '📋';
      case 'SOL': return '⚙️';
      default: return '📌';
    }
  };

  if (!sesionCargada || !sesion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-knar-text-muted">
          <p className="text-sm">Cargando hallazgos...</p>
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
            Total: {hallazgosFiltrados.length} hallazgos
          </h3>
          <p className="text-xs text-knar-text-muted">
            De {sesion.hallazgos.length} totales en sesión
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {(['Peligro', 'Barrera', 'POE', 'SOL'] as TipoHallazgo[]).map((tipo) => (
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

      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={filtros.busqueda}
          onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
          placeholder="Buscar hallazgos..."
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

      {/* Tabla */}
      {hallazgosFiltrados.length === 0 ? (
        <div className="bg-knar-charcoal rounded-lg border border-knar-border p-8 text-center">
          <p className="text-xs text-knar-text-secondary">
            {sesion.hallazgos.length === 0
              ? 'No hay hallazgos en la sesión. Cree un análisis para comenzar.'
              : 'No hay hallazgos que coincidan con los filtros.'}
          </p>
        </div>
      ) : (
        <div className="bg-knar-charcoal rounded-lg border border-knar-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-knar-dark border-b border-knar-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Título</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-light text-knar-text-secondary">Relaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-knar-border">
              {hallazgosFiltrados.map((hallazgo) => (
                <tr key={hallazgo.id} className="hover:bg-knar-dark hover:bg-opacity-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getColorPorTipo(hallazgo.tipo)}`} />
                      <span className="text-xs text-knar-text-primary">{hallazgo.tipo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-knar-text-primary font-medium">{hallazgo.titulo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-knar-text-secondary line-clamp-2 max-w-xs block">
                      {hallazgo.descripcion}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {hallazgo.ubicacion ? (
                      <span className="text-xs text-knar-text-muted font-mono">
                        ({hallazgo.ubicacion.x}, {hallazgo.ubicacion.y})
                      </span>
                    ) : (
                      <span className="text-xs text-knar-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-knar-text-primary font-medium">
                        {contarRelaciones(hallazgo.id)}
                      </span>
                      {contarRelaciones(hallazgo.id) > 0 ? (
                        <span className="text-xs" title={`${contarRelaciones(hallazgo.id)} relaciones`}>🔗</span>
                      ) : (
                        <span className="text-xs text-knar-text-muted" title="Sin relaciones">—</span>
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
