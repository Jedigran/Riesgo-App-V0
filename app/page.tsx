/**
 * ============================================================================
 * RIESGO APP - Página Principal con 5 Formularios Completos
 * ============================================================================
 * 
 * Formularios implementados:
 * 1. Intuición - Creación directa de hallazgos
 * 2. HAZOP - Hazard and Operability Study
 * 3. FMEA - Failure Mode and Effects Analysis
 * 4. LOPA - Layer of Protection Analysis
 * 5. OCA - Consequence Analysis
 * 
 * Cada formulario tiene DOS secciones:
 * - Section 1: Campos de la metodología
 * - Section 2: Creación de hallazgos (Peligro, Barrera, POE, SOL)
 * 
 * @module app/page
 */

'use client';

import { useState, FormEvent, useCallback } from 'react';
import { useAnalisis } from '@/src/controllers/useAnalisis';
import { useHallazgo } from '@/src/controllers/useHallazgo';
import { useUIEstado } from '@/src/controllers/useUIEstado';
import { useMapa } from '@/src/controllers/useMapa';
import { SiteHeader } from '@/components';
import TablaHallazgos from '@/components/tabla/TablaHallazgos';
import TablaAnalisis from '@/components/tabla/TablaAnalisis';

// ============================================================================
// TYPES
// ============================================================================

type LeftTab = 'configuracion' | 'censo' | 'relaciones';
type RightTab = 'esquematico' | 'tabla-hallazgo' | 'tabla-analisis';
type Metodologia = 'intuicion' | 'hazop' | 'fmea' | 'lopa' | 'oca' | null;
type HallazgoTipo = 'Peligro' | 'Barrera' | 'POE' | 'SOL';

interface ConfigData {
  proyecto: string;
  empresa: string;
  responsable: string;
  validez: string;
}

