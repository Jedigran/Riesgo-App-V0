# Risk-Census 🎯

**Herramienta de Mapeo Visual de Riesgos Industriales**

Risk-Census es una aplicación web moderna para la gestión y visualización de riesgos industriales mediante metodologías estructuradas de análisis de peligros.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Metodologías Soportadas](#-metodologías-soportadas)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Arquitectura](#-arquitectura)
- [Comandos Disponibles](#-comandos-disponibles)
- [Capturas](#-capturas)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### **Gestión de Análisis de Riesgos**
- ✅ Creación de análisis mediante metodologías estandarizadas
- ✅ Vinculación automática de hallazgos con sus análisis de origen
- ✅ Seguimiento del estado de cada análisis (en progreso / completado)

### **Mapeo Visual Interactivo**
- ✅ Diagrama esquemático de planta industrial
- ✅ Posicionamiento visual de hallazgos (Peligros, Barreras, POEs, SOLs)
- ✅ Filtros por tipo de hallazgo, relaciones y análisis
- ✅ Zoom y paneo para navegación en el diagrama

### **Hallazgos (Entidades)**
- ✅ **Peligros** - Identificación de fuentes de daño
- ✅ **Barreras** - Medidas de protección (Físicas, Administrativas, Humanas)
- ✅ **POEs** - Procedimientos Operativos Estándar
- ✅ **SOLs** - Capas de Protección (Sistemas Instrumentados)

### **Relaciones y Grupos**
- ✅ Agrupación de peligros con sus controles
- ✅ Visualización de sistemas de protección coherentes
- ✅ Filtrado por relaciones para análisis específico

### **Interfaz de Usuario**
- ✅ Diseño moderno y limpio (KNAR Design System)
- ✅ Totalmente responsive
- ✅ Tema oscuro por defecto
- ✅ Tipografía optimizada (Inter + Geist)

---

## 🎯 Metodologías Soportadas

### **HAZOP** (Hazard and Operability Study)
- Palabras guía + Parámetros = Desviaciones
- Nodos y subnodos de proceso
- Causas, consecuencias y salvaguardas

### **FMEA** (Failure Mode and Effects Analysis)
- Equipos y funciones
- Modos de falla y efectos
- Cálculo automático de RPN (S × O × D)

### **LOPA** (Layer of Protection Analysis)
- Escenarios de riesgo
- Capas de protección independientes (IPL)
- Cálculo de riesgo y SIL requerido

### **OCA** (Consequence Analysis)
- Dispersión de compuestos químicos
- Cálculo de distancias de impacto
- Programas RMP según EPA

### **Intuición** (Registro Directo)
- Creación rápida de hallazgos
- Para observaciones informales

---

## 🛠️ Requisitos

- **Node.js** 18.x o superior
- **npm** o **yarn** como gestor de paquetes
- Navegador moderno (Chrome, Firefox, Edge, Safari)

---

## 📦 Instalación

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd riesgo-app
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

4. **Abrir en el navegador:**
```
http://localhost:3000
```

---

## 💻 Uso

### **Crear un Análisis**

1. Navega a la pestaña **"Elementos de análisis"** (panel izquierdo)
2. Selecciona una metodología (HAZOP, FMEA, LOPA, OCA, o Registro directo)
3. Completa los campos del formulario
4. Agrega entidades (Peligro, Barrera, POE, SOL)
5. Haz clic en **"Guardar"**

### **Ubicar Entidades en el Mapa**

1. Después de crear una entidad, haz clic en **"🗺️ Ubicar en mapa"**
2. El panel derecho cambiará automáticamente a **"Esquemático"**
3. Haz clic en el diagrama para posicionar la entidad
4. Las entidades se guardan con sus coordenadas

### **Filtrar Hallazgos**

En la barra de filtros del **Esquemático**:
- **Tipo**: Activa/desactiva Peligros, Barreras, POEs, SOLs
- **Relaciones**: Filtra por grupos de protección (multi-selección)
- **Análisis**: Filtra por análisis de origen
- **Búsqueda**: Texto libre para encontrar hallazgos

### **Crear Relaciones**

1. Ve a la pestaña **"Relaciones"** (panel izquierdo)
2. Haz clic en **"Nueva Relación"**
3. Selecciona peligros y controles relacionados
4. Asigna un nombre y color al grupo
5. Guarda la relación

---

## 📁 Estructura del Proyecto

```
riesgo-app/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Página principal
│   ├── layout.tsx             # Layout root
│   └── globals.css            # Estilos globales
├── components/                # Componentes de UI
│   ├── censo/                 # Componentes de censo
│   ├── configuracion/         # Configuración
│   ├── esquematico/           # Panel esquemático
│   ├── formularios/           # Formularios
│   ├── grupos/                # Gestión de grupos
│   ├── layout/                # Layout components
│   ├── mapa/                  # Componentes de mapa
│   ├── relaciones/            # Panel de relaciones
│   ├── tabla/                 # Tablas de datos
│   └── ui/                    # Componentes base
├── src/
│   ├── controllers/           # React Hooks (gestión de estado)
│   │   ├── useAnalisis.ts
│   │   ├── useHallazgo.ts
│   │   ├── useMapa.ts
│   │   ├── useSesion.ts
│   │   └── ...
│   ├── models/                # Modelos de dominio
│   │   ├── analisis/          # Tipos y validadores de análisis
│   │   ├── hallazgo/          # Tipos y validadores de hallazgos
│   │   ├── relaciones/        # Tipos de relaciones
│   │   ├── grupos/            # Grupos de protección
│   │   ├── sesion/            # Estado de sesión
│   │   └── utils/             # Utilidades (generadores, transformadores)
│   └── lib/
│       └── state/             # SessionContext (React Context)
├── test/                      # Tests
├── docs/                      # Documentación
└── public/                    # Assets estáticos
```

---

## 🏗️ Arquitectura

### **Patrón MVC con React**

```
┌─────────────────────────────────────┐
│           VIEW LAYER                │
│  (Components: Forms, Tables, Maps) │
└─────────────────────────────────────┘
                ↓↑ consumes
┌─────────────────────────────────────┐
│        CONTROLLER LAYER             │
│  (React Hooks: useAnalisis, etc.)   │
└─────────────────────────────────────┘
                ↓↑ uses
┌─────────────────────────────────────┐
│         MODEL LAYER                 │
│  (Types, Validators, Utils)         │
└─────────────────────────────────────┘
```

### **Gestión de Estado**

- **SessionContext**: Estado global de la sesión (React Context + useReducer)
- **Controllers**: Hooks especializados por dominio (useAnalisis, useHallazgo, etc.)
- **Inmutabilidad**: Todas las actualizaciones crean nuevo estado
- **Type-Safe**: TypeScript estricto en toda la aplicación

---

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Producción
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción

# Calidad de código
npm run lint             # Ejecutar ESLint

# Tests
npm run test             # Ejecutar todos los tests
npm run test:models      # Tests de modelos
npm run test:validators  # Tests de validadores
npm run test:utils       # Tests de utilidades
```

---

## 📸 Capturas

### Panel Principal
- **Izquierda**: Configuración, Elementos de análisis, Relaciones
- **Derecha**: Esquemático, Tabla de entidades, Tabla de análisis

### Esquemático
- Diagrama de planta interactivo
- Marcadores de colores por tipo de hallazgo
- Filtros en tiempo real
- Tooltips con información detallada

---

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Desarrollo

- **TypeScript**: Tipado estricto en todos los archivos
- **Estilos**: Usar KNAR Design System (ver `knar-design.css`)
- **Componentes**: Seguir patrón de composición
- **Tests**: Incluir tests para nueva funcionalidad

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 📞 Soporte

Para reportar bugs o solicitar features, por favor crea un issue en el repositorio.

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Estilos
- [TypeScript](https://www.typescriptlang.org/) - Tipado

---

**Hecho con ❤️ para la gestión de riesgos industriales**
