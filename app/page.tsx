/**
 * ============================================================================
 * RIESGO APP - Página Principal
 * ============================================================================
 * 
 * Aplicación de mapeo de riesgos industriales con layout de dos paneles.
 * - Izquierda: Tabs múltiples (Configuración, Censo, Relaciones)
 * - Derecha: Tabs exclusivos (Esquemático, Tabla Hallazgo, Tabla Análisis)
 * 
 * @module app/page
 */

'use client';

import { useState, FormEvent } from 'react';
import { SiteHeader } from '@/components';

// ============================================================================
// TYPES
// ============================================================================

type LeftTab = 'configuracion' | 'censo' | 'relaciones';
type RightTab = 'esquematico' | 'tabla-hallazgo' | 'tabla-analisis';
type Metodologia = 'intuicion' | 'hazop' | 'fmea' | 'lopa' | 'oca' | null;

interface ConfigData {
  proyecto: string;
  empresa: string;
  responsable: string;
  validez: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RiesgoApp() {
  // Estado para tab izquierdo (SOLO uno visible a la vez - como el derecho)
  const [leftTabActive, setLeftTabActive] = useState<LeftTab>('configuracion');
  
  // Estado para tab derecho (solo uno visible a la vez)
  const [rightTabActive, setRightTabActive] = useState<RightTab>('esquematico');
  
  // Estado para metodología seleccionada en Censo
  const [metodologiaSeleccionada, setMetodologiaSeleccionada] = useState<Metodologia>(null);
  
  // Estado para configuración del proyecto
  const [configData, setConfigData] = useState<ConfigData>({
    proyecto: '',
    empresa: '',
    responsable: '',
    validez: '',
  });

  // Handle cambio en configuración
  const handleConfigChange = (e: FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setConfigData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-knar-dark font-sans">
      {/* HEADER */}
      <header className="bg-knar-dark border-b border-knar-border px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg
                className="w-6 h-6 text-knar-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h1 className="text-lg font-medium text-knar-text-primary">RiesgoApp</h1>
            </div>
            <span className="text-xs text-knar-text-muted">|</span>
            <span className="text-xs text-knar-text-secondary">Sesión Activa</span>
          </div>

          {/* Right Tab Switcher */}
          <div className="flex items-center space-x-1 bg-knar-charcoal rounded-md p-1">
            <button
              onClick={() => setRightTabActive('esquematico')}
              className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${
                rightTabActive === 'esquematico'
                  ? 'bg-knar-orange text-knar-text-primary'
                  : 'text-knar-text-secondary hover:text-knar-text-primary'
              }`}
            >
              🗺️ Esquemático
            </button>
            <button
              onClick={() => setRightTabActive('tabla-hallazgo')}
              className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${
                rightTabActive === 'tabla-hallazgo'
                  ? 'bg-knar-orange text-knar-text-primary'
                  : 'text-knar-text-secondary hover:text-knar-text-primary'
              }`}
            >
              📊 Tabla Hallazgo
            </button>
            <button
              onClick={() => setRightTabActive('tabla-analisis')}
              className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${
                rightTabActive === 'tabla-analisis'
                  ? 'bg-knar-orange text-knar-text-primary'
                  : 'text-knar-text-secondary hover:text-knar-text-primary'
              }`}
            >
              📋 Tabla Análisis
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT - Two Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Multiple Tabs (40-50%) */}
        <aside className="w-[45%] border-r border-knar-border overflow-y-auto bg-knar-charcoal">
          {/* Left Tab Buttons - EXCLUSIVE (like right panel) */}
          <div className="border-b border-knar-border px-4 py-2 flex space-x-2 flex-shrink-0">
            <button
              onClick={() => setLeftTabActive('configuracion')}
              className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${
                leftTabActive === 'configuracion'
                  ? 'bg-knar-orange text-knar-text-primary'
                  : 'text-knar-text-secondary hover:text-knar-text-primary'
              }`}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => setLeftTabActive('censo')}
              className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${
                leftTabActive === 'censo'
                  ? 'bg-knar-orange text-knar-text-primary'
                  : 'text-knar-text-secondary hover:text-knar-text-primary'
              }`}
            >
              📋 Censo
            </button>
            <button
              onClick={() => setLeftTabActive('relaciones')}
              className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${
                leftTabActive === 'relaciones'
                  ? 'bg-knar-orange text-knar-text-primary'
                  : 'text-knar-text-secondary hover:text-knar-text-primary'
              }`}
            >
              🔗 Relaciones
            </button>
          </div>

          {/* Left Panel Content - Only ACTIVE tab shows */}
          <div className="p-4">
            {/* Configuración Tab */}
            {leftTabActive === 'configuracion' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="knar-card-title">Configuración del Proyecto</h3>
                </div>
                <div className="knar-card-content space-y-3">
                  <div>
                    <label className="block text-xs text-knar-text-secondary mb-1">
                      Proyecto *
                    </label>
                    <input
                      type="text"
                      name="proyecto"
                      value={configData.proyecto}
                      onChange={handleConfigChange}
                      className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                      placeholder="Nombre del proyecto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-knar-text-secondary mb-1">
                      Empresa *
                    </label>
                    <input
                      type="text"
                      name="empresa"
                      value={configData.empresa}
                      onChange={handleConfigChange}
                      className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-knar-text-secondary mb-1">
                      Responsable *
                    </label>
                    <input
                      type="text"
                      name="responsable"
                      value={configData.responsable}
                      onChange={handleConfigChange}
                      className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                      placeholder="Nombre del responsable"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-knar-text-secondary mb-1">
                      Validez *
                    </label>
                    <input
                      type="date"
                      name="validez"
                      value={configData.validez}
                      onChange={handleConfigChange}
                      className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Censo Tab */}
            {leftTabActive === 'censo' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="knar-card-title">Metodologías de Análisis</h3>
                </div>
                <div className="knar-card-content">
                  {metodologiaSeleccionada === null ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setMetodologiaSeleccionada('intuicion')}
                        className="w-full knar-btn knar-btn-primary justify-start"
                      >
                        💡 Intuición
                      </button>
                      <button
                        onClick={() => setMetodologiaSeleccionada('hazop')}
                        className="w-full knar-btn knar-btn-ghost justify-start"
                      >
                        🔍 HAZOP
                      </button>
                      <button
                        onClick={() => setMetodologiaSeleccionada('fmea')}
                        className="w-full knar-btn knar-btn-ghost justify-start"
                      >
                        ⚙️ FMEA
                      </button>
                      <button
                        onClick={() => setMetodologiaSeleccionada('lopa')}
                        className="w-full knar-btn knar-btn-ghost justify-start"
                      >
                        🛡️ LOPA
                      </button>
                      <button
                        onClick={() => setMetodologiaSeleccionada('oca')}
                        className="w-full knar-btn knar-btn-ghost justify-start"
                      >
                        📊 OCA
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-knar-text-primary capitalize">
                          Formulario {metodologiaSeleccionada}
                        </h4>
                        <button
                          onClick={() => setMetodologiaSeleccionada(null)}
                          className="text-xs text-knar-text-muted hover:text-knar-text-primary"
                        >
                          ← Volver
                        </button>
                      </div>
                      <div className="bg-knar-dark rounded p-3 border border-knar-border">
                        <p className="text-xs text-knar-text-secondary">
                          Formulario de {metodologiaSeleccionada} (próximamente)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Relaciones Tab */}
            {leftTabActive === 'relaciones' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="knar-card-title">Relaciones</h3>
                </div>
                <div className="knar-card-content">
                  <p className="text-xs text-knar-text-secondary">
                    Panel de relaciones (próximamente)
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL - Single Tab (50-60%) */}
        <main className="flex-1 overflow-y-auto bg-knar-dark">
          <div className="p-6">
            {/* Esquemático Tab */}
            {rightTabActive === 'esquematico' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="knar-card-title">Esquemático - Sistema de Bombas de Achique</h3>
                </div>
                <div className="knar-card-content">
                  <div className="relative bg-knar-charcoal rounded-lg border border-knar-border overflow-hidden">
                    {/* Placeholder for pump system image */}
                    <div className="aspect-video flex items-center justify-center">
                      <div className="text-center text-knar-text-muted">
                        <p className="text-3xl mb-2">🏭</p>
                        <p className="text-xs">Imagen: Sistema Bombas de Achique_V2.png</p>
                        <p className="text-xs mt-1">Click para colocar hallazgos</p>
                      </div>
                    </div>
                    {/* Edit mode indicator */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-knar-orange bg-opacity-20 border border-knar-orange border-opacity-30 rounded text-xs text-knar-orange">
                      Modo edición: Ubicación
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla Hallazgo Tab */}
            {rightTabActive === 'tabla-hallazgo' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="knar-card-title">Tabla de Hallazgos</h3>
                </div>
                <div className="knar-card-content">
                  <div className="bg-knar-charcoal rounded-lg border border-knar-border p-8 text-center">
                    <p className="text-xs text-knar-text-secondary">
                      Tabla de hallazgos (próximamente)
                    </p>
                    <p className="text-xs text-knar-text-muted mt-2">
                      Filtros: Tipo, Severidad, Ubicación, Relaciones
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla Análisis Tab */}
            {rightTabActive === 'tabla-analisis' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="knar-card-title">Tabla de Análisis</h3>
                </div>
                <div className="knar-card-content">
                  <div className="bg-knar-charcoal rounded-lg border border-knar-border p-8 text-center">
                    <p className="text-xs text-knar-text-secondary">
                      Tabla de análisis (próximamente)
                    </p>
                    <p className="text-xs text-knar-text-muted mt-2">
                      HAZOP, FMEA, LOPA, OCA, Intuición
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-knar-dark border-t border-knar-border px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-knar-text-muted">
          <div className="flex items-center space-x-3">
            <span>
              Proyecto: <span className="text-knar-text-secondary">{configData.proyecto || '—'}</span>
            </span>
            <span>|</span>
            <span>
              Empresa: <span className="text-knar-text-secondary">{configData.empresa || '—'}</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span>
              Responsable: <span className="text-knar-text-secondary">{configData.responsable || '—'}</span>
            </span>
            <span>|</span>
            <span>
              Validez: <span className="text-knar-text-secondary">{configData.validez || '—'}</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
