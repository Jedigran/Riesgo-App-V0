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
import { useHallazgo, type CrearPeligroDTO, type CrearBarreraDTO, type CrearPOEDTO, type CrearSOLDTO } from '@/src/controllers/useHallazgo';
import { useUIEstado } from '@/src/controllers/useUIEstado';
import { useSesion } from '@/src/controllers/useSesion';
import { useGrupo } from '@/src/controllers/useGrupo';
import { KnarHeader } from '@/components/KnarHeader';
import { ejemplosBasicos, ejemplosAnalisis, posicionesHallazgos, ejemplosGrupos } from '@/src/data/ejemplos';
import TablaHallazgos from '@/components/tabla/TablaHallazgos';
import TablaAnalisis from '@/components/tabla/TablaAnalisis';
import RelacionesPanel from '@/components/relaciones/RelacionesPanel';
import GruposPanel from '@/components/grupos/GruposPanel';
import EsquematicoPanel from '@/components/esquematico/EsquematicoPanel';
import { IntuicionForm, HazopForm, FmeaForm, LopaForm, OcaForm } from '@/components/formularios';

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
  contexto: string;
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
// COLLAPSIBLE CARD COMPONENT
// ============================================================================

interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  rightAddon?: React.ReactNode;
}

function CollapsibleCard({
  title,
  icon,
  isExpanded,
  onToggle,
  onDelete,
  rightAddon,
  children,
}: CollapsibleCardProps) {
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
        {rightAddon && <div className="mr-2">{rightAddon}</div>}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-xs text-knar-text-muted hover:text-red-400 px-2 py-1 transition-colors"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            × Eliminar
          </button>
        )}
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
    contexto: sesion?.contexto ?? '',
  });

  // ========================================
  // ESTADOS PARA COLAPSAR SECCIONES
  // ========================================

  // Controla si el formulario de análisis está colapsado
  const [analisisFormCollapsed, setAnalisisFormCollapsed] = useState(false);

  // Controla qué entidad está expandida (null = ninguna)
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);

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

  // Nombre compartido para todos los análisis
  const [nombreAnalisis, setNombreAnalisis] = useState('');

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
  const { crearGrupo } = useGrupo();
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
    // Auto-expand the new entity
    setExpandedEntityId(nuevoHallazgo.id);
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
  // HELPER: RESET FORM STATE
  // ========================================
  const resetFormState = () => {
    setMetodologiaSeleccionada(null);
    setHallazgosForm([]);
    setNombreAnalisis('');
    setAnalisisFormCollapsed(false);
    setExpandedEntityId(null);
  };

  // ========================================
  // TEST DATA LOADER - COMPLETE EXAMPLE (Hallazgos + Grupos + Análisis)
  // ========================================
  const cargarDatosEjemplo = () => {
    const erroresEncontrados: string[] = [];
    const hallazgoIdsByTitle = new Map<string, string>();

    console.log('🔵 Cargando ejemplos de hallazgos...');

    // Step 1: Create all hallazgos from hallazgos.ts
    ejemplosBasicos.forEach((ejemplo) => {
      let resultado;

      switch (ejemplo.tipo) {
        case 'Peligro':
          resultado = crearPeligro(ejemplo.datos as CrearPeligroDTO, ejemplo.ubicacion);
          break;
        case 'Barrera':
          resultado = crearBarrera(ejemplo.datos as CrearBarreraDTO, ejemplo.ubicacion);
          break;
        case 'POE':
          resultado = crearPOE(ejemplo.datos as CrearPOEDTO, ejemplo.ubicacion);
          break;
        case 'SOL':
          resultado = crearSOL(ejemplo.datos as CrearSOLDTO, ejemplo.ubicacion);
          break;
      }

      if (resultado?.exito && resultado.id) {
        hallazgoIdsByTitle.set(ejemplo.datos.titulo, resultado.id);
        console.log(`✅ Creado: ${ejemplo.tipo} - ${ejemplo.datos.titulo}`);
      } else if (resultado && !resultado.exito) {
        const error = `Error creando ${ejemplo.tipo} ${ejemplo.datos.titulo}: ${resultado.errores.join(', ')}`;
        erroresEncontrados.push(error);
        console.error(`❌ ${error}`);
      }
    });

    console.log(`📦 Hallazgos creados: ${hallazgoIdsByTitle.size}`);
    console.log('🔵 Creando grupos de protección...');

    // Step 2: Create groups from grupos.ts
    ejemplosGrupos.forEach((grupoData) => {
      const peligrosIds = grupoData.peligrosTitulos
        .map((titulo) => hallazgoIdsByTitle.get(titulo))
        .filter((id): id is string => id !== undefined);

      const protectoresIds = grupoData.protectoresTitulos
        .map((titulo) => hallazgoIdsByTitle.get(titulo))
        .filter((id): id is string => id !== undefined);

      console.log(`  Grupo "${grupoData.nombre}": ${peligrosIds.length} peligros, ${protectoresIds.length} protectores`);

      if (peligrosIds.length > 0 && protectoresIds.length > 0) {
        // Skip validation for programmatic group creation (async state update issue)
        // Manual group creation through UI will have validation enabled
        const resultadoGrupo = crearGrupo({
          nombre: grupoData.nombre,
          descripcion: grupoData.descripcion,
          color: grupoData.color,
          peligrosIds,
          protectoresIds,
        }, true); // skipValidation = true for example loading

        if (resultadoGrupo.exito) {
          console.log(`✅ Grupo creado: ${grupoData.nombre}`);
        } else {
          erroresEncontrados.push(`Error creando ${grupoData.nombre}: ${resultadoGrupo.errores.join(', ')}`);
        }
      } else {
        erroresEncontrados.push(`No se encontraron IDs para ${grupoData.nombre}`);
      }
    });

    // Show result notification
    if (erroresEncontrados.length > 0) {
      console.error('❌ Errores:', erroresEncontrados);
      agregarNotificacion({
        tipo: 'error',
        titulo: 'Error al cargar ejemplos',
        mensaje: erroresEncontrados.join(' | '),
        duracion: 10000,
      });
    } else {
      console.log('✅ Todos los ejemplos cargados correctamente');
      agregarNotificacion({
        tipo: 'success',
        titulo: '✅ Ejemplos Cargados',
        mensaje: '8 hallazgos + 2 grupos + 6 análisis creados - Revisa la pestaña "Relaciones"',
        duracion: 8000,
      });
    }

    return hallazgoIdsByTitle;
  };

  // ========================================
  // TEST DATA LOADER FOR ANALYSIS (HAZOP, FMEA, LOPA, OCA)
  // ========================================
  const cargarAnalisisEjemplo = () => {
    const erroresEncontrados: string[] = [];
    let entityIndex = 0;

    // Process each example analysis
    ejemplosAnalisis.forEach((ejemplo) => {
      let resultado: ReturnType<typeof crearAnalisisHAZOP> | ReturnType<typeof crearAnalisisFMEA> | ReturnType<typeof crearAnalisisLOPA> | ReturnType<typeof crearAnalisisOCA> | ReturnType<typeof crearAnalisisIntuicion>;

      // Create analysis based on type
      switch (ejemplo.tipo) {
        case 'RegistroDirecto':
          resultado = crearAnalisisIntuicion(ejemplo.datos);
          break;
        case 'HAZOP':
          resultado = crearAnalisisHAZOP(ejemplo.datos);
          break;
        case 'FMEA':
          resultado = crearAnalisisFMEA(ejemplo.datos);
          break;
        case 'LOPA':
          resultado = crearAnalisisLOPA(ejemplo.datos);
          break;
        case 'OCA':
          resultado = crearAnalisisOCA(ejemplo.datos);
          break;
      }

      // Create hallazgos for this analysis
      if (resultado.exito && resultado.id) {
        ejemplo.hallazgos.forEach((h) => {
          const ubicacion = posicionesHallazgos[entityIndex] || { x: 50, y: 50 };

          if (h.tipo === 'Peligro') {
            crearPeligro({
              ...h.datos,
              analisisOrigenIds: [resultado.id!],
            }, ubicacion);
          } else if (h.tipo === 'Barrera') {
            crearBarrera({
              ...h.datos,
              analisisOrigenIds: [resultado.id!],
            }, ubicacion);
          } else if (h.tipo === 'POE') {
            crearPOE({
              ...h.datos,
              analisisOrigenIds: [resultado.id!],
            }, ubicacion);
          } else if (h.tipo === 'SOL') {
            crearSOL({
              ...h.datos,
              analisisOrigenIds: [resultado.id!],
            }, ubicacion);
          }

          entityIndex++;
        });
      } else if (!resultado.exito) {
        erroresEncontrados.push(`Error creando ${ejemplo.tipo}: ${resultado.errores.join(', ')}`);
      }
    });

    // Show notification
    if (erroresEncontrados.length > 0) {
      agregarNotificacion({
        tipo: 'error',
        titulo: 'Error al cargar ejemplos',
        mensaje: erroresEncontrados.join(' | '),
        duracion: 8000,
      });
    } else {
      agregarNotificacion({
        tipo: 'success',
        titulo: 'Análisis de Ejemplo Cargados',
        mensaje: `Se crearon ${ejemplosAnalisis.length} análisis con sus entidades asociadas`,
        duracion: 6000,
      });
    }
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
        }, nombreAnalisis);

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar HAZOP' });
          return;
        }

        // Create entities only if they exist
        if (hallazgosForm.length > 0) {
          crearHallazgosDeFormulario(resultadoAnalisis.id);
        }

        const entidadesCount = hallazgosForm.length;
        agregarNotificacion({ 
          tipo: 'success', 
          titulo: 'HAZOP Guardado', 
          mensaje: entidadesCount > 0 
            ? `Análisis y ${entidadesCount} entidades guardadas`
            : 'Análisis guardado (puede agregar entidades después)', 
          duracion: 3000 
        });
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
        resetFormState();
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
        }, nombreAnalisis);

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar FMEA' });
          return;
        }

        // Create entities only if they exist
        if (hallazgosForm.length > 0) {
          crearHallazgosDeFormulario(resultadoAnalisis.id);
        }

        const entidadesCount = hallazgosForm.length;
        agregarNotificacion({ 
          tipo: 'success', 
          titulo: 'FMEA Guardado', 
          mensaje: entidadesCount > 0 
            ? `Análisis y ${entidadesCount} entidades guardadas`
            : 'Análisis guardado (puede agregar entidades después)', 
          duracion: 3000 
        });
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
        resetFormState();
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
        }, nombreAnalisis);

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar LOPA' });
          return;
        }

        // Create entities only if they exist
        if (hallazgosForm.length > 0) {
          crearHallazgosDeFormulario(resultadoAnalisis.id);
        }

        const entidadesCount = hallazgosForm.length;
        agregarNotificacion({ 
          tipo: 'success', 
          titulo: 'LOPA Guardado', 
          mensaje: entidadesCount > 0 
            ? `Análisis y ${entidadesCount} entidades guardadas`
            : 'Análisis guardado (puede agregar entidades después)', 
          duracion: 3000 
        });
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
        resetFormState();
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
        }, nombreAnalisis);

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar OCA' });
          return;
        }

        // Create entities only if they exist
        if (hallazgosForm.length > 0) {
          crearHallazgosDeFormulario(resultadoAnalisis.id);
        }

        const entidadesCount = hallazgosForm.length;
        agregarNotificacion({ 
          tipo: 'success', 
          titulo: 'OCA Guardado', 
          mensaje: entidadesCount > 0 
            ? `Análisis y ${entidadesCount} entidades guardadas`
            : 'Análisis guardado (puede agregar entidades después)', 
          duracion: 3000 
        });
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
        resetFormState();
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar OCA' });
      }
    }
    // ========== INTUICION ==========
    else if (metodologiaSeleccionada === 'intuicion') {
      if (!intuicionData.descripcion.trim()) {
        agregarError({ severidad: 'error', mensaje: 'Complete la descripción' });
        return;
      }

      try {
        const resultadoAnalisis = crearAnalisisIntuicion({
          titulo: intuicionData.titulo || 'Registro directo',
          descripcion: intuicionData.descripcion,
          observaciones: intuicionData.observaciones.filter(o => o.trim()).length > 0 ? intuicionData.observaciones.filter(o => o.trim()) : [''],
        }, nombreAnalisis);

        if (!resultadoAnalisis.exito || !resultadoAnalisis.id) {
          agregarError({ severidad: 'error', mensaje: resultadoAnalisis.errores[0] || 'Error al guardar Registro directo' });
          return;
        }

        // Create entities only if they exist
        if (hallazgosForm.length > 0) {
          crearHallazgosDeFormulario(resultadoAnalisis.id);
        }

        const entidadesCount = hallazgosForm.length;
        agregarNotificacion({ 
          tipo: 'success', 
          titulo: 'Registro directo Guardado', 
          mensaje: entidadesCount > 0 
            ? `Análisis y ${entidadesCount} entidades guardadas`
            : 'Análisis guardado (puede agregar entidades después)', 
          duracion: 3000 
        });
        setIntuicionData({ titulo: '', descripcion: '', observaciones: [''] });
        resetFormState();
      } catch (error) {
        agregarError({ severidad: 'error', mensaje: 'Error inesperado al guardar Registro directo' });
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
      <KnarHeader
        title="Risk Census"
        subtitle="Gestión de Riesgos de Proceso"
        rightContent={
          <div className="knar-tabs-inline" style={{ borderBottom: 'none', padding: 0, height: '100%' }}>
            <button onClick={() => setRightTabActive('esquematico')} className={`knar-tab-inline${rightTabActive === 'esquematico' ? ' active' : ''}`}>Esquemático</button>
            <button onClick={() => setRightTabActive('tabla-hallazgo')} className={`knar-tab-inline${rightTabActive === 'tabla-hallazgo' ? ' active' : ''}`}>Tabla Entidades</button>
            <button onClick={() => setRightTabActive('tabla-analisis')} className={`knar-tab-inline${rightTabActive === 'tabla-analisis' ? ' active' : ''}`}>Tabla Elementos de Análisis</button>
          </div>
        }
      />

      {/* MAIN CONTENT - Two Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Exclusive Tabs (45%) */}
        <aside style={{ backgroundColor: 'var(--knar-charcoal)', borderRight: '0.5px solid var(--border)' }} className="w-[30%] overflow-y-auto">
          {/* Left Tab Buttons — underline pattern */}
          <div className="knar-tabs-inline flex-shrink-0">
            <button onClick={() => setLeftTabActive('configuracion')} className={`knar-tab-inline${leftTabActive === 'configuracion' ? ' active' : ''}`}>Configuración</button>
            <button onClick={() => setLeftTabActive('censo')} className={`knar-tab-inline${leftTabActive === 'censo' ? ' active' : ''}`}>Elementos de análisis</button>
            {/* <button onClick={() => setLeftTabActive('relaciones')} className={`knar-tab-inline${leftTabActive === 'relaciones' ? ' active' : ''}`}>Relaciones</button> */}
            <button onClick={() => setLeftTabActive('grupos')} className={`knar-tab-inline${leftTabActive === 'grupos' ? ' active' : ''}`}>Relaciones</button>
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
                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Contexto</label><input type="text" name="contexto" value={configData.contexto} onChange={handleConfigChange} className="knar-input" placeholder="Ej. Revisión preliminar, Auditoría 2025" /></div>
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
                      <h3 className="knar-card-title">Elementos de Análisis</h3>
                    </div>
                    <div className="knar-card-content space-y-2">
                      <button onClick={() => setMetodologiaSeleccionada('intuicion')} className="w-full knar-btn knar-btn-ghost justify-start">Registro directo</button>
                      <button onClick={() => setMetodologiaSeleccionada('hazop')} className="w-full knar-btn knar-btn-ghost justify-start">HAZOP</button>
                      <button onClick={() => setMetodologiaSeleccionada('fmea')} className="w-full knar-btn knar-btn-ghost justify-start">FMEA</button>
                      <button onClick={() => setMetodologiaSeleccionada('lopa')} className="w-full knar-btn knar-btn-ghost justify-start">LOPA</button>
                      <button onClick={() => setMetodologiaSeleccionada('oca')} className="w-full knar-btn knar-btn-ghost justify-start">OCA</button>
                    </div>
                  </div>
                ) : (
                  /* Formulario de metodología */
                  <div className="space-y-4">
                    <button onClick={resetFormState} className="knar-btn knar-btn-ghost">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                      Volver a elementos de análisis
                    </button>

                    {/* ========== NOMBRE DEL ANÁLISIS (COMPARTIDO) ========== */}
                    <div className="knar-card">
                      <div className="knar-card-content">
                        <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          Nombre del análisis
                          <span style={{ color: 'var(--text-disabled)', marginLeft: '6px', fontWeight: 300 }}>(opcional — ayuda a identificarlo en filtros)</span>
                        </label>
                        <input
                          type="text"
                          value={nombreAnalisis}
                          onChange={(e) => setNombreAnalisis(e.target.value)}
                          className="knar-input"
                          placeholder={
                            metodologiaSeleccionada === 'hazop' ? 'Ej: Línea A — Bomba P-201' :
                            metodologiaSeleccionada === 'fmea' ? 'Ej: Bomba centrífuga P-201' :
                            metodologiaSeleccionada === 'lopa' ? 'Ej: Pérdida de bombeo — escenario crítico' :
                            metodologiaSeleccionada === 'oca' ? 'Ej: Derrame H2S — zona norte' :
                            'Ej: Inspección visual — 15 mar 2026'
                          }
                        />
                      </div>
                    </div>

                    {/* ========== HAZOP FORM ========== */}
                    {metodologiaSeleccionada === 'hazop' && (
                      <HazopForm
                        data={hazopData}
                        onChange={setHazopData}
                        analisisFormCollapsed={analisisFormCollapsed}
                        onToggleCollapse={setAnalisisFormCollapsed}
                      />
                    )}

                    {/* ========== FMEA FORM ========== */}
                    {metodologiaSeleccionada === 'fmea' && (
                      <FmeaForm
                        data={fmeaData}
                        onChange={setFmeaData}
                        analisisFormCollapsed={analisisFormCollapsed}
                        onToggleCollapse={setAnalisisFormCollapsed}
                      />
                    )}

                    {/* ========== LOPA FORM ========== */}
                    {metodologiaSeleccionada === 'lopa' && (
                      <LopaForm
                        data={lopaData}
                        onChange={setLopaData}
                        analisisFormCollapsed={analisisFormCollapsed}
                        onToggleCollapse={setAnalisisFormCollapsed}
                      />
                    )}

                    {/* ========== OCA FORM ========== */}
                    {metodologiaSeleccionada === 'oca' && (
                      <OcaForm
                        data={ocaData}
                        onChange={setOcaData}
                        analisisFormCollapsed={analisisFormCollapsed}
                        onToggleCollapse={setAnalisisFormCollapsed}
                      />
                    )}

                    {/* ========== INTUICION FORM ========== */}
                    {metodologiaSeleccionada === 'intuicion' && (
                      <IntuicionForm
                        data={intuicionData}
                        onChange={setIntuicionData}
                        analisisFormCollapsed={analisisFormCollapsed}
                        onToggleCollapse={setAnalisisFormCollapsed}
                      />
                    )}

                    {/* ========== SECTION 2: HALLAZGOS (COMÚN PARA TODOS) ========== */}
                    <div className="knar-card">
                      <div className="knar-card-header">
                        <div className="knar-icon-box"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg></div>
                        <h3 className="knar-card-title">Crear Entidades (opcional)</h3>
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
                          <p className="text-xs text-knar-text-muted text-center py-4">No hay entidades agregadas. Seleccione un tipo y haga clic en "+ Agregar"</p>
                        ) : (
                          <div className="space-y-3">
                            {hallazgosForm.map((hallazgo, index) => (
                              <CollapsibleCard
                                key={hallazgo.id}
                                title={`Entidad ${index + 1}: ${hallazgo.tipo}`}
                                icon={
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 13h.01M7 19h.01M8.001 3h7.999a2 2 0 012 2v14a2 2 0 01-2 2H8.001a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>
                                }
                                isExpanded={expandedEntityId === hallazgo.id}
                                onToggle={() => setExpandedEntityId(expandedEntityId === hallazgo.id ? null : hallazgo.id)}
                                onDelete={() => eliminarHallazgo(hallazgo.id)}
                              >
                                <div className="space-y-2">
                                  <div><label className="block mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Título *</label><input type="text" value={hallazgo.titulo} onChange={(e) => actualizarHallazgo(hallazgo.id, 'titulo', e.target.value)} className="w-full px-2 py-1.5 bg-knar-charcoal border border-knar-border rounded text-xs text-knar-text-primary focus:border-knar-orange focus:outline-none" placeholder="Título de la entidad" /></div>
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
                                      <button
                                        onClick={() => {
                                          setUbicacionEditando(hallazgo.id);
                                          setRightTabActive('esquematico');
                                        }}
                                        className={`px-3 py-1.5 rounded text-xs font-light transition-colors ${ubicacionEditando === hallazgo.id ? 'bg-blue-500 text-white' : 'bg-knar-charcoal text-knar-text-secondary hover:text-knar-text-primary'}`}
                                      >
                                        🗺️ {hallazgo.ubicacion ? 'Cambiar ubicación' : 'Ubicar en mapa'}
                                      </button>
                                      {hallazgo.ubicacion && (<span className="text-xs text-knar-text-muted">({hallazgo.ubicacion.x}, {hallazgo.ubicacion.y})</span>)}
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleCard>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center space-x-3 pt-4 border-t border-knar-border">
                          <button onClick={handleGuardar} className="knar-btn knar-btn-primary">Guardar</button>
                          <button onClick={resetFormState} className="knar-btn knar-btn-ghost">Cancelar</button>
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
              <GruposPanel />
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
                  <h3 className="knar-card-title">Tabla de entidades</h3>
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
                  <h3 className="knar-card-title">Tabla de Elementos de Análisis</h3>
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
            <span>|</span>
            <span>Contexto: <span className="text-knar-text-secondary">{configData.contexto || '—'}</span></span>
            <span>|</span>
            <button
              onClick={() => {
                cargarDatosEjemplo();
                cargarAnalisisEjemplo();
              }}
              style={{
                padding: '4px 10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 400,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 150ms ease',
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
              🧪 Cargar Ejemplo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
