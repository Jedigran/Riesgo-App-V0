/**
 * ============================================================================
 * LOPA FORM - Layer of Protection Analysis Form
 * ============================================================================
 *
 * Form for LOPA analysis methodology.
 * Used to evaluate risk and determine if protection layers are adequate.
 */

'use client';

// ============================================================================
// TYPES
// ============================================================================

export interface CapaIPL {
  nombre: string;
  pfd: number;
}

export interface LopaData {
  escenario: string;
  consecuencia: string;
  receptorImpacto: string;
  S: number;
  riesgoTolerable: number;
  causa: string;
  frecuenciaInicial: number;
  capasIPL: CapaIPL[];
  pfdTotal: number;
  riesgoEscenario: number;
  cumpleCriterio: boolean;
  pfdObjetivo: number;
  rrf: number;
  silRequerido: number;
  recomendaciones: string[];
}

export interface LopaFormProps {
  data: LopaData;
  onChange: (data: LopaData) => void;
  analisisFormCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calcularPfdTotal(capasIPL: CapaIPL[]): number {
  if (capasIPL.length === 0) return 1;
  return capasIPL.reduce((acc, capa) => acc * (capa.pfd || 1), 1);
}

function calcularRiesgo(frecuenciaInicial: number, pfdTotal: number): number {
  return frecuenciaInicial * pfdTotal;
}

function cumpleCriterio(riesgo: number, riesgoTolerable: number): boolean {
  return riesgo <= riesgoTolerable;
}

function calcularRRF(riesgo: number, riesgoTolerable: number): number {
  if (riesgo <= riesgoTolerable) return 1;
  return riesgo / riesgoTolerable;
}

function calcularSILRequerido(rrf: number): number {
  if (rrf <= 1) return 0;
  if (rrf <= 100) return 1;
  if (rrf <= 1000) return 2;
  if (rrf <= 10000) return 3;
  return 4;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function LopaForm({
  data,
  onChange,
  analisisFormCollapsed,
  onToggleCollapse,
}: LopaFormProps) {
  // Calculate derived values
  const pfdTotal = calcularPfdTotal(data.capasIPL);
  const riesgoEscenario = calcularRiesgo(data.frecuenciaInicial, pfdTotal);
  const cumple = cumpleCriterio(riesgoEscenario, data.riesgoTolerable);
  const rrf = calcularRRF(riesgoEscenario, data.riesgoTolerable);
  const silRequerido = calcularSILRequerido(rrf);

  // Handler functions for IPL management
  const handleAgregarIPL = () => {
    if (data.capasIPL.length >= 8) return;
    const nuevasCapas = [...data.capasIPL, { nombre: '', pfd: 0.1 }];
    onChange({ ...data, capasIPL: nuevasCapas });
  };

  const handleEliminarIPL = (index: number) => {
    if (data.capasIPL.length <= 1) return;
    const nuevasCapas = data.capasIPL.filter((_, i) => i !== index);
    onChange({ ...data, capasIPL: nuevasCapas });
  };

  const handleIPLNombreChange = (index: number, value: string) => {
    const nuevasCapas = [...data.capasIPL];
    if (!nuevasCapas[index]) nuevasCapas[index] = { nombre: '', pfd: 0.1 };
    nuevasCapas[index].nombre = value;
    onChange({ ...data, capasIPL: nuevasCapas });
  };

  const handleIPLPfdChange = (index: number, value: number) => {
    const nuevasCapas = [...data.capasIPL];
    if (!nuevasCapas[index]) nuevasCapas[index] = { nombre: '', pfd: 0.1 };
    nuevasCapas[index].pfd = Math.max(0, Math.min(1, value));
    onChange({ ...data, capasIPL: nuevasCapas });
  };

  return (
    <CollapsibleCard
      title="LOPA - Capas de Protección"
      icon={
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      }
      isExpanded={!analisisFormCollapsed}
      onToggle={() => onToggleCollapse(!analisisFormCollapsed)}
    >
      {/* Escenario */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Escenario de Riesgo *
        </label>
        <input
          type="text"
          value={data.escenario}
          onChange={(e) => onChange({ ...data, escenario: e.target.value })}
          className="knar-input"
          placeholder="Ej: Pérdida de bombeo de achique"
        />
      </div>

      {/* Consecuencia */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Consecuencia *
        </label>
        <textarea
          value={data.consecuencia}
          onChange={(e) => onChange({ ...data, consecuencia: e.target.value })}
          className="knar-input"
          rows={2}
          placeholder="Ej: Acumulación de agua"
        />
      </div>

      {/* Receptor con Mayor Impacto */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Receptor con Mayor Impacto
        </label>
        <input
          type="text"
          value={data.receptorImpacto}
          onChange={(e) => onChange({ ...data, receptorImpacto: e.target.value })}
          className="knar-input"
          placeholder="Ej: Personal / Operación"
        />
      </div>

      {/* Severidad */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Severidad (S) 1-10 *
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={data.S}
          onChange={(e) => onChange({ ...data, S: Number(e.target.value) })}
          className="knar-input"
        />
      </div>

      {/* Riesgo Tolerable */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Riesgo Tolerable (eventos/año) *
        </label>
        <input
          type="number"
          step="0.000001"
          value={data.riesgoTolerable}
          onChange={(e) => onChange({ ...data, riesgoTolerable: Number(e.target.value) })}
          className="knar-input"
          placeholder="Ej: 0.00001"
        />
      </div>

      {/* Causa */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Causa *
        </label>
        <textarea
          value={data.causa}
          onChange={(e) => onChange({ ...data, causa: e.target.value })}
          className="knar-input"
          rows={2}
          placeholder="Ej: Falla eléctrica del motor"
        />
      </div>

      {/* Frecuencia Inicial */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Frecuencia Inicial (eventos/año) *
        </label>
        <input
          type="number"
          step="0.0001"
          value={data.frecuenciaInicial}
          onChange={(e) => onChange({ ...data, frecuenciaInicial: Number(e.target.value) })}
          className="knar-input"
          placeholder="Ej: 0.0707"
        />
      </div>

      {/* Capas IPL Section */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Capas de Protección Independientes (IPL)
          </h4>
          <div className="relative group">
            <div
              className="flex items-center justify-center w-4 h-4 rounded-full border border-knar-border-6 text-knar-text-muted cursor-help transition-all hover:border-knar-orange hover:text-knar-orange"
              style={{ fontSize: '10px', fontWeight: 'var(--weight-medium)' }}
            >
              ?
            </div>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block min-w-[220px] p-2 rounded-md border border-knar-border-6 bg-knar-charcoal shadow-lg" style={{ fontSize: 'var(--text-3xs)', color: 'var(--text-muted)', lineHeight: '1.5', zIndex: 'var(--z-tooltip)' }}>
              <div className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>PfD Total</div>
              <div>PfD = PfD₁ × PfD₂ × ... × PfDₙ</div>
            </div>
          </div>
        </div>

        {/* IPL Layers */}
        <div className="space-y-2 mb-3">
          {data.capasIPL.map((capa, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* IPL Badge with rounded styling */}
              <div
                className="flex items-center justify-center px-2 py-0.5 rounded-full bg-knar-dark border border-knar-border-6"
                style={{ fontSize: '9px', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', minWidth: '42px' }}
              >
                IPL {index + 1}
              </div>
              <input
                type="text"
                value={capa.nombre}
                onChange={(e) => handleIPLNombreChange(index, e.target.value)}
                className="knar-input flex-1"
                placeholder="Nombre"
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={capa.pfd}
                onChange={(e) => handleIPLPfdChange(index, Number(e.target.value))}
                className="knar-input w-20"
                placeholder="PfD"
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <button
                onClick={() => handleEliminarIPL(index)}
                disabled={data.capasIPL.length <= 1}
                className="flex items-center justify-center w-5 h-5 rounded border border-knar-border-6 text-knar-text-muted hover:border-red-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                style={{ fontSize: '12px' }}
                title="Eliminar IPL"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <button
          onClick={handleAgregarIPL}
          disabled={data.capasIPL.length >= 8}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded border border-knar-border-6 text-knar-text-muted hover:border-knar-orange hover:text-knar-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all mb-3"
          style={{ fontSize: 'var(--text-3xs)' }}
        >
          <span style={{ fontSize: '12px' }}>+</span> Agregar IPL (max 8)
        </button>

        {/* PfD Total Calculation */}
        <div className="rounded-md bg-knar-dark p-2 border border-knar-border-6">
          <div className="text-[10px] text-knar-text-muted mb-1">
            PfD Total = {data.capasIPL.map((_, i) => `PfD${i + 1}`).join(' × ')}
          </div>
          <div className="text-[10px] text-knar-text-muted mb-1">
            PfD Total = {data.capasIPL.map(c => c.pfd.toFixed(4)).join(' × ')}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            PfD Total = {pfdTotal.toExponential(4)}
          </div>
        </div>
      </div>

      {/* Risk Calculations Display */}
      <div className="rounded-md border border-knar-border-6 p-3 space-y-2">
        <h4 className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cálculos de Riesgo</h4>

        {/* Divider */}
        <div className="border-t border-knar-border-6" style={{ borderWidth: '0.5px' }}></div>

        {/* Riesgo del Escenario */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-knar-text-muted">Riesgo Escenario:</span>
          <span className="text-knar-text-primary font-mono" style={{ fontSize: 'var(--text-xs)' }}>{riesgoEscenario.toExponential(2)} eventos/año</span>
        </div>

        {/* Divider */}
        <div className="border-t border-knar-border-6" style={{ borderWidth: '0.5px' }}></div>

        {/* ¿Cumple Criterio? */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-knar-text-muted">¿Cumple Criterio?</span>
          <span
            className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${
              cumple
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {cumple ? 'SÍ' : 'NO'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-knar-border-6" style={{ borderWidth: '0.5px' }}></div>

        {/* RRF */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-knar-text-muted">RRF:</span>
          <span className="text-knar-text-primary font-mono" style={{ fontSize: 'var(--text-xs)' }}>{rrf.toFixed(2)}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-knar-border-6" style={{ borderWidth: '0.5px' }}></div>

        {/* SIL Requerido */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-knar-text-muted">SIL Requerido:</span>
          {silRequerido > 0 ? (
            <span
              className="px-2 py-0.5 rounded-full border bg-knar-orange-10 border-knar-orange-30 text-knar-orange-70"
              style={{ fontSize: '10px', fontWeight: 'var(--weight-medium)' }}
            >
              SIL {silRequerido}
            </span>
          ) : (
            <span className="text-knar-text-muted" style={{ fontSize: 'var(--text-xs)' }}>No requerido</span>
          )}
        </div>
      </div>
    </CollapsibleCard>
  );
}

// ============================================================================
// COLLAPSIBLE CARD
// ============================================================================

interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleCard({ title, icon, isExpanded, onToggle, children }: CollapsibleCardProps) {
  return (
    <div className="knar-card">
      <div
        className="knar-card-header cursor-pointer select-none"
        onClick={onToggle}
        style={{ transition: 'background-color 0.15s ease' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div className="knar-icon-box">{icon}</div>
        <h3 className="knar-card-title flex-1">{title}</h3>
        <span
          className="text-knar-text-muted ml-2 transition-transform duration-200"
          style={{
            display: 'inline-block',
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          ▼
        </span>
      </div>
      {isExpanded && <div className="knar-card-content">{children}</div>}
    </div>
  );
}
