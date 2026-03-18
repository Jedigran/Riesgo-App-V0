/**
 * ============================================================================
 * HAZOP FORM - Hazard and Operability Study Form
 * ============================================================================
 *
 * Form for HAZOP analysis methodology.
 * Used to identify hazards through systematic examination of process parameters.
 */

'use client';

// ============================================================================
// TYPES
// ============================================================================

export interface HazopData {
  nodo: string;
  subnodo: string;
  parametro: string;
  palabraGuia: string;
  causa: string;
  consecuencia: string;
  receptorImpacto: string;
  salvaguardasExistentes: string[];
  recomendaciones: string[];
}

export interface HazopFormProps {
  data: HazopData;
  onChange: (data: HazopData) => void;
  analisisFormCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PARAMETROS = [
  'Flujo',
  'Presión',
  'Temperatura',
  'Nivel',
  'Composición',
  'pH',
  'Velocidad',
  'Vibración',
];

const PALABRAS_GUIA = [
  'NO',
  'MÁS',
  'MENOS',
  'PARTE DE',
  'ASÍ COMO',
  'OTRO QUE',
  'REVERSO',
  'TEMPRANO',
  'TARDE',
  'ANTES',
  'DESPUÉS',
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function HazopForm({
  data,
  onChange,
  analisisFormCollapsed,
  onToggleCollapse,
}: HazopFormProps) {
  // Calculate desviación text
  const getDesviacion = () => {
    if (!data.parametro || !data.palabraGuia) return '';
    if (data.palabraGuia === 'NO') return `Sin ${data.parametro.toLowerCase()}`;
    if (data.palabraGuia === 'MÁS' || data.palabraGuia === 'MENOS') {
      return `${data.palabraGuia} de ${data.parametro.toLowerCase()}`;
    }
    return `${data.palabraGuia} ${data.parametro.toLowerCase()}`;
  };

  return (
    <CollapsibleCard
      title="HAZOP - Nodo de Análisis"
      icon={
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      isExpanded={!analisisFormCollapsed}
      onToggle={() => onToggleCollapse(!analisisFormCollapsed)}
    >
      {/* Nodo */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Nodo *
        </label>
        <input
          type="text"
          value={data.nodo}
          onChange={(e) => onChange({ ...data, nodo: e.target.value })}
          className="knar-input"
          placeholder="Ej: Sistema de Achique"
        />
      </div>

      {/* Subnodo/Equipo */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Subnodo/Equipo
        </label>
        <input
          type="text"
          value={data.subnodo}
          onChange={(e) => onChange({ ...data, subnodo: e.target.value })}
          className="knar-input"
          placeholder="Ej: Bomba principal"
        />
      </div>

      {/* Parámetro y Palabra Guía */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Parámetro *
          </label>
          <select
            value={data.parametro}
            onChange={(e) => onChange({ ...data, parametro: e.target.value })}
            className="knar-input"
          >
            <option value="">Seleccionar</option>
            {PARAMETROS.map((param) => (
              <option key={param} value={param}>
                {param}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Palabra Guía *
          </label>
          <select
            value={data.palabraGuia}
            onChange={(e) => onChange({ ...data, palabraGuia: e.target.value })}
            className="knar-input"
          >
            <option value="">Seleccionar</option>
            {PALABRAS_GUIA.map((palabra) => (
              <option key={palabra} value={palabra}>
                {palabra}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desviación (calculado) */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Desviación
          <span className="text-knar-text-muted ml-2">(calculado)</span>
        </label>
        <input
          type="text"
          value={getDesviacion()}
          readOnly
          className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
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
          placeholder="Ej: Acumulación de agua en el área"
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
          placeholder="Ej: Personal/Operación/Medio Ambiente"
        />
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
