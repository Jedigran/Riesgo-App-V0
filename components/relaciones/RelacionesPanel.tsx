/**
 * ============================================================================
 * RELACIONES PANEL - Panel de Relaciones entre Hallazgos
 * ============================================================================
 * 
 * Permite crear y gestionar relaciones entre hallazgos:
 * - Barrera mitiga Peligro
 * - POE controla Peligro
 * - Barrera protege SOL
 * - Peligro requiere Barrera
 * 
 * @module components/relaciones/RelacionesPanel
 */

'use client';

import { useState, useMemo } from 'react';
import { useSesion } from '@/src/controllers/useSesion';
import { useRelacionesHallazgo } from '@/src/controllers/useRelacionesHallazgo';
import type { Hallazgo, TipoHallazgo } from '@/src/models/hallazgo/types';
import type { TipoRelacionHallazgo } from '@/src/models/relaciones/types';

interface OpcionDropdown {
  value: string;
  label: string;
  tipo: Hallazgo['tipo'];
}

export default function RelacionesPanel() {
  const { sesion, sesionCargada } = useSesion();
  const { 
    relaciones, 
    crearRelacionHallazgo, 
    eliminarRelacionHallazgo,
    hallazgosHuerfanos 
  } = useRelacionesHallazgo();

  // Estado para formulario
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [tipoRelacion, setTipoRelacion] = useState<TipoRelacionHallazgo>('mitiga');
  const [descripcion, setDescripcion] = useState('');

  // Obtener hallazgos de la sesión
  const hallazgos = useMemo(() => {
    return sesion?.hallazgos || [];
  }, [sesion]);

  // Filtrar hallazgos por tipo para los dropdowns
  const hallazgosPorTipo = useMemo(() => {
    return {
      Peligro: hallazgos.filter(h => h.tipo === 'Peligro'),
      Barrera: hallazgos.filter(h => h.tipo === 'Barrera'),
      POE: hallazgos.filter(h => h.tipo === 'POE'),
      SOL: hallazgos.filter(h => h.tipo === 'SOL'),
    };
  }, [hallazgos]);

  // Opciones para dropdown de origen según tipo de relación
  const opcionesOrigen = useMemo((): OpcionDropdown[] => {
    switch (tipoRelacion) {
      case 'mitiga':
        return hallazgosPorTipo.Barrera.map(h => ({ value: h.id, label: h.titulo, tipo: 'Barrera' }));
      case 'controla':
        return hallazgosPorTipo.POE.map(h => ({ value: h.id, label: h.titulo, tipo: 'POE' }));
      case 'protege':
        return hallazgosPorTipo.Barrera.map(h => ({ value: h.id, label: h.titulo, tipo: 'Barrera' }));
      case 'requiere':
        return hallazgosPorTipo.Peligro.map(h => ({ value: h.id, label: h.titulo, tipo: 'Peligro' }));
      default:
        return [];
    }
  }, [tipoRelacion, hallazgosPorTipo]);

  // Opciones para dropdown de destino según tipo de relación
  const opcionesDestino = useMemo((): OpcionDropdown[] => {
    switch (tipoRelacion) {
      case 'mitiga':
        return hallazgosPorTipo.Peligro.map(h => ({ value: h.id, label: h.titulo, tipo: 'Peligro' }));
      case 'controla':
        return hallazgosPorTipo.Peligro.map(h => ({ value: h.id, label: h.titulo, tipo: 'Peligro' }));
      case 'protege':
        return [...hallazgosPorTipo.Barrera, ...hallazgosPorTipo.SOL].map(h => ({ value: h.id, label: h.titulo, tipo: h.tipo }));
      case 'requiere':
        return hallazgosPorTipo.Barrera.map(h => ({ value: h.id, label: h.titulo, tipo: 'Barrera' }));
      default:
        return [];
    }
  }, [tipoRelacion, hallazgosPorTipo]);

  // Obtener etiqueta corta por tipo
  const getIconoTipo = (tipo: Hallazgo['tipo']): string => {
    switch (tipo) {
      case 'Peligro': return '[P]';
      case 'Barrera': return '[B]';
      case 'POE':     return '[E]';
      case 'SOL':     return '[S]';
      default:        return '[?]';
    }
  };

  // Obtener hallazgo por ID
  const getHallazgoPorId = (id: string) => {
    return hallazgos.find(h => h.id === id);
  };

  // Manejar creación de relación
  const handleCrear = () => {
    if (!origenId || !destinoId) {
      return;
    }

    const resultado = crearRelacionHallazgo(tipoRelacion, origenId, destinoId, descripcion);
    
    if (resultado.exito) {
      // Resetear formulario
      setOrigenId('');
      setDestinoId('');
      setDescripcion('');
    }
  };

  if (!sesionCargada || !sesion) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)' }}>Cargando relaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulario de Creación */}
      <div className="knar-card">
        <div className="knar-card-header">
          <div className="knar-icon-box">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="knar-card-title">Crear Relación</h3>
        </div>
        <div className="knar-card-content space-y-3">
          {/* Tipo de Relación */}
          <div>
            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Tipo de Relación *
            </label>
            <select
              value={tipoRelacion}
              onChange={(e) => {
                setTipoRelacion(e.target.value as TipoRelacionHallazgo);
                setOrigenId('');
                setDestinoId('');
              }}
              className="knar-select"
            >
              <option value="mitiga">mitiga — Barrera mitigates Peligro</option>
              <option value="controla">controla — POE controla Peligro</option>
              <option value="protege">protege — Barrera protege Barrera/SOL</option>
              <option value="requiere">requiere — Peligro requiere Barrera</option>
            </select>
          </div>

          {/* Hallazgo Origen */}
          <div>
            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Entidad Origen ({getIconoTipo(opcionesOrigen[0]?.tipo || 'Peligro')}) *
            </label>
            <select
              value={origenId}
              onChange={(e) => setOrigenId(e.target.value)}
              className="knar-select"
              style={{ opacity: opcionesOrigen.length === 0 ? 0.5 : 1 }}
              disabled={opcionesOrigen.length === 0}
            >
              <option value="">Seleccionar...</option>
              {opcionesOrigen.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {getIconoTipo(opcion.tipo)} {opcion.label}
                </option>
              ))}
            </select>
            {opcionesOrigen.length === 0 && (
              <p className="mt-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                No hay {opcionesOrigen[0]?.tipo || 'entidades'} disponibles
              </p>
            )}
          </div>

          {/* Flecha */}
          <div className="flex items-center justify-center">
            <svg style={{ width: 14, height: 14, color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Hallazgo Destino */}
          <div>
            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Entidad Destino ({getIconoTipo(opcionesDestino[0]?.tipo || 'Peligro')}) *
            </label>
            <select
              value={destinoId}
              onChange={(e) => setDestinoId(e.target.value)}
              className="knar-select"
              style={{ opacity: opcionesDestino.length === 0 ? 0.5 : 1 }}
              disabled={opcionesDestino.length === 0}
            >
              <option value="">Seleccionar...</option>
              {opcionesDestino.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {getIconoTipo(opcion.tipo)} {opcion.label}
                </option>
              ))}
            </select>
            {opcionesDestino.length === 0 && (
              <p className="mt-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                No hay {opcionesDestino[0]?.tipo || 'entidades'} disponibles
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="knar-input"
              placeholder="Descripción de la relación"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCrear}
              disabled={!origenId || !destinoId}
              className="knar-btn knar-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Relación
            </button>
            <button
              onClick={() => {
                setOrigenId('');
                setDestinoId('');
                setDescripcion('');
              }}
              className="knar-btn knar-btn-ghost"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Relaciones Existentes */}
      <div className="knar-card">
        <div className="knar-card-header">
          <div className="knar-icon-box">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="knar-card-title">
            Relaciones Existentes ({relaciones.length})
          </h3>
        </div>
        <div className="knar-card-content">
          {relaciones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-knar-text-secondary">
                No hay relaciones creadas
              </p>
              <p className="text-xs text-knar-text-muted mt-1">
                Crea una relación usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {relaciones.map((relacion) => {
                const origen = getHallazgoPorId(relacion.origenId);
                const destino = getHallazgoPorId(relacion.destinoId);
                
                if (!origen || !destino) return null;

                return (
                  <div
                    key={relacion.id}
                    style={{ backgroundColor: 'var(--knar-dark)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2-5) var(--space-3)' }}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 'var(--weight-light)' }} className="truncate">
                        {getIconoTipo(origen.tipo)} {origen.titulo}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--accent)', backgroundColor: 'var(--knar-orange-10)', border: '0.5px solid var(--knar-orange-20)', borderRadius: 'var(--radius-sm)', padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {relacion.tipo}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 'var(--weight-light)' }} className="truncate">
                        {getIconoTipo(destino.tipo)} {destino.titulo}
                      </span>
                    </div>
                    <button
                      onClick={() => eliminarRelacionHallazgo(relacion.id)}
                      className="knar-btn knar-btn-ghost"
                      style={{ padding: '2px 8px', fontSize: 10, flexShrink: 0 }}
                      title="Eliminar relación"
                    >
                      Eliminar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hallazgos Huérfanos */}
      {hallazgosHuerfanos().length > 0 && (
        <div className="knar-card">
          <div className="knar-card-header">
            <div className="knar-icon-box">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v-2m0 0V4m0 2a2 2 0 110 4 2 2 0 010-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v2m0 0v2m0-2a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            </div>
            <h3 className="knar-card-title">
              Entidades sin Relaciones ({hallazgosHuerfanos().length})
            </h3>
          </div>
          <div className="knar-card-content">
            <div className="flex flex-wrap gap-2">
              {hallazgosHuerfanos().map((h) => (
                <span
                  key={h.id}
                  style={{ padding: '2px 8px', backgroundColor: 'var(--knar-charcoal)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-light)' }}
                >
                  {getIconoTipo(h.tipo)} {h.titulo}
                </span>
              ))}
            </div>
            <p className="text-xs text-knar-text-muted mt-2">
              Estas entidades no tienen relaciones. Considera crear relaciones para ellas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