interface HallazgoFormData {
  id: string;
  tipo: HallazgoTipo;
  titulo: string;
  descripcion: string;
  ubicacion?: { x: number; y: number };
  // Peligro
  consecuencia?: string;
  severidad?: number;
  causaRaiz?: string;
  // Barrera
  tipoBarrera?: 'Fisica' | 'Administrativa' | 'Humana';
  efectividadEstimada?: number;
  elementoProtegido?: string;
  // POE
  procedimientoReferencia?: string;
  frecuenciaAplicacion?: string;
  responsable?: string;
  // SOL
  capaNumero?: number;
  independiente?: boolean;
  tipoTecnologia?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RiesgoApp() {
  // Estado para tab izquierdo (EXCLUSIVO)
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

  // ========================================
  // ESTADOS PARA CADA FORMULARIO (SECTION 1)
  // ========================================

  // HAZOP
  const [hazopData, setHazopData] = useState({
    nodo: '',
    parametro: '',
    palabraGuia: '',
    causa: '',
    consecuencia: '',
    salvaguardasExistentes: [''],
    recomendaciones: [''],
  });

  // FMEA
  const [fmeaData, setFmeaData] = useState({
    componente: '',
    modoFalla: '',
    efecto: '',
    causa: '',
    controlesActuales: [''],
    S: 1,
    O: 1,
    D: 1,
    RPN: 1,
    accionesRecomendadas: [''],
  });

  // LOPA
  const [lopaData, setLopaData] = useState({
    escenario: '',
    frecuenciaInicial: 0.1,
    consecuencia: '',
    capasIPL: [{ nombre: '', pfd: 0.1 }],
    frecuenciaFinal: 0.01,
    objetivoRiesgo: 0.001,
  });

  // OCA
  const [ocaData, setOcaData] = useState({
    eventoIniciador: '',
    consecuencia: '',
    barrerasExistentes: [''],
    gaps: [''],
    recomendaciones: [''],
  });

  // Intuicion
  const [intuicionData, setIntuicionData] = useState({
    titulo: '',
    descripcion: '',
    observaciones: [''],
  });

  // ========================================
  // ESTADOS PARA SECTION 2: HALLAZGOS
  // ========================================

  const [hallazgoTipoSeleccionado, setHallazgoTipoSeleccionado] = useState<HallazgoTipo>('Peligro');
  const [hallazgosForm, setHallazgosForm] = useState<HallazgoFormData[]>([]);
  const [ubicacionEditando, setUbicacionEditando] = useState<string | null>(null);

  // ========================================
  // HOOKS
  // ========================================

  const { crearAnalisisHAZOP, crearAnalisisFMEA, crearAnalisisLOPA, crearAnalisisOCA, crearAnalisisIntuicion } = useAnalisis();
  const { crearPeligro, crearBarrera, crearPOE, crearSOL } = useHallazgo();
  const { agregarError, agregarNotificacion } = useUIEstado();
  const { actualizarUbicacionHallazgo } = useMapa();

  // ========================================
  // HANDLERS
  // ========================================

  const handleConfigChange = (e: FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setConfigData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ubicacionEditando) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setHallazgosForm((prev) =>
      prev.map((h) =>
        h.id === ubicacionEditando
          ? { ...h, ubicacion: { x: Math.round(x), y: Math.round(y) } }
          : h
      )
    );
  }, [ubicacionEditando]);

  const agregarHallazgo = () => {
    const nuevoHallazgo: HallazgoFormData = {
      id: `hallazgo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tipo: hallazgoTipoSeleccionado,
      titulo: '',
      descripcion: '',
    };
    setHallazgosForm((prev) => [...prev, nuevoHallazgo]);
  };

  const actualizarHallazgo = (id: string, campo: keyof HallazgoFormData, valor: any) => {
    setHallazgosForm((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [campo]: valor } : h))
    );
  };

  const eliminarHallazgo = (id: string) => {
    setHallazgosForm((prev) => prev.filter((h) => h.id !== id));
  };

  // ========================================
  // SHARED HALLAZGO CREATOR (all types)
  // ========================================
  const crearHallazgosDeFormulario = (analisisId: string) => {
    // Default location for hallazgos not yet placed on the schematic
    const ubicacionDefault = { x: 0, y: 0 };

    for (const hallazgo of hallazgosForm) {
      const ubicacion = hallazgo.ubicacion ?? ubicacionDefault;

      if (hallazgo.tipo === 'Peligro') {
        crearPeligro({
          titulo: hallazgo.titulo || 'Sin título',
          descripcion: hallazgo.descripcion || 'Sin descripción',
          consecuencia: hallazgo.consecuencia || 'Por definir',
          severidad: (hallazgo.severidad || 3) as any,
          causaRaiz: hallazgo.causaRaiz || 'Por definir',
          analisisOrigenIds: [analisisId],
        }, ubicacion);
      } else if (hallazgo.tipo === 'Barrera') {
        crearBarrera({
          titulo: hallazgo.titulo || 'Sin título',
          descripcion: hallazgo.descripcion || 'Sin descripción',
          tipoBarrera: (hallazgo.tipoBarrera || 'Fisica') as any,
          efectividadEstimada: (hallazgo.efectividadEstimada || 3) as any,
          elementoProtegido: hallazgo.elementoProtegido || 'Por definir',
          analisisOrigenIds: [analisisId],
        }, ubicacion);
      } else if (hallazgo.tipo === 'POE') {
        crearPOE({
          titulo: hallazgo.titulo || 'Sin título',
          descripcion: hallazgo.descripcion || 'Sin descripción',
          procedimientoReferencia: hallazgo.procedimientoReferencia || 'Por definir',
          frecuenciaAplicacion: hallazgo.frecuenciaAplicacion || 'Por definir',
          responsable: hallazgo.responsable || 'Por definir',
          analisisOrigenIds: [analisisId],
        }, ubicacion);
      } else if (hallazgo.tipo === 'SOL') {
        crearSOL({
          titulo: hallazgo.titulo || 'Sin título',
          descripcion: hallazgo.descripcion || 'Sin descripción',
          capaNumero: hallazgo.capaNumero || 1,
          independiente: hallazgo.independiente ?? true,
          tipoTecnologia: hallazgo.tipoTecnologia || 'Por definir',
          analisisOrigenIds: [analisisId],
        }, ubicacion);
      }
    }
  };

  // ========================================
  // UNIFIED GUARDAR HANDLER
  // ========================================
  const handleGuardar = async () => {
    // ========== HAZOP ==========
    if (metodologiaSeleccionada === 'hazop') {
      if (!hazopData.nodo.trim() || !hazopData.parametro.trim() || !hazopData.causa.trim() || !hazopData.consecuencia.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete los campos requeridos de HAZOP' });
        return;
      }
      if (hallazgosForm.length === 0) {
        agregarError({ severidad: 'warning', mensaje: 'Agregue al menos un hallazgo' });
        return;
      }

      try {
        const resultadoAnalisis = crearAnalisisHAZOP({
          nodo: hazopData.nodo,
          parametro: hazopData.parametro,
          palabraGuia: hazopData.palabraGuia,
          causa: hazopData.causa,
          consecuencia: hazopData.consecuencia,
          salvaguardasExistentes: hazopData.salvaguardasExistentes.filter(s => s.trim()).length > 0 ? hazopData.salvaguardasExistentes.filter(s => s.trim()) : [''],
          recomendaciones: hazopData.recomendaciones.filter(r => r.trim()).length > 0 ? hazopData.recomendaciones.filter(r => r.trim()) : [''],
        });

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar HAZOP' });
          return;
        }

        crearHallazgosDeFormulario(resultadoAnalisis.id);
        agregarNotificacion({ tipo: 'success', titulo: 'HAZOP Guardado', mensaje: 'Análisis y hallazgos guardados', duracion: 3000 });
        setHazopData({ nodo: '', parametro: '', palabraGuia: '', causa: '', consecuencia: '', salvaguardasExistentes: [''], recomendaciones: [''] });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar HAZOP' });
      }
    }
    // ========== FMEA ==========
    else if (metodologiaSeleccionada === 'fmea') {
      if (!fmeaData.componente.trim() || !fmeaData.modoFalla.trim() || !fmeaData.efecto.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete los campos requeridos de FMEA' });
        return;
      }

      try {
        const resultadoAnalisis = crearAnalisisFMEA({
          componente: fmeaData.componente,
          modoFalla: fmeaData.modoFalla,
          efecto: fmeaData.efecto,
          causa: fmeaData.causa,
          controlesActuales: fmeaData.controlesActuales.filter(c => c.trim()).length > 0 ? fmeaData.controlesActuales.filter(c => c.trim()) : [''],
          S: fmeaData.S,
          O: fmeaData.O,
          D: fmeaData.D,
          RPN: fmeaData.S * fmeaData.O * fmeaData.D,
          accionesRecomendadas: fmeaData.accionesRecomendadas.filter(a => a.trim()).length > 0 ? fmeaData.accionesRecomendadas.filter(a => a.trim()) : [''],
        });

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar FMEA' });
          return;
        }

        crearHallazgosDeFormulario(resultadoAnalisis.id);
        agregarNotificacion({ tipo: 'success', titulo: 'FMEA Guardado', mensaje: 'Análisis y hallazgos guardados', duracion: 3000 });
        setFmeaData({ componente: '', modoFalla: '', efecto: '', causa: '', controlesActuales: [''], S: 1, O: 1, D: 1, RPN: 1, accionesRecomendadas: [''] });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar FMEA' });
      }
    }
    // ========== LOPA ==========
    else if (metodologiaSeleccionada === 'lopa') {
      if (!lopaData.escenario.trim() || !lopaData.consecuencia.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete los campos requeridos de LOPA' });
        return;
      }

      try {
        const resultadoAnalisis = crearAnalisisLOPA({
          escenario: lopaData.escenario,
          frecuenciaInicial: lopaData.frecuenciaInicial,
          consecuencia: lopaData.consecuencia,
          capasIPL: lopaData.capasIPL.filter(c => c.nombre.trim()).length > 0 ? lopaData.capasIPL.filter(c => c.nombre.trim()) : [{ nombre: '', pfd: 0.1 }],
          frecuenciaFinal: lopaData.frecuenciaFinal,
          objetivoRiesgo: lopaData.objetivoRiesgo,
        });

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar LOPA' });
          return;
        }

        crearHallazgosDeFormulario(resultadoAnalisis.id);
        agregarNotificacion({ tipo: 'success', titulo: 'LOPA Guardado', mensaje: 'Análisis y hallazgos guardados', duracion: 3000 });
        setLopaData({ escenario: '', frecuenciaInicial: 0.1, consecuencia: '', capasIPL: [{ nombre: '', pfd: 0.1 }], frecuenciaFinal: 0.01, objetivoRiesgo: 0.001 });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar LOPA' });
      }
    }
    // ========== OCA ==========
    else if (metodologiaSeleccionada === 'oca') {
      if (!ocaData.eventoIniciador.trim() || !ocaData.consecuencia.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete los campos requeridos de OCA' });
        return;
      }

      try {
        const resultadoAnalisis = crearAnalisisOCA({
          eventoIniciador: ocaData.eventoIniciador,
          consecuencia: ocaData.consecuencia,
          barrerasExistentes: ocaData.barrerasExistentes.filter(b => b.trim()).length > 0 ? ocaData.barrerasExistentes.filter(b => b.trim()) : [''],
          gaps: ocaData.gaps.filter(g => g.trim()).length > 0 ? ocaData.gaps.filter(g => g.trim()) : [''],
          recomendaciones: ocaData.recomendaciones.filter(r => r.trim()).length > 0 ? ocaData.recomendaciones.filter(r => r.trim()) : [''],
        });

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar OCA' });
          return;
        }

        crearHallazgosDeFormulario(resultadoAnalisis.id);
        agregarNotificacion({ tipo: 'success', titulo: 'OCA Guardado', mensaje: 'Análisis y hallazgos guardados', duracion: 3000 });
        setOcaData({ eventoIniciador: '', consecuencia: '', barrerasExistentes: [''], gaps: [''], recomendaciones: [''] });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar OCA' });
      }
    }
    // ========== INTUICION ==========
    else if (metodologiaSeleccionada === 'intuicion') {
      if (!intuicionData.titulo.trim() || !intuicionData.descripcion.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete título y descripción' });
        return;
      }

      try {
        const resultadoAnalisis = crearAnalisisIntuicion({
          titulo: intuicionData.titulo,
          descripcion: intuicionData.descripcion,
          observaciones: intuicionData.observaciones.filter(o => o.trim()).length > 0 ? intuicionData.observaciones.filter(o => o.trim()) : [''],
        });

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar Intuición' });
          return;
        }

        crearHallazgosDeFormulario(resultadoAnalisis.id);
        agregarNotificacion({ tipo: 'success', titulo: 'Intuición Guardada', mensaje: 'Análisis y hallazgos guardados', duracion: 3000 });
        setIntuicionData({ titulo: '', descripcion: '', observaciones: [''] });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar Intuición' });
      }
    }
    else {
      agregarError({ severidad: 'error', mensaje: 'Seleccione una metodología' });
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen flex flex-col bg-knar-dark font-sans">
      {/* HEADER */}
      <header className="bg-knar-dark border-b border-knar-border px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-knar-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h1 className="text-lg font-medium text-knar-text-primary">RiesgoApp</h1>
            </div>
            <span className="text-xs text-knar-text-muted">|</span>
            <span className="text-xs text-knar-text-secondary">Sesión Activa</span>
          </div>

          {/* Right Tab Switcher */}
          <div className="flex items-center space-x-1 bg-knar-charcoal rounded-md p-1">
            <button onClick={() => setRightTabActive('esquematico')} className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${rightTabActive === 'esquematico' ? 'bg-knar-orange text-knar-text-primary' : 'text-knar-text-secondary hover:text-knar-text-primary'}`}>🗺️ Esquemático</button>
            <button onClick={() => setRightTabActive('tabla-hallazgo')} className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${rightTabActive === 'tabla-hallazgo' ? 'bg-knar-orange text-knar-text-primary' : 'text-knar-text-secondary hover:text-knar-text-primary'}`}>📊 Tabla Hallazgo</button>
            <button onClick={() => setRightTabActive('tabla-analisis')} className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${rightTabActive === 'tabla-analisis' ? 'bg-knar-orange text-knar-text-primary' : 'text-knar-text-secondary hover:text-knar-text-primary'}`}>📋 Tabla Análisis</button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT - Two Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Exclusive Tabs (45%) */}
        <aside className="w-[45%] border-r border-knar-border overflow-y-auto bg-knar-charcoal">
          {/* Left Tab Buttons */}
          <div className="border-b border-knar-border px-4 py-2 flex space-x-2 flex-shrink-0">
            <button onClick={() => setLeftTabActive('configuracion')} className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${leftTabActive === 'configuracion' ? 'bg-knar-orange text-knar-text-primary' : 'text-knar-text-secondary hover:text-knar-text-primary'}`}>⚙️ Configuración</button>
            <button onClick={() => setLeftTabActive('censo')} className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${leftTabActive === 'censo' ? 'bg-knar-orange text-knar-text-primary' : 'text-knar-text-secondary hover:text-knar-text-primary'}`}>📋 Censo</button>
            <button onClick={() => setLeftTabActive('relaciones')} className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${leftTabActive === 'relaciones' ? 'bg-knar-orange text-knar-text-primary' : 'text-knar-text-secondary hover:text-knar-text-primary'}`}>🔗 Relaciones</button>
          </div>

          {/* Left Panel Content */}
          <div className="p-4">
            {/* Configuración Tab */}
            {leftTabActive === 'configuracion' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3 className="knar-card-title">Configuración del Proyecto</h3>
                </div>
                <div className="knar-card-content space-y-3">
                  <div><label className="block text-xs text-knar-text-secondary mb-1">Proyecto *</label><input type="text" name="proyecto" value={configData.proyecto} onChange={handleConfigChange} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Nombre del proyecto" /></div>
                  <div><label className="block text-xs text-knar-text-secondary mb-1">Empresa *</label><input type="text" name="empresa" value={configData.empresa} onChange={handleConfigChange} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Nombre de la empresa" /></div>
                  <div><label className="block text-xs text-knar-text-secondary mb-1">Responsable *</label><input type="text" name="responsable" value={configData.responsable} onChange={handleConfigChange} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Nombre del responsable" /></div>
                  <div><label className="block text-xs text-knar-text-secondary mb-1">Validez *</label><input type="date" name="validez" value={configData.validez} onChange={handleConfigChange} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                </div>
              </div>
            )}

            {/* Censo Tab */}
            {leftTabActive === 'censo' && (
              <div className="space-y-4">
                {metodologiaSeleccionada === null ? (
                  /* Lista de metodologías */
                  <div className="knar-card">
                    <div className="knar-card-header">
                      <div className="knar-icon-box">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <h3 className="knar-card-title">Metodologías de Análisis</h3>
                    </div>
                    <div className="knar-card-content space-y-2">
                      <button onClick={() => setMetodologiaSeleccionada('intuicion')} className="w-full knar-btn knar-btn-primary justify-start">💡 Intuición</button>
                      <button onClick={() => setMetodologiaSeleccionada('hazop')} className="w-full knar-btn knar-btn-ghost justify-start">🔍 HAZOP</button>
                      <button onClick={() => setMetodologiaSeleccionada('fmea')} className="w-full knar-btn knar-btn-ghost justify-start">⚙️ FMEA</button>
                      <button onClick={() => setMetodologiaSeleccionada('lopa')} className="w-full knar-btn knar-btn-ghost justify-start">🛡️ LOPA</button>
                      <button onClick={() => setMetodologiaSeleccionada('oca')} className="w-full knar-btn knar-btn-ghost justify-start">📊 OCA</button>
                    </div>
                  </div>
                ) : (
                  /* Formulario de metodología */
                  <div className="space-y-4">
                    <button onClick={() => { setMetodologiaSeleccionada(null); setHallazgosForm([]); }} className="knar-btn knar-btn-ghost">← Volver a metodologías</button>

                    {/* ========== HAZOP FORM ========== */}
                    {metodologiaSeleccionada === 'hazop' && (
                      <>
                        <div className="knar-card">
                          <div className="knar-card-header">
                            <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            <h3 className="knar-card-title">HAZOP - Nodo de Análisis</h3>
                          </div>
                          <div className="knar-card-content space-y-3">
                            <div><label className="block text-xs text-knar-text-secondary mb-1">Nodo *</label><input type="text" value={hazopData.nodo} onChange={(e) => setHazopData({ ...hazopData, nodo: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Ej: Reactor R-101" /></div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className="block text-xs text-knar-text-secondary mb-1">Parámetro *</label><select value={hazopData.parametro} onChange={(e) => setHazopData({ ...hazopData, parametro: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="">Seleccionar</option><option value="Flujo">Flujo</option><option value="Presión">Presión</option><option value="Temperatura">Temperatura</option><option value="Nivel">Nivel</option></select></div>
                              <div><label className="block text-xs text-knar-text-secondary mb-1">Palabra Guía *</label><select value={hazopData.palabraGuia} onChange={(e) => setHazopData({ ...hazopData, palabraGuia: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="">Seleccionar</option><option value="MÁS">Más de</option><option value="MENOS">Menos de</option><option value="NO">No</option><option value="INVERSO">Inverso</option></select></div>
                            </div>
                            <div><label className="block text-xs text-knar-text-secondary mb-1">Causa *</label><textarea value={hazopData.causa} onChange={(e) => setHazopData({ ...hazopData, causa: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" rows={2} placeholder="Causa de la desviación" /></div>
                            <div><label className="block text-xs text-knar-text-secondary mb-1">Consecuencia *</label><textarea value={hazopData.consecuencia} onChange={(e) => setHazopData({ ...hazopData, consecuencia: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" rows={2} placeholder="Consecuencia si ocurre" /></div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ========== FMEA FORM ========== */}
                    {metodologiaSeleccionada === 'fmea' && (
                      <div className="knar-card">
                        <div className="knar-card-header">
                          <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v10m0-10V4m0 4a2 2 0 110 4 2 2 0 010-4z" /></svg></div>
                          <h3 className="knar-card-title">FMEA - Análisis de Fallas</h3>
                        </div>
                        <div className="knar-card-content space-y-3">
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Componente *</label><input type="text" value={fmeaData.componente} onChange={(e) => setFmeaData({ ...fmeaData, componente: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Ej: Bomba P-201" /></div>
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Modo de Falla *</label><input type="text" value={fmeaData.modoFalla} onChange={(e) => setFmeaData({ ...fmeaData, modoFalla: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Ej: Pérdida de sello" /></div>
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Efecto *</label><input type="text" value={fmeaData.efecto} onChange={(e) => setFmeaData({ ...fmeaData, efecto: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Ej: Fuga de producto" /></div>
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Causa *</label><input type="text" value={fmeaData.causa} onChange={(e) => setFmeaData({ ...fmeaData, causa: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Causa raíz" /></div>
                          <div className="grid grid-cols-3 gap-2">
                            <div><label className="block text-xs text-knar-text-secondary mb-1">S (1-10) *</label><input type="number" min="1" max="10" value={fmeaData.S} onChange={(e) => setFmeaData({ ...fmeaData, S: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                            <div><label className="block text-xs text-knar-text-secondary mb-1">O (1-10) *</label><input type="number" min="1" max="10" value={fmeaData.O} onChange={(e) => setFmeaData({ ...fmeaData, O: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                            <div><label className="block text-xs text-knar-text-secondary mb-1">D (1-10) *</label><input type="number" min="1" max="10" value={fmeaData.D} onChange={(e) => setFmeaData({ ...fmeaData, D: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                          </div>
                          <div className="bg-knar-dark rounded p-2 text-center">
                            <span className="text-xs text-knar-text-muted">RPN = S × O × D = </span>
                            <span className="text-sm font-bold text-knar-orange">{fmeaData.S * fmeaData.O * fmeaData.D}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========== LOPA FORM ========== */}
                    {metodologiaSeleccionada === 'lopa' && (
                      <div className="knar-card">
                        <div className="knar-card-header">
                          <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                          <h3 className="knar-card-title">LOPA - Capas de Protección</h3>
                        </div>
                        <div className="knar-card-content space-y-3">
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Escenario *</label><input type="text" value={lopaData.escenario} onChange={(e) => setLopaData({ ...lopaData, escenario: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Ej: Sobrepresión en separador" /></div>
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Consecuencia *</label><input type="text" value={lopaData.consecuencia} onChange={(e) => setLopaData({ ...lopaData, consecuencia: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Consecuencia si fallan todas las capas" /></div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs text-knar-text-secondary mb-1">Frecuencia Inicial (eventos/año)</label><input type="number" step="0.0001" value={lopaData.frecuenciaInicial} onChange={(e) => setLopaData({ ...lopaData, frecuenciaInicial: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                            <div><label className="block text-xs text-knar-text-secondary mb-1">Objetivo de Riesgo</label><input type="number" step="0.0001" value={lopaData.objetivoRiesgo} onChange={(e) => setLopaData({ ...lopaData, objetivoRiesgo: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========== OCA FORM ========== */}
                    {metodologiaSeleccionada === 'oca' && (
                      <div className="knar-card">
                        <div className="knar-card-header">
                          <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                          <h3 className="knar-card-title">OCA - Análisis de Consecuencias</h3>
                        </div>
                        <div className="knar-card-content space-y-3">
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Evento Iniciador *</label><input type="text" value={ocaData.eventoIniciador} onChange={(e) => setOcaData({ ...ocaData, eventoIniciador: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Ej: Pérdida de energía" /></div>
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Consecuencia *</label><input type="text" value={ocaData.consecuencia} onChange={(e) => setOcaData({ ...ocaData, consecuencia: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Consecuencia potencial" /></div>
                        </div>
                      </div>
                    )}

                    {/* ========== INTUICION FORM ========== */}
                    {metodologiaSeleccionada === 'intuicion' && (
                      <div className="knar-card">
                        <div className="knar-card-header">
                          <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
                          <h3 className="knar-card-title">Intuición - Hallazgo Directo</h3>
                        </div>
                        <div className="knar-card-content space-y-3">
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Título *</label><input type="text" value={intuicionData.titulo} onChange={(e) => setIntuicionData({ ...intuicionData, titulo: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Título del hallazgo" /></div>
                          <div><label className="block text-xs text-knar-text-secondary mb-1">Descripción *</label><textarea value={intuicionData.descripcion} onChange={(e) => setIntuicionData({ ...intuicionData, descripcion: e.target.value })} className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" rows={3} placeholder="Descripción detallada de la observación" /></div>
                        </div>
                      </div>
                    )}

                    {/* ========== SECTION 2: HALLAZGOS (COMÚN PARA TODOS) ========== */}
                    <div className="knar-card">
                      <div className="knar-card-header">
                        <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg></div>
                        <h3 className="knar-card-title">Crear Hallazgos</h3>
                      </div>
                      <div className="knar-card-content space-y-4">
                        <div className="flex items-center space-x-2">
                          <select value={hallazgoTipoSeleccionado} onChange={(e) => setHallazgoTipoSeleccionado(e.target.value as HallazgoTipo)} className="flex-1 px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none">
                            <option value="Peligro">Peligro</option>
                            <option value="Barrera">Barrera</option>
                            <option value="POE">POE</option>
                            <option value="SOL">SOL</option>
                          </select>
                          <button onClick={agregarHallazgo} className="knar-btn knar-btn-primary">+ Agregar</button>
                        </div>

                        {hallazgosForm.length === 0 ? (
                          <p className="text-xs text-knar-text-muted text-center py-4">No hay hallazgos agregados. Seleccione un tipo y haga clic en "+ Agregar"</p>
                        ) : (
                          <div className="space-y-3">
                            {hallazgosForm.map((hallazgo, index) => (
                              <div key={hallazgo.id} className="bg-knar-dark rounded border border-knar-border p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-knar-text-primary">Hallazgo {index + 1}: {hallazgo.tipo}</span>
                                  <button onClick={() => eliminarHallazgo(hallazgo.id)} className="text-xs text-knar-text-muted hover:text-red-400">× Eliminar</button>
                                </div>
                                <div><label className="block text-xs text-knar-text-secondary mb-1">Título *</label><input type="text" value={hallazgo.titulo} onChange={(e) => actualizarHallazgo(hallazgo.id, 'titulo', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Título del hallazgo" /></div>
                                <div><label className="block text-xs text-knar-text-secondary mb-1">Descripción *</label><textarea value={hallazgo.descripcion} onChange={(e) => actualizarHallazgo(hallazgo.id, 'descripcion', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" rows={2} placeholder="Descripción detallada" /></div>
                                {hallazgo.tipo === 'Peligro' && (<>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Consecuencia</label><input type="text" value={hallazgo.consecuencia || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'consecuencia', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Severidad (1-5)</label><select value={hallazgo.severidad || 3} onChange={(e) => actualizarHallazgo(hallazgo.id, 'severidad', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="1">1 - Insignificante</option><option value="2">2 - Menor</option><option value="3">3 - Moderado</option><option value="4">4 - Mayor</option><option value="5">5 - Catastrófico</option></select></div>
                                </>)}
                                {hallazgo.tipo === 'Barrera' && (<>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Tipo de Barrera</label><select value={hallazgo.tipoBarrera || 'Fisica'} onChange={(e) => actualizarHallazgo(hallazgo.id, 'tipoBarrera', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="Fisica">Física</option><option value="Administrativa">Administrativa</option><option value="Humana">Humana</option></select></div>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Efectividad (1-5)</label><select value={hallazgo.efectividadEstimada || 3} onChange={(e) => actualizarHallazgo(hallazgo.id, 'efectividadEstimada', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="1">1 - Muy Baja</option><option value="2">2 - Baja</option><option value="3">3 - Media</option><option value="4">4 - Alta</option><option value="5">5 - Muy Alta</option></select></div>
                                </>)}
                                <div>
                                  <label className="block text-xs text-knar-text-secondary mb-1">Ubicación</label>
                                  <div className="flex items-center space-x-2">
                                    <button onClick={() => setUbicacionEditando(hallazgo.id)} className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${ubicacionEditando === hallazgo.id ? 'bg-blue-500 text-white' : 'bg-knar-charcoal text-knar-text-secondary hover:text-knar-text-primary'}`}>🗺️ {hallazgo.ubicacion ? 'Cambiar ubicación' : 'Ubicar en mapa'}</button>
                                    {hallazgo.ubicacion && (<span className="text-xs text-knar-text-muted">({hallazgo.ubicacion.x}, {hallazgo.ubicacion.y})</span>)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center space-x-3 pt-4 border-t border-knar-border">
                          <button onClick={handleGuardar} className="knar-btn knar-btn-primary">Guardar</button>
                          <button onClick={() => { setMetodologiaSeleccionada(null); setHallazgosForm([]); }} className="knar-btn knar-btn-ghost">Cancelar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Relaciones Tab */}
            {leftTabActive === 'relaciones' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></div>
                  <h3 className="knar-card-title">Relaciones</h3>
                </div>
                <div className="knar-card-content"><p className="text-xs text-knar-text-secondary">Panel de relaciones (próximamente)</p></div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL - Single Tab (55%) */}
        <main className="flex-1 overflow-y-auto bg-knar-dark">
          <div className="p-6">
            {/* Esquemático Tab with ACTUAL IMAGE */}
            {rightTabActive === 'esquematico' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  <h3 className="knar-card-title">Esquemático - Sistema de Bombas de Achique</h3>
                </div>
                <div className="knar-card-content">
                  <div onClick={handleMapClick} className={`relative bg-knar-charcoal rounded-lg border-2 overflow-hidden cursor-crosshair ${ubicacionEditando ? 'border-blue-500' : 'border-knar-border'}`}>
                    {/* ACTUAL IMAGE HERE */}
                    <img src="/ReferenceIamge/Sistema Bombas de Achique_V2.png" alt="Sistema de Bombas de Achique" className="w-full h-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    
                    {/* Fallback placeholder if image fails */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center text-knar-text-muted">
                        <p className="text-3xl mb-2">🏭</p>
                        <p className="text-xs">Sistema Bombas de Achique_V2.png</p>
                        {ubicacionEditando && (<p className="text-xs text-blue-400 mt-2 animate-pulse">Click en el mapa para colocar hallazgo</p>)}
                      </div>
                    </div>
                    
                    {/* Edit mode indicator */}
                    {ubicacionEditando && (<div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 rounded text-xs text-blue-400">Modo edición: Ubicación activa</div>)}
                    
                    {/* Hallazgo markers */}
                    {hallazgosForm.map((h) => h.ubicacion && (
                      <div key={h.id} className="absolute w-4 h-4 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${h.ubicacion.x}%`, top: `${h.ubicacion.y}%`, backgroundColor: h.tipo === 'Peligro' ? '#ef4444' : h.tipo === 'Barrera' ? '#3b82f6' : '#10b981' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla Hallazgo Tab */}
            {rightTabActive === 'tabla-hallazgo' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                  <h3 className="knar-card-title">Tabla de Hallazgos</h3>
                </div>
                <div className="knar-card-content">
                  <TablaHallazgos />
                </div>
              </div>
            )}

            {/* Tabla Análisis Tab */}
            {rightTabActive === 'tabla-analisis' && (
              <div className="knar-card">
                <div className="knar-card-header">
                  <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                  <h3 className="knar-card-title">Tabla de Análisis</h3>
                </div>
                <div className="knar-card-content">
                  <TablaAnalisis />
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
            <span>Proyecto: <span className="text-knar-text-secondary">{configData.proyecto || '—'}</span></span>
            <span>|</span>
            <span>Empresa: <span className="text-knar-text-secondary">{configData.empresa || '—'}</span></span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Responsable: <span className="text-knar-text-secondary">{configData.responsable || '—'}</span></span>
            <span>|</span>
            <span>Validez: <span className="text-knar-text-secondary">{configData.validez || '—'}</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
