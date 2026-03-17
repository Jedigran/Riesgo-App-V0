/**
 * ============================================================================
 * GRUPO FORM - Form for Creating/Editing Protection Groups
 * ============================================================================
 * 
 * Form component for creating and editing protection groups with:
 * - Group name and description
 * - Color picker (preset colors)
 * - Hazard selection (multi-select)
 * - Protector selection (multi-select)
 * - Validation feedback
 * 
 * @module components/grupos/GrupoForm
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { GrupoProteccion, ColorHex } from '@/src/models/grupos/types';
import type { Hallazgo, Peligro, Barrera, POE, SOL } from '@/src/models/hallazgo/types';

// ============================================================================
// TYPES
// ============================================================================

export interface GrupoFormProps {
  /** All hallazgos for selection */
  hallazgos: Hallazgo[];
  
  /** Existing group (for edit mode). If undefined, creates new group */
  grupoExistente?: GrupoProteccion;
  
  /** Called when form is submitted successfully */
  onSubmit: (datos: {
    nombre: string;
    descripcion?: string;
    color: string;
    peligrosIds: string[];
    protectoresIds: string[];
  }) => void;
  
  /** Called when user cancels/closes the form */
  onCancel: () => void;
  
  /** Whether the form is in loading state */
  isLoading?: boolean;
}

// ============================================================================
// PRESET COLORS
// ============================================================================

const COLORES_PRESET: { value: string; label: string }[] = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Ámbar' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Cian' },
  { value: '#84CC16', label: 'Lima' },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Form component for creating/editing protection groups.
 * 
 * @example
 * <GrupoForm
 *   hallazgos={todosLosHallazgos}
 *   onSubmit={(datos) => crearGrupo(datos)}
 *   onCancel={() => setShowForm(false)}
 * />
 */
