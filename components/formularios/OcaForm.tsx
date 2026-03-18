/**
 * ============================================================================
 * OCA FORM - Consequence Analysis Form
 * ============================================================================
 *
 * Form for OCA (Consequence Analysis) methodology.
 * Used to analyze chemical dispersion and consequence distances.
 */

'use client';

// ============================================================================
// TYPES
// ============================================================================

export interface OcaData {
  compuesto: string;
  cantidad: number;
  viento: number;
  factorViento: number;
  estabilidad: string;
  factorEscalabilidad: number;
  topografia: string;
  factorTopografia: number;
  tipoEscenario: string;
  endpoint: number;
  tasaLiberacion: number;
  distanciaEndpointMillas: number;
  distanciaEndpointKm: number;
  areaAfectadaMillas2: number;
  areaAfectadaKm2: number;
  programaRMP: string;
  evaluacion: string;
  barrerasExistentes: string[];
  gaps: string[];
  recomendaciones: string[];
}

export interface OcaFormProps {
  data: OcaData;
  onChange: (data: OcaData) => void;
  analisisFormCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const ENDPOINTS: Record<string, number> = {
  H2S: 0.0017,
  CO: 0.035,
  Cl2: 0.0035,
  SO2: 0.014,
  NH3: 0.14,
  PM10: 0.15,
  Diesel: 0.05,
};

const ESTABILIDAD_FACTORES: Record<string, number> = {
  A: 0.5,
  B: 0.7,
  C: 0.9,
  D: 1.0,
  E: 1.2,
  F: 1.5,
};

function getEndpointPorCompuesto(compuesto: string): number {
  return ENDPOINTS[compuesto] || 0.0017;
}

function calcularFactorViento(viento: number): number {
  if (viento <= 0) return 1.0;
  return 1.5 / viento;
}

function calcularFactorEscalabilidad(estabilidad: string): number {
  return ESTABILIDAD_FACTORES[estabilidad] || 1.0;
}

function calcularFactorTopografia(topografia: string): number {
  return topografia === 'Urbana' ? 0.85 : 1.0;
}

function calcularTasaLiberacion(cantidad: number, tipoEscenario: string): number {
  const tiempo = tipoEscenario === 'Worst-Case' ? 10 : 60;
  return cantidad / tiempo;
}

function calcularDistanciaEndpoint(
  tasa: number,
  endpoint: number,
  factorViento: number,
  factorEscalabilidad: number,
  factorTopografia: number
): number {
  if (tasa <= 0 || endpoint <= 0) return 0;
  const factores = factorViento * factorEscalabilidad * factorTopografia;
  return 0.45 * Math.log10(tasa / endpoint) * factores;
}

function obtenerProgramaRMP(distanciaMillas: number): string {
  if (distanciaMillas < 1) return 'Programa 1';
  if (distanciaMillas <= 5) return 'Programa 2';
  return 'Programa 3';
}

function obtenerEvaluacion(distanciaMillas: number): string {
  if (distanciaMillas < 2) return '🟢 BAJA';
  if (distanciaMillas <= 5) return '🟡 MODERADA';
  return '🔴 ALTA';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function OcaForm({
  data,
  onChange,
  analisisFormCollapsed,
  onToggleCollapse,
}: OcaFormProps) {
  // Calculate derived values
  const distancia = calcularDistanciaEndpoint(
    data.tasaLiberacion || 0,
    data.endpoint,
    data.factorViento,
    data.factorEscalabilidad,
    data.factorTopografia
  );

  const distanciaKm = distancia * 1.60934;
  const areaMillas2 = Math.PI * Math.pow(distancia, 2);
  const areaKm2 = areaMillas2 * 2.58999;
  const programaRMP = obtenerProgramaRMP(distancia);
  const evaluacion = obtenerEvaluacion(distancia);

  const handleCompuestoChange = (compuesto: string) => {
    const endpoint = getEndpointPorCompuesto(compuesto);
    onChange({ ...data, compuesto, endpoint });
  };

  const handleVientoChange = (viento: number) => {
    const factorViento = calcularFactorViento(viento);
    onChange({ ...data, viento, factorViento });
  };

  const handleEstabilidadChange = (estabilidad: string) => {
    const factorEscalabilidad = calcularFactorEscalabilidad(estabilidad);
    onChange({ ...data, estabilidad, factorEscalabilidad });
  };

  const handleTopografiaChange = (topografia: string) => {
    const factorTopografia = calcularFactorTopografia(topografia);
    onChange({ ...data, topografia, factorTopografia });
  };

  const handleTipoEscenarioChange = (tipoEscenario: string) => {
    const tasaLiberacion = calcularTasaLiberacion(data.cantidad, tipoEscenario);
    onChange({ ...data, tipoEscenario, tasaLiberacion });
  };

  return (
    <CollapsibleCard
      title="OCA - Consecuencias"
      icon={
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      isExpanded={!analisisFormCollapsed}
      onToggle={() => onToggleCollapse(!analisisFormCollapsed)}
    >
      {/* Compuesto */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Compuesto Químico *
        </label>
        <select
          value={data.compuesto}
          onChange={(e) => handleCompuestoChange(e.target.value)}
          className="knar-input"
        >
          <option value="H2S">H2S (Ácido Sulfhídrico)</option>
          <option value="CO">CO (Monóxido de Carbono)</option>
          <option value="Cl2">Cl2 (Cloro)</option>
          <option value="SO2">SO2 (Dióxido de Azufre)</option>
          <option value="NH3">NH3 (Amoníaco)</option>
          <option value="PM10">PM10 (Material Particulado)</option>
          <option value="Diesel">Diesel</option>
        </select>
      </div>

      {/* Cantidad */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Cantidad (lb) *
        </label>
        <input
          type="number"
          value={data.cantidad}
          onChange={(e) => {
            const cantidad = Number(e.target.value);
            const tasaLiberacion = calcularTasaLiberacion(cantidad, data.tipoEscenario);
            onChange({ ...data, cantidad, tasaLiberacion });
          }}
          className="knar-input"
          placeholder="Ej: 1000"
        />
      </div>

      {/* Viento */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Viento (m/s) *
        </label>
        <input
          type="number"
          step="0.01"
          value={data.viento}
          onChange={(e) => handleVientoChange(Number(e.target.value))}
          className="knar-input"
          placeholder="Ej: 1.50"
        />
      </div>

      {/* Factor del Viento (calculado) */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Factor del Viento
          <span className="text-knar-text-muted ml-2">(calculado: 1.5 / viento)</span>
        </label>
        <input
          type="number"
          readOnly
          value={data.factorViento.toFixed(2)}
          className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
        />
      </div>

      {/* Estabilidad */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Estabilidad Atmosférica *
        </label>
        <select
          value={data.estabilidad}
          onChange={(e) => handleEstabilidadChange(e.target.value)}
          className="knar-input"
        >
          <option value="A">A - Muy inestable</option>
          <option value="B">B - Inestable</option>
          <option value="C">C - Ligeramente inestable</option>
          <option value="D">D - Neutral (típico)</option>
          <option value="E">E - Ligeramente estable</option>
          <option value="F">F - Muy estable (worst-case)</option>
        </select>
      </div>

      {/* Factor de Escalabilidad (calculado) */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Factor de Escalabilidad
          <span className="text-knar-text-muted ml-2">(calculado)</span>
        </label>
        <input
          type="number"
          readOnly
          value={data.factorEscalabilidad.toFixed(2)}
          className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
        />
      </div>

      {/* Topografía */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Topografía *
        </label>
        <select
          value={data.topografia}
          onChange={(e) => handleTopografiaChange(e.target.value)}
          className="knar-input"
        >
          <option value="Urbana">Urbana</option>
          <option value="Rural">Rural</option>
        </select>
      </div>

      {/* Factor de Topografía (calculado) */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Factor de Topografía
          <span className="text-knar-text-muted ml-2">(calculado)</span>
        </label>
        <input
          type="number"
          readOnly
          value={data.factorTopografia.toFixed(2)}
          className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
        />
      </div>

      {/* Tipo de Escenario */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Tipo de Escenario *
        </label>
        <select
          value={data.tipoEscenario}
          onChange={(e) => handleTipoEscenarioChange(e.target.value)}
          className="knar-input"
        >
          <option value="Worst-Case">Worst-Case (10 min)</option>
          <option value="Alternativo">Alternativo (60 min)</option>
        </select>
      </div>

      {/* Endpoint */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Endpoint (mg/L) *
        </label>
        <input
          type="number"
          step="0.0001"
          value={data.endpoint}
          onChange={(e) => onChange({ ...data, endpoint: Number(e.target.value) })}
          className="knar-input"
          placeholder="Auto-fill según compuesto"
        />
      </div>

      {/* Tasa de Liberación (calculado) */}
      <div className="mb-3">
        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Tasa de Liberación (lb/min)
          <span className="text-knar-text-muted ml-2">(calculado)</span>
        </label>
        <input
          type="number"
          readOnly
          value={(data.tasaLiberacion || 0).toFixed(2)}
          className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
        />
      </div>

      {/* Dispersion Calculations */}
      <div className="bg-knar-charcoal rounded p-3 space-y-2 border border-knar-border mb-3">
        <h4 className="text-xs font-medium text-knar-text-primary">Cálculos de Dispersión</h4>

        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">Distancia al Endpoint:</span>
          <span className="text-knar-text-primary font-mono">{distancia.toFixed(2)} millas</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">Distancia en km:</span>
          <span className="text-knar-text-primary font-mono">{distanciaKm.toFixed(2)} km</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">Área Afectada:</span>
          <span className="text-knar-text-primary font-mono">{areaMillas2.toFixed(4)} miles²</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">Programa RMP:</span>
          <span className="text-knar-text-primary font-mono">{programaRMP}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-knar-text-muted">Evaluación:</span>
          <span className="text-knar-text-primary font-mono">{evaluacion}</span>
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
