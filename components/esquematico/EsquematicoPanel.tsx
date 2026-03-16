'use client';

import { useCallback, useRef, useState } from 'react';
import { useMapa } from '@/src/controllers/useMapa';
import { useFiltrosHallazgos } from '@/src/controllers/useFiltrosHallazgos';
import type { Hallazgo, TipoHallazgo } from '@/src/models/hallazgo/types';

// ============================================================================
// TYPES
// ============================================================================

export interface EsquematicoPanelProps {
  /** ID of the hallazgo currently being located (null = view mode) */
  ubicacionEditando: string | null;
  /** Called when user clicks the map while in location-edit mode */
  onLocationSet: (hallazgoId: string, x: number, y: number) => void;
  /** In-progress hallazgos (from form, not yet in session) */
  hallazgosForm?: Array<{ id: string; tipo: TipoHallazgo; titulo: string; ubicacion?: { x: number; y: number } }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MARKER_COLORS: Record<TipoHallazgo, string> = {
  Peligro: '#ef4444',
  Barrera: '#3b82f6',
  POE:     '#10b981',
  SOL:     '#8b5cf6',
};

const MARKER_LABELS: Record<TipoHallazgo, string> = {
  Peligro: 'P',
  Barrera: 'B',
  POE:     'E',
  SOL:     'S',
};

const TIPOS: TipoHallazgo[] = ['Peligro', 'Barrera', 'POE', 'SOL'];

const ZOOM_STEP = 0.25;

// ============================================================================
// COMPONENT
// ============================================================================

export default function EsquematicoPanel({
  ubicacionEditando,
  onLocationSet,
  hallazgosForm = [],
}: EsquematicoPanelProps) {
  const {
    imagenActual,
    zoom,
    pan,
    actualizarZoom,
    actualizarPan,
    actualizarUbicacionHallazgo,
    hallazgosVisibles,
    resetearVista,
    cambiarImagen,
  } = useMapa();

  const {
    filtrosActivos,
    toggleFiltro,
    activarTodos,
    busquedaTexto,
    actualizarBusqueda,
    hallazgosFiltrados,
    contarPorTipo,
    limpiarFiltros,
  } = useFiltrosHallazgos();

  // Tooltip state
  const [tooltipHallazgo, setTooltipHallazgo] = useState<Hallazgo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan drag state
  const isPanning = useRef(false);
  const panStart = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0, mouseY: 0, panX: 0, panY: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // MAP CLICK — place hallazgo OR show tooltip
  // ============================================================================

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

      if (ubicacionEditando) {
        // Save to session via useMapa
        actualizarUbicacionHallazgo(ubicacionEditando, x, y);
        // Also notify page.tsx to clear local form state and editing flag
        onLocationSet(ubicacionEditando, x, y);
      }
    },
    [ubicacionEditando, actualizarUbicacionHallazgo, onLocationSet]
  );

  // ============================================================================
  // MARKER TOOLTIP
  // ============================================================================

  const handleMarkerClick = useCallback(
    (e: React.MouseEvent, hallazgo: Hallazgo) => {
      e.stopPropagation();
      if (tooltipHallazgo?.id === hallazgo.id) {
        setTooltipHallazgo(null);
        return;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      setTooltipHallazgo(hallazgo);
    },
    [tooltipHallazgo]
  );

  // ============================================================================
  // PAN (mouse drag on background)
  // ============================================================================

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (ubicacionEditando) return; // don't pan while placing
      isPanning.current = false;
      panStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - panStart.current.mouseX;
        const dy = me.clientY - panStart.current.mouseY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isPanning.current = true;
        actualizarPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        // Reset isPanning after a tick so click handler sees the final value
        setTimeout(() => { isPanning.current = false; }, 0);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [ubicacionEditando, pan, actualizarPan]
  );

  // ============================================================================
  // ZOOM — wheel
  // ============================================================================

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      actualizarZoom(zoom + delta);
    },
    [zoom, actualizarZoom]
  );

  // ============================================================================
  // IMAGE UPLOAD
  // ============================================================================

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      cambiarImagen(objectUrl);
    },
    [cambiarImagen]
  );

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const counts = contarPorTipo();
  const filteredSessionHallazgos = hallazgosFiltrados();

  // Merge: session hallazgos (filtered) + form hallazgos with location (always shown)
  const formHallazgosWithLocation = hallazgosForm.filter((h) => h.ubicacion);
  const allMarkers = [
    ...filteredSessionHallazgos,
    ...formHallazgosWithLocation.map((h) => ({
      ...h,
      ubicacion: h.ubicacion!,
      // Provide minimum required fields to satisfy Hallazgo union type display
      id: h.id,
      tipo: h.tipo,
      titulo: h.titulo,
    })),
  ];

  const isEditMode = ubicacionEditando !== null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="knar-card flex flex-col" style={{ minHeight: '520px' }}>
      {/* Header */}
      <div className="knar-card-header flex-shrink-0">
        <div className="knar-icon-box">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="knar-card-title">Esquemático del Sistema</h3>

        {/* Header right actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Image upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded text-xs font-light transition-colors text-knar-text-muted hover:text-knar-text-primary hover:bg-knar-slate"
            title="Cargar imagen del diagrama"
          >
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Imagen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-knar-border rounded px-1">
            <button
              onClick={() => actualizarZoom(zoom - ZOOM_STEP)}
              className="w-5 h-5 flex items-center justify-center text-knar-text-muted hover:text-knar-text-primary transition-colors text-sm"
              title="Reducir zoom"
            >
              −
            </button>
            <span className="text-xs text-knar-text-muted font-mono w-8 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => actualizarZoom(zoom + ZOOM_STEP)}
              className="w-5 h-5 flex items-center justify-center text-knar-text-muted hover:text-knar-text-primary transition-colors text-sm"
              title="Aumentar zoom"
            >
              +
            </button>
          </div>

          {/* Reset view */}
          <button
            onClick={() => { resetearVista(); setTooltipHallazgo(null); }}
            className="px-2 py-1 rounded text-xs font-light transition-colors text-knar-text-muted hover:text-knar-text-primary hover:bg-knar-slate"
            title="Restablecer vista"
          >
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 px-4 py-2 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border-6)' }}>
        {/* Search */}
        <div className="relative flex-1 min-w-32 max-w-48">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-knar-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busquedaTexto}
            onChange={(e) => actualizarBusqueda(e.target.value)}
            placeholder="Buscar hallazgo..."
            className="w-full pl-6 pr-2 py-1 bg-knar-charcoal border rounded text-xs font-light text-knar-text-secondary placeholder-knar-text-muted focus:outline-none focus:border-knar-orange transition-colors"
            style={{ borderColor: 'var(--border-8)' }}
          />
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-1">
          {TIPOS.map((tipo) => {
            const active = filtrosActivos.includes(tipo);
            return (
              <button
                key={tipo}
                onClick={() => toggleFiltro(tipo)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-light transition-all"
                style={{
                  borderColor: active ? MARKER_COLORS[tipo] : 'var(--border-8)',
                  backgroundColor: active ? `${MARKER_COLORS[tipo]}18` : 'transparent',
                  color: active ? MARKER_COLORS[tipo] : 'var(--text-muted)',
                }}
                title={`Filtrar ${tipo}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: active ? MARKER_COLORS[tipo] : 'var(--text-disabled)' }}
                />
                {tipo}
                <span
                  className="ml-0.5 px-1 rounded-full text-xs"
                  style={{
                    backgroundColor: active ? `${MARKER_COLORS[tipo]}25` : 'var(--border-6)',
                    color: active ? MARKER_COLORS[tipo] : 'var(--text-disabled)',
                  }}
                >
                  {counts[tipo]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Show all / clear */}
        <button
          onClick={limpiarFiltros}
          className="px-2 py-0.5 rounded text-xs font-light text-knar-text-muted hover:text-knar-text-primary transition-colors"
        >
          Todos
        </button>

        {/* Marker count */}
        <span className="ml-auto text-xs text-knar-text-muted">
          {filteredSessionHallazgos.filter((h) => h.ubicacion.x > 0 || h.ubicacion.y > 0).length} ubicados
        </span>
      </div>

      {/* Edit mode banner */}
      {isEditMode && (
        <div
          className="flex-shrink-0 px-4 py-1.5 flex items-center gap-2 text-xs font-light"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: '#3b82f6' }}
          />
          <span style={{ color: '#93c5fd' }}>
            Modo colocacion activo — haz clic en el diagrama para ubicar el hallazgo
          </span>
        </div>
      )}

      {/* Map canvas */}
      <div className="knar-card-content flex-1 p-3">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg"
          style={{
            height: '420px',
            backgroundColor: 'var(--knar-charcoal)',
            border: isEditMode
              ? '1px solid rgba(59, 130, 246, 0.4)'
              : '1px solid var(--border-8)',
            cursor: isEditMode ? 'crosshair' : 'grab',
          }}
          onClick={handleMapClick}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          {/* Transformable inner layer */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            {/* Diagram image */}
            <img
              src="/ReferenceIamge/Sistema Bombas de Achique_V2.png"
              alt="Diagrama del sistema"
              draggable={false}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Hallazgo markers */}
            {allMarkers.map((h) => {
              const ub = h.ubicacion;
              if (!ub || (ub.x === 0 && ub.y === 0)) return null;
              const color = MARKER_COLORS[h.tipo];
              const label = MARKER_LABELS[h.tipo];
              const isActive = tooltipHallazgo?.id === h.id;

              return (
                <div
                  key={h.id}
                  className="absolute"
                  style={{
                    left: `${ub.x}%`,
                    top: `${ub.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isActive ? 20 : 10,
                  }}
                  onClick={(e) => handleMarkerClick(e, h as Hallazgo)}
                >
                  {/* Outer pulse ring */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: '20px',
                      height: '20px',
                      top: '-4px',
                      left: '-4px',
                      backgroundColor: `${color}20`,
                      border: `1px solid ${color}50`,
                      transition: 'transform 0.15s',
                    }}
                  />
                  {/* Marker dot */}
                  <div
                    className="relative flex items-center justify-center rounded-full"
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: color,
                      border: '1.5px solid rgba(255,255,255,0.8)',
                      boxShadow: `0 0 6px ${color}60`,
                      fontSize: '7px',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tooltip (positioned relative to container, not transformed inner) */}
          {tooltipHallazgo && (
            <MarkerTooltip
              hallazgo={tooltipHallazgo}
              pos={tooltipPos}
              onClose={() => setTooltipHallazgo(null)}
            />
          )}

          {/* Empty state */}
          {allMarkers.filter((h) => h.ubicacion.x > 0 || h.ubicacion.y > 0).length === 0 && !isEditMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-knar-text-muted">
                Sin hallazgos ubicados. Abre un hallazgo en la tabla para colocarlo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex-shrink-0 px-4 py-2 flex items-center gap-4 border-t"
        style={{ borderColor: 'var(--border-6)' }}
      >
        {TIPOS.map((tipo) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: MARKER_COLORS[tipo] }}
            />
            <span className="text-xs font-light text-knar-text-muted">{tipo}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-knar-text-muted">
          Rueda del raton para zoom · Arrastrar para desplazar
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MARKER TOOLTIP SUB-COMPONENT
// ============================================================================

interface MarkerTooltipProps {
  hallazgo: Hallazgo;
  pos: { x: number; y: number };
  onClose: () => void;
}

function MarkerTooltip({ hallazgo, pos, onClose }: MarkerTooltipProps) {
  const color = MARKER_COLORS[hallazgo.tipo];

  // Clamp so tooltip doesn't overflow 300px card width roughly
  const left = Math.min(pos.x + 8, pos.x - 10);

  return (
    <div
      className="absolute z-30 rounded-lg border shadow-lg"
      style={{
        left: `${left}px`,
        top: `${pos.y + 12}px`,
        maxWidth: '220px',
        backgroundColor: 'var(--knar-dark)',
        borderColor: `${color}30`,
        borderLeftColor: color,
        borderLeftWidth: '2px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tooltip header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border-6)' }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-light" style={{ color }}>
            {hallazgo.tipo}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-knar-text-muted hover:text-knar-text-primary transition-colors ml-2"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tooltip body */}
      <div className="px-3 py-2 space-y-1">
        <p className="text-xs font-normal text-knar-text-primary leading-snug">
          {hallazgo.titulo || '—'}
        </p>
        {hallazgo.descripcion && (
          <p className="text-xs font-light text-knar-text-muted leading-relaxed line-clamp-3">
            {hallazgo.descripcion}
          </p>
        )}
        {/* Type-specific summary field */}
        <TooltipExtraFields hallazgo={hallazgo} />
        <p className="text-xs font-light" style={{ color: 'var(--text-disabled)' }}>
          ({Math.round(hallazgo.ubicacion.x)}, {Math.round(hallazgo.ubicacion.y)})
        </p>
      </div>
    </div>
  );
}

function TooltipExtraFields({ hallazgo }: { hallazgo: Hallazgo }) {
  if (hallazgo.tipo === 'Peligro' && hallazgo.consecuencia) {
    return (
      <p className="text-xs font-light text-knar-text-muted">
        <span style={{ color: 'var(--text-disabled)' }}>Consecuencia:</span>{' '}
        {hallazgo.consecuencia}
      </p>
    );
  }
  if (hallazgo.tipo === 'Barrera' && hallazgo.elementoProtegido) {
    return (
      <p className="text-xs font-light text-knar-text-muted">
        <span style={{ color: 'var(--text-disabled)' }}>Protege:</span>{' '}
        {hallazgo.elementoProtegido}
      </p>
    );
  }
  if (hallazgo.tipo === 'POE' && hallazgo.responsable) {
    return (
      <p className="text-xs font-light text-knar-text-muted">
        <span style={{ color: 'var(--text-disabled)' }}>Responsable:</span>{' '}
        {hallazgo.responsable}
      </p>
    );
  }
  if (hallazgo.tipo === 'SOL' && hallazgo.parametro) {
    return (
      <p className="text-xs font-light text-knar-text-muted">
        <span style={{ color: 'var(--text-disabled)' }}>Parametro:</span>{' '}
        {hallazgo.parametro}
      </p>
    );
  }
  return null;
}
