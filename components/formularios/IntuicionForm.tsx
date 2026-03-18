/**
 * ============================================================================
 * INTUICION FORM - Direct Registration Form
 * ============================================================================
 *
 * Simple form for intuitive/expert judgment analysis.
 * Used for quick assessments or when formal methodology is not required.
 */

'use client';

import type { FormEvent } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface IntuicionData {
  titulo: string;
  descripcion: string;
  observaciones: string[];
}

export interface IntuicionFormProps {
  data: IntuicionData;
  onChange: (data: IntuicionData) => void;
  analisisFormCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function IntuicionForm({
  data,
  onChange,
  analisisFormCollapsed,
  onToggleCollapse,
}: IntuicionFormProps) {
  return (
    <CollapsibleCard
      title="Registro directo - Entidad Directa"
      icon={
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      }
      isExpanded={!analisisFormCollapsed}
      onToggle={() => onToggleCollapse(!analisisFormCollapsed)}
    >
      <div className="space-y-3">
        <div>
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Título
          </label>
          <input
            type="text"
            value={data.titulo}
            onChange={(e) => onChange({ ...data, titulo: e.target.value })}
            className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
            placeholder="Título del análisis (opcional)"
          />
        </div>
        <div>
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Descripción *
          </label>
          <textarea
            value={data.descripcion}
            onChange={(e) => onChange({ ...data, descripcion: e.target.value })}
            className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
            rows={3}
            placeholder="Descripción detallada de la observación"
          />
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
