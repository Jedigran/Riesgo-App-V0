/**
 * ============================================================================
 * FMEA FORM - Failure Mode and Effects Analysis Form
 * ============================================================================
 *
 * Form for FMEA analysis methodology.
 * Used to identify potential failure modes and their effects.
 */

'use client';

// ============================================================================
// TYPES
// ============================================================================

export interface FmeaData {
  equipo: string;
  funcion: string;
  modoFalla: string;
  receptorImpacto: string;
  efecto: string;
  causa: string;
  S: number;
  O: number;
  D: number;
  RPN: number;
  barrerasExistentes: string[];
  accionesRecomendadas: string[];
}

export interface FmeaFormProps {
  data: FmeaData;
  onChange: (data: FmeaData) => void;
  analisisFormCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function FmeaForm({
  data,
  onChange,
  analisisFormCollapsed,
  onToggleCollapse,
}: FmeaFormProps) {
  const npr = data.S * data.O * data.D;
  const [bg, border, textColor, label] =
    npr >= 201
      ? ['rgba(220,38,38,0.12)', 'rgba(220,38,38,0.35)', '#f87171', 'Crítico']
      : npr >= 101
      ? ['rgba(234,88,12,0.12)', 'rgba(234,88,12,0.35)', 'var(--accent)', 'Alto']
      : npr >= 51
      ? ['rgba(202,138,4,0.12)', 'rgba(202,138,4,0.35)', '#facc15', 'Moderado']
      : ['rgba(22,163,74,0.12)', 'rgba(22,163,74,0.35)', '#4ade80', 'Bajo'];

  return (
    <CollapsibleCard
      title="FMEA - Análisis de Fallas"
      icon={
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v10m0-10V4m0 4a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      }
      isExpanded={!analisisFormCollapsed}
      onToggle={() => onToggleCollapse(!analisisFormCollapsed)}
    >
      {/* Equipo */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Equipo *
        </label>
        <input
          type="text"
          value={data.equipo}
          onChange={(e) => onChange({ ...data, equipo: e.target.value })}
          className="knar-input"
          placeholder="Ej: Bomba principal del Sistema de Achique"
        />
      </div>

      {/* Función */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Función *
        </label>
        <textarea
          value={data.funcion}
          onChange={(e) => onChange({ ...data, funcion: e.target.value })}
          className="knar-input"
          rows={2}
          placeholder="Ej: Evacuar agua acumulada del sistema de drenaje"
        />
      </div>

      {/* Modo de Falla */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Modo de Falla *
        </label>
        <textarea
          value={data.modoFalla}
          onChange={(e) => onChange({ ...data, modoFalla: e.target.value })}
          className="knar-input"
          rows={2}
          placeholder="Ej: Motor no opera"
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

      {/* Efecto Potencial */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Efecto Potencial *
        </label>
        <textarea
          value={data.efecto}
          onChange={(e) => onChange({ ...data, efecto: e.target.value })}
          className="knar-input"
          rows={2}
          placeholder="Ej: Pérdida de bombeo"
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

      {/* S, O, D */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            S (1-10) *
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={data.S}
            onChange={(e) => onChange({ ...data, S: Number(e.target.value), RPN: Number(e.target.value) * data.O * data.D })}
            className="knar-input"
          />
        </div>
        <div>
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            O (1-10) *
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={data.O}
            onChange={(e) => onChange({ ...data, O: Number(e.target.value), RPN: data.S * Number(e.target.value) * data.D })}
            className="knar-input"
          />
        </div>
        <div>
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            D (1-10) *
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={data.D}
            onChange={(e) => onChange({ ...data, D: Number(e.target.value), RPN: data.S * data.O * Number(e.target.value) })}
            className="knar-input"
          />
        </div>
      </div>

      {/* NPR (RPN) with color coding */}
      <div
        className="mb-3"
        style={{
          backgroundColor: bg,
          border: `0.5px solid ${border}`,
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-2)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)' }}>
          {'NPR = S × O × D = '}
        </span>
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-normal)', color: textColor }}>
          {npr}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)', marginLeft: 'var(--space-2)' }}>
          ({label})
        </span>
      </div>

      {/* Barreras Existentes */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Barreras Existentes
        </label>
        <input
          type="text"
          value={data.barrerasExistentes[0]}
          onChange={(e) => onChange({ ...data, barrerasExistentes: [e.target.value] })}
          className="knar-input"
          placeholder="Ej: Sensor de nivel, Alarma de alto nivel"
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
