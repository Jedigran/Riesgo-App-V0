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
    busquedaTexto,
    actualizarBusqueda,
    hallazgosFiltrados,
    contarPorTipo,
    limpiarFiltros,
  } = useFiltrosHallazgos();

  // Tooltip state
  const [tooltipHallazgo, setTooltipHallazgo] = useState<Hallazgo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Image name for header display
  const [imagenNombre, setImagenNombre] = useState<string>('');

  // Drag-over-canvas state (for file drop)
  const [isDragOver, setIsDragOver] = useState(false);

  // Pan drag state
  const isPanning = useRef(false);
  const panStart = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0, mouseY: 0, panX: 0, panY: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // MAP CLICK — place hallazgo
  // ============================================================================

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

      if (ubicacionEditando) {
        actualizarUbicacionHallazgo(ubicacionEditando, x, y);
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
  // PAN (mouse drag)
  // ============================================================================

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (ubicacionEditando) return;
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
  // IMAGE UPLOAD & DROP
  // ============================================================================

  const loadImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const objectUrl = URL.createObjectURL(file);
      cambiarImagen(objectUrl);
      setImagenNombre(file.name);
    },
    [cambiarImagen]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      loadImageFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [loadImageFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadImageFile(file);
    },
    [loadImageFile]
  );

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const counts = contarPorTipo();
  const filteredSessionHallazgos = hallazgosFiltrados();
  const formHallazgosWithLocation = hallazgosForm.filter((h) => h.ubicacion);
  const allMarkers = [
    ...filteredSessionHallazgos,
    ...formHallazgosWithLocation.map((h) => ({
      ...h,
      ubicacion: h.ubicacion!,
    })),
  ];

  const isEditMode = ubicacionEditando !== null;
  const zoomPct = Math.round(zoom * 100);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="knar-card flex flex-col" style={{ minHeight: '520px' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="knar-card-header flex-shrink-0">
        <div className="knar-icon-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="knar-card-title">Esquematico del Sistema</h3>

        {/* Image upload — header right */}
        <div className="ml-auto flex items-center gap-2">
          {imagenNombre && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 300, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {imagenNombre}
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="knar-btn knar-btn-ghost"
            title="Cargar imagen del diagrama (o arrastra un archivo sobre el canvas)"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Cargar imagen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-2 flex-wrap px-4 py-2"
        style={{ borderBottom: '0.5px solid var(--border-6)' }}
      >
        {/* Search */}
        <div className="relative" style={{ minWidth: '120px', maxWidth: '180px', flex: '1' }}>
          <svg
            className="absolute"
            style={{ left: '8px', top: '50%', transform: 'translateY(-50%)', width: '11px', height: '11px', color: 'var(--text-muted)', pointerEvents: 'none' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busquedaTexto}
            onChange={(e) => actualizarBusqueda(e.target.value)}
            placeholder="Buscar..."
            style={{
              width: '100%',
              paddingLeft: '24px',
              paddingRight: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
              background: 'var(--knar-dark)',
              border: '0.5px solid var(--border-8)',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 300,
              color: 'var(--text-secondary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: '0.5px', height: '16px', background: 'var(--border-6)' }} />

        {/* Type filter pills */}
        {TIPOS.map((tipo) => {
          const active = filtrosActivos.includes(tipo);
          const color = MARKER_COLORS[tipo];
          return (
            <button
              key={tipo}
              onClick={() => toggleFiltro(tipo)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '9999px',
                border: `0.5px solid ${active ? color : 'var(--border-8)'}`,
                backgroundColor: active ? `${color}12` : 'transparent',
                color: active ? color : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 300,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
              title={`Filtrar ${tipo}`}
            >
              {/* Dot */}
              <span
                style={{
                  display: 'inline-block',
                  width: '5px',
                  height: '5px',
                  borderRadius: '9999px',
                  flexShrink: 0,
                  backgroundColor: active ? color : 'var(--text-disabled)',
                }}
              />
              {tipo}
              {/* Count badge — always visible, solid background */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '16px',
                  height: '14px',
                  padding: '0 4px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 400,
                  background: active ? `${color}22` : 'rgba(255,255,255,0.06)',
                  color: active ? color : 'var(--text-muted)',
                  border: `0.5px solid ${active ? `${color}30` : 'var(--border-6)'}`,
                }}
              >
                {counts[tipo]}
              </span>
            </button>
          );
        })}

        {/* Clear / show all */}
        <button
          onClick={limpiarFiltros}
          style={{
            fontSize: '11px',
            fontWeight: 300,
            color: 'var(--text-disabled)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-disabled)')}
        >
          Todos
        </button>

        {/* Marker count */}
        <span
          className="ml-auto"
          style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-disabled)' }}
        >
          {allMarkers.filter((h) => h.ubicacion).length} ubicados
        </span>
      </div>

      {/* ── Edit mode banner ──────────────────────────────────────────────── */}
      {isEditMode && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5"
          style={{
            background: 'rgba(59,130,246,0.06)',
            borderBottom: '0.5px solid rgba(59,130,246,0.18)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '9999px',
              backgroundColor: '#3b82f6',
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 300, color: '#93c5fd' }}>
            Modo colocacion activo — haz clic en el diagrama para ubicar el hallazgo
          </span>
        </div>
      )}

      {/* ── Map canvas ───────────────────────────────────────────────���────── */}
      <div className="knar-card-content flex-1" style={{ padding: '12px' }}>
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '6px',
            height: '420px',
            background: 'var(--knar-dark)',
            border: isEditMode
              ? '1px solid rgba(59,130,246,0.35)'
              : '0.5px solid var(--border-8)',
            cursor: isEditMode ? 'crosshair' : 'grab',
          }}
          onClick={handleMapClick}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Transformable layer */}
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
              src={imagenActual}
              alt="Diagrama del sistema"
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
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
                  style={{
                    position: 'absolute',
                    left: `${ub.x}%`,
                    top: `${ub.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isActive ? 20 : 10,
                  }}
                  onClick={(e) => handleMarkerClick(e, h as Hallazgo)}
                >
                  {/* Outer ring */}
                  <div style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    top: '-4px',
                    left: '-4px',
                    borderRadius: '9999px',
                    background: `${color}18`,
                    border: `0.5px solid ${color}40`,
                    transition: 'transform 0.15s',
                  }} />
                  {/* Marker dot */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '12px',
                    height: '12px',
                    borderRadius: '9999px',
                    background: color,
                    border: '1.5px solid rgba(255,255,255,0.75)',
                    boxShadow: `0 0 6px ${color}50`,
                    fontSize: '7px',
                    color: '#fff',
                    fontWeight: 600,
                  }}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drag-over drop zone overlay */}
          {isDragOver && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'rgba(14,17,22,0.80)',
              border: '1.5px dashed var(--accent)',
              borderRadius: '6px',
              zIndex: 50,
              pointerEvents: 'none',
            }}>
              <svg width="28" height="28" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 300, color: 'var(--accent)' }}>Suelta la imagen aqui</span>
            </div>
          )}

          {/* Tooltip (in container coords, not transformed) */}
          {tooltipHallazgo && (
            <MarkerTooltip
              hallazgo={tooltipHallazgo}
              pos={tooltipPos}
              onClose={() => setTooltipHallazgo(null)}
            />
          )}

          {/* Empty state */}
          {allMarkers.filter((h) => h.ubicacion).length === 0 && !isEditMode && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 300, color: 'var(--text-disabled)' }}>
                Sin hallazgos ubicados. Abre un hallazgo en la tabla para colocarlo.
              </p>
            </div>
          )}

          {/* ── Zoom controls overlay — bottom-right ──────────────────────── */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 30,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Zoom in */}
            <button
              onClick={() => actualizarZoom(zoom + ZOOM_STEP)}
              title="Acercar"
              style={{
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--knar-charcoal)',
                border: '0.5px solid var(--border-10)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 300,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              +
            </button>

            {/* Zoom percentage */}
            <div style={{
              width: '26px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--knar-dark)',
              border: '0.5px solid var(--border-6)',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 400,
              color: 'var(--text-disabled)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.01em',
            }}>
              {zoomPct}%
            </div>

            {/* Zoom out */}
            <button
              onClick={() => actualizarZoom(zoom - ZOOM_STEP)}
              title="Alejar"
              style={{
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--knar-charcoal)',
                border: '0.5px solid var(--border-10)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 300,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              −
            </button>

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'var(--border-6)', margin: '1px 3px' }} />

            {/* Reset view */}
            <button
              onClick={() => { resetearVista(); setTooltipHallazgo(null); }}
              title="Restablecer vista"
              style={{
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--knar-charcoal)',
                border: '0.5px solid var(--border-10)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <svg style={{ width: '11px', height: '11px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-4 px-4 py-2"
        style={{ borderTop: '0.5px solid var(--border-6)' }}
      >
        {TIPOS.map((tipo) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                flexShrink: 0,
                background: MARKER_COLORS[tipo],
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 300, color: 'var(--text-disabled)' }}>
              {tipo}
            </span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 300, color: 'var(--text-disabled)' }}>
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

  return (
    <div
      style={{
        position: 'absolute',
        left: `${Math.min(pos.x + 10, pos.x - 10)}px`,
        top: `${pos.y + 14}px`,
        maxWidth: '210px',
        zIndex: 30,
        background: 'var(--knar-dark)',
        border: `0.5px solid ${color}25`,
        borderLeft: `1.5px solid ${color}`,
        borderRadius: '6px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 10px',
          borderBottom: '0.5px solid var(--border-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '9999px', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 400, color }}>{hallazgo.tipo}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-disabled)',
            padding: '0 0 0 8px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg style={{ width: '11px', height: '11px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {hallazgo.titulo || '—'}
        </p>
        {hallazgo.descripcion && (
          <p style={{ fontSize: '11px', fontWeight: 300, color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {hallazgo.descripcion}
          </p>
        )}
        <TooltipExtraFields hallazgo={hallazgo} />
        <p style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-disabled)', marginTop: '2px' }}>
          ({Math.round(hallazgo.ubicacion.x)}, {Math.round(hallazgo.ubicacion.y)})
        </p>
      </div>
    </div>
  );
}

function TooltipExtraFields({ hallazgo }: { hallazgo: Hallazgo }) {
  const labelStyle = { color: 'var(--text-disabled)' };
  const valueStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 300, color: 'var(--text-muted)' };

  if (hallazgo.tipo === 'Peligro' && hallazgo.consecuencia) {
    return (
      <p style={valueStyle}>
        <span style={labelStyle}>Consecuencia: </span>{hallazgo.consecuencia}
      </p>
    );
  }
  if (hallazgo.tipo === 'Barrera' && hallazgo.elementoProtegido) {
    return (
      <p style={valueStyle}>
        <span style={labelStyle}>Protege: </span>{hallazgo.elementoProtegido}
      </p>
    );
  }
  if (hallazgo.tipo === 'POE' && hallazgo.responsable) {
    return (
      <p style={valueStyle}>
        <span style={labelStyle}>Responsable: </span>{hallazgo.responsable}
      </p>
    );
  }
  if (hallazgo.tipo === 'SOL' && hallazgo.parametro) {
    return (
      <p style={valueStyle}>
        <span style={labelStyle}>Parametro: </span>{hallazgo.parametro}
      </p>
    );
  }
  return null;
}
