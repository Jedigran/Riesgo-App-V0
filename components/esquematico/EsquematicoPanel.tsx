'use client';

import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { useMapa } from '@/src/controllers/useMapa';
import { useFiltrosHallazgos } from '@/src/controllers/useFiltrosHallazgos';
import { useGrupo } from '@/src/controllers/useGrupo';
import { useSesion } from '@/src/controllers/useSesion';
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
  POE: '#10b981',
  SOL: '#8b5cf6',
};

const MARKER_LABELS: Record<TipoHallazgo, string> = {
  Peligro: 'P',
  Barrera: 'B',
  POE: 'E',
  SOL: 'S',
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

  const { grupos, obtenerGruposPorHallazgo } = useGrupo();
  const { sesion } = useSesion();

  // Tooltip state
  const [tooltipHallazgo, setTooltipHallazgo] = useState<Hallazgo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltipGrupos, setTooltipGrupos] = useState<any[]>([]);

  // Group filter state (multi-select)
  const [grupoFiltrosActivos, setGrupoFiltrosActivos] = useState<string[]>([]);

  // Analisis filter state (multi-select)
  const [analisisFiltrosActivos, setAnalisisFiltrosActivos] = useState<string[]>([]);

  // Dropdown state
  const [grupoDropdownOpen, setGrupoDropdownOpen] = useState(false);
  const [analisisDropdownOpen, setAnalisisDropdownOpen] = useState(false);

  // Image name for header display
  const [imagenNombre, setImagenNombre] = useState<string>('');

  // Image fit mode ('contain' | 'cover')
  const [imagenFitMode, setImagenFitMode] = useState<'contain' | 'cover'>('contain');

  // Image loading state
  const [imagenCargada, setImagenCargada] = useState(false);

  // Image natural dimensions
  const [imagenDimensions, setImagenDimensions] = useState({ width: 0, height: 0 });

  // Drag-over-canvas state (for file drop)
  const [isDragOver, setIsDragOver] = useState(false);

  // Pan drag state
  const isPanning = useRef(false);
  const panStart = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0, mouseY: 0, panX: 0, panY: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const analisisDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setGrupoDropdownOpen(false);
    }
    if (analisisDropdownRef.current && !analisisDropdownRef.current.contains(event.target as Node)) {
      setAnalisisDropdownOpen(false);
    }
  }, []);

  // Register click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // ============================================================================
  // DERIVED DATA - Group mapping (needed before callbacks)
  // ============================================================================

  // Create a map of hallazgo ID to its groups for quick lookup
  const hallazgoGruposMap = useMemo(() => {
    const map = new Map<string, typeof grupos>();
    const allMarkersForMap = [
      ...hallazgosFiltrados(),
      ...hallazgosForm.filter((h) => h.ubicacion).map((h) => ({ ...h, ubicacion: h.ubicacion! })),
    ];
    allMarkersForMap.forEach((h) => {
      map.set(h.id, obtenerGruposPorHallazgo(h.id));
    });
    return map;
  }, [hallazgosForm, obtenerGruposPorHallazgo]);

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
      const gruposDelHallazgo = hallazgoGruposMap.get(hallazgo.id) || [];
      if (tooltipHallazgo?.id === hallazgo.id) {
        setTooltipHallazgo(null);
        setTooltipGrupos([]);
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
      setTooltipGrupos(gruposDelHallazgo);
    },
    [tooltipHallazgo, hallazgoGruposMap]
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
      const newZoom = Math.min(3, Math.max(0.5, zoom + delta));  // ← Zoom limits
      actualizarZoom(newZoom);
    },
    [zoom, actualizarZoom]
  );

  // ============================================================================
  // IMAGE UPLOAD & DROP
  // ============================================================================

  const loadImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setImagenCargada(false);
      
      const objectUrl = URL.createObjectURL(file);
      cambiarImagen(objectUrl);
      setImagenNombre(file.name);
      
      // Get image dimensions for dynamic height
      const img = new Image();
      img.onload = () => {
        setImagenDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
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

  // Create map of hallazgo to groups
  const markersConGrupos = useMemo(() => {
    const map = new Map<string, typeof grupos>();
    allMarkers.forEach((h) => {
      map.set(h.id, obtenerGruposPorHallazgo(h.id));
    });
    return map;
  }, [allMarkers, obtenerGruposPorHallazgo]);

  // Apply group filter (multi-select)
  const markersConGrupoFiltro = useMemo(() => {
    if (grupoFiltrosActivos.length === 0) return allMarkers;
    return allMarkers.filter((h) => {
      const gruposDelHallazgo = markersConGrupos.get(h.id) || [];
      return gruposDelHallazgo.some((g) => grupoFiltrosActivos.includes(g.id));
    });
  }, [allMarkers, grupoFiltrosActivos, markersConGrupos]);

  // Toggle group filter selection
  const toggleGrupoFiltro = useCallback((grupoId: string) => {
    setGrupoFiltrosActivos((prev) =>
      prev.includes(grupoId)
        ? prev.filter((id) => id !== grupoId)
        : [...prev, grupoId]
    );
  }, []);

  // Clear group filters
  const clearGrupoFiltros = useCallback(() => {
    setGrupoFiltrosActivos([]);
  }, []);

  // Apply analisis filter on top of group filter (multi-select)
  const markersFiltrados = useMemo(() => {
    if (analisisFiltrosActivos.length === 0) return markersConGrupoFiltro;
    const hallazgos = sesion?.hallazgos ?? [];
    return markersConGrupoFiltro.filter((h) => {
      const hallazgo = hallazgos.find((s) => s.id === h.id);
      return analisisFiltrosActivos.some((id) => hallazgo?.analisisOrigenIds?.includes(id) ?? false);
    });
  }, [markersConGrupoFiltro, analisisFiltrosActivos, sesion?.hallazgos]);

  // Toggle analisis filter selection
  const toggleAnalisisFiltro = useCallback((analisisId: string) => {
    setAnalisisFiltrosActivos((prev) =>
      prev.includes(analisisId)
        ? prev.filter((id) => id !== analisisId)
        : [...prev, analisisId]
    );
  }, []);

  // Clear analisis filters
  const clearAnalisisFiltros = useCallback(() => {
    setAnalisisFiltrosActivos([]);
  }, []);

  // Count hallazgos por grupo
  const gruposCount = useMemo(() => {
    const counts: Record<string, number> = {};
    grupos.forEach((g) => {
      counts[g.id] = allMarkers.filter((h) => {
        const gruposDelHallazgo = markersConGrupos.get(h.id) || [];
        return gruposDelHallazgo.some((grp) => grp.id === g.id);
      }).length;
    });
    return counts;
  }, [allMarkers, grupos, markersConGrupos]);

  // Count hallazgos por analisis
  const analisisCount = useMemo(() => {
    const counts: Record<string, number> = {};
    const hallazgos = sesion?.hallazgos ?? [];
    (sesion?.analisis ?? []).forEach((a) => {
      counts[a.base.id] = allMarkers.filter((h) => {
        const hallazgo = hallazgos.find((s) => s.id === h.id);
        return hallazgo?.analisisOrigenIds?.includes(a.base.id) ?? false;
      }).length;
    });
    return counts;
  }, [allMarkers, sesion?.analisis, sesion?.hallazgos]);

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

        {/* Group filter divider */}
        {grupos.length > 0 && (
          <div style={{ width: '0.5px', height: '16px', background: 'var(--border-6)' }} />
        )}

        {/* Group filter dropdown (multi-select) */}
        {grupos.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setGrupoDropdownOpen(!grupoDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 300,
                color: grupoFiltrosActivos.length > 0 ? 'var(--knar-orange)' : 'var(--text-muted)',
                background: grupoFiltrosActivos.length > 0 ? 'rgba(255,140,0,0.10)' : 'var(--knar-dark)',
                border: `0.5px solid ${grupoFiltrosActivos.length > 0 ? 'var(--knar-orange)' : 'var(--border-8)'}`,
                borderRadius: '6px',
                padding: '3px 10px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              title="Filtrar por relaciones"
            >
              <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
              Relaciones
              {grupoFiltrosActivos.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '18px',
                    height: '16px',
                    padding: '0 5px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 400,
                    background: 'var(--knar-orange)',
                    color: 'white',
                  }}
                >
                  {grupoFiltrosActivos.length}
                </span>
              )}
              <svg style={{ width: '10px', height: '10px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={grupoDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>

            {/* Dropdown menu */}
            {grupoDropdownOpen && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  zIndex: 100,
                  minWidth: '220px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  background: 'var(--knar-charcoal)',
                  border: '0.5px solid var(--border-8)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  padding: '6px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderBottom: '0.5px solid var(--border-8)',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Filtrar por relación
                  </span>
                  {grupoFiltrosActivos.length > 0 && (
                    <button
                      onClick={clearGrupoFiltros}
                      style={{
                        fontSize: '10px',
                        fontWeight: 300,
                        color: 'var(--knar-orange)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Options */}
                {grupos.map((grupo) => {
                  const checked = grupoFiltrosActivos.includes(grupo.id);
                  const count = gruposCount[grupo.id] || 0;
                  return (
                    <label
                      key={grupo.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: checked ? `${grupo.color}15` : 'transparent',
                        border: checked ? `0.5px solid ${grupo.color}30` : '0.5px solid transparent',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGrupoFiltro(grupo.id)}
                        style={{
                          width: '14px',
                          height: '14px',
                          cursor: 'pointer',
                          accentColor: grupo.color,
                        }}
                      />
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '2px',
                          background: grupo.color,
                          boxShadow: checked ? `0 0 4px ${grupo.color}60` : 'none',
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          fontWeight: 300,
                          color: checked ? grupo.color : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {grupo.nombre.length > 25 ? grupo.nombre.substring(0, 25) + '...' : grupo.nombre}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 400,
                          color: checked ? grupo.color : 'var(--text-muted)',
                          background: checked ? `${grupo.color}22` : 'rgba(255,255,255,0.06)',
                          borderRadius: '9999px',
                          padding: '1px 6px',
                        }}
                      >
                        {count}
                      </span>
                    </label>
                  );
                })}

                {/* Footer */}
                {grupos.length === 0 && (
                  <p style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-disabled)', padding: '12px', textAlign: 'center' }}>
                    No hay relaciones creadas
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Elementos de análisis filter divider */}
        {(sesion?.analisis?.length ?? 0) > 0 && (
          <div style={{ width: '0.5px', height: '16px', background: 'var(--border-6)' }} />
        )}

        {/* Elementos de análisis filter dropdown (multi-select) */}
        {(sesion?.analisis?.length ?? 0) > 0 && (
          <div style={{ position: 'relative' }} ref={analisisDropdownRef}>
            <button
              onClick={() => setAnalisisDropdownOpen(!analisisDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 300,
                color: analisisFiltrosActivos.length > 0 ? 'var(--knar-orange)' : 'var(--text-muted)',
                background: analisisFiltrosActivos.length > 0 ? 'rgba(255,140,0,0.10)' : 'var(--knar-dark)',
                border: `0.5px solid ${analisisFiltrosActivos.length > 0 ? 'var(--knar-orange)' : 'var(--border-8)'}`,
                borderRadius: '6px',
                padding: '3px 10px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              title="Filtrar por elementos de análisis"
            >
              <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Elementos de análisis
              {analisisFiltrosActivos.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '18px',
                    height: '16px',
                    padding: '0 5px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 400,
                    background: 'var(--knar-orange)',
                    color: 'white',
                  }}
                >
                  {analisisFiltrosActivos.length}
                </span>
              )}
              <svg style={{ width: '10px', height: '10px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={analisisDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>

            {/* Dropdown panel */}
            {analisisDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  zIndex: 100,
                  minWidth: '240px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  background: 'var(--knar-charcoal)',
                  border: '0.5px solid var(--border-8)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  padding: '6px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderBottom: '0.5px solid var(--border-8)',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Filtrar por análisis
                  </span>
                  {analisisFiltrosActivos.length > 0 && (
                    <button
                      onClick={clearAnalisisFiltros}
                      style={{
                        fontSize: '10px',
                        fontWeight: 300,
                        color: 'var(--knar-orange)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Options */}
                {(sesion?.analisis ?? []).map((analisis) => {
                  const checked = analisisFiltrosActivos.includes(analisis.base.id);
                  const tipo = analisis.base.tipo === 'Intuicion' ? 'Registro directo' : analisis.base.tipo;
                  const count = analisisCount[analisis.base.id] || 0;
                  const nombre = analisis.base.nombre
                    ? `${tipo} — ${analisis.base.nombre}`
                    : tipo;
                  return (
                    <label
                      key={analisis.base.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: checked ? 'rgba(255,140,0,0.12)' : 'transparent',
                        border: checked ? '0.5px solid rgba(255,140,0,0.25)' : '0.5px solid transparent',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAnalisisFiltro(analisis.base.id)}
                        style={{
                          width: '14px',
                          height: '14px',
                          cursor: 'pointer',
                          accentColor: 'var(--knar-orange)',
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          fontWeight: 300,
                          color: checked ? 'var(--knar-orange)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {nombre.length > 30 ? nombre.substring(0, 30) + '...' : nombre}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 400,
                          color: checked ? 'var(--knar-orange)' : 'var(--text-muted)',
                          background: checked ? 'rgba(255,140,0,0.18)' : 'rgba(255,255,255,0.06)',
                          borderRadius: '9999px',
                          padding: '1px 6px',
                        }}
                      >
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Marker count */}
        <span
          className="ml-auto"
          style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-disabled)' }}
        >
          {markersFiltrados.filter((h) => h.ubicacion).length} ubicados
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
            Modo colocacion activo — haz clic en el diagrama para ubicar la entidad
          </span>
        </div>
      )}

      {/* ── Group filter banner ───────────────────────────────────────────── */}
      {grupoFiltrosActivos.length > 0 && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5"
          style={{
            background: 'rgba(255,140,0,0.08)',
            borderBottom: '0.5px solid rgba(255,140,0,0.2)',
          }}
        >
          <svg style={{ width: '14px', height: '14px', color: 'var(--knar-orange)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-secondary)' }}>
            Filtrando por <strong>{grupoFiltrosActivos.length}</strong> relación{grupoFiltrosActivos.length !== 1 ? 'es' : ''}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-muted)', marginLeft: '8px' }}>
            ({markersConGrupoFiltro.filter(h => h.ubicacion).length} entidades mostradas)
          </span>
          <button
            onClick={clearGrupoFiltros}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--knar-orange)',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 300,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff8800'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--knar-orange)'}
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* ── Analisis filter banner ───────────────────────────────────────── */}
      {analisisFiltrosActivos.length > 0 && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5"
          style={{
            background: 'rgba(255,140,0,0.08)',
            borderBottom: '0.5px solid rgba(255,140,0,0.2)',
          }}
        >
          <svg style={{ width: '14px', height: '14px', color: 'var(--knar-orange)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-secondary)' }}>
            Filtrando por <strong>{analisisFiltrosActivos.length}</strong> elemento{analisisFiltrosActivos.length !== 1 ? 's' : ''} de análisis
          </span>
          <span style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-muted)', marginLeft: '8px' }}>
            ({markersFiltrados.filter(h => h.ubicacion).length} entidades mostradas)
          </span>
          <button
            onClick={clearAnalisisFiltros}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--knar-orange)',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 300,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff8800'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--knar-orange)'}
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* ── Map canvas ───────────────────────────────────────────────���────── */}
      <div className="knar-card-content flex-1" style={{ padding: '12px', height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '6px',
            height: '100%',
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
              transformOrigin: 'center center',
              width: '100%',
              height: '100%',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            {/* Diagram image */}
            <img
              src={imagenActual || '/ReferenceIamge/Sistema Bombas de Achique_V2.png'}
              alt="Diagrama del sistema"
              draggable={false}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImagenDimensions({
                  width: img.naturalWidth,
                  height: img.naturalHeight
                });
                setImagenCargada(true);
              }}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: imagenFitMode,
                display: 'block'
              }}
              onError={(e) => { 
                (e.target as HTMLImageElement).style.opacity = '0';
              }}
            />

            {/* Hallazgo markers */}
            {markersFiltrados.map((h) => {
              const ub = h.ubicacion;
              if (!ub || (ub.x === 0 && ub.y === 0)) return null;
              const color = MARKER_COLORS[h.tipo];
              const label = MARKER_LABELS[h.tipo];
              const isActive = tooltipHallazgo?.id === h.id;
              const gruposDelHallazgo = markersConGrupos.get(h.id) || [];
              const tieneGrupos = gruposDelHallazgo.length > 0;
              const estaEnFiltro = grupoFiltrosActivos.length > 0 && gruposDelHallazgo.some(g => grupoFiltrosActivos.includes(g.id));

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
                  {/* Group rings (only if hallazgo belongs to groups) */}
                  {tieneGrupos && gruposDelHallazgo.map((grupo, index) => {
                    const ringSize = 20 + (index * 6); // Increment size for each ring
                    const offset = -4 + (index * 3);
                    return (
                      <div
                        key={grupo.id}
                        style={{
                          position: 'absolute',
                          width: `${ringSize}px`,
                          height: `${ringSize}px`,
                          top: `${offset}px`,
                          left: `${offset}px`,
                          borderRadius: '9999px',
                          background: `${grupo.color}10`,
                          border: `1px solid ${grupo.color}60`,
                          boxShadow: `0 0 4px ${grupo.color}40`,
                          transition: 'all 0.15s ease',
                          pointerEvents: 'none',
                        }}
                        title={grupo.nombre}
                      />
                    );
                  })}

                  {/* Outer ring (type-based, shown when no groups) */}
                  {!tieneGrupos && (
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
                  )}

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
              onClose={() => { setTooltipHallazgo(null); setTooltipGrupos([]); }}
              grupos={tooltipGrupos}
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
                Sin entidades ubicadas. Abre una entidad en la tabla para colocarla.
              </p>
            </div>
          )}

          {/* ── Zoom controls overlay — bottom-right ────────────────────��─── */}
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
            {/* Fit mode toggle */}
            <button
              onClick={() => setImagenFitMode(imagenFitMode === 'contain' ? 'cover' : 'contain')}
              title={imagenFitMode === 'contain' ? 'Ajustar: Contener' : 'Ajustar: Llenar'}
              style={{
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: imagenFitMode === 'contain' ? 'var(--knar-charcoal)' : 'rgba(255,140,0,0.15)',
                border: `0.5px solid ${imagenFitMode === 'contain' ? 'var(--border-10)' : 'var(--knar-orange)'}`,
                borderRadius: '4px',
                color: imagenFitMode === 'contain' ? 'var(--text-secondary)' : 'var(--knar-orange)',
                fontSize: '10px',
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {imagenFitMode === 'contain' ? '▢' : '◫'}
            </button>

            {/* Zoom in */}
            <button
              onClick={() => actualizarZoom(Math.min(3, zoom + ZOOM_STEP))}
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
              onClick={() => actualizarZoom(Math.max(0.5, zoom - ZOOM_STEP))}
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
  grupos: any[];
}

function MarkerTooltip({ hallazgo, pos, onClose, grupos }: MarkerTooltipProps) {
  const color = MARKER_COLORS[hallazgo.tipo];
  const tieneGrupos = grupos.length > 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${Math.min(pos.x + 10, pos.x - 10)}px`,
        top: `${pos.y + 14}px`,
        maxWidth: '250px',
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

        {/* Group membership section */}
        {tieneGrupos && (
          <div
            style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '0.5px solid var(--border-6)',
            }}
          >
            <p style={{ fontSize: '9px', fontWeight: 400, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Relaciones
            </p>
            {grupos.map((grupo) => (
              <div
                key={grupo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 6px',
                  marginBottom: '2px',
                  background: `${grupo.color}15`,
                  border: `0.5px solid ${grupo.color}30`,
                  borderRadius: '3px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    background: grupo.color,
                    boxShadow: `0 0 4px ${grupo.color}60`,
                  }}
                />
                <span style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-secondary)' }}>
                  {grupo.nombre}
                </span>
              </div>
            ))}
          </div>
        )}

        {!tieneGrupos && (
          <div
            style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '0.5px solid var(--border-6)',
            }}
          >
            <p style={{ fontSize: '9px', fontWeight: 300, color: 'var(--text-disabled)', fontStyle: 'italic' }}>
              Sin relaciones
            </p>
          </div>
        )}

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
