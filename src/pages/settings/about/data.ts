// Shared data used across about sub-pages

import {
  Users,
  Shield,
  ClipboardCheck,
  PlayCircle,
  Sparkles,
  Bug,
  Zap,
} from 'lucide-react';

// ─── Workflow guide ───────────────────────────────────────────────────────────

export const WORKFLOW_STEPS = [
  {
    icon: Users,
    color: 'bg-blue-500/10 text-blue-600',
    title: '1. Lista de Personal',
    desc: 'Registra el equipo que trabaja en tu área. Ve a Personal y añade a cada miembro con su cargo y jerarquía.',
    link: '/personal',
    linkLabel: 'Ir a Personal',
  },
  {
    icon: Shield,
    color: 'bg-violet-500/10 text-violet-600',
    title: '2. Configurar Guardias',
    desc: 'Define los grupos de guardia (Guardia A, B, etc.) y asigna el personal a cada turno en la misma sección de Personal.',
    link: '/personal',
    linkLabel: 'Configurar Guardias',
  },
  {
    icon: ClipboardCheck,
    color: 'bg-amber-500/10 text-amber-600',
    title: '3. Orden del Día',
    desc: 'Antes de empezar el turno, completa la Orden del Día: relevo de guardia, actividades y observaciones.',
    link: '/orden-del-dia',
    linkLabel: 'Ir a Orden del Día',
  },
  {
    icon: PlayCircle,
    color: 'bg-green-500/10 text-green-600',
    title: '4. Abrir la Guardia',
    desc: 'Con la Orden del Día completa, abre la guardia. Desde ese momento podrás registrar novedades y generar reportes.',
    link: '/orden-del-dia',
    linkLabel: 'Abrir Guardia',
  },
];

// ─── Changelog ────────────────────────────────────────────────────────────────

export type ChangeType = 'nueva' | 'mejora' | 'corrección';

export interface ChangeEntry {
  type: ChangeType;
  text: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangeEntry[];
}

