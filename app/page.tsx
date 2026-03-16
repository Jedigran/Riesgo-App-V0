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
import { useSesion } from '@/src/controllers/useSesion';
import { useGrupo } from '@/src/controllers/useGrupo';
import { SiteHeader } from '@/components';
import TablaHallazgos from '@/components/tabla/TablaHallazgos';
import TablaAnalisis from '@/components/tabla/TablaAnalisis';
import RelacionesPanel from '@/components/relaciones/RelacionesPanel';
import GruposPanel from '@/components/grupos/GruposPanel';
import EsquematicoPanel from '@/components/esquematico/EsquematicoPanel';

// ============================================================================
// TYPES
// ============================================================================

type LeftTab = 'configuracion' | 'censo' | 'relaciones' | 'grupos';
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
  const { sesion, dispatch } = useSesion();

  // Estado para tab izquierdo (EXCLUSIVO)
  const [leftTabActive, setLeftTabActive] = useState<LeftTab>('configuracion');

  // Estado para tab derecho (solo uno visible a la vez)
  const [rightTabActive, setRightTabActive] = useState<RightTab>('esquematico');

  // Estado para metodología seleccionada en Censo
  const [metodologiaSeleccionada, setMetodologiaSeleccionada] = useState<Metodologia>(null);

  // Estado para configuración del proyecto — seeded from session on first load
  const [configData, setConfigData] = useState<ConfigData>({
    proyecto: sesion?.proyecto ?? '',
    empresa: sesion?.empresa ?? '',
    responsable: sesion?.responsable ?? '',
    validez: sesion?.validez ?? '',
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
    dispatch({ type: 'ACTUALIZAR_SESION', payload: { [name]: value } });
  };

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
  // TEST DATA LOADER (FOR TESTING GRUPOS TAB)
  // ========================================
  const cargarDatosEjemplo = () => {
    // Create 5 Peligros
    crearPeligro({
      titulo: 'Sobrepresión en Reactor',
      descripcion: 'Riesgo de sobrepresión durante operación normal',
      tipoPeligro: 'Inherente',
      consecuencia: 'Ruptura del reactor con liberación de material tóxico',
      severidad: 5,
      causaRaiz: 'Falla en válvula de control PIC-101',
      analisisOrigenIds: [],
    }, { x: 45, y: 30 });

    crearPeligro({
      titulo: 'Fuga de Gas H2S',
      descripcion: 'Liberación de gas sulfhídrico por corrosión en tubería',
      tipoPeligro: 'Diseño',
      consecuencia: 'Intoxicación del personal y contaminación ambiental',
      severidad: 5,
      causaRaiz: 'Corrosión acelerada por ambiente marino',
      analisisOrigenIds: [],
    }, { x: 55, y: 25 });

    crearPeligro({
      titulo: 'Incendio en Tanque de Diesel',
      descripcion: 'Riesgo de ignición en tanque de almacenamiento',
      tipoPeligro: 'Inherente',
      consecuencia: 'Pérdida total del tanque y propagación a equipos cercanos',
      severidad: 4,
      causaRaiz: 'Acumulación de vapores inflamables',
      analisisOrigenIds: [],
    }, { x: 30, y: 45 });

    crearPeligro({
      titulo: 'Derrame de Producto Químico',
      descripcion: 'Liberación no controlada de ácido sulfúrico',
      tipoPeligro: 'Inherente',
      consecuencia: 'Quemaduras químicas y contaminación de suelos',
      severidad: 4,
      causaRaiz: 'Falla en bomba de transferencia',
      analisisOrigenIds: [],
    }, { x: 65, y: 55 });

    crearPeligro({
      titulo: 'Exposición a Ruido Excesivo',
      descripcion: 'Niveles de ruido superiores a 85 dB en área de compresores',
      tipoPeligro: 'Diseño',
      consecuencia: 'Pérdida auditiva permanente del personal',
      severidad: 3,
      causaRaiz: 'Equipos sin aislamiento acústico adecuado',
      analisisOrigenIds: [],
    }, { x: 20, y: 60 });

    // Create 5 Barreras
    crearBarrera({
      titulo: 'Válvula de Alivio PSV-101',
      descripcion: 'Alivia presión cuando excede el setpoint de diseño',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Mitigativa',
      efectividadEstimada: 4,
      elementoProtegido: 'Reactor R-101',
      analisisOrigenIds: [],
    }, { x: 47, y: 32 });

    crearBarrera({
      titulo: 'Detector de Gas H2S',
      descripcion: 'Sistema de detección continua de gas sulfhídrico',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Detectiva',
      efectividadEstimada: 4,
      elementoProtegido: 'Personal en área de proceso',
      analisisOrigenIds: [],
    }, { x: 57, y: 27 });

    crearBarrera({
      titulo: 'Sistema de Espuma',
      descripcion: 'Sistema fijo de generación de espuma para tanques',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Mitigativa',
      efectividadEstimada: 5,
      elementoProtegido: 'Tanque de Diesel T-201',
      analisisOrigenIds: [],
    }, { x: 32, y: 47 });

    crearBarrera({
      titulo: 'Dique de Contención',
      descripcion: 'Barrera física para contener derrames',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Mitigativa',
      efectividadEstimada: 4,
      elementoProtegido: 'Área de almacenamiento de químicos',
      analisisOrigenIds: [],
    }, { x: 67, y: 57 });

    crearBarrera({
      titulo: 'Cabinas Insonorizadas',
      descripcion: 'Cabinas con aislamiento acústico para operadores',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Preventiva',
      efectividadEstimada: 3,
      elementoProtegido: 'Operadores de sala de control',
      analisisOrigenIds: [],
    }, { x: 22, y: 62 });

    // Create 5 POEs
    crearPOE({
      titulo: 'POE-001 Inspección de Válvulas',
      descripcion: 'Procedimiento para inspección periódica de válvulas de seguridad',
      procedimientoReferencia: 'PRO-INS-001',
      frecuenciaAplicacion: 'Mensual',
      responsable: 'Jefe de Mantenimiento',
      analisisOrigenIds: [],
    }, { x: 40, y: 35 });

    crearPOE({
      titulo: 'POE-002 Monitoreo de Gases',
      descripcion: 'Procedimiento para monitoreo continuo de H2S',
      procedimientoReferencia: 'PRO-SEG-002',
      frecuenciaAplicacion: 'Diario',
      responsable: 'Supervisor de Seguridad',
      analisisOrigenIds: [],
    }, { x: 52, y: 30 });

    crearPOE({
      titulo: 'POE-003 Prevención de Incendios',
      descripcion: 'Procedimiento para prevención y control de incendios',
      procedimientoReferencia: 'PRO-SEG-003',
      frecuenciaAplicacion: 'Permanente',
      responsable: 'Brigada de Emergencia',
      analisisOrigenIds: [],
    }, { x: 35, y: 42 });

    crearPOE({
      titulo: 'POE-004 Manejo de Químicos',
      descripcion: 'Procedimiento para manejo seguro de ácidos',
      procedimientoReferencia: 'PRO-OPR-004',
      frecuenciaAplicacion: 'Por turno',
      responsable: 'Operador de Planta',
      analisisOrigenIds: [],
    }, { x: 62, y: 52 });

    crearPOE({
      titulo: 'POE-005 Control de Ruido',
      descripcion: 'Procedimiento para control de exposición a ruido',
      procedimientoReferencia: 'PRO-SEG-005',
      frecuenciaAplicacion: 'Semanal',
      responsable: 'Higienista Industrial',
      analisisOrigenIds: [],
    }, { x: 25, y: 58 });

    // Create 5 SOLs
    crearSOL({
      titulo: 'SIS-001 Parada de Emergencia del Reactor',
      descripcion: 'Sistema instrumentado de seguridad para parada segura',
      capaNumero: 1,
      independiente: true,
      tipoTecnologia: 'Sensor de presión + Válvula de bloqueo',
      parametro: 'Presión',
      valorMinimo: 0,
      valorMaximo: 150,
      unidad: 'psig',
      analisisOrigenIds: [],
    }, { x: 48, y: 33 });

    crearSOL({
      titulo: 'SIS-002 Parada de Bomba',
      descripcion: 'Parada automática por nivel bajo',
      capaNumero: 2,
      independiente: true,
      tipoTecnologia: 'Sensor de nivel + Contactador',
      parametro: 'Nivel',
      valorMinimo: 10,
      valorMaximo: 90,
      unidad: '%',
      analisisOrigenIds: [],
    }, { x: 58, y: 28 });

    crearSOL({
      titulo: 'SIS-003 Alarma de Gas',
      descripcion: 'Alarma sonora por alta concentración de gas',
      capaNumero: 1,
      independiente: true,
      tipoTecnologia: 'Detector puntual + Sirena',
      parametro: 'Concentración H2S',
      valorMinimo: 0,
      valorMaximo: 10,
      unidad: 'ppm',
      analisisOrigenIds: [],
    }, { x: 53, y: 26 });

    crearSOL({
      titulo: 'SIS-004 Control de Temperatura',
      descripcion: 'Parada por alta temperatura en reactor',
      capaNumero: 1,
      independiente: true,
      tipoTecnologia: 'Termopar + Válvula de vapor',
      parametro: 'Temperatura',
      valorMinimo: 20,
      valorMaximo: 180,
      unidad: '°C',
      analisisOrigenIds: [],
    }, { x: 43, y: 38 });

    crearSOL({
      titulo: 'SIS-005 Protección contra Sobreflujo',
      descripcion: 'Parada por alto nivel en tanque',
      capaNumero: 2,
      independiente: true,
      tipoTecnologia: 'Switch de nivel + Válvula de entrada',
      parametro: 'Nivel',
      valorMinimo: 0,
      valorMaximo: 95,
      unidad: '%',
      analisisOrigenIds: [],
    }, { x: 38, y: 48 });

    agregarNotificacion({
      tipo: 'success',
      titulo: 'Datos de Ejemplo Cargados',
      mensaje: 'Se crearon 5 Peligros, 5 Barreras, 5 POEs y 5 SOLs',
      duracion: 4000,
    });
  };

  // ========================================
  // TEST DATA LOADER FOR ANALYSIS (HAZOP, FMEA, LOPA, OCA)
  // ========================================
  const cargarAnalisisEjemplo = () => {
    // HAZOP-01
    const resultadoHAZOP = crearAnalisisHAZOP({
      nodo: 'Sistema de Achique',
      subnodo: 'Bomba principal',
      parametro: 'Flujo',
      palabraGuia: 'No',
      causa: 'Falla eléctrica del motor',
      consecuencia: 'Acumulación de agua en el área de operación',
      receptorImpacto: 'Personal/Operación',
      salvaguardasExistentes: ['Sensor de nivel', 'Alarma de alto nivel'],
      recomendaciones: ['Instalar bomba redundante'],
    });

    if (resultadoHAZOP.exito && resultadoHAZOP.id) {
      crearHallazgosDeFormulario(resultadoHAZOP.id);
    }

    // FMEA-01
    const resultadoFMEA = crearAnalisisFMEA({
      equipo: 'Bomba principal del Sistema de Achique',
      funcion: 'Evacuar agua acumulada del sistema de drenaje',
      modoFalla: 'Motor no opera',
      receptorImpacto: 'Personal / Operación',
      efecto: 'Pérdida de bombeo',
      causa: 'Falla eléctrica del motor',
      S: 9,
      O: 5,
      D: 3,
      RPN: 135,
      barrerasExistentes: ['Sensor de nivel', 'Alarma de alto nivel'],
      accionesRecomendadas: ['Instalar bomba redundante'],
    });

    if (resultadoFMEA.exito && resultadoFMEA.id) {
      crearHallazgosDeFormulario(resultadoFMEA.id);
    }

    // LOPA-01
    const resultadoLOPA = crearAnalisisLOPA({
      escenario: 'Pérdida de bombeo de achique',
      consecuencia: 'Acumulación de agua',
      receptorImpacto: 'Personal / Operación',
      S: 7,
      riesgoTolerable: 0.00001,
      causa: 'Falla eléctrica del motor',
      frecuenciaInicial: 0.0707,
      capasIPL: [
        {
          nombre: 'Alarma de alto nivel',
          pfd: 0.0001,
        },
      ],
      pfdTotal: 0.0001,
      riesgoEscenario: 0.00000707,
      cumpleCriterio: true,
      pfdObjetivo: 0,
      rrf: 0,
      silRequerido: 0,
      recomendaciones: ['N/A'],
    });

    if (resultadoLOPA.exito && resultadoLOPA.id) {
      crearHallazgosDeFormulario(resultadoLOPA.id);
    }

    // OCA-01
    const resultadoOCA = crearAnalisisOCA({
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
      distanciaEndpointMillas: 2.29,
      distanciaEndpointKm: 3.69,
      areaAfectadaMillas2: 16.48,
      areaAfectadaKm2: 42.67,
      programaRMP: 'Programa 2',
      evaluacion: '⚠️ MODERADA',
      barrerasExistentes: [''],
      gaps: [''],
      recomendaciones: [''],
    });

    if (resultadoOCA.exito && resultadoOCA.id) {
      crearHallazgosDeFormulario(resultadoOCA.id);
    }

    agregarNotificacion({
      tipo: 'success',
      titulo: 'Análisis de Ejemplo Cargados',
      mensaje: 'Se crearon HAZOP-01, FMEA-01, LOPA-01 y OCA-01',
      duracion: 4000,
    });
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
    <div className="h-screen flex flex-col bg-knar-dark font-sans overflow-hidden">
      {/* HEADER */}
      <header style={{ backgroundColor: 'var(--knar-dark)', borderBottom: '0.5px solid var(--border)' }} className="px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg style={{ color: 'var(--accent)' }} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-normal)', color: 'var(--text-primary)' }}>Risk-Sensus</h1>
            </div>
            <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', display: 'inline-block' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)' }}>Sesión Activa</span>
          </div>

          {/* Right Tab Switcher — underline pattern */}
          <div className="knar-tabs-inline" style={{ borderBottom: 'none', padding: 0 }}>
            <button onClick={() => setRightTabActive('esquematico')} className={`knar-tab-inline${rightTabActive === 'esquematico' ? ' active' : ''}`}>Esquemático</button>
            <button onClick={() => setRightTabActive('tabla-hallazgo')} className={`knar-tab-inline${rightTabActive === 'tabla-hallazgo' ? ' active' : ''}`}>Tabla Hallazgo</button>
            <button onClick={() => setRightTabActive('tabla-analisis')} className={`knar-tab-inline${rightTabActive === 'tabla-analisis' ? ' active' : ''}`}>Tabla Análisis</button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT - Two Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Exclusive Tabs (45%) */}
        <aside style={{ backgroundColor: 'var(--knar-charcoal)', borderRight: '0.5px solid var(--border)' }} className="w-[45%] overflow-y-auto">
          {/* Left Tab Buttons — underline pattern */}
          <div className="knar-tabs-inline flex-shrink-0">
            <button onClick={() => setLeftTabActive('configuracion')} className={`knar-tab-inline${leftTabActive === 'configuracion' ? ' active' : ''}`}>Configuración</button>
            <button onClick={() => setLeftTabActive('censo')} className={`knar-tab-inline${leftTabActive === 'censo' ? ' active' : ''}`}>Censo</button>
            {/* <button onClick={() => setLeftTabActive('relaciones')} className={`knar-tab-inline${leftTabActive === 'relaciones' ? ' active' : ''}`}>Relaciones</button> */}
            <button onClick={() => setLeftTabActive('grupos')} className={`knar-tab-inline${leftTabActive === 'grupos' ? ' active' : ''}`}>Grupos</button>
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
                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Proyecto *</label><input type="text" name="proyecto" value={configData.proyecto} onChange={handleConfigChange} className="knar-input" placeholder="Nombre del proyecto" /></div>
                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Empresa *</label><input type="text" name="empresa" value={configData.empresa} onChange={handleConfigChange} className="knar-input" placeholder="Nombre de la empresa" /></div>
                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Responsable *</label><input type="text" name="responsable" value={configData.responsable} onChange={handleConfigChange} className="knar-input" placeholder="Nombre del responsable" /></div>
                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Validez *</label><input type="date" name="validez" value={configData.validez} onChange={handleConfigChange} className="knar-input" /></div>
                </div>
              </div>
            )}

            {/* Censo Tab */}
            {leftTabActive === 'censo' && (
              <div className="space-y-4">
                {/* TEST BUTTON FOR ANALYSIS - REMOVE LATER */}
                <button
                  onClick={cargarAnalisisEjemplo}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 400,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    marginBottom: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Cargar Análisis de Ejemplo (HAZOP, FMEA, LOPA, OCA) - TESTING ONLY
                </button>

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
                      <button onClick={() => setMetodologiaSeleccionada('intuicion')} className="w-full knar-btn knar-btn-primary justify-start">Intuición</button>
                      <button onClick={() => setMetodologiaSeleccionada('hazop')} className="w-full knar-btn knar-btn-ghost justify-start">HAZOP</button>
                      <button onClick={() => setMetodologiaSeleccionada('fmea')} className="w-full knar-btn knar-btn-ghost justify-start">FMEA</button>
                      <button onClick={() => setMetodologiaSeleccionada('lopa')} className="w-full knar-btn knar-btn-ghost justify-start">LOPA</button>
                      <button onClick={() => setMetodologiaSeleccionada('oca')} className="w-full knar-btn knar-btn-ghost justify-start">OCA</button>
                    </div>
                  </div>
                ) : (
                  /* Formulario de metodología */
                  <div className="space-y-4">
                    <button onClick={() => { setMetodologiaSeleccionada(null); setHallazgosForm([]); }} className="knar-btn knar-btn-ghost">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                      Volver a metodologías
                    </button>

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
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Nodo *</label>
                              <input
                                type="text"
                                value={hazopData.nodo}
                                onChange={(e) => setHazopData({ ...hazopData, nodo: e.target.value })}
                                className="knar-input"
                                placeholder="Ej: Sistema de Achique"
                              />
                            </div>

                            {/* Subnodo/Equipo */}
                            <div>
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Subnodo/Equipo</label>
                              <input
                                type="text"
                                value={hazopData.subnodo}
                                onChange={(e) => setHazopData({ ...hazopData, subnodo: e.target.value })}
                                className="knar-input"
                                placeholder="Ej: Bomba principal"
                              />
                            </div>

                            {/* Parámetro y Palabra Guía */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Parámetro *</label>
                                <select
                                  value={hazopData.parametro}
                                  onChange={(e) => setHazopData({ ...hazopData, parametro: e.target.value })}
                                  className="knar-input"
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
                                <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Palabra Guía *</label>
                                <select
                                  value={hazopData.palabraGuia}
                                  onChange={(e) => setHazopData({ ...hazopData, palabraGuia: e.target.value })}
                                  className="knar-input"
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
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Causa *</label>
                              <textarea
                                value={hazopData.causa}
                                onChange={(e) => setHazopData({ ...hazopData, causa: e.target.value })}
                                className="knar-input"
                                rows={2}
                                placeholder="Ej: Falla eléctrica del motor"
                              />
                            </div>

                            {/* Consecuencia */}
                            <div>
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Consecuencia *</label>
                              <textarea
                                value={hazopData.consecuencia}
                                onChange={(e) => setHazopData({ ...hazopData, consecuencia: e.target.value })}
                                className="knar-input"
                                rows={2}
                                placeholder="Ej: Acumulación de agua en el área"
                              />
                            </div>

                            {/* Receptor con Mayor Impacto */}
                            <div>
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Receptor con Mayor Impacto</label>
                              <input
                                type="text"
                                value={hazopData.receptorImpacto}
                                onChange={(e) => setHazopData({ ...hazopData, receptorImpacto: e.target.value })}
                                className="knar-input"
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
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Equipo *</label>
                            <input
                              type="text"
                              value={fmeaData.equipo}
                              onChange={(e) => setFmeaData({ ...fmeaData, equipo: e.target.value })}
                              className="knar-input"
                              placeholder="Ej: Bomba principal del Sistema de Achique"
                            />
                          </div>

                          {/* Función */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Función *</label>
                            <textarea
                              value={fmeaData.funcion}
                              onChange={(e) => setFmeaData({ ...fmeaData, funcion: e.target.value })}
                              className="knar-input"
                              rows={2}
                              placeholder="Ej: Evacuar agua acumulada del sistema de drenaje"
                            />
                          </div>

                          {/* Modo de Falla */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Modo de Falla *</label>
                            <textarea
                              value={fmeaData.modoFalla}
                              onChange={(e) => setFmeaData({ ...fmeaData, modoFalla: e.target.value })}
                              className="knar-input"
                              rows={2}
                              placeholder="Ej: Motor no opera"
                            />
                          </div>

                          {/* Receptor con Mayor Impacto */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Receptor con Mayor Impacto</label>
                            <input
                              type="text"
                              value={fmeaData.receptorImpacto}
                              onChange={(e) => setFmeaData({ ...fmeaData, receptorImpacto: e.target.value })}
                              className="knar-input"
                              placeholder="Ej: Personal / Operación"
                            />
                          </div>

                          {/* Efecto Potencial */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Efecto Potencial *</label>
                            <textarea
                              value={fmeaData.efecto}
                              onChange={(e) => setFmeaData({ ...fmeaData, efecto: e.target.value })}
                              className="knar-input"
                              rows={2}
                              placeholder="Ej: Pérdida de bombeo"
                            />
                          </div>

                          {/* Causa */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Causa *</label>
                            <textarea
                              value={fmeaData.causa}
                              onChange={(e) => setFmeaData({ ...fmeaData, causa: e.target.value })}
                              className="knar-input"
                              rows={2}
                              placeholder="Ej: Falla eléctrica del motor"
                            />
                          </div>

                          {/* S, O, D */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>S (1-10) *</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={fmeaData.S}
                                onChange={(e) => setFmeaData({ ...fmeaData, S: Number(e.target.value) })}
                                className="knar-input"
                              />
                            </div>
                            <div>
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>O (1-10) *</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={fmeaData.O}
                                onChange={(e) => setFmeaData({ ...fmeaData, O: Number(e.target.value) })}
                                className="knar-input"
                              />
                            </div>
                            <div>
                              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>D (1-10) *</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={fmeaData.D}
                                onChange={(e) => setFmeaData({ ...fmeaData, D: Number(e.target.value) })}
                                className="knar-input"
                              />
                            </div>
                          </div>

                          {/* NPR (RPN) con color coding */}
                          {(() => {
                            const npr = fmeaData.S * fmeaData.O * fmeaData.D;
                            const [bg, border, textColor, label] =
                              npr >= 201 ? ['rgba(220,38,38,0.12)', 'rgba(220,38,38,0.35)', '#f87171', 'Crítico'] :
                              npr >= 101 ? ['rgba(234,88,12,0.12)', 'rgba(234,88,12,0.35)', 'var(--accent)', 'Alto'] :
                              npr >= 51  ? ['rgba(202,138,4,0.12)', 'rgba(202,138,4,0.35)', '#facc15', 'Moderado'] :
                                           ['rgba(22,163,74,0.12)', 'rgba(22,163,74,0.35)', '#4ade80', 'Bajo'];
                            return (
                              <div style={{ backgroundColor: bg, border: `0.5px solid ${border}`, borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', textAlign: 'center' }}>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)' }}>{'NPR = S × O × D = '}</span>
                                <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-normal)', color: textColor }}>{npr}</span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-light)', marginLeft: 'var(--space-2)' }}>({label})</span>
                              </div>
                            );
                          })()}

                          {/* Causa */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Causa *</label>
                            <textarea
                              value={fmeaData.causa}
                              onChange={(e) => setFmeaData({ ...fmeaData, causa: e.target.value })}
                              className="knar-input"
                              rows={2}
                              placeholder="Ej: Falla eléctrica del motor"
                            />
                          </div>

                          {/* Barreras Existentes */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Barreras Existentes</label>
                            <input
                              type="text"
                              value={fmeaData.barrerasExistentes[0]}
                              onChange={(e) => setFmeaData({ ...fmeaData, barrerasExistentes: [e.target.value] })}
                              className="knar-input"
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
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Escenario de Riesgo *</label>
                            <input
                              type="text"
                              value={lopaData.escenario}
                              onChange={(e) => setLopaData({ ...lopaData, escenario: e.target.value })}
                              className="knar-input"
                              placeholder="Ej: Pérdida de bombeo de achique"
                            />
                          </div>

                          {/* Consecuencia */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Consecuencia *</label>
                            <textarea
                              value={lopaData.consecuencia}
                              onChange={(e) => setLopaData({ ...lopaData, consecuencia: e.target.value })}
                              className="knar-input"
                              rows={2}
                              placeholder="Ej: Acumulación de agua"
                            />
                          </div>

                          {/* Receptor con Mayor Impacto */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Receptor con Mayor Impacto</label>
                            <input
                              type="text"
                              value={lopaData.receptorImpacto}
                              onChange={(e) => setLopaData({ ...lopaData, receptorImpacto: e.target.value })}
                              className="knar-input"
                              placeholder="Ej: Personal / Operación"
                            />
                          </div>

                          {/* Severidad */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Severidad (S) 1-10 *</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={lopaData.S}
                              onChange={(e) => setLopaData({ ...lopaData, S: Number(e.target.value) })}
                              className="knar-input"
                            />
                          </div>

                          {/* Riesgo Tolerable */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Riesgo Tolerable (eventos/año) *</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={lopaData.riesgoTolerable}
                              onChange={(e) => setLopaData({ ...lopaData, riesgoTolerable: Number(e.target.value) })}
                              className="knar-input"
                              placeholder="Ej: 0.00001"
                            />
                          </div>

                          {/* Causa */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Causa *</label>
                            <textarea
                              value={lopaData.causa}
                              onChange={(e) => setLopaData({ ...lopaData, causa: e.target.value })}
                              className="knar-input"
                              rows={2}
                              placeholder="Ej: Falla eléctrica del motor"
                            />
                          </div>

                          {/* Frecuencia Inicial */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Frecuencia Inicial (eventos/año) *</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={lopaData.frecuenciaInicial}
                              onChange={(e) => setLopaData({ ...lopaData, frecuenciaInicial: Number(e.target.value) })}
                              className="knar-input"
                              placeholder="Ej: 0.0707"
                            />
                          </div>

                          {/* Capas IPL - Simplified for now */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Capa IPL 1 - Nombre</label>
                            <input
                              type="text"
                              value={lopaData.capasIPL[0]?.nombre || ''}
                              onChange={(e) => {
                                const nuevasCapas = [...lopaData.capasIPL];
                                if (!nuevasCapas[0]) nuevasCapas[0] = { nombre: '', pfd: 0.1 };
                                nuevasCapas[0].nombre = e.target.value;
                                setLopaData({ ...lopaData, capasIPL: nuevasCapas });
                              }}
                              className="knar-input"
                              placeholder="Ej: BPCS - Alarma"
                            />
                          </div>
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Capa IPL 1 - PFD</label>
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
                              className="knar-input"
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
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Compuesto Químico *</label>
                            <select
                              value={ocaData.compuesto}
                              onChange={(e) => {
                                const compuesto = e.target.value;
                                const endpoint = getEndpointPorCompuesto(compuesto);
                                setOcaData({ ...ocaData, compuesto, endpoint });
                              }}
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
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Cantidad (lb) *</label>
                            <input
                              type="number"
                              value={ocaData.cantidad}
                              onChange={(e) => setOcaData({ ...ocaData, cantidad: Number(e.target.value) })}
                              className="knar-input"
                              placeholder="Ej: 1000"
                            />
                          </div>

                          {/* Viento */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Viento (m/s) *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={ocaData.viento}
                              onChange={(e) => {
                                const viento = Number(e.target.value);
                                const factorViento = calcularFactorViento(viento);
                                setOcaData({ ...ocaData, viento, factorViento });
                              }}
                              className="knar-input"
                              placeholder="Ej: 1.50"
                            />
                          </div>

                          {/* Factor del Viento (calculado) */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Estabilidad Atmosférica *</label>
                            <select
                              value={ocaData.estabilidad}
                              onChange={(e) => {
                                const estabilidad = e.target.value;
                                const factorEscalabilidad = calcularFactorEscalabilidad(estabilidad);
                                setOcaData({ ...ocaData, estabilidad, factorEscalabilidad });
                              }}
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
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Topografía *</label>
                            <select
                              value={ocaData.topografia}
                              onChange={(e) => {
                                const topografia = e.target.value;
                                const factorTopografia = calcularFactorTopografia(topografia);
                                setOcaData({ ...ocaData, topografia, factorTopografia });
                              }}
                              className="knar-input"
                            >
                              <option value="Urbana">Urbana</option>
                              <option value="Rural">Rural</option>
                            </select>
                          </div>

                          {/* Factor de Topografía (calculado) */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Tipo de Escenario *</label>
                            <select
                              value={ocaData.tipoEscenario}
                              onChange={(e) => {
                                const tipoEscenario = e.target.value;
                                const tasaLiberacion = calcularTasaLiberacion(ocaData.cantidad, tipoEscenario);
                                setOcaData({ ...ocaData, tipoEscenario, tasaLiberacion });
                              }}
                              className="knar-input"
                            >
                              <option value="Worst-Case">Worst-Case (10 min)</option>
                              <option value="Alternativo">Alternativo (60 min)</option>
                            </select>
                          </div>

                          {/* Endpoint */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Endpoint (mg/L) *</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={ocaData.endpoint}
                              onChange={(e) => setOcaData({ ...ocaData, endpoint: Number(e.target.value) })}
                              className="knar-input"
                              placeholder="Auto-fill según compuesto"
                            />
                          </div>

                          {/* Tasa de Liberación (calculado) */}
                          <div>
                            <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
                          <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Título *</label><input type="text" value={intuicionData.titulo} onChange={(e) => setIntuicionData({ ...intuicionData, titulo: e.target.value })} className="knar-input" placeholder="Título del hallazgo" /></div>
                          <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Descripción *</label><textarea value={intuicionData.descripcion} onChange={(e) => setIntuicionData({ ...intuicionData, descripcion: e.target.value })} className="knar-input" rows={3} placeholder="Descripción detallada de la observación" /></div>
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
                          <select value={hallazgoTipoSeleccionado} onChange={(e) => setHallazgoTipoSeleccionado(e.target.value as HallazgoTipo)} className="knar-select flex-1">
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
                                <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Título *</label><input type="text" value={hallazgo.titulo} onChange={(e) => actualizarHallazgo(hallazgo.id, 'titulo', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Título del hallazgo" /></div>
                                <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Descripción *</label><textarea value={hallazgo.descripcion} onChange={(e) => actualizarHallazgo(hallazgo.id, 'descripcion', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" rows={2} placeholder="Descripción detallada" /></div>
                                {hallazgo.tipo === 'Peligro' && (<>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Tipo de Peligro *</label><select value={hallazgo.tipoPeligro || 'Inherente'} onChange={(e) => actualizarHallazgo(hallazgo.id, 'tipoPeligro', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="Inherente">Inherente (peligro propio de la sustancia)</option><option value="Diseño">Diseño (peligro por condiciones de operación)</option></select></div>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Consecuencia</label><input type="text" value={hallazgo.consecuencia || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'consecuencia', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" /></div>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Severidad (1-5)</label><select value={hallazgo.severidad || 3} onChange={(e) => actualizarHallazgo(hallazgo.id, 'severidad', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="1">1 - Insignificante</option><option value="2">2 - Menor</option><option value="3">3 - Moderado</option><option value="4">4 - Mayor</option><option value="5">5 - Catastrófico</option></select></div>
                                </>)}
                                {hallazgo.tipo === 'Barrera' && (<>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Tipo de Barrera</label><select value={hallazgo.tipoBarrera || 'Fisica'} onChange={(e) => actualizarHallazgo(hallazgo.id, 'tipoBarrera', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="Fisica">Física</option><option value="Administrativa">Administrativa</option><option value="Humana">Humana</option></select></div>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Función de Barrera *</label><select value={hallazgo.tipoBarreraFuncion || 'Preventiva'} onChange={(e) => actualizarHallazgo(hallazgo.id, 'tipoBarreraFuncion', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="Preventiva">Preventiva (evita que ocurra el evento)</option><option value="Detectiva">Detectiva (detecta el evento)</option><option value="Mitigativa">Mitigativa (mitiga consecuencias)</option></select></div>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Efectividad (1-5)</label><select value={hallazgo.efectividadEstimada || 3} onChange={(e) => actualizarHallazgo(hallazgo.id, 'efectividadEstimada', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="1">1 - Muy Baja</option><option value="2">2 - Baja</option><option value="3">3 - Media</option><option value="4">4 - Alta</option><option value="5">5 - Muy Alta</option></select></div>
                                </>)}
                                {hallazgo.tipo === 'SOL' && (<>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Parámetro *</label><select value={hallazgo.parametro || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'parametro', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="">Seleccionar</option><option value="Presión">Presión</option><option value="Temperatura">Temperatura</option><option value="Flujo">Flujo</option><option value="Nivel">Nivel</option><option value="pH">pH</option><option value="Velocidad">Velocidad</option><option value="Vibración">Vibración</option><option value="Concentración">Concentración</option><option value="dBA">dBA (Sonido/Ruido)</option></select></div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Valor Mínimo</label><input type="number" value={hallazgo.valorMinimo || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'valorMinimo', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="0" /></div>
                                    <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Valor Máximo</label><input type="number" value={hallazgo.valorMaximo || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'valorMaximo', Number(e.target.value))} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="100" /></div>
                                  </div>
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Unidad</label><select value={hallazgo.unidad || ''} onChange={(e) => actualizarHallazgo(hallazgo.id, 'unidad', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none"><option value="">Seleccionar</option><option value="psi">psi</option><option value="bar">bar</option><option value="kPa">kPa</option><option value="atm">atm</option><option value="°C">°C</option><option value="°F">°F</option><option value="K">K</option><option value="m³/h">m³/h</option><option value="L/min">L/min</option><option value="gal/min">gal/min</option><option value="%">%</option><option value="m">m</option><option value="ft">ft</option><option value="pH">pH (0-14)</option><option value="mm/s">mm/s</option><option value="g">g</option><option value="ppm">ppm</option><option value="mg/L">mg/L</option><option value="dBA">dBA</option></select></div>
                                </>)}
                                <div>
                                  <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Ubicación</label>
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

            {/* Relaciones Tab - HIDDEN */}
            {/* {leftTabActive === 'relaciones' && (
              <RelacionesPanel />
            )} */}

            {/* Grupos Tab */}
            {leftTabActive === 'grupos' && (
              <div>
                {/* TEST BUTTON - REMOVE LATER */}
                <button
                  onClick={cargarDatosEjemplo}
                  style={{
                    marginBottom: '12px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 400,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Cargar Datos de Ejemplo (5 de cada tipo) - TESTING ONLY
                </button>
                <GruposPanel />
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL - Single Tab (55%) */}
        <main className="flex-1 overflow-y-auto bg-knar-dark">
          <div className="p-6">
            {/* Esquemático Tab */}
            {rightTabActive === 'esquematico' && (
              <EsquematicoPanel
                ubicacionEditando={ubicacionEditando}
                onLocationSet={(id, x, y) => {
                  // Update the in-form hallazgo location (pre-submit)
                  setHallazgosForm((prev) =>
                    prev.map((h) =>
                      h.id === id ? { ...h, ubicacion: { x, y } } : h
                    )
                  );
                  // Clear editing mode
                  setUbicacionEditando(null);
                }}
                hallazgosForm={hallazgosForm}
              />
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