export default function GrupoForm({
  hallazgos,
  grupoExistente,
  onSubmit,
  onCancel,
  isLoading = false,
}: GrupoFormProps) {
  // Extract existing peligros and protectores
  const peligrosExistentes = hallazgos.filter((h): h is Peligro => h.tipo === 'Peligro');
  const protectoresExistentes = hallazgos.filter(
    (h): h is Barrera | POE | SOL => ['Barrera', 'POE', 'SOL'].includes(h.tipo)
  );
  
  // Form state
  const [nombre, setNombre] = useState(grupoExistente?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(grupoExistente?.descripcion ?? '');
  const [color, setColor] = useState<string>(grupoExistente?.color ?? COLORES_PRESET[0].value);
  const [peligrosSeleccionados, setPeligrosSeleccionados] = useState<string[]>(
    grupoExistente?.peligrosIds ?? []
  );
  const [protectoresSeleccionados, setProtectoresSeleccionados] = useState<string[]>(
    grupoExistente?.protectoresIds ?? []
  );
  
  // Validation errors
  const [errores, setErrores] = useState<string[]>([]);
  
  // Filter state
  const [filtroPeligros, setFiltroPeligros] = useState('');
  const [filtroProtectores, setFiltroProtectores] = useState('');
  
  // Filtered lists
  const peligrosFiltrados = useMemo(() => {
    if (!filtroPeligros.trim()) return peligrosExistentes;
    const busqueda = filtroPeligros.toLowerCase();
    return peligrosExistentes.filter(
      p => p.titulo.toLowerCase().includes(busqueda) ||
           p.descripcion.toLowerCase().includes(busqueda)
    );
  }, [peligrosExistentes, filtroPeligros]);
  
  const protectoresFiltrados = useMemo(() => {
    if (!filtroProtectores.trim()) return protectoresExistentes;
    const busqueda = filtroProtectores.toLowerCase();
    return protectoresExistentes.filter(
      p => p.titulo.toLowerCase().includes(busqueda) ||
           p.descripcion.toLowerCase().includes(busqueda)
    );
  }, [protectoresExistentes, filtroProtectores]);
  
  // Toggle selection helpers
  const togglePeligro = useCallback((id: string) => {
    setPeligrosSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  }, []);
  
  const toggleProtector = useCallback((id: string) => {
    setProtectoresSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  }, []);
  
  // Validate form
  const validarFormulario = (): string[] => {
    const errores: string[] = [];
    
    if (!nombre.trim()) {
      errores.push('El nombre de la relación es requerido');
    }
    
    if (peligrosSeleccionados.length === 0) {
      errores.push('Debe seleccionar al menos 1 peligro');
    }
    
    if (protectoresSeleccionados.length === 0) {
      errores.push('Debe seleccionar al menos 1 protector (Barrera/POE/SOL)');
    }
    
    // Check for overlap
    const overlap = peligrosSeleccionados.filter(id =>
      protectoresSeleccionados.includes(id)
    );
    if (overlap.length > 0) {
      errores.push('Una entidad no puede ser peligro y protector simultáneamente');
    }
    
    return errores;
  };
  
  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      const errores = validarFormulario();
      if (errores.length > 0) {
        setErrores(errores);
        return;
      }
      
      setErrores([]);
      onSubmit({
        nombre,
        descripcion: descripcion.trim() || undefined,
        color,
        peligrosIds: peligrosSeleccionados,
        protectoresIds: protectoresSeleccionados,
      });
    },
    [nombre, descripcion, color, peligrosSeleccionados, protectoresSeleccionados, onSubmit]
  );
  
  // Check if item is selected
  const isPeligroSelected = (id: string) => peligrosSeleccionados.includes(id);
  const isProtectorSelected = (id: string) => protectoresSeleccionados.includes(id);
  
  return (
    <form onSubmit={handleSubmit} className="knar-card flex flex-col">
      {/* Header */}
      <div className="knar-card-header flex-shrink-0">
        <div className="knar-icon-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="knar-card-title">
          {grupoExistente ? 'Editar Relación de Protección' : 'Nueva Relación de Protección'}
        </h3>
      </div>
      
      {/* Scrollable content */}
      <div className="knar-card-content flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {/* Error messages */}
        {errores.length > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '0.5px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              padding: '8px 12px',
              marginBottom: '16px',
            }}
          >
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {errores.map((error, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '11px',
                    fontWeight: 300,
                    color: '#fca5a5',
                    marginBottom: '4px',
                  }}
                >
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Name field */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            Nombre de la Relación *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Sistema de Alivio de Presión"
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--knar-dark)',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 300,
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 150ms ease',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-8)'}
          />
        </div>
        
        {/* Description field */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            Descripción (opcional)
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describa el propósito de esta relación de protección..."
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--knar-dark)',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 300,
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 150ms ease',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-8)'}
          />
        </div>
        
        {/* Color selection */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            Color de la Relación *
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '6px',
            }}
          >
            {COLORES_PRESET.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '4px',
                  background: c.value,
                  border: color === c.value ? '2px solid white' : '0.5px solid var(--border-8)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  position: 'relative',
                }}
                title={c.label}
                onMouseEnter={(e) => {
                  if (color !== c.value) {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.borderColor = c.value;
                  }
                }}
                onMouseLeave={(e) => {
                  if (color !== c.value) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'var(--border-8)';
                  }
                }}
              >
                {color === c.value && (
                  <svg
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '16px',
                      height: '16px',
                      color: 'white',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Peligros selection */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: 'var(--text-secondary)',
              }}
            >
              Peligros ({peligrosSeleccionados.length}) *
            </label>
          </div>
          
          {/* Search */}
          <input
            type="text"
            value={filtroPeligros}
            onChange={(e) => setFiltroPeligros(e.target.value)}
            placeholder="Buscar peligros..."
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'var(--knar-dark)',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 300,
              color: 'var(--text-primary)',
              outline: 'none',
              marginBottom: '8px',
            }}
          />
          
          {/* Selection list */}
          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              padding: '4px',
            }}
          >
            {peligrosFiltrados.length === 0 ? (
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 300,
                  color: 'var(--text-disabled)',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                No hay peligros disponibles
              </p>
            ) : (
              peligrosFiltrados.map((p) => (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: isPeligroSelected(p.id) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    border: isPeligroSelected(p.id) ? '0.5px solid rgba(239, 68, 68, 0.3)' : '0.5px solid transparent',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPeligroSelected(p.id)) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPeligroSelected(p.id)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isPeligroSelected(p.id)}
                    onChange={() => togglePeligro(p.id)}
                    style={{
                      width: '14px',
                      height: '14px',
                      accentColor: '#ef4444',
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      flex: 1,
                    }}
                  >
                    {p.titulo}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
        
        {/* Protectores selection */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: 'var(--text-secondary)',
              }}
            >
              Protectores ({protectoresSeleccionados.length}) *
            </label>
          </div>
          
          {/* Search */}
          <input
            type="text"
            value={filtroProtectores}
            onChange={(e) => setFiltroProtectores(e.target.value)}
            placeholder="Buscar protectores (Barreras/POEs/SOLs)..."
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'var(--knar-dark)',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 300,
              color: 'var(--text-primary)',
              outline: 'none',
              marginBottom: '8px',
            }}
          />
          
          {/* Selection list */}
          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              padding: '4px',
            }}
          >
            {protectoresFiltrados.length === 0 ? (
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 300,
                  color: 'var(--text-disabled)',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                No hay protectores disponibles
              </p>
            ) : (
              protectoresFiltrados.map((p) => {
                const tipoColor =
                  p.tipo === 'Barrera' ? '#3b82f6' :
                  p.tipo === 'POE' ? '#10b981' :
                  '#8b5cf6';
                
                return (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: isProtectorSelected(p.id) ? `${tipoColor}15` : 'transparent',
                      border: isProtectorSelected(p.id) ? `0.5px solid ${tipoColor}40` : '0.5px solid transparent',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isProtectorSelected(p.id)) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isProtectorSelected(p.id)) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isProtectorSelected(p.id)}
                      onChange={() => toggleProtector(p.id)}
                      style={{
                        width: '14px',
                        height: '14px',
                        accentColor: tipoColor,
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 300,
                        color: 'var(--text-primary)',
                        flex: 1,
                      }}
                    >
                      {p.titulo}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 400,
                        color: tipoColor,
                        padding: '1px 6px',
                        background: `${tipoColor}20`,
                        borderRadius: '3px',
                      }}
                    >
                      {p.tipo}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Footer actions */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: '0.5px solid var(--border-8)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '0.5px solid var(--border-8)',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 300,
            color: 'var(--text-secondary)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = 'var(--text-muted)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-8)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 400,
            color: 'var(--knar-dark)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
          }}
        >
          {isLoading && (
            <svg
              style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {grupoExistente ? 'Guardar Cambios' : 'Crear Grupo'}
        </button>
      </div>
    </form>
  );
}
