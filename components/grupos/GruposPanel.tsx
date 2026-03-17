/**
 * ============================================================================
 * GRUPOS PANEL - Panel de Grupos de Protección
 * ============================================================================
 *
 * Permite crear y gestionar grupos de protección:
 * - Agrupar múltiples peligros con múltiples protectores
 * - Visualización por colores
 * - Edición y eliminación de grupos
 *
 * @module components/grupos/GruposPanel
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGrupo } from '@/src/controllers/useGrupo';
import { useHallazgo } from '@/src/controllers/useHallazgo';
import { useSesion } from '@/src/controllers/useSesion';
import { useUIEstado } from '@/src/controllers/useUIEstado';
import { GrupoForm, GrupoList, GrupoTabla } from './index';
import type { GrupoProteccion } from '@/src/models/grupos/types';

type VistaGrupos = 'lista' | 'tabla';

export default function GruposPanel() {
  const { sesion, sesionCargada } = useSesion();
  const { hallazgos } = useHallazgo();
  const {
    grupos,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo,
    hallazgosSinGrupo,
  } = useGrupo();
  const { agregarError, agregarNotificacion } = useUIEstado();

  // Estado para formulario
  const [grupoEditando, setGrupoEditando] = useState<GrupoProteccion | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vistaActual, setVistaActual] = useState<VistaGrupos>('lista');
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState<string | null>(null);

  // Obtener hallazgos de la sesión
  const hallazgosLista = useMemo(() => {
    return sesion?.hallazgos || [];
  }, [sesion]);

  // Handle crear grupo
  const handleCrearGrupo = useCallback(
    (datos: {
      nombre: string;
      descripcion?: string;
      color: string;
      peligrosIds: string[];
      protectoresIds: string[];
    }) => {
      const resultado = crearGrupo(datos);

      if (resultado.exito) {
        agregarNotificacion({
          tipo: 'success',
          titulo: 'Relación Creada',
          mensaje: 'La relación se creó correctamente',
          duracion: 3000,
        });
        setMostrarFormulario(false);
      } else {
        agregarError({
          severidad: 'error',
          mensaje: resultado.errores.join(', '),
        });
      }
    },
    [crearGrupo, agregarNotificacion, agregarError]
  );

  // Handle actualizar grupo
  const handleActualizarGrupo = useCallback(
    (datos: {
      nombre: string;
      descripcion?: string;
      color: string;
      peligrosIds: string[];
      protectoresIds: string[];
    }) => {
      if (!grupoEditando) return;

      const resultado = actualizarGrupo(grupoEditando.id, datos);

      if (resultado.exito) {
        agregarNotificacion({
          tipo: 'success',
          titulo: 'Relación Actualizada',
          mensaje: 'La relación se actualizó correctamente',
          duracion: 3000,
        });
        setGrupoEditando(null);
        setMostrarFormulario(false);
      } else {
        agregarError({
          severidad: 'error',
          mensaje: resultado.errores.join(', '),
        });
      }
    },
    [grupoEditando, actualizarGrupo, agregarNotificacion, agregarError]
  );

  // Handle eliminar grupo
  const handleEliminarGrupo = useCallback(
    (grupoId: string) => {
      if (!confirm('¿Está seguro de eliminar esta relación?')) return;

      const resultado = eliminarGrupo(grupoId);

      if (resultado.exito) {
        agregarNotificacion({
          tipo: 'success',
          titulo: 'Relación Eliminada',
          mensaje: 'La relación se eliminó correctamente',
          duracion: 3000,
        });
        if (grupoSeleccionadoId === grupoId) {
          setGrupoSeleccionadoId(null);
        }
      } else {
        agregarError({
          severidad: 'error',
          mensaje: resultado.errores.join(', '),
        });
      }
    },
    [eliminarGrupo, grupoSeleccionadoId, agregarNotificacion, agregarError]
  );

  // Handle editar grupo
  const handleEditarGrupo = useCallback((grupo: GrupoProteccion) => {
    setGrupoEditando(grupo);
    setMostrarFormulario(true);
  }, []);

  // Handle cancelar formulario
  const handleCancelarFormulario = useCallback(() => {
    setGrupoEditando(null);
    setMostrarFormulario(false);
  }, []);

  // Handle seleccionar grupo
  const handleSeleccionarGrupo = useCallback((grupoId: string) => {
    setGrupoSeleccionadoId(grupoId === grupoSeleccionadoId ? null : grupoId);
  }, [grupoSeleccionadoId]);

  // Statistics
  const totalPeligrosEnGrupos = useMemo(() => {
    return grupos.reduce((acc, g) => acc + g.peligrosIds.length, 0);
  }, [grupos]);

  const totalProtectoresEnGrupos = useMemo(() => {
    return grupos.reduce((acc, g) => acc + g.protectoresIds.length, 0);
  }, [grupos]);

  if (!sesionCargada) {
    return (
      <div className="knar-card">
        <div className="knar-card-content">
          <p style={{ fontSize: '11px', fontWeight: 300, color: 'var(--text-muted)' }}>
            Cargando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="knar-card flex flex-col">
      {/* Header */}
      <div className="knar-card-header flex-shrink-0">
        <div className="knar-icon-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="knar-card-title">Relaciones</h3>

        {/* Stats */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-muted)' }}>
            {grupos.length} relación{grupos.length !== 1 ? 'es' : ''}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-disabled)' }}>
            •
          </span>
          <span style={{ fontSize: '10px', fontWeight: 300, color: '#ef4444' }}>
            {totalPeligrosEnGrupos} peligros
          </span>
          <span style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-disabled)' }}>
            •
          </span>
          <span style={{ fontSize: '10px', fontWeight: 300, color: '#10b981' }}>
            {totalProtectoresEnGrupos} controles
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Toggle view */}
          <button
            onClick={() => setVistaActual(vistaActual === 'lista' ? 'tabla' : 'lista')}
            className="knar-btn knar-btn-ghost"
            title={vistaActual === 'lista' ? 'Vista de tabla' : 'Vista de lista'}
          >
            {vistaActual === 'lista' ? (
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Create button */}
          <button
            onClick={() => {
              setGrupoEditando(null);
              setMostrarFormulario(true);
            }}
            className="knar-btn knar-btn-primary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            <svg style={{ width: '14px', height: '14px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Relación
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="knar-card-content flex-1 overflow-y-auto" style={{ padding: 0 }}>
        {/* Formulario modal */}
        {mostrarFormulario && (
          <div
            style={{
              padding: '16px',
              borderBottom: '0.5px solid var(--border-8)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <GrupoForm
              hallazgos={hallazgosLista}
              grupoExistente={grupoEditando || undefined}
              onSubmit={grupoEditando ? handleActualizarGrupo : handleCrearGrupo}
              onCancel={handleCancelarFormulario}
            />
          </div>
        )}

        {/* Main content */}
        <div style={{ padding: '16px' }}>
          {/* Warning for hallazgos sin grupo */}
          {hallazgosSinGrupo().length > 0 && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 12px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '0.5px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg
                  style={{ width: '14px', height: '14px', color: '#fbbf24' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span style={{ fontSize: '10px', fontWeight: 300, color: '#fbbf24' }}>
                  {hallazgosSinGrupo().length} entidad{hallazgosSinGrupo().length !== 1 ? 'es' : ''} sin relación. 
                  Considera crear relaciones para organizar mejor tus entidades.
                </span>
              </div>
            </div>
          )}

          {/* Vista de lista */}
          {vistaActual === 'lista' && (
            <GrupoList
              grupos={grupos}
              hallazgos={hallazgosLista}
              onEdit={handleEditarGrupo}
              onDelete={handleEliminarGrupo}
              onMemberClick={(id) => console.log('Member clicked:', id)}
              selectedGroupId={grupoSeleccionadoId}
            />
          )}

          {/* Vista de tabla */}
          {vistaActual === 'tabla' && (
            <GrupoTabla
              grupos={grupos}
              hallazgos={hallazgosLista}
              onGroupClick={handleSeleccionarGrupo}
              onHallazgoClick={(id) => console.log('Hallazgo clicked:', id)}
            />
          )}

          {/* Empty state */}
          {grupos.length === 0 && !mostrarFormulario && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <svg
                style={{
                  width: '56px',
                  height: '56px',
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
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}
              >
                No hay relaciones
              </p>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 300,
                  color: 'var(--text-disabled)',
                  maxWidth: '400px',
                }}
              >
                Las relaciones te permiten organizar tus entidades en sistemas de protección coherentes.
                Cada relación puede contener múltiples peligros y sus respectivos controles.
              </p>
              <button
                onClick={() => {
                  setGrupoEditando(null);
                  setMostrarFormulario(true);
                }}
                className="knar-btn knar-btn-primary"
                style={{ marginTop: '16px' }}
              >
                <svg style={{ width: '14px', height: '14px', marginRight: '6px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Primera Relación
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
