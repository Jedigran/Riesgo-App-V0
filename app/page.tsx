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
import { useSesion } from '@/src/controllers/useSesion';
import { SiteHeader } from '@/components';
import TablaHallazgos from '@/components/tabla/TablaHallazgos';
import TablaAnalisis from '@/components/tabla/TablaAnalisis';
import RelacionesPanel from '@/components/relaciones/RelacionesPanel';

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
  tipoPeligro?: 'Inherente' | 'Diseño';
  // Barrera
  tipoBarrera?: 'Fisica' | 'Administrativa' | 'Humana';
  tipoBarreraFuncion?: 'Preventiva' | 'Detectiva' | 'Mitigativa';
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
  parametro?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  unidad?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RiesgoApp() {
  // Get session for map markers
  const { sesion } = useSesion();

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
    subnodo: '',
    parametro: '',
    palabraGuia: '',
    causa: '',
    consecuencia: '',
    receptorImpacto: '',
    salvaguardasExistentes: [''],
    recomendaciones: [''],
  });

  // FMEA
  const [fmeaData, setFmeaData] = useState({
    equipo: '',
    funcion: '',
    modoFalla: '',
    receptorImpacto: '',
    efecto: '',
    causa: '',
    S: 1,
    O: 1,
    D: 1,
    RPN: 1,
    barrerasExistentes: [''],
    accionesRecomendadas: [''],
  });

  // LOPA
  const [lopaData, setLopaData] = useState({
    escenario: '',
    consecuencia: '',
    receptorImpacto: '',
    S: 1,
    riesgoTolerable: 0.00001,
    causa: '',
    frecuenciaInicial: 0.1,
    capasIPL: [{ nombre: '', pfd: 0.1 }],
    pfdTotal: 0.1,
    riesgoEscenario: 0.01,
    cumpleCriterio: false,
    pfdObjetivo: 0,
    rrf: 0,
    silRequerido: 0,
    recomendaciones: [''],
  });

  // OCA
  const [ocaData, setOcaData] = useState({
    compuesto: 'H2S',
    cantidad: 1000,
    viento: 1.5,
    factorViento: 1.0,
    estabilidad: 'F',
    factorEscalabilidad: 1.5,
    topografia: 'Urbana',
    factorTopografia: 0.85,
    tipoEscenario: 'Alternativo',
    endpoint: 0.0017,
    tasaLiberacion: 16.67,
    distanciaEndpointMillas: 0,
    distanciaEndpointKm: 0,
    areaAfectadaMillas2: 0,
    areaAfectadaKm2: 0,
    programaRMP: '',
    evaluacion: '',
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
  // OCA HELPER FUNCTIONS
  // ========================================
  
  // Chemical compound endpoint lookup (mg/L)
  const getEndpointPorCompuesto = (compuesto: string): number => {
    const endpoints: Record<string, number> = {
      'H2S': 0.0017,
      'CO': 0.035,
      'Cl2': 0.0035,
      'SO2': 0.014,
      'NH3': 0.14,
      'PM10': 0.15,
      'Diesel': 0.05,
    };
    return endpoints[compuesto] || 0.0017;
  };

  // Calculate wind factor: 1.5 / viento_real
  const calcularFactorViento = (viento: number): number => {
    if (viento <= 0) return 1.0;
    return 1.5 / viento;
  };

  // Calculate scalability factor by stability class
  const calcularFactorEscalabilidad = (estabilidad: string): number => {
    const factores: Record<string, number> = {
      'A': 0.5,
      'B': 0.7,
      'C': 0.9,
      'D': 1.0,
      'E': 1.2,
      'F': 1.5,
    };
    return factores[estabilidad] || 1.0;
  };

  // Calculate topography factor
  const calcularFactorTopografia = (topografia: string): number => {
    return topografia === 'Urbana' ? 0.85 : 1.0;
  };

  // Calculate release rate: Cantidad / Tiempo
  const calcularTasaLiberacion = (cantidad: number, tipoEscenario: string): number => {
    const tiempo = tipoEscenario === 'Worst-Case' ? 10 : 60;
    return cantidad / tiempo;
  };

  // Calculate distance to endpoint: 0.45 × LOG10(Tasa/Endpoint) × Factores
  const calcularDistanciaEndpoint = (
    tasa: number,
    endpoint: number,
    factorViento: number,
    factorEscalabilidad: number,
    factorTopografia: number
  ): number => {
    if (tasa <= 0 || endpoint <= 0) return 0;
    const factores = factorViento * factorEscalabilidad * factorTopografia;
    return 0.45 * Math.log10(tasa / endpoint) * factores;
  };

  // Calculate affected area: π × distancia²
  const calcularArea = (distancia: number): number => {
    return Math.PI * Math.pow(distancia, 2);
  };

  // Get EPA RMP program by distance
  const obtenerProgramaRMP = (distanciaMillas: number): string => {
    if (distanciaMillas < 1) return 'Programa 1';
    if (distanciaMillas <= 5) return 'Programa 2';
    return 'Programa 3';
  };

  // Get evaluation by distance
  const obtenerEvaluacion = (distanciaMillas: number): string => {
    if (distanciaMillas < 2) return '🟢 BAJA';
    if (distanciaMillas <= 5) return '🟡 MODERADA';
    return '🔴 ALTA';
  };

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
          tipoPeligro: hallazgo.tipoPeligro || 'Inherente',
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
          tipoBarreraFuncion: hallazgo.tipoBarreraFuncion || 'Preventiva',
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
          parametro: hallazgo.parametro || '',
          valorMinimo: hallazgo.valorMinimo,
          valorMaximo: hallazgo.valorMaximo,
          unidad: hallazgo.unidad || '',
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
          subnodo: hazopData.subnodo,
          parametro: hazopData.parametro,
          palabraGuia: hazopData.palabraGuia,
          causa: hazopData.causa,
          consecuencia: hazopData.consecuencia,
          receptorImpacto: hazopData.receptorImpacto,
          salvaguardasExistentes: hazopData.salvaguardasExistentes.filter(s => s.trim()).length > 0 ? hazopData.salvaguardasExistentes.filter(s => s.trim()) : [''],
          recomendaciones: hazopData.recomendaciones.filter(r => r.trim()).length > 0 ? hazopData.recomendaciones.filter(r => r.trim()) : [''],
        });

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar HAZOP' });
          return;
        }

        crearHallazgosDeFormulario(resultadoAnalisis.id);
        agregarNotificacion({ tipo: 'success', titulo: 'HAZOP Guardado', mensaje: 'Análisis y hallazgos guardados', duracion: 3000 });
        setHazopData({
        nodo: '',
        subnodo: '',
        parametro: '',
        palabraGuia: '',
        causa: '',
        consecuencia: '',
        receptorImpacto: '',
        salvaguardasExistentes: [''],
        recomendaciones: [''],
      });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar HAZOP' });
      }
    }
    // ========== FMEA ==========
    else if (metodologiaSeleccionada === 'fmea') {
      if (!fmeaData.equipo.trim() || !fmeaData.funcion.trim() || !fmeaData.modoFalla.trim() || !fmeaData.efecto.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete los campos requeridos de FMEA' });
        return;
      }

      try {
        const resultadoAnalisis = crearAnalisisFMEA({
          equipo: fmeaData.equipo,
          funcion: fmeaData.funcion,
          modoFalla: fmeaData.modoFalla,
          receptorImpacto: fmeaData.receptorImpacto,
          efecto: fmeaData.efecto,
          causa: fmeaData.causa,
          barrerasExistentes: fmeaData.barrerasExistentes.filter(b => b.trim()).length > 0 ? fmeaData.barrerasExistentes.filter(b => b.trim()) : [''],
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
        setFmeaData({
          equipo: '',
          funcion: '',
          modoFalla: '',
          receptorImpacto: '',
          efecto: '',
          causa: '',
          S: 1,
          O: 1,
          D: 1,
          RPN: 1,
          barrerasExistentes: [''],
          accionesRecomendadas: [''],
        });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar FMEA' });
      }
    }
    // ========== LOPA ==========
    else if (metodologiaSeleccionada === 'lopa') {
      if (!lopaData.escenario.trim() || !lopaData.consecuencia.trim() || !lopaData.causa.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete los campos requeridos de LOPA' });
        return;
      }

      try {
        const pfdTotal = lopaData.capasIPL.reduce((acc, capa) => acc * (capa.pfd || 1), 1);
        const riesgoEscenario = lopaData.frecuenciaInicial * pfdTotal;
        const cumpleCriterio = riesgoEscenario <= lopaData.riesgoTolerable;

        const resultadoAnalisis = crearAnalisisLOPA({
          escenario: lopaData.escenario,
          consecuencia: lopaData.consecuencia,
          receptorImpacto: lopaData.receptorImpacto,
          S: lopaData.S,
          riesgoTolerable: lopaData.riesgoTolerable,
          causa: lopaData.causa,
          frecuenciaInicial: lopaData.frecuenciaInicial,
          capasIPL: lopaData.capasIPL.filter(c => c.nombre.trim()).length > 0 ? lopaData.capasIPL.filter(c => c.nombre.trim()) : [{ nombre: '', pfd: 0.1 }],
          pfdTotal,
          riesgoEscenario,
          cumpleCriterio,
          pfdObjetivo: cumpleCriterio ? 0 : lopaData.riesgoTolerable / lopaData.frecuenciaInicial,
          rrf: cumpleCriterio ? 0 : 1 / (lopaData.riesgoTolerable / lopaData.frecuenciaInicial),
          silRequerido: 0,
          recomendaciones: lopaData.recomendaciones.filter(r => r.trim()).length > 0 ? lopaData.recomendaciones.filter(r => r.trim()) : [''],
        });

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar LOPA' });
          return;
        }

        crearHallazgosDeFormulario(resultadoAnalisis.id);
        agregarNotificacion({ tipo: 'success', titulo: 'LOPA Guardado', mensaje: 'Análisis y hallazgos guardados', duracion: 3000 });
        setLopaData({
          escenario: '',
          consecuencia: '',
          receptorImpacto: '',
          S: 1,
          riesgoTolerable: 0.00001,
          causa: '',
          frecuenciaInicial: 0.1,
          capasIPL: [{ nombre: '', pfd: 0.1 }],
          pfdTotal: 0.1,
          riesgoEscenario: 0.01,
          cumpleCriterio: false,
          pfdObjetivo: 0,
          rrf: 0,
          silRequerido: 0,
          recomendaciones: [''],
        });
        setHallazgosForm([]);
        setMetodologiaSeleccionada(null);
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar LOPA' });
      }
    }
    // ========== OCA ==========
    else if (metodologiaSeleccionada === 'oca') {
      if (!ocaData.compuesto || !ocaData.cantidad || !ocaData.viento || !ocaData.estabilidad || !ocaData.topografia || !ocaData.tipoEscenario || !ocaData.endpoint) {
        agregarError({ severidad: 'error', mensaje: 'Complete los campos requeridos de OCA' });
        return;
      }

      try {
        // Calculate all derived fields
        const factorViento = calcularFactorViento(ocaData.viento);
        const factorEscalabilidad = calcularFactorEscalabilidad(ocaData.estabilidad);
        const factorTopografia = calcularFactorTopografia(ocaData.topografia);
        const tasaLiberacion = calcularTasaLiberacion(ocaData.cantidad, ocaData.tipoEscenario);
        const distanciaMillas = calcularDistanciaEndpoint(tasaLiberacion, ocaData.endpoint, factorViento, factorEscalabilidad, factorTopografia);
        const distanciaKm = distanciaMillas * 1.60934;
        const areaMillas2 = calcularArea(distanciaMillas);
        const areaKm2 = calcularArea(distanciaKm);
        const programaRMP = obtenerProgramaRMP(distanciaMillas);
        const evaluacion = obtenerEvaluacion(distanciaMillas);

        const resultadoAnalisis = crearAnalisisOCA({
          compuesto: ocaData.compuesto,
          cantidad: ocaData.cantidad,
          viento: ocaData.viento,
          factorViento,
          estabilidad: ocaData.estabilidad,
          factorEscalabilidad,
          topografia: ocaData.topografia,
          factorTopografia,
          tipoEscenario: ocaData.tipoEscenario,
          endpoint: ocaData.endpoint,
          tasaLiberacion,
          distanciaEndpointMillas: distanciaMillas,
          distanciaEndpointKm: distanciaKm,
          areaAfectadaMillas2: areaMillas2,
          areaAfectadaKm2: areaKm2,
          programaRMP,
          evaluacion,
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
        setOcaData({
          compuesto: 'H2S',
          cantidad: 1000,
          viento: 1.5,
          factorViento: 1.0,
          estabilidad: 'F',
          factorEscalabilidad: 1.5,
          topografia: 'Urbana',
          factorTopografia: 0.85,
          tipoEscenario: 'Alternativo',
          endpoint: 0.0017,
          tasaLiberacion: 16.67,
          distanciaEndpointMillas: 0,
          distanciaEndpointKm: 0,
          areaAfectadaMillas2: 0,
          areaAfectadaKm2: 0,
          programaRMP: '',
          evaluacion: '',
          barrerasExistentes: [''],
          gaps: [''],
          recomendaciones: [''],
        });
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
                            {/* Nodo */}
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">Nodo *</label>
                              <input
                                type="text"
                                value={hazopData.nodo}
                                onChange={(e) => setHazopData({ ...hazopData, nodo: e.target.value })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                                placeholder="Ej: Sistema de Achique"
                              />
                            </div>

                            {/* Subnodo/Equipo */}
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">Subnodo/Equipo</label>
                              <input
                                type="text"
                                value={hazopData.subnodo}
                                onChange={(e) => setHazopData({ ...hazopData, subnodo: e.target.value })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                                placeholder="Ej: Bomba principal"
                              />
                            </div>

                            {/* Parámetro y Palabra Guía */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-knar-text-secondary mb-1">Parámetro *</label>
                                <select
                                  value={hazopData.parametro}
                                  onChange={(e) => setHazopData({ ...hazopData, parametro: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                                >
                                  <option value="">Seleccionar</option>
                                  <option value="Flujo">Flujo</option>
                                  <option value="Presión">Presión</option>
                                  <option value="Temperatura">Temperatura</option>
                                  <option value="Nivel">Nivel</option>
                                  <option value="Composición">Composición</option>
                                  <option value="pH">pH</option>
                                  <option value="Velocidad">Velocidad</option>
                                  <option value="Vibración">Vibración</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-knar-text-secondary mb-1">Palabra Guía *</label>
                                <select
                                  value={hazopData.palabraGuia}
                                  onChange={(e) => setHazopData({ ...hazopData, palabraGuia: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                                >
                                  <option value="">Seleccionar</option>
                                  <option value="NO">NO</option>
                                  <option value="MÁS">MÁS</option>
                                  <option value="MENOS">MENOS</option>
                                  <option value="PARTE DE">PARTE DE</option>
                                  <option value="ASÍ COMO">ASÍ COMO</option>
                                  <option value="OTRO QUE">OTRO QUE</option>
                                  <option value="REVERSO">REVERSO</option>
                                  <option value="TEMPRANO">TEMPRANO</option>
                                  <option value="TARDE">TARDE</option>
                                  <option value="ANTES">ANTES</option>
                                  <option value="DESPUÉS">DESPUÉS</option>
                                </select>
                              </div>
                            </div>

                            {/* Desviación (calculado) */}
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">
                                Desviación
                                <span className="text-knar-text-muted ml-2">(calculado)</span>
                              </label>
                              <input
                                type="text"
                                value={(() => {
                                  if (!hazopData.parametro || !hazopData.palabraGuia) return '';
                                  if (hazopData.palabraGuia === 'NO') return `Sin ${hazopData.parametro.toLowerCase()}`;
                                  if (hazopData.palabraGuia === 'MÁS' || hazopData.palabraGuia === 'MENOS') {
                                    return `${hazopData.palabraGuia} de ${hazopData.parametro.toLowerCase()}`;
                                  }
                                  return `${hazopData.palabraGuia} ${hazopData.parametro.toLowerCase()}`;
                                })()}
                                readOnly
                                className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
                              />
                            </div>

                            {/* Causa */}
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">Causa *</label>
                              <textarea
                                value={hazopData.causa}
                                onChange={(e) => setHazopData({ ...hazopData, causa: e.target.value })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                                rows={2}
                                placeholder="Ej: Falla eléctrica del motor"
                              />
                            </div>

                            {/* Consecuencia */}
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">Consecuencia *</label>
                              <textarea
                                value={hazopData.consecuencia}
                                onChange={(e) => setHazopData({ ...hazopData, consecuencia: e.target.value })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                                rows={2}
                                placeholder="Ej: Acumulación de agua en el área"
                              />
                            </div>

                            {/* Receptor con Mayor Impacto */}
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">Receptor con Mayor Impacto</label>
                              <input
                                type="text"
                                value={hazopData.receptorImpacto}
                                onChange={(e) => setHazopData({ ...hazopData, receptorImpacto: e.target.value })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                                placeholder="Ej: Personal/Operación/Medio Ambiente"
                              />
                            </div>
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
                          {/* Equipo */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Equipo *</label>
                            <input
                              type="text"
                              value={fmeaData.equipo}
                              onChange={(e) => setFmeaData({ ...fmeaData, equipo: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: Bomba principal del Sistema de Achique"
                            />
                          </div>

                          {/* Función */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Función *</label>
                            <textarea
                              value={fmeaData.funcion}
                              onChange={(e) => setFmeaData({ ...fmeaData, funcion: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              rows={2}
                              placeholder="Ej: Evacuar agua acumulada del sistema de drenaje"
                            />
                          </div>

                          {/* Modo de Falla */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Modo de Falla *</label>
                            <textarea
                              value={fmeaData.modoFalla}
                              onChange={(e) => setFmeaData({ ...fmeaData, modoFalla: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              rows={2}
                              placeholder="Ej: Motor no opera"
                            />
                          </div>

                          {/* Receptor con Mayor Impacto */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Receptor con Mayor Impacto</label>
                            <input
                              type="text"
                              value={fmeaData.receptorImpacto}
                              onChange={(e) => setFmeaData({ ...fmeaData, receptorImpacto: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: Personal / Operación"
                            />
                          </div>

                          {/* Efecto Potencial */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Efecto Potencial *</label>
                            <textarea
                              value={fmeaData.efecto}
                              onChange={(e) => setFmeaData({ ...fmeaData, efecto: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              rows={2}
                              placeholder="Ej: Pérdida de bombeo"
                            />
                          </div>

                          {/* Causa */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Causa *</label>
                            <textarea
                              value={fmeaData.causa}
                              onChange={(e) => setFmeaData({ ...fmeaData, causa: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              rows={2}
                              placeholder="Ej: Falla eléctrica del motor"
                            />
                          </div>

                          {/* S, O, D */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">S (1-10) *</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={fmeaData.S}
                                onChange={(e) => setFmeaData({ ...fmeaData, S: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">O (1-10) *</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={fmeaData.O}
                                onChange={(e) => setFmeaData({ ...fmeaData, O: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-knar-text-secondary mb-1">D (1-10) *</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={fmeaData.D}
                                onChange={(e) => setFmeaData({ ...fmeaData, D: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* NPR (RPN) con color coding */}
                          <div className={`rounded p-2 text-center ${
                            fmeaData.S * fmeaData.O * fmeaData.D >= 201 ? 'bg-red-900 bg-opacity-30 border border-red-500' :
                            fmeaData.S * fmeaData.O * fmeaData.D >= 101 ? 'bg-orange-900 bg-opacity-30 border border-orange-500' :
                            fmeaData.S * fmeaData.O * fmeaData.D >= 51 ? 'bg-yellow-900 bg-opacity-30 border border-yellow-500' :
                            'bg-green-900 bg-opacity-30 border border-green-500'
                          }`}>
                            <span className="text-xs text-knar-text-muted">NPR = S × O × D = </span>
                            <span className={`text-sm font-bold ${
                              fmeaData.S * fmeaData.O * fmeaData.D >= 201 ? 'text-red-500' :
                              fmeaData.S * fmeaData.O * fmeaData.D >= 101 ? 'text-orange-500' :
                              fmeaData.S * fmeaData.O * fmeaData.D >= 51 ? 'text-yellow-500' :
                              'text-green-500'
                            }`}>
                              {fmeaData.S * fmeaData.O * fmeaData.D}
                            </span>
                            <span className="text-xs text-knar-text-muted ml-2">
                              ({
                                fmeaData.S * fmeaData.O * fmeaData.D >= 201 ? 'Crítico' :
                                fmeaData.S * fmeaData.O * fmeaData.D >= 101 ? 'Alto' :
                                fmeaData.S * fmeaData.O * fmeaData.D >= 51 ? 'Moderado' :
                                'Bajo'
                              })
                            </span>
                          </div>

                          {/* Causa */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Causa *</label>
                            <textarea
                              value={fmeaData.causa}
                              onChange={(e) => setFmeaData({ ...fmeaData, causa: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              rows={2}
                              placeholder="Ej: Falla eléctrica del motor"
                            />
                          </div>

                          {/* Barreras Existentes */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Barreras Existentes</label>
                            <input
                              type="text"
                              value={fmeaData.barrerasExistentes[0]}
                              onChange={(e) => setFmeaData({ ...fmeaData, barrerasExistentes: [e.target.value] })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: Sensor de nivel, Alarma de alto nivel"
                            />
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
                          {/* Escenario */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Escenario de Riesgo *</label>
                            <input
                              type="text"
                              value={lopaData.escenario}
                              onChange={(e) => setLopaData({ ...lopaData, escenario: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: Pérdida de bombeo de achique"
                            />
                          </div>

                          {/* Consecuencia */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Consecuencia *</label>
                            <textarea
                              value={lopaData.consecuencia}
                              onChange={(e) => setLopaData({ ...lopaData, consecuencia: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              rows={2}
                              placeholder="Ej: Acumulación de agua"
                            />
                          </div>

                          {/* Receptor con Mayor Impacto */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Receptor con Mayor Impacto</label>
                            <input
                              type="text"
                              value={lopaData.receptorImpacto}
                              onChange={(e) => setLopaData({ ...lopaData, receptorImpacto: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: Personal / Operación"
                            />
                          </div>

                          {/* Severidad */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Severidad (S) 1-10 *</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={lopaData.S}
                              onChange={(e) => setLopaData({ ...lopaData, S: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                            />
                          </div>

                          {/* Riesgo Tolerable */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Riesgo Tolerable (eventos/año) *</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={lopaData.riesgoTolerable}
                              onChange={(e) => setLopaData({ ...lopaData, riesgoTolerable: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: 0.00001"
                            />
                          </div>

                          {/* Causa */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Causa *</label>
                            <textarea
                              value={lopaData.causa}
                              onChange={(e) => setLopaData({ ...lopaData, causa: e.target.value })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              rows={2}
                              placeholder="Ej: Falla eléctrica del motor"
                            />
                          </div>

                          {/* Frecuencia Inicial */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Frecuencia Inicial (eventos/año) *</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={lopaData.frecuenciaInicial}
                              onChange={(e) => setLopaData({ ...lopaData, frecuenciaInicial: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: 0.0707"
                            />
                          </div>

                          {/* Capas IPL - Simplified for now */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Capa IPL 1 - Nombre</label>
                            <input
                              type="text"
                              value={lopaData.capasIPL[0]?.nombre || ''}
                              onChange={(e) => {
                                const nuevasCapas = [...lopaData.capasIPL];
                                if (!nuevasCapas[0]) nuevasCapas[0] = { nombre: '', pfd: 0.1 };
                                nuevasCapas[0].nombre = e.target.value;
                                setLopaData({ ...lopaData, capasIPL: nuevasCapas });
                              }}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: BPCS - Alarma"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Capa IPL 1 - PFD</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={lopaData.capasIPL[0]?.pfd || 0.1}
                              onChange={(e) => {
                                const nuevasCapas = [...lopaData.capasIPL];
                                if (!nuevasCapas[0]) nuevasCapas[0] = { nombre: '', pfd: 0.1 };
                                nuevasCapas[0].pfd = Number(e.target.value);
                                setLopaData({ ...lopaData, capasIPL: nuevasCapas });
                              }}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: 0.1"
                            />
                          </div>

                          {/* Cálculos automáticos */}
                          <div className="bg-knar-charcoal rounded p-3 space-y-2 border border-knar-border">
                            <h4 className="text-xs font-medium text-knar-text-primary">Cálculos de Riesgo</h4>
                            
                            {/* PfD Total */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">PfD Total:</span>
                              <span className="text-knar-text-primary font-mono">
                                {lopaData.capasIPL.reduce((acc, capa) => acc * (capa.pfd || 1), 1).toExponential(2)}
                              </span>
                            </div>

                            {/* Riesgo del Escenario */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">Riesgo Escenario:</span>
                              <span className="text-knar-text-primary font-mono">
                                {(lopaData.frecuenciaInicial * lopaData.capasIPL.reduce((acc, capa) => acc * (capa.pfd || 1), 1)).toExponential(2)}
                              </span>
                            </div>

                            {/* ¿Cumple Criterio? */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">¿Cumple Criterio?</span>
                              <span className={`font-bold ${
                                (lopaData.frecuenciaInicial * lopaData.capasIPL.reduce((acc, capa) => acc * (capa.pfd || 1), 1)) <= lopaData.riesgoTolerable
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }`}>
                                {(lopaData.frecuenciaInicial * lopaData.capasIPL.reduce((acc, capa) => acc * (capa.pfd || 1), 1)) <= lopaData.riesgoTolerable ? '✅ SÍ' : '❌ NO'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========== OCA FORM ========== */}
                    {metodologiaSeleccionada === 'oca' && (
                      <div className="knar-card">
                        <div className="knar-card-header">
                          <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                          <h3 className="knar-card-title">OCA - Consecuencias</h3>
                        </div>
                        <div className="knar-card-content space-y-3">
                          {/* Compuesto */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Compuesto Químico *</label>
                            <select
                              value={ocaData.compuesto}
                              onChange={(e) => {
                                const compuesto = e.target.value;
                                const endpoint = getEndpointPorCompuesto(compuesto);
                                setOcaData({ ...ocaData, compuesto, endpoint });
                              }}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
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
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Cantidad (lb) *</label>
                            <input
                              type="number"
                              value={ocaData.cantidad}
                              onChange={(e) => setOcaData({ ...ocaData, cantidad: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: 1000"
                            />
                          </div>

                          {/* Viento */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Viento (m/s) *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={ocaData.viento}
                              onChange={(e) => {
                                const viento = Number(e.target.value);
                                const factorViento = calcularFactorViento(viento);
                                setOcaData({ ...ocaData, viento, factorViento });
                              }}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Ej: 1.50"
                            />
                          </div>

                          {/* Factor del Viento (calculado) */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">
                              Factor del Viento
                              <span className="text-knar-text-muted ml-2">(calculado: 1.5 / viento)</span>
                            </label>
                            <input
                              type="number"
                              readOnly
                              value={ocaData.factorViento.toFixed(2)}
                              className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
                            />
                          </div>

                          {/* Estabilidad */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Estabilidad Atmosférica *</label>
                            <select
                              value={ocaData.estabilidad}
                              onChange={(e) => {
                                const estabilidad = e.target.value;
                                const factorEscalabilidad = calcularFactorEscalabilidad(estabilidad);
                                setOcaData({ ...ocaData, estabilidad, factorEscalabilidad });
                              }}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
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
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">
                              Factor de Escalabilidad
                              <span className="text-knar-text-muted ml-2">(calculado)</span>
                            </label>
                            <input
                              type="number"
                              readOnly
                              value={ocaData.factorEscalabilidad.toFixed(2)}
                              className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
                            />
                          </div>

                          {/* Topografía */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Topografía *</label>
                            <select
                              value={ocaData.topografia}
                              onChange={(e) => {
                                const topografia = e.target.value;
                                const factorTopografia = calcularFactorTopografia(topografia);
                                setOcaData({ ...ocaData, topografia, factorTopografia });
                              }}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                            >
                              <option value="Urbana">Urbana</option>
                              <option value="Rural">Rural</option>
                            </select>
                          </div>

                          {/* Factor de Topografía (calculado) */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">
                              Factor de Topografía
                              <span className="text-knar-text-muted ml-2">(calculado)</span>
                            </label>
                            <input
                              type="number"
                              readOnly
                              value={ocaData.factorTopografia.toFixed(2)}
                              className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
                            />
                          </div>

                          {/* Tipo de Escenario */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Tipo de Escenario *</label>
                            <select
                              value={ocaData.tipoEscenario}
                              onChange={(e) => {
                                const tipoEscenario = e.target.value;
                                const tasaLiberacion = calcularTasaLiberacion(ocaData.cantidad, tipoEscenario);
                                setOcaData({ ...ocaData, tipoEscenario, tasaLiberacion });
                              }}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                            >
                              <option value="Worst-Case">Worst-Case (10 min)</option>
                              <option value="Alternativo">Alternativo (60 min)</option>
                            </select>
                          </div>

                          {/* Endpoint */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">Endpoint (mg/L) *</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={ocaData.endpoint}
                              onChange={(e) => setOcaData({ ...ocaData, endpoint: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-knar-dark border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"
                              placeholder="Auto-fill según compuesto"
                            />
                          </div>

                          {/* Tasa de Liberación (calculado) */}
                          <div>
                            <label className="block text-xs text-knar-text-secondary mb-1">
                              Tasa de Liberación (lb/min)
                              <span className="text-knar-text-muted ml-2">(calculado)</span>
                            </label>
                            <input
                              type="number"
                              readOnly
                              value={ocaData.tasaLiberacion?.toFixed(2) || '0.00'}
                              className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-muted focus:outline-none"
                            />
                          </div>

                          {/* Cálculos de Distancia y Área */}
                          <div className="bg-knar-charcoal rounded p-3 space-y-2 border border-knar-border">
                            <h4 className="text-xs font-medium text-knar-text-primary">Cálculos de Dispersión</h4>
                            
                            {/* Distancia en millas */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">Distancia al Endpoint:</span>
                              <span className="text-knar-text-primary font-mono">
                                {(() => {
                                  const distancia = calcularDistanciaEndpoint(
                                    ocaData.tasaLiberacion || 0,
                                    ocaData.endpoint,
                                    ocaData.factorViento,
                                    ocaData.factorEscalabilidad,
                                    ocaData.factorTopografia
                                  );
                                  return distancia.toFixed(2) + ' millas';
                                })()}
                              </span>
                            </div>

                            {/* Distancia en km */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">Distancia en km:</span>
                              <span className="text-knar-text-primary font-mono">
                                {(() => {
                                  const distancia = calcularDistanciaEndpoint(
                                    ocaData.tasaLiberacion || 0,
                                    ocaData.endpoint,
                                    ocaData.factorViento,
                                    ocaData.factorEscalabilidad,
                                    ocaData.factorTopografia
                                  );
                                  return (distancia * 1.60934).toFixed(2) + ' km';
                                })()}
                              </span>
                            </div>

                            {/* Área en millas² */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">Área Afectada:</span>
                              <span className="text-knar-text-primary font-mono">
                                {(() => {
                                  const distancia = calcularDistanciaEndpoint(
                                    ocaData.tasaLiberacion || 0,
                                    ocaData.endpoint,
                                    ocaData.factorViento,
                                    ocaData.factorEscalabilidad,
                                    ocaData.factorTopografia
                                  );
                                  return calcularArea(distancia).toFixed(2) + ' miles²';
                                })()}
                              </span>
                            </div>

                            {/* Programa RMP */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">Programa RMP:</span>
                              <span className="text-knar-text-primary font-bold">
                                {(() => {
                                  const distancia = calcularDistanciaEndpoint(
                                    ocaData.tasaLiberacion || 0,
                                    ocaData.endpoint,
                                    ocaData.factorViento,
                                    ocaData.factorEscalabilidad,
                                    ocaData.factorTopografia
                                  );
                                  return obtenerProgramaRMP(distancia);
                                })()}
                              </span>
                            </div>

                            {/* Evaluación */}
                            <div className="flex justify-between text-xs">
                              <span className="text-knar-text-muted">Evaluación:</span>
                              <span className="font-bold">
                                {(() => {
                                  const distancia = calcularDistanciaEndpoint(
                                    ocaData.tasaLiberacion || 0,
                                    ocaData.endpoint,
                                    ocaData.factorViento,
                                    ocaData.factorEscalabilidad,
                                    ocaData.factorTopografia
                                  );
                                  return obtenerEvaluacion(distancia);
                                })()}
                              </span>
                            </div>
                          </div>
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
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Tipo de Peligro *</label><select value={hallazgo.tipoPeligro || 'Inherente'} onChange={(e) => actualizarHallazgo(hallazgo.id, 'tipoPeligro', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="Inherente">Inherente (peligro propio de la sustancia)</option><option value="Diseño">Diseño (peligro por condiciones de operación)</option></select></div>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Consecuencia</label><input type="text" value={hallazgo.consecuencia || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'consecuencia', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Severidad (1-5)</label><select value={hallazgo.severidad || 3} onChange={(e) => actualizarHallazgo(hallazgo.id, 'severidad', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="1">1 - Insignificante</option><option value="2">2 - Menor</option><option value="3">3 - Moderado</option><option value="4">4 - Mayor</option><option value="5">5 - Catastrófico</option></select></div>
                                </>)}
                                {hallazgo.tipo === 'Barrera' && (<>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Tipo de Barrera</label><select value={hallazgo.tipoBarrera || 'Fisica'} onChange={(e) => actualizarHallazgo(hallazgo.id, 'tipoBarrera', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="Fisica">Física</option><option value="Administrativa">Administrativa</option><option value="Humana">Humana</option></select></div>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Función de Barrera *</label><select value={hallazgo.tipoBarreraFuncion || 'Preventiva'} onChange={(e) => actualizarHallazgo(hallazgo.id, 'tipoBarreraFuncion', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="Preventiva">Preventiva (evita que ocurra el evento)</option><option value="Detectiva">Detectiva (detecta el evento)</option><option value="Mitigativa">Mitigativa (mitiga consecuencias)</option></select></div>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Efectividad (1-5)</label><select value={hallazgo.efectividadEstimada || 3} onChange={(e) => actualizarHallazgo(hallazgo.id, 'efectividadEstimada', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="1">1 - Muy Baja</option><option value="2">2 - Baja</option><option value="3">3 - Media</option><option value="4">4 - Alta</option><option value="5">5 - Muy Alta</option></select></div>
                                </>)}
                                {hallazgo.tipo === 'SOL' && (<>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Parámetro *</label><select value={hallazgo.parametro || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'parametro', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="">Seleccionar</option><option value="Presión">Presión</option><option value="Temperatura">Temperatura</option><option value="Flujo">Flujo</option><option value="Nivel">Nivel</option><option value="pH">pH</option><option value="Velocidad">Velocidad</option><option value="Vibración">Vibración</option><option value="Concentración">Concentración</option><option value="dBA">dBA (Sonido/Ruido)</option></select></div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-xs text-knar-text-secondary mb-1">Valor Mínimo</label><input type="number" value={hallazgo.valorMinimo || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'valorMinimo', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="0" /></div>
                                    <div><label className="block text-xs text-knar-text-secondary mb-1">Valor Máximo</label><input type="number" value={hallazgo.valorMaximo || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'valorMaximo', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="100" /></div>
                                  </div>
                                  <div><label className="block text-xs text-knar-text-secondary mb-1">Unidad</label><select value={hallazgo.unidad || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'unidad', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="">Seleccionar</option><option value="psi">psi</option><option value="bar">bar</option><option value="kPa">kPa</option><option value="atm">atm</option><option value="°C">°C</option><option value="°F">°F</option><option value="K">K</option><option value="m³/h">m³/h</option><option value="L/min">L/min</option><option value="gal/min">gal/min</option><option value="%">%</option><option value="m">m</option><option value="ft">ft</option><option value="pH">pH (0-14)</option><option value="mm/s">mm/s</option><option value="g">g</option><option value="ppm">ppm</option><option value="mg/L">mg/L</option><option value="dBA">dBA</option></select></div>
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
              <RelacionesPanel />
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
                  <div
                    onClick={handleMapClick}
                    className={`relative bg-knar-charcoal rounded-lg border-2 overflow-hidden ${
                      ubicacionEditando ? 'border-blue-500 cursor-crosshair' : 'border-knar-border cursor-default'
                    }`}
                  >
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
                    
                    {/* Edit mode indicator - ONLY show when editing */}
                    {ubicacionEditando && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 rounded text-xs text-blue-400 pointer-events-none">
                        Modo edición: Ubicación activa
                      </div>
                    )}
                    
                    {/* HALLAZGO MARKERS - Show BOTH saved (session) AND in-progress (form) */}
                    {[...(sesion?.hallazgos || []), ...hallazgosForm].map((h) => h.ubicacion && (
                      <div
                        key={h.id}
                        className="absolute w-4 h-4 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg hover:scale-125 transition-transform cursor-pointer"
                        style={{ 
                          left: `${h.ubicacion.x}%`, 
                          top: `${h.ubicacion.y}%`, 
                          backgroundColor: h.tipo === 'Peligro' ? '#ef4444' : h.tipo === 'Barrera' ? '#3b82f6' : h.tipo === 'POE' ? '#10b981' : '#8b5cf6'
                        }}
                        title={`${h.tipo}: ${h.titulo}`}
                      />
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
