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
// COMPONENT
// ============================================================================

export default function LopaForm({
  data,
  onChange,
  analisisFormCollapsed,
  onToggleCollapse,
}: LopaFormProps) {
  // Calculate PfD Total
  const pfdTotal = data.capasIPL.reduce((acc, capa) => acc * (capa.pfd || 1), 1);

  // Calculate Scenario Risk
  const riesgoEscenario = data.frecuenciaInicial * pfdTotal;

  // Check if meets criteria
  const cumpleCriterio = riesgoEscenario <= data.riesgoTolerable;

  const handleIPLNombreChange = (index: number, value: string) => {
    const nuevasCapas = [...data.capasIPL];
    if (!nuevasCapas[index]) nuevasCapas[index] = { nombre: '', pfd: 0.1 };
    nuevasCapas[index].nombre = value;
    onChange({ ...data, capasIPL: nuevasCapas });
  };

  const handleIPLPfdChange = (index: number, value: number) => {
    const nuevasCapas = [...data.capasIPL];
    if (!nuevasCapas[index]) nuevasCapas[index] = { nombre: '', pfd: 0.1 };
    nuevasCapas[index].pfd = value;
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

      {/* Capas IPL - Layer 1 */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Capa IPL 1 - Nombre
        </label>
        <input
          type="text"
          value={data.capasIPL[0]?.nombre || ''}
          onChange={(e) => handleIPLNombreChange(0, e.target.value)}
          className="knar-input"
          placeholder="Ej: BPCS - Alarma"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Capa IPL 1 - PFD
        </label>
        <input
          type="number"
          step="0.0001"
          value={data.capasIPL[0]?.pfd || 0.1}
          onChange={(e) => handleIPLPfdChange(0, Number(e.target.value))}
          className="knar-input"
          placeholder="Ej: 0.1"
        />
      </div>

      {/* Risk Calculations Display */}
      <div className="bg-knar-charcoal rounded p-3 space-y-2 border border-knar-border mb-3">
        <h4 className="text-xs font-medium text-knar-text-primary">Cálculos de Riesgo</h4>

        {/* PfD Total */}
        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">PfD Total:</span>
          <span className="text-knar-text-primary font-mono">{pfdTotal.toExponential(2)}</span>
        </div>

        {/* Riesgo del Escenario */}
        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">Riesgo Escenario:</span>
          <span className="text-knar-text-primary font-mono">{riesgoEscenario.toExponential(2)}</span>
        </div>

        {/* ¿Cumple Criterio? */}
        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">¿Cumple Criterio?</span>
          <span className={`font-bold ${cumpleCriterio ? 'text-green-500' : 'text-red-500'}`}>
            {cumpleCriterio ? '✅ SÍ' : '❌ NO'}
          </span>
        </div>
      </div>
    </CollapsibleCard>
  );
}

// ============================================================================
// COLLAPSIBLE CARD (Local copy for now - can be extracted to shared component)
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