export const APP_VERSION = '1.8.1';

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.8.1',
    date: '31/05/2026',
    changes: [
      { type: 'nueva', text: 'Selector Rápido de Chats de WhatsApp: Añadido un botón interactivo sobre el icono de la campana en la barra de navegación (lateral y móvil) que permite elegir y sincronizar rápidamente los destinatarios de los reportes.' },
      { type: 'nueva', text: 'Modificador "hidden" en Plantillas: Implementada la etiqueta {:hidden} o {|hidden} para ocultar campos específicos en el reporte final manteniendo su funcionalidad en los formularios.' },
    ],
  },
  {
    version: '1.8.0',
    date: '29/05/2026',
    changes: [
      { type: 'nueva', text: 'Soporte Inicial de Imágenes en Reportes: Primera implementación del sistema de fotos y evidencias fotográficas. Las imágenes se guardan localmente de forma instantánea y se sincronizan automáticamente con la nube.' },
      { type: 'nueva', text: 'Editor de Imágenes Integrado: Cada foto adjunta puede editarse directamente en la aplicación. Incluye pincel de anotación con colores personalizados, pixelado de privacidad estilo mosaico, deshacer paso a paso, zoom con rueda del mouse, desplazamiento con herramienta de mano y recorte interactivo con guías visuales.' },
      { type: 'nueva', text: 'Envío de Fotos por WhatsApp: Las imágenes adjuntas al reporte se envían automáticamente junto con la minuta, tanto en envíos inmediatos como en mensajes programados para una hora futura.' },
      { type: 'nueva', text: 'Activación de Fotos por Plantilla: Agrega la etiqueta {photos} en una plantilla para habilitar la sección de carga de imágenes en las novedades que lo requieran. Si la plantilla no la incluye, el formulario se mantiene sin la sección de imágenes.' },
      { type: 'mejora', text: 'Formulario de Novedades: Cuando la plantilla lo indica con {photos}, aparece una sección de galería fotográfica al final del formulario.' },
    ],
  },
  {
    version: '1.7.5',
    date: '24/05/2026',
    changes: [
      { type: 'nueva', text: 'Nuevo Botón de "Apoyo Institucional" en los Reportes: Ahora puedes marcar un reporte como apoyo directamente desde el formulario. Esto colocará el texto "(Apoyo institucional)" de forma automática en la minuta, sumará 1 punto a la estadística de apoyos institucionales y aplicará las reglas de descarte configuradas.' },
      { type: 'nueva', text: 'Control de Estadísticas Flexible: Añadidos selectores en el editor de plantillas para decidir con total precisión qué estadísticas ignorar cuando el Apoyo Institucional está activo. Puedes apagar la estadística principal, subcategorías individuales ("Omitir Apoyo") o decidir regla por regla cuál ignorar ("Omitir por Apoyo").' },
      { type: 'mejora', text: 'Sincronización en la Nube Transparente: Guardado automático de todas tus preferencias de exclusión de estadísticas directamente en la plantilla, permitiendo que tus configuraciones se guarden al instante y se sincronicen perfectamente en todos tus dispositivos y computadoras.' },
      { type: 'mejora', text: 'Diseño de Interfaz Premium: Renovación del estilo visual en el editor de plantillas y en el formulario de reportes con una hermosa píldora naranja translúcida y transiciones fluidas.' },
    ],
  },
  {
    version: '1.7.1',
    date: '22/05/2026',
    changes: [
      { type: 'mejora', text: 'Cálculo Inteligente de Traslados: El sistema ahora analiza de forma automática cada tramo de tu viaje (destino por destino) a partir de tu ubicación para determinar con total precisión si son urbanos o extraurbanos, omitiendo de forma limpia las filas vacías.' },
    ],
  },
  {
    version: '1.7.0',
    date: '22/05/2026',
    changes: [
      { type: 'nueva', text: 'Actualización Manual PWA en Tiempo Real: Conectado el botón \'Buscar actualizaciones\' en Configuración para comprobar y descargar inmediatamente nuevos despliegues en Vercel con feedback y toasts interactivos.' },
      { type: 'mejora', text: 'Consulta Inteligente de Área de Trabajo: Reducción drástica de pantallas emergentes molestas al refrescar la página, recordando la elección previa por pestaña (con sessionStorage) y solicitándola únicamente al iniciar sesión.' },
      { type: 'corrección', text: 'Reducción de Spam en Consola: Mitigado el spam persistente de errores de conexión (`ERR_CONNECTION_REFUSED`) del Bot de WhatsApp cuando está offline mediante una caché modular de estado y algoritmo de retroceso exponencial.' },
      { type: 'corrección', text: 'Condición de Carrera en Guardado: Resuelto el error donde los reportes marcados como \'Finalizados\' a veces se revertían a \'En proceso\', estabilizando la lógica de guardado automático en el visor de novedades.' },
    ],
  },
  {
    version: '1.6.5',
    date: '18/05/2026',
    changes: [
      { type: 'nueva', text: 'Programación de Mensajes de WhatsApp: Ahora se pueden programar reportes para ser enviados automáticamente a una hora específica.' },
      { type: 'nueva', text: 'Barra de Búsqueda de Plantillas: Se añadió un buscador en la lista de selección de plantillas al crear una nueva novedad.' },
      { type: 'nueva', text: 'Botón de Estadísticas en Formulario: Ahora el campo "Estadísticas" incluye un botón para calcular el resumen numérico del día automáticamente.' },
      { type: 'mejora', text: 'Optimización de Rendimiento: Se eliminó el lag al escribir en el campo de estadísticas mediante consultas imperativas en lugar de hooks reactivos.' },
    ],
  },
  {
    version: '1.6.0',
    date: '17/05/2026',
    changes: [
      { type: 'nueva', text: 'Integración con WhatsApp: Sistema de envío automático de reportes a través de un bot local de WhatsApp Web.' },
      { type: 'nueva', text: 'Soporte Multi-Chat: Posibilidad de seleccionar hasta 5 chats o grupos destino para el envío simultáneo de reportes.' },
      { type: 'nueva', text: 'Control de Límites: Diálogo de advertencia personalizado para evitar exceder el límite de 5 chats y proteger la cuenta de bloqueos.' },
      { type: 'nueva', text: 'Script de Inicio Rápido: Archivo iniciar-bot.bat para ejecutar el bot de WhatsApp con un solo doble clic en Windows.' },
      { type: 'nueva', text: 'Diseño del Módulo de WhatsApp completo con avatares, barra de búsqueda, estados animados y estética premium.' },
      { type: 'nueva', text: 'Botón de Enviar con el logo oficial de WhatsApp.' },
    ],
  },
  {
    version: '1.5.0',
    date: '14/05/2026',
    changes: [
      { type: 'nueva', text: 'Exportación Masiva a Word: Se implementó el sistema oficial de generación de documentos (.docx) para consolidar todas las novedades en un solo archivo profesional.' },
      { type: 'nueva', text: 'Confirmación de Seguridad: Añadido diálogo de confirmación antes de exportar para evitar descargas accidentales y mejorar la experiencia de usuario.' },
      { type: 'mejora', text: 'Sincronización Automática: Los reportes finalizados en dispositivos secundarios se suben instantáneamente a la nube para asegurar su disponibilidad inmediata.' },
      { type: 'mejora', text: 'Soporte de Secciones: Habilitada la persistencia y sincronización del campo "sections", garantizando que el contenido estructurado llegue íntegro a Supabase.' },
      { type: 'corrección', text: 'Estabilidad de Datos: Resueltos problemas de desajuste de esquema y optimizada la lectura de configuraciones globales (Estatus, Encargado, etc).' },
    ],
  },
  {
    version: '1.4.0',
    date: '13/05/2026',
    changes: [
      { type: 'nueva', text: 'Selector de Fecha Inteligente: Se implementó un selector de calendario en la Orden del Día que genera automáticamente el rango de guardia (DD/MM/YYYY AL DD/MM/YYYY).' },
      { type: 'mejora', text: 'Estética del Calendario Refinada: Nuevo diseño de selección con bordes redondeados (rounded-xl) y alineación corregida en flechas de navegación para evitar solapamientos.' },
      { type: 'mejora', text: 'Estandarización de Versiones: Se centralizó el control de versión en el módulo "Acerca de", eliminando la gestión redundante desde el panel de administración para mayor coherencia.' },
      { type: 'mejora', text: 'Visibilidad de Sistema: El indicador de versión en la esquina inferior ahora es más legible con fondo desenfocado y mayor contraste en modo claro.' },
    ],
  },
  {
    version: '1.3.2',
    date: '11/05/2026',
    changes: [
      { type: 'mejora', text: 'Migración de Datos Estabilizada: Se corrigieron los errores de desajuste de esquema en la base de datos local para una persistencia más confiable.' },
      { type: 'corrección', text: 'Setup Wizard: Corregido el error de pantalla en blanco al finalizar o saltar la configuración inicial, asegurando el acceso inmediato a la app.' },
      { type: 'mejora', text: 'Motor de Plantillas Refinado: Mejoras significativas en el renderizado de secciones anidadas y lógica condicional para reportes más complejos.' },
      { type: 'corrección', text: 'Estabilidad del Código: Resolución de conflictos de tipado y errores en la suite de pruebas tras la estandarización a snake_case.' },
    ],
  },
  {
    version: '1.3.1',
    date: '28/04/2026',
    changes: [
      { type: 'mejora', text: 'Mayor Estabilidad del Sistema: Hemos reorganizado internamente la lógica de la Orden del Día y el Reporte Final para que la aplicación sea mucho más robusta y rápida.' },
      { type: 'mejora', text: 'Navegación más Fluida: Se optimizó el acceso a los datos internos, eliminando esperas innecesarias al abrir o guardar información.' },
      { type: 'mejora', text: 'Lectura de Reportes Mejorada: Ahora todos los cuadros de texto de los reportes se desplazan suavemente y tienen un diseño uniforme, haciendo que revisar la guardia sea mucho más cómodo.' },
      { type: 'mejora', text: 'Experiencia Móvil Optimizada: Al generar un reporte en el celular, ahora verás un panel inferior más fácil de manejar y botones de cerrar más claros.' },
      { type: 'corrección', text: 'Corregidos errores visuales y de carga que aparecían tras realizar mejoras internas en la aplicación.' },
      { type: 'corrección', text: 'Orden Cronológico Asegurado: Las novedades en el reporte final ahora siempre aparecerán en el orden exacto en que ocurrieron, sin errores de fecha.' },
    ],
  },
  {
    version: '1.3.0',
    date: '28/04/2026',
    changes: [
      { type: 'nueva', text: 'Rebranding oficial: La aplicación ha sido renombrada a "Minutas", unificando la identidad en todas las plataformas.' },
      { type: 'nueva', text: 'Sincronización QR Premium: Rediseño total del sistema de vinculación con escaneo de alta precisión y QR siempre visible.' },
      { type: 'nueva', text: 'Catálogo Cloud 2.0: Ahora puedes descargar todas las plantillas de la comunidad con un solo click y ver etiquetas PRO.' },
      { type: 'mejora', text: 'Refactorización Arquitectónica: Aplicación de principios SOLID en el módulo de Novedades para mejorar la mantenibilidad y escalabilidad del código.' },
      { type: 'mejora', text: 'Experiencia Móvil Refinada: Los diálogos ahora se comportan como paneles inferiores (Sheets) para un uso más cómodo con una sola mano.' },
      { type: 'mejora', text: 'UI Estilizada: Mejoras visuales en cabeceras, botones y tarjetas con un enfoque más moderno y limpio.' },
      { type: 'corrección', text: 'Solucionado el problema de la pantalla negra al escanear QR en dispositivos móviles antiguos.' },
    ],
  },
  {
    version: '1.2.0',
    date: '24/04/2026',
    changes: [
      { type: 'nueva', text: 'Suma inteligente de cantidades: ahora puedes configurar plantillas para sumar números específicos (ej. total de heridos o insumos) en las estadísticas.' },
      { type: 'nueva', text: 'Cálculo automático en el Cierre de Guardia: nuevo botón que genera al instante el cuadro estadístico del día para tu reporte final.' },
      { type: 'nueva', text: 'Módulo de Estadísticas activado: el panel de métricas ya es oficial y puedes activarlo desde los ajustes de la aplicación.' },
      { type: 'mejora', text: 'Reportes más limpios: las estadísticas ahora se ven más profesionales, sin códigos numéricos y con un formato de texto más elegante.' },
      { type: 'mejora', text: 'Mejor organización visual: las sub-categorías de los reportes ahora se ordenan con sangría automáticamente para una lectura más fácil.' },
      { type: 'mejora', text: 'Reglas estadísticas potentes: nuevas opciones para filtrar datos por "mayor que", "menor que", o si el texto empieza/termina con algo específico.' },
      { type: 'mejora', text: 'Buscador de categorías mejorado: el selector de estadísticas en el editor de plantillas ahora es más estable y fácil de usar.' },
      { type: 'corrección', text: 'Solucionados errores al guardar plantillas con reglas estadísticas avanzadas y mejoras de estabilidad general.' },
    ],
  },
  {
    version: '1.1.1',
    date: '23/04/2026',
    changes: [
      { type: 'mejora', text: 'Arquitectura de componentes reorganizada: mayor orden en carpetas layout, common, providers y ui/custom.' },
      { type: 'mejora', text: 'Animaciones de interfaz ultra-rápidas (100ms - 200ms) para una navegación más fluida.' },
      { type: 'mejora', text: 'Gestión de capas (z-index) estandarizada: se acabaron los diálogos ocultos detrás del fondo.' },
      { type: 'mejora', text: 'Scroll inteligente en modales: el contenido se adapta a la pantalla y nunca bloquea los botones de acción.' },
      { type: 'mejora', text: 'Tarjeta de Gestión de Unidades refinada: carga suave con skeletons y diseño unificado con el resto de la app.' },
      { type: 'corrección', text: 'Eliminados artefactos visuales (destellos azules) que se cortaban al hacer scroll en el asistente de configuración.' },
    ],
  },
  {
    version: '1.1.0',
    date: '23/04/2026',
    changes: [
      { type: 'nueva', text: 'Página dedicada de Módulos en Ajustes: activa o desactiva secciones de la app desde /settings/modules.' },
      { type: 'nueva', text: 'Nuevo tipo de campo {Campo:cedula} en plantillas: renderiza el input de cédula venezolana con formato automático.' },
      { type: 'nueva', text: 'Scroll con estilo Radix en el dropdown del multi-input.' },
      { type: 'nueva', text: 'Scroll en la tarjeta "Otros ajustes" de Configuración.' },
      { type: 'mejora', text: 'Búsqueda insensible a mayúsculas y acentos en campos de personal, direcciones y autocompletado de reportes (García = Garcia, José = Jose).' },
      { type: 'mejora', text: 'Los módulos desactivados excluyen su personal de los reportes: si Orden del Día está desactivada, se usa el personal de la guardia directamente.' },
      { type: 'corrección', text: 'Campos del sistema (Enc, Pie, Usuario, Estatus) ya no aparecen como inputs en el formulario, sin importar dónde estén en la plantilla.' },
      { type: 'corrección', text: 'Presionar Enter en campos de personal (Director, Jefe de los servicios) ya no borra el valor seleccionado.' },
    ],
  },
  {
    version: '1.0.1',
    date: '22/04/2026',
    changes: [
      { type: 'nueva', text: 'Flujo de configuración inicial en pantalla completa (onboarding de 7 pasos).' },
      { type: 'nueva', text: 'Selector de tema (Claro / Sistema / Oscuro) en el onboarding.' },
      { type: 'nueva', text: 'Guía de primeros pasos integrada en el onboarding y en Acerca de.' },
      { type: 'nueva', text: 'Historial de cambios (esta sección).' },
      { type: 'nueva', text: 'Continuación del onboarding al reabrir la app si se cerró a mitad.' },
      { type: 'mejora', text: 'El reporte de cierre ahora incluye todos los reportes de la guardia, sin filtro de horario.' },
      { type: 'mejora', text: 'Director y Jefe de Operaciones toman sus valores exclusivamente de la Orden del Día.' },
      { type: 'corrección', text: 'Dropdowns de Ajustes Generales en el onboarding ya visibles (z-index corregido).' },
      { type: 'corrección', text: 'Errores CONFLICT de RxDB al iniciar con un workspace ya existente.' },
    ],
  },
  {
    version: '1.0.0',
    date: '07/04/2026',
    changes: [
      { type: 'nueva', text: 'Lanzamiento inicial de Minutas.' },
      { type: 'nueva', text: 'Módulos: Novedades, Orden del Día, Personal, Plantillas, Reporte Final, Estadísticas.' },
      { type: 'nueva', text: 'Sistema de plantillas personalizables con campos condicionales.' },
      { type: 'nueva', text: 'Sincronización entre dispositivos vía Supabase Realtime.' },
      { type: 'nueva', text: 'Soporte offline como PWA instalable.' },
      { type: 'nueva', text: 'Múltiples áreas de trabajo (multi-workspace).' },
      { type: 'nueva', text: 'Historial de reportes de guardia archivados.' },
    ],
  },
];

export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; icon: typeof Sparkles; className: string }> = {
  nueva: { label: 'Nueva', icon: Sparkles, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  mejora: { label: 'Mejora', icon: Zap, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  corrección: { label: 'Corrección', icon: Bug, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};
